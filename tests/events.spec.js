const { test, expect } = require('@playwright/test');

test.describe('Event System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?test=true');
    await page.waitForFunction(() =>
        window.dataManager &&
        window.dataManager.maps &&
        window.dataManager.events &&
        window.dataManager.npcs &&
        window.sceneManager &&
        window.sceneManager.currentScene() &&
        window.sceneManager.currentScene().constructor.name === "Scene_Map"
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

    // Should have enemies at least
    expect(floorData.some(e => e.type === 'enemy')).toBe(true);
    // Should have shop
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

          // Force NPC generation logic check
          let hasNpc = false;
          // Try 20 times to hit the chance if probabilistic, but we forced count: 1
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

        floor.events.push(new window.Game_Event(1, 0, {
            type: 'TRAP_TRIGGER',
            symbol: 'T',
            hidden: true,
            trapValue: 100,
            actions: [{ type: 'TRAP_TRIGGER', damage: 1 }]
        }));

        scene.updateGrid();
    });

    const tileHidden = await page.locator('.tile[data-x="1"][data-y="0"]').textContent();
    expect(tileHidden.trim()).toBe('');

    await page.evaluate(() => {
        const p = window.sceneManager.currentScene().party.members[0];
        p.passives.push({
            name: 'Eagle Eye',
            traits: [{ code: 'SEE_TRAPS', value: 101 }]
        });
        window.sceneManager.currentScene().updateGrid();
    });

    const tileVisible = await page.locator('.tile[data-x="1"][data-y="0"]').textContent();
    expect(tileVisible).toContain('T');
  });

  test('Trap triggering logic', async ({ page }) => {
      await page.evaluate(() => {
          const scene = window.sceneManager.currentScene();
          const map = scene.map;
          const floor = map.floors[map.floorIndex];
          map.playerX = 0;
          map.playerY = 0;
          floor.visited[0][1] = true;
          floor.tiles[0][1] = '.';
          floor.events = floor.events.filter(e => !(e.x === 1 && e.y === 0));

          floor.events.push(new window.Game_Event(1, 0, {
              type: 'TRAP_TRIGGER',
              symbol: 'T',
              hidden: true,
              trapValue: 100,
              actions: [{ type: 'TRAP_TRIGGER', damage: 10, message: "Testing Trap" }]
          }));
          scene.updateGrid();
      });

      await page.locator('.tile[data-x="1"][data-y="0"]').click();

      const eventTitle = await page.locator('#event-window .dialog-titlebar span').textContent();
      expect(eventTitle).toContain('Trap!');

      const eventDesc = await page.locator('#event-window .event-description').textContent();
      expect(eventDesc).toContain('Testing Trap');
  });

  test('Treasure event logic', async ({ page }) => {
      await page.evaluate(() => {
          window.sceneManager.currentScene().openTreasureEvent();
      });

      const eventTitle = await page.locator('#event-window .dialog-titlebar span').textContent();
      expect(eventTitle).toContain('Treasure Found!');

      await page.waitForTimeout(200);
      const imgSrc = await page.locator('#event-window img').getAttribute('src');
      expect(imgSrc).toContain('default.png');
  });

  test('Shrine terminal style', async ({ page }) => {
      await page.evaluate(() => {
           window.sceneManager.currentScene().eventWindow.show({
                title: "Shrine Test",
                description: "Terminal log start.",
                style: 'terminal',
                choices: [{ label: "Test", onClick: () => {} }]
           });
      });

      const hasClass = await page.locator('#event-window .event-description').getAttribute('class');
      expect(hasClass).toContain('terminal-style');

      const desc = await page.locator('#event-window .event-description').textContent();
      expect(desc).toContain('Terminal log start.');
  });
});
