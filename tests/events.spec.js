const { test, expect } = require('@playwright/test');

test.describe('Event System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?test=true');
    await page.waitForFunction(() => window.dataManager && window.dataManager.maps && window.dataManager.events && window.dataManager.npcs);
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
});
