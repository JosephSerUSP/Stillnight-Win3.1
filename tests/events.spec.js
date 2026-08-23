import { test, expect } from '@playwright/test';

test.describe('Event System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?test=true');
    await page.waitForFunction(() =>
        window.dataManager &&
        window.dataManager.maps &&
        window.dataManager.events &&
        window.sceneManager &&
        window.sceneManager.currentScene() &&
        window.sceneManager.currentScene().constructor.name === "Scene_Map"
    );
    await page.evaluate(() => { window.ConfigManager.windowAnimations = false; });
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
         const meta = { title: "Test Floor", depth: 1, events: [ { id: 'enemy', count: 1 } ] };
         const eventDefs = window.dataManager.events;
         const floor = map.generateFloor(meta, 0, eventDefs, []);

         const event = floor.events[0];
         if (!event) return { success: false, reason: 'No events generated' };

         const countBefore = floor.events.length;
         map.floors = [floor];
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
          const meta = { title: "Test Floor", depth: 1, events: [ { id: 'npc', count: 1 } ] };
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

  test('Trap visibility logic', async ({ page }) => {
    await page.evaluate(() => {
        const scene = window.sceneManager.currentScene();
        const map = scene.map;
        const floor = map.floors[map.floorIndex];
        map.playerX = 0;
        map.playerY = 0;
        floor.tiles[0][1] = '.';
        floor.visited[0][1] = true;
        floor.events = floor.events.filter(e => !(e.x === 1 && e.y === 0));

        floor.events.push(new window.Game_Event(1, 0, {
            type: 'trap',
            symbol: 'T',
            hidden: true,
            trapValue: 100,
            scripts: { onEnter: [] }
        }));
        scene.updateGrid();
    });

    const tileHidden = await page.locator('.tile[data-x="1"][data-y="0"]').textContent();
    expect(tileHidden.trim()).toBe('');

    await page.evaluate(() => {
        const p = window.sceneManager.currentScene().party.members[0];
        p.passives.push({ name: 'Eagle Eye', traits: [{ code: 'SEE_TRAPS', value: 101 }] });
        window.sceneManager.currentScene().updateGrid();
    });

    const tileVisible = await page.locator('.tile[data-x="1"][data-y="0"]').textContent();
    expect(tileVisible).toContain('T');
  });

  test('Hidden trap executes its onEnter script exactly once', async ({ page }) => {
      const hpBefore = await page.evaluate(() => {
          const scene = window.sceneManager.currentScene();
          const map = scene.map;
          const floor = map.floors[map.floorIndex];
          map.playerX = 0;
          map.playerY = 0;
          floor.visited[0][1] = true;
          floor.tiles[0][1] = '.';
          floor.events = floor.events.filter(e => !(e.x === 1 && e.y === 0));

          floor.events.push(new window.Game_Event(1, 0, {
              type: 'trap',
              symbol: 'T',
              hidden: true,
              trapValue: 100,
              scripts: {
                  onEnter: [{ type: 'DAMAGE_PARTY', amount: 1, message: 'Testing Trap' }]
              }
          }));
          scene.updateGrid();
          return scene.party.members[0].hp;
      });

      await page.locator('.tile[data-x="1"][data-y="0"]').click();
      await page.waitForFunction(before =>
          window.sceneManager.currentScene().party.members[0].hp < before,
          hpBefore
      );

      const result = await page.evaluate(() => {
          const scene = window.sceneManager.currentScene();
          const floor = scene.map.floors[scene.map.floorIndex];
          const trap = floor.events.find(e => e.x === 1 && e.y === 0);
          return {
              hp: scene.party.members[0].hp,
              hidden: trap ? trap.hidden : null,
              log: document.getElementById('log-content').textContent
          };
      });

      expect(result.hp).toBe(hpBefore - 1);
      expect(result.hidden).toBe(false);
      expect(result.log).toContain('Testing Trap');
  });

  test('Treasure event gives the scripted item through the interpreter', async ({ page }) => {
      const before = await page.evaluate(() => {
          const scene = window.sceneManager.currentScene();
          const map = scene.map;
          const floor = map.floors[map.floorIndex];
          map.playerX = 0;
          map.playerY = 0;
          floor.visited[0][1] = true;
          floor.tiles[0][1] = '.';
          floor.events = floor.events.filter(e => !(e.x === 1 && e.y === 0));

          floor.events.push(new window.Game_Event(1, 0, {
              type: 'treasure',
              symbol: '$',
              scripts: {
                  onEnter: [{ type: 'GIVE_ITEM', itemId: 'hp_tonic' }]
              }
          }));
          scene.updateGrid();
          return scene.party.inventory.filter(i => i.id === 'hp_tonic').length;
      });

      await page.locator('.tile[data-x="1"][data-y="0"]').click();
      await page.waitForFunction(expected =>
          window.sceneManager.currentScene().party.inventory.filter(i => i.id === 'hp_tonic').length === expected,
          before + 1
      );

      const result = await page.evaluate(() => ({
          count: window.sceneManager.currentScene().party.inventory.filter(i => i.id === 'hp_tonic').length,
          log: document.getElementById('log-content').textContent
      }));
      expect(result.count).toBe(before + 1);
      expect(result.log).toContain('Obtained:');
  });

  test('Shrine terminal style', async ({ page }) => {
      await page.evaluate(() => {
          const scene = window.sceneManager.currentScene();
          const eventWindow = scene.eventWindow;
          eventWindow.show({
              title: 'Shrine Test',
              description: 'Terminal log start.',
              style: 'terminal',
              choices: [{ label: 'Test', onClick: () => {} }]
          });
          scene.windowManager.push(eventWindow);
      });

      const eventWindow = page.locator('#event-window');
      await expect(eventWindow).toBeVisible();
      const desc = eventWindow.locator('.event-description');
      await expect(desc).toHaveClass(/terminal-style/);
      await expect(desc).toContainText('Terminal log start.');
  });
});
