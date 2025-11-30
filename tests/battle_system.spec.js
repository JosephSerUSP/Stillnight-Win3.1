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
            party.addMember(hero);

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
            party.addMember(hero);

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
            const parasiteCode = "PARASITE";
            // Use existing data or mock if missing in data files (but typically it's in passives.js)

            const hero = new Game_Battler({
                name: "Hero",
                maxHp: 100,
                level: 1,
                passives: [parasiteCode]
            });

            // Mock getPassiveValue if data isn't perfectly aligned or just rely on it working if data is good.
            // Game_Battler constructor resolves string passives to objects.
            // If PARASITE isn't in passives.js, value will be 0.
            // Let's force it for the test if needed, but better to trust the data.
            // We can inject it into the battler instance if needed.
            // Check if passive is loaded and has traits, or force it for test
            const hasTrait = hero.traits.some(t => t.code === parasiteCode);

            if (!hasTrait) {
                 // Manually add/update for test reliability
                 // Note: Logic now requires 'traits' array in passive object
                 hero.passives.push({
                     id: 'testParasite',
                     name: 'Parasite',
                     traits: [{ code: parasiteCode, value: 5 }]
                 });
            }

            hero.hp = 50;
            party.addMember(hero);

            const ally = new Game_Battler({ name: "Ally", maxHp: 100, level: 1 });
            ally.hp = 100;
            party.addMember(ally);

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

    test('Reserve party members do not enter battle (Active Members only)', async ({ page }) => {
        const queueLength = await page.evaluate(() => {
            const { BattleManager, Game_Battler, Game_Party } = window;
            const dataManager = window.dataManager;
            const party = new Game_Party();

            // Add 4 active members
            for(let i=0; i<4; i++) {
                const m = new Game_Battler({ name: `Member${i}`, maxHp: 100, level: 1 });
                party.addMember(m);
            }

            // Add 1 reserve member
            const reserve = new Game_Battler({ name: "Reserve", maxHp: 100, level: 1 });
            party.addMember(reserve);

            // Create a gap to test robust active member logic
            party.removeMember(party.slots[1]); // Remove Member1 (Slot 1)

            const bm = new BattleManager(party, dataManager);
            const enemy = new Game_Battler({ name: "Slime", maxHp: 10, level: 1 }, 1, true);

            bm.setup([enemy], 0, 0);
            bm.startRound();

            return bm.turnQueue.filter(t => !t.isEnemy).length;
        });

        expect(queueLength).toBe(3);
    });
});
