import { test, expect } from '@playwright/test';

test.describe('Progression and State', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/?test=true');
        await page.waitForFunction(() =>
            window.dataManager &&
            window.dataManager.actors &&
            window.dataManager.items &&
            window.dataManager.terms &&
            window.dataManager.startingParty
        );
    });

    test('XP Gain triggers level up and stats increase', async ({ page }) => {
        const result = await page.evaluate(() => {
            const { Game_Battler } = window;
            const battler = new Game_Battler({ name: "Hero", maxHp: 20, level: 1, expGrowth: 5 });

            const initialLevel = battler.level;
            const initialHp = battler.maxHp;
            const needed = window.ProgressionSystem.xpNeeded(1, battler.expGrowth);

            // Gain enough XP to level up
            const gainResult = window.ProgressionSystem.gainXp(battler, needed + 5);

            return {
                leveledUp: gainResult.leveledUp,
                newLevel: battler.level,
                hpIncreased: battler.maxHp > initialHp,
                hpGain: gainResult.hpGain
            };
        });

        expect(result.leveledUp).toBe(true);
        expect(result.newLevel).toBe(2);
        expect(result.hpIncreased).toBe(true);
        expect(result.hpGain).toBeGreaterThan(0);
    });

    test('Game_Party initializes correctly with data', async ({ page }) => {
        const result = await page.evaluate(() => {
            const { Game_Party } = window;
            const dataManager = window.dataManager;
            const party = new Game_Party();

            party.createInitialMembers(dataManager);

            return {
                memberCount: party.members.length,
                hasGold: party.gold >= 0,
                hasInventory: Array.isArray(party.inventory),
                firstMemberName: party.members[0] ? party.members[0].name : null
            };
        });

        expect(result.memberCount).toBeGreaterThan(0);
        expect(result.hasGold).toBe(true);
        expect(result.hasInventory).toBe(true);
        expect(result.firstMemberName).toBeTruthy();
    });
});
