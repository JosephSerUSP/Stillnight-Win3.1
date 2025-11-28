const { test, expect } = require('@playwright/test');

test.describe('Campaign Verification', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/?test=true');
        await page.waitForFunction(() => window.dataManager && window.dataManager.maps && window.dataManager.items && window.dataManager.actors);
    });

    test('Campaign has 10 floors', async ({ page }) => {
        const floorCount = await page.evaluate(() => window.dataManager.maps.length);
        expect(floorCount).toBe(10);
    });

    test('Bosses are correctly defined', async ({ page }) => {
        const bosses = await page.evaluate(() => {
            const maps = window.dataManager.maps;
            const bosses = [];
            maps.forEach((map, index) => {
                const bossEvent = map.events ? map.events.find(e => e.id === 'boss') : null;
                if (bossEvent) {
                    bosses.push({ floor: index + 1, actions: bossEvent.actions });
                }
            });
            return bosses;
        });

        const f3 = bosses.find(b => b.floor === 3);
        expect(f3.actions[0].enemyId).toBe('belltollGargoyle');

        const f6 = bosses.find(b => b.floor === 6);
        expect(f6.actions[0].enemyId).toBe('queenAeliana');

        const f9 = bosses.find(b => b.floor === 9);
        expect(f9.actions[0].enemyId).toBe('malacor');
    });

    test('Locked stairs exist on all required floors', async ({ page }) => {
        const locks = await page.evaluate(() => {
             const maps = window.dataManager.maps;
             const locks = [];
             maps.forEach((map, index) => {
                 const stairs = map.events.find(e => e.id === 'stairs');
                 if (stairs && stairs.locked) {
                     locks.push({ floor: index + 1, key: stairs.keyItemId });
                 }
             });
             return locks;
        });

        expect(locks.find(l => l.floor === 1).key).toBe('gate_key');
        expect(locks.find(l => l.floor === 2).key).toBe('merchant_pass');
        expect(locks.find(l => l.floor === 3).key).toBe('cathedral_key');
        expect(locks.find(l => l.floor === 4).key).toBe('mirror_shard');
        expect(locks.find(l => l.floor === 5).key).toBe('banquet_invitation');
        expect(locks.find(l => l.floor === 6).key).toBe('royal_seal');
        expect(locks.find(l => l.floor === 7).key).toBe('clockwork_cog');
        expect(locks.find(l => l.floor === 8).key).toBe('starmap');
        expect(locks.find(l => l.floor === 9).key).toBe('void_key');
    });
});
