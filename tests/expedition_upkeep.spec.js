import { test, expect } from '@playwright/test';

test.describe('Expedition upkeep', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/?test=true');
        await page.waitForFunction(() => window.Game_Party && window.Game_Battler);
    });

    test('deployed creatures drain their combined upkeep while reserves are free', async ({ page }) => {
        const result = await page.evaluate(() => {
            const party = new window.Game_Party();
            party.slots[0] = new window.Game_Battler({ id: 'light', name: 'Light', maxHp: 10, mpDrain: 1 });
            party.slots[1] = new window.Game_Battler({ id: 'heavy', name: 'Heavy', maxHp: 10, mpDrain: 3 });
            party.slots[5] = new window.Game_Battler({ id: 'reserve', name: 'Reserve', maxHp: 10, mpDrain: 9 });
            party.slots[4] = new window.Game_Battler({ id: 'summoner', name: 'Alex', role: 'Summoner', maxHp: 18, maxMp: 20, mpDrain: 0 });

            const cost = party.mpCostPerStep;
            party.onStep(false);
            return { cost, mp: party.summoner.mp };
        });

        expect(result.cost).toBe(4);
        expect(result.mp).toBe(16);
    });

    test('depletion escalates, affects creatures only, and clears when the link recovers', async ({ page }) => {
        const result = await page.evaluate(() => {
            const party = new window.Game_Party();
            const creature = new window.Game_Battler({ id: 'creature', name: 'Creature', maxHp: 100, mpDrain: 2 });
            const summoner = new window.Game_Battler({ id: 'summoner', name: 'Alex', role: 'Summoner', maxHp: 18, maxMp: 1, mpDrain: 0 });
            party.slots[0] = creature;
            party.slots[4] = summoner;

            const firstEvents = party.onStep(false);
            for (let i = 0; i < 8; i++) party.onStep(false);
            const depleted = {
                creatureHp: creature.hp,
                summonerHp: summoner.hp,
                weakened: creature.isStateAffected('weakened'),
                steps: party.variables.depletionSteps,
                announced: firstEvents.some(event => event.msg && event.msg.includes('runs dry'))
            };

            summoner.mp = 5;
            party.onStep(true);
            return {
                ...depleted,
                recovered: !creature.isStateAffected('weakened'),
                resetSteps: party.variables.depletionSteps
            };
        });

        expect(result.creatureHp).toBeLessThan(70);
        expect(result.summonerHp).toBe(18);
        expect(result.weakened).toBe(true);
        expect(result.steps).toBe(9);
        expect(result.announced).toBe(true);
        expect(result.recovered).toBe(true);
        expect(result.resetSteps).toBe(0);
    });
});
