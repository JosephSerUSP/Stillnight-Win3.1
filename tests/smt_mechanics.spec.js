const { test, expect } = require('@playwright/test');

test.describe('SMT Mechanics', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/?test=true');
        // Wait for dataManager to be fully loaded
        await page.waitForFunction(() =>
            window.dataManager &&
            window.dataManager.terms &&
            window.dataManager.actors &&
            window.BattleManager &&
            window.Game_Action
        );
    });

    test('Weakness hit triggers One More', async ({ page }) => {
        const result = await page.evaluate(() => {
            const { BattleManager, Game_Battler, Game_Party, Game_Action } = window;
            const dataManager = window.dataManager;
            const party = new Game_Party();

            // Attacker: Fire User (Pyro Jack)
            const attackerData = dataManager.actors.find(a => a.id === 'pyroJack');
            if (!attackerData) return { error: "Pyro Jack not found" };

            const attacker = new Game_Battler(attackerData, 5);
            party.addMember(attacker);

            // Defender: Jack Frost (Weak to Fire)
            const defenderData = dataManager.actors.find(a => a.id === 'jackFrost');
            if (!defenderData) return { error: "Jack Frost not found" };

            const defender = new Game_Battler(defenderData, 5, true);

            const bm = new BattleManager(party, dataManager);
            bm.setup([defender], 0, 0);

            // Execute Agi (Fire)
            const action = new Game_Action(attacker);
            action.setSkill('agi', dataManager);
            action.target = defender;

            // Ensure attacker hasn't acted one more
            attacker._hasActedOneMore = false;

            const events = bm.executeAction(action);
            const damageEvent = events.find(e => e.type === 'damage');
            const oneMoreEvent = events.find(e => e.type === 'one_more');

            return {
                isWeakness: damageEvent ? damageEvent.isWeakness : false,
                oneMoreTriggered: !!oneMoreEvent,
                hasActedOneMore: attacker._hasActedOneMore
            };
        });

        expect(result.error).toBeUndefined();
        expect(result.isWeakness).toBe(true);
        expect(result.oneMoreTriggered).toBe(true);
        expect(result.hasActedOneMore).toBe(true);
    });

    test('Resist hit does NOT trigger One More', async ({ page }) => {
        const result = await page.evaluate(() => {
            const { BattleManager, Game_Battler, Game_Party, Game_Action } = window;
            const dataManager = window.dataManager;
            const party = new Game_Party();

            // Attacker: Ice User (Jack Frost)
            const attackerData = dataManager.actors.find(a => a.id === 'jackFrost');
            const attacker = new Game_Battler(attackerData, 5);
            party.addMember(attacker);

            // Defender: Resists Ice (Jack Frost)
            const defenderData = dataManager.actors.find(a => a.id === 'jackFrost');
            const defender = new Game_Battler(defenderData, 5, true);

            const bm = new BattleManager(party, dataManager);
            bm.setup([defender], 0, 0);

            // Execute Bufu (Ice)
            const action = new Game_Action(attacker);
            action.setSkill('bufu', dataManager);
            action.target = defender;

            const events = bm.executeAction(action);
            const damageEvent = events.find(e => e.type === 'damage');
            const oneMoreEvent = events.find(e => e.type === 'one_more');

            return {
                isWeakness: damageEvent ? damageEvent.isWeakness : false,
                oneMoreTriggered: !!oneMoreEvent
            };
        });

        expect(result.isWeakness).toBe(false);
        expect(result.oneMoreTriggered).toBe(false);
    });
});
