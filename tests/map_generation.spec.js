const { test, expect } = require('@playwright/test');

test.describe('Map Generation', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/?test=true');
        await page.waitForFunction(() => window.dataManager && window.dataManager.maps);
    });

    test('generateFloor creates valid map structure', async ({ page }) => {
        const floorData = await page.evaluate(() => {
            const { Game_Map } = window;
            const map = new Game_Map();
            const eventDefs = [
                 { id: 'stairs_down', type: 'stairs', symbol: 'S' }
            ];
            const meta = {
                title: "Test Floor",
                depth: 1,
                intro: "Welcome",
                spawns: [
                    { id: 'stairs_down', count: 1 }
                ]
            };

            const floor = map.generateFloor(meta, eventDefs, 0);

            // Check for essential elements
            let hasStairs = false;
            let hasStart = false;
            let hasFloor = false;

            for (let y = 0; y < map.MAX_H; y++) {
                for (let x = 0; x < map.MAX_W; x++) {
                    const tile = floor.tiles[y][x];
                    // Stairs are now events, tile is floor
                    if (tile === '.') hasFloor = true;
                    if (x === floor.startX && y === floor.startY) hasStart = true;
                }
            }
            if (floor.events.some(e => e.type === 'stairs')) hasStairs = true;

            return {
                hasStairs,
                hasStart,
                hasFloor,
                width: floor.tiles[0].length,
                height: floor.tiles.length
            };
        });

        expect(floorData.hasStairs).toBe(true);
        expect(floorData.hasStart).toBe(true);
        expect(floorData.hasFloor).toBe(true);
        expect(floorData.width).toBe(16);
        expect(floorData.height).toBe(16);
    });
});
