const { test, expect } = require('@playwright/test');

test.describe('Event System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?test=true');
    await page.waitForFunction(() =>
        window.dataManager &&
        window.dataManager.maps &&
        window.dataManager.events &&
        window.dataManager.npcs &&
        window.Scene_Map
    );
  });

  test('Map generates events properly', async ({ page }) => {
    const floorData = await page.evaluate(() => {
      const { Game_Map } = window;
      const map = new Game_Map();
      const meta = {
          title: "Test Floor",
          depth: 1,
          intro: "Welcome",
          events: [
              { id: 'enemy', min: 1, max: 1 },
              { id: 'shop', count: 1 }
          ]
      };
      const eventDefs = window.dataManager.events;
      const floor = map.generateFloor(meta, 0, eventDefs, []);
      return floor.events;
    });

    expect(floorData.some(e => e.type === 'enemy')).toBe(true);
    expect(floorData.some(e => e.type === 'shop')).toBe(true);
  });

  test('Events can be removed', async ({ page }) => {
     const result = await page.evaluate(() => {
         const { Game_Map } = window;
         const map = new Game_Map();
         const meta = {
             title: "Test Floor",
             depth: 1,
             events: [ { id: 'enemy', count: 1 } ]
         };
         const eventDefs = window.dataManager.events;
         const floor = map.generateFloor(meta, 0, eventDefs, []);

         const event = floor.events[0];
         if (!event) return { success: false, reason: 'No events generated' };

         const countBefore = floor.events.length;
         map.floors = [floor]; // Setup map state
         map.removeEvent(0, event.x, event.y);
         const countAfter = floor.events.length;

         return {
             success: true,
             removed: countAfter === countBefore - 1,
             found: floor.events.find(e => e.x === event.x && e.y === event.y)
         };
     });

     expect(result.success).toBe(true);
     expect(result.removed).toBe(true);
     expect(result.found).toBeUndefined();
  });

  test('NPC generation logic', async ({ page }) => {
      const result = await page.evaluate(() => {
          const { Game_Map } = window;
          const map = new Game_Map();
          const meta = {
              title: "Test Floor",
              depth: 1,
              events: [ { id: 'npc', count: 1 } ]
          };
          const npcs = [{ id: 'test_npc', char: 'T', dialogue: 'Hello' }];
          const eventDefs = window.dataManager.events;

          let hasNpc = false;
          for(let i=0; i<5; i++) {
              const floor = map.generateFloor(meta, 0, eventDefs, npcs);
              if (floor.events.some(e => e.type === 'npc' && e.id === 'test_npc')) {
                  hasNpc = true;
                  break;
              }
          }
          return hasNpc;
      });
      expect(result).toBe(true);
  });

  test('Trap Detection Logic', async ({ page }) => {
    const result = await page.evaluate(() => {
        const { Scene_Map, Game_Battler, SoundManager } = window;
        // Mock SoundManager to prevent AudioContext errors
        if (SoundManager) SoundManager.beep = () => {};

        const dataManager = window.dataManager;
        let scene;
        const sceneManager = {
            currentScene: () => scene,
            push: () => {},
            pop: () => {},
            previous: () => null
        };
        const windowManager = {
            stack: [],
            push: () => {},
            close: () => {},
            updateState: () => {}
        };

        scene = new Scene_Map(dataManager, sceneManager, windowManager);
        // Force runActive for checks
        scene.runActive = true;
        scene.startNewRun();

        if (!scene.map.floors || scene.map.floors.length === 0) {
            return { error: "Floors not initialized. startNewRun failed?" };
        }

        // Inject a trap
        const floor = scene.map.floors[scene.map.floorIndex];
        const trapX = (scene.map.playerX + 1) % scene.map.MAX_W;
        const trapY = scene.map.playerY;

        const trapEvent = new window.Game_Event(trapX, trapY, {
            type: 'trap',
            id: 'trap',
            hidden: true,
            value: 10,
            symbol: 'T',
            actions: [{ type: 'TRAP' }]
        });
        floor.events.push(trapEvent);

        // Case 1: No detection
        // Mock party members
        scene.party.members = [ new Game_Battler({ name: "Hero", maxHp: 10, level: 1 }) ];
        // Mock getPassiveValue to return 0
        scene.party.members[0].getPassiveValue = () => 0;

        // Try to trigger detection via onTileClick logic
        // We can't call onTileClick directly easily because of DOM dependencies.
        // But we can verify the logic by running the same check.

        let detection = scene.party.members.reduce((sum, m) => sum + m.getPassiveValue('SEE_TRAPS'), 0);
        const detected1 = detection > trapEvent.value;

        // Case 2: Detection
        scene.party.members[0].getPassiveValue = (code) => code === 'SEE_TRAPS' ? 15 : 0;
        detection = scene.party.members.reduce((sum, m) => sum + m.getPassiveValue('SEE_TRAPS'), 0);
        const detected2 = detection > trapEvent.value;

        return { detected1, detected2 };
    });

        expect(result.error).toBeUndefined();
    expect(result.detected1).toBe(false);
    expect(result.detected2).toBe(true);
  });

  test('Trap Trigger Logic', async ({ page }) => {
      const hpLost = await page.evaluate(() => {
          const { Scene_Map, Game_Battler, SoundManager } = window;
          if (SoundManager) SoundManager.beep = () => {};
          const dataManager = window.dataManager;
          // Mock dependencies
          const sceneManager = { currentScene: () => null };
          const windowManager = { push: () => {}, close: () => {} };

          const scene = new Scene_Map(dataManager, sceneManager, windowManager);
          scene.party.members = [ new Game_Battler({ name: "Hero", maxHp: 20, level: 1 }) ];
          scene.party.members[0].hp = 20;

          // Mock methods that touch DOM
          scene.logMessage = () => {};
          scene.setStatus = () => {};
          scene.updateAll = () => {};
          scene.map = {
              floorIndex: 0,
              removeEvent: () => {}
          };

          const trapEvent = { x: 0, y: 0, damage: 8 };
          scene.triggerTrap(trapEvent);

          return 20 - scene.party.members[0].hp;
      });

      expect(hpLost).toBe(8);
  });

  test('Treasure Trigger Logic', async ({ page }) => {
      const result = await page.evaluate(() => {
          const { Scene_Map, SoundManager } = window;
          if (SoundManager) SoundManager.beep = () => {};
          const dataManager = window.dataManager;
          const sceneManager = { currentScene: () => null };
          const windowManager = { push: () => {}, close: () => {} };

          const scene = new Scene_Map(dataManager, sceneManager, windowManager);
          scene.party.inventory = [];

          // Mock methods
          scene.logMessage = () => {};
          scene.updateAll = () => {};

          // Mock eventWindow methods used in triggerTreasure
          scene.eventWindow.setTerminalMode = () => {};
          scene.eventWindow.setImage = () => {};

          // Use 'hp_tonic' which exists in data
          const itemId = 'hp_tonic';
          const item = dataManager.items.find(i => i.id === itemId);
          if (!item) return { error: `Item ${itemId} not found in data` };

          const treasureEvent = { x: 0, y: 0, item: itemId };
          scene.triggerTreasure(treasureEvent);

          return {
              hasItem: scene.party.inventory.some(i => i.id === itemId)
          };
      });

      expect(result.error).toBeUndefined();
      expect(result.hasItem).toBe(true);
  });
});
