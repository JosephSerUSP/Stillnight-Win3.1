const { test, expect } = require('@playwright/test');

test.describe('Battle System', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/?test=true');
        // Wait for all critical data to be loaded
        await page.waitForFunction(() =>
            window.dataManager &&
            window.dataManager.actors &&
            window.dataManager.items &&
            window.dataManager.terms &&
            window.dataManager.elements &&
            window.dataManager.skills &&
            window.dataManager.passives &&
            window.dataManager.startingParty
        );
    });

    test('BattleManager initializes turn queue correctly', async ({ page }) => {
        const result = await page.evaluate(() => {
            const { BattleManager, Game_Battler, Game_Party } = window;
            const dataManager = window.dataManager;
            const party = new Game_Party();
            // Mock party members
            const heroData = dataManager.actors.find(a => a.id === "hero");
            const hero = new Game_Battler({...heroData, level: 1});
            party.members.push(hero);

            const bm = new BattleManager(party, dataManager);

            // Mock enemies
            const slimeData = { name: "Slime", maxHp: 10, level: 1, elements: [], skills: [] };
            const enemy = new Game_Battler(slimeData, 1, true);

            bm.setup([enemy], 0, 0);
            bm.startRound();

            return {
                queueLength: bm.turnQueue.length,
                firstBattlerName: bm.turnQueue[0].battler.name
            };
        });

        expect(result.queueLength).toBe(2);
    });

    test('Damage calculation considers elemental weakness', async ({ page }) => {
        const result = await page.evaluate(() => {
            const { BattleManager, Game_Battler, Game_Party } = window;
            const dataManager = window.dataManager;
            const party = new Game_Party();
            const bm = new BattleManager(party, dataManager);

            // Find an element with a weakness
            let attackerElem = "Fire";
            let defenderElem = null;

            // Look for a valid weakness pair from loaded data
            for (const [elemName, data] of Object.entries(dataManager.elements)) {
                if (data.strong && data.strong.length > 0) {
                    attackerElem = elemName;
                    defenderElem = data.strong[0];
                    break;
                }
            }

            if (!defenderElem) return { error: "No element weakness found in data" };

            const attacker = new Game_Battler({ name: "Attacker", maxHp: 100, level: 10, elements: [attackerElem] });
            const defender = new Game_Battler({ name: "Defender", maxHp: 100, level: 10, elements: [defenderElem] }, 1, true);

            const multiplier = bm.elementMultiplier(attacker.elements, defender.elements);

            return { multiplier, attackerElem, defenderElem };
        });

        expect(result.error).toBeUndefined();
        expect(result.multiplier).toBe(1.5);
    });

    test('Healing skill restores HP', async ({ page }) => {
        const result = await page.evaluate(() => {
            const { BattleManager, Game_Battler, Game_Party } = window;
            const dataManager = window.dataManager;
            const party = new Game_Party();
            const bm = new BattleManager(party, dataManager);

            // Setup healer and injured ally
            const healer = new Game_Battler({ name: "Cleric", maxHp: 50, level: 5 });
            const ally = new Game_Battler({ name: "Warrior", maxHp: 100, level: 5 });
            ally.hp = 50; // Injured

            // Find a healing skill
            let healSkillId = null;
            for (const [id, skill] of Object.entries(dataManager.skills)) {
                if (skill.effects.some(e => e.type === 'hp_heal')) {
                    healSkillId = id;
                    break;
                }
            }

            if (!healSkillId) return { error: "No healing skill found" };

            // Execute heal action
            const sourceContext = { battler: healer, index: 0, isEnemy: false };
            const action = bm.createAction(sourceContext, 'skill', ally, { skillId: healSkillId });

            const events = bm.executeAction(action);
            const healEvent = events.find(e => e.type === 'heal');

            return {
                hpAfter: ally.hp,
                healedAmount: healEvent ? healEvent.value : 0
            };
        });

        expect(result.hpAfter).toBeGreaterThan(50);
        expect(result.healedAmount).toBeGreaterThan(0);
    });

    test('Battle ends when all enemies are defeated', async ({ page }) => {
        const isVictory = await page.evaluate(() => {
            const { BattleManager, Game_Battler, Game_Party } = window;
            const dataManager = window.dataManager;
            const party = new Game_Party();
            const hero = new Game_Battler({ name: "Hero", maxHp: 100, level: 1 });
            party.members.push(hero);

            const bm = new BattleManager(party, dataManager);

            const enemy = new Game_Battler({ name: "Slime", maxHp: 1, level: 1 }, 1, true);
            enemy.hp = 1;

            bm.setup([enemy], 0, 0);

            const sourceContext = { battler: hero, index: 0, isEnemy: false };
            const action = bm.createAction(sourceContext, 'attack', enemy);

            // Mock high damage to ensure kill
            hero.getPassiveValue = () => 999;
            hero.level = 50;

            bm.executeAction(action);

            return bm.isVictoryPending;
        });

        expect(isVictory).toBe(true);
    });

    test('Passive PARASITE drains HP at start of turn', async ({ page }) => {
        const result = await page.evaluate(() => {
            const { BattleManager, Game_Battler, Game_Party } = window;
            const dataManager = window.dataManager;
            const party = new Game_Party();

            // Ensure PARASITE is available
            // parasite in data has ID 'parasite', code 'PARASITE', value 2.
            // The test needs to use the ID to load it.

            const hero = new Game_Battler({
                name: "Hero",
                maxHp: 100,
                level: 1,
                passives: [parasiteCode]
            });

            // Force the passive trait for the test to ensure isolation from data changes
            // Or trust the loader. Since we just refactored data/passives.js,
            // 'parasite' ID should load object with traits: [{code: 'PARASITE', value: 2}]

            // To be safe against data loading issues in test env, we can manually ensure the trait exists.
            // But we can't easily push to 'passives' if it's already processed into objects.
            // Game_Battler.passives is Array<Object>.
            // Let's check if the trait is there.
            const hasTrait = hero.traitsSum("PARASITE") > 0;

            if (!hasTrait) {
                 // Inject a mock passive object with the trait
                 hero.passives.push({
                     id: 'test_parasite',
                     name: 'Test Parasite',
                     traits: [{ code: 'PARASITE', value: 5 }]
                 });
            }

            hero.hp = 50;
            party.members.push(hero);

            const ally = new Game_Battler({ name: "Ally", maxHp: 100, level: 1 });
            ally.hp = 100;
            party.members.push(ally);

            const bm = new BattleManager(party, dataManager);
            bm.setup([], 0, 0);

            const context = { battler: hero, index: 0, isEnemy: false };

            const events = bm.startTurn(context);
            const drainEvent = events.find(e => e.type === 'passive_drain');

            return {
                drainValue: drainEvent ? drainEvent.value : 0,
                heroHp: hero.hp,
                allyHp: ally.hp
            };
        });

        expect(result.drainValue).toBeGreaterThan(0);
        expect(result.heroHp).toBe(50 + result.drainValue);
        expect(result.allyHp).toBe(100 - result.drainValue);
    });
});
