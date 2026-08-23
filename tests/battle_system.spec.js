import { test, expect } from '@playwright/test';

test.describe('Battle System', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/?test=true');
        await page.waitForFunction(() =>
            window.dataManager &&
            window.dataManager.actors &&
            window.dataManager.items &&
            window.dataManager.terms &&
            window.dataManager.elements &&
            window.dataManager.skills &&
            window.dataManager.passives &&
            window.dataManager.startingParty &&
            window.Game_Action &&
            window.BattleAdapter &&
            window.BattleSystem
        );
    });

    test('BattleAdapter initializes turn queue correctly', async ({ page }) => {
        const result = await page.evaluate(() => {
            const { BattleAdapter, BattleSystem, Game_Battler, Game_Party } = window;
            const dataManager = window.dataManager;
            const party = new Game_Party();
            const heroData = dataManager.actors.find(a => a.id === "hero");
            const hero = new Game_Battler({ ...heroData, level: 1 });
            party.addMember(hero);

            const bm = new BattleAdapter(party, new BattleSystem());
            const slimeData = { name: "Slime", maxHp: 10, level: 1, elements: [], skills: [] };
            const enemy = new Game_Battler(slimeData, 1, true);

            bm.setup([enemy], 0, 0);
            bm.planRound();

            return {
                queueLength: bm.turnQueue.length,
                firstBattlerName: bm.turnQueue[0].battler.name
            };
        });

        expect(result.queueLength).toBe(2);
    });

    test('Damage calculation considers elemental weakness', async ({ page }) => {
        const result = await page.evaluate(() => {
            const { Game_Battler, Game_Action } = window;
            const dataManager = window.dataManager;

            let attackerElem = "Fire";
            let defenderElem = null;
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
            const action = new Game_Action(attacker);
            const multiplier = action._elementMultiplier(attacker.elements, defender.elements, dataManager);

            return { multiplier, attackerElem, defenderElem };
        });

        expect(result.error).toBeUndefined();
        expect(result.multiplier).toBe(1.5);
    });

    test('Healing skill restores HP through BattleAdapter', async ({ page }) => {
        const result = await page.evaluate(() => {
            const { BattleAdapter, BattleSystem, Game_Battler, Game_Party, Game_Action } = window;
            const dataManager = window.dataManager;
            const party = new Game_Party();
            const healer = new Game_Battler({ name: "Cleric", maxHp: 50, level: 5, elements: [] });
            const ally = new Game_Battler({ name: "Warrior", maxHp: 100, level: 5, elements: [] });
            ally.hp = 50;
            party.addMember(healer);
            party.addMember(ally);

            const bm = new BattleAdapter(party, new BattleSystem());
            bm.setup([new Game_Battler({ name: "Dummy", maxHp: 100, level: 1, elements: [], skills: [] }, 1, true)], 0, 0);

            let healSkillId = null;
            for (const [id, skill] of Object.entries(dataManager.skills)) {
                if (skill.effects.some(e => e.type === 'hp_heal')) {
                    healSkillId = id;
                    break;
                }
            }
            if (!healSkillId) return { error: "No healing skill found" };

            const action = new Game_Action(healer);
            action.setSkill(healSkillId, dataManager);
            action.target = ally;
            const events = bm.executeAction(action);
            const healEvent = events.find(e => e.type === 'heal');

            return { hpAfter: ally.hp, healedAmount: healEvent ? healEvent.value : 0 };
        });

        expect(result.error).toBeUndefined();
        expect(result.hpAfter).toBeGreaterThan(50);
        expect(result.healedAmount).toBeGreaterThan(0);
    });

    test('Battle ends when all enemies are defeated', async ({ page }) => {
        const result = await page.evaluate(() => {
            const { BattleAdapter, BattleSystem, Game_Battler, Game_Party, Game_Action } = window;
            const dataManager = window.dataManager;
            const party = new Game_Party();
            const hero = new Game_Battler({ name: "Hero", maxHp: 100, level: 50, elements: [] });
            party.addMember(hero);

            const enemy = new Game_Battler({ name: "Slime", maxHp: 1, level: 1, elements: [], skills: [] }, 1, true);
            enemy.hp = 1;
            const bm = new BattleAdapter(party, new BattleSystem());
            bm.setup([enemy], 0, 0);

            const damageSkillId = Object.keys(dataManager.skills).find(id =>
                dataManager.skills[id].effects.some(e => e.type === 'hp_damage')
            );
            if (!damageSkillId) return { error: 'No damage skill found' };

            const action = new Game_Action(hero);
            action.setSkill(damageSkillId, dataManager);
            action.target = enemy;
            bm.executeAction(action);

            return { victory: bm.isVictoryPending, enemyHp: enemy.hp };
        });

        expect(result.error).toBeUndefined();
        expect(result.enemyHp).toBe(0);
        expect(result.victory).toBe(true);
    });

    test('Passive PARASITE drains HP at start of turn', async ({ page }) => {
        const result = await page.evaluate(() => {
            const { BattleAdapter, BattleSystem, Game_Battler, Game_Party } = window;
            const party = new Game_Party();
            const hero = new Game_Battler({ name: "Hero", maxHp: 100, level: 1, passives: ["PARASITE"] });

            if (!hero.traits.some(t => t.code === "PARASITE")) {
                hero.passives.push({ id: 'testParasite', name: 'Parasite', traits: [{ code: "PARASITE", value: 5 }] });
            }

            hero.hp = 50;
            party.addMember(hero);
            const ally = new Game_Battler({ name: "Ally", maxHp: 100, level: 1 });
            ally.hp = 100;
            party.addMember(ally);

            const bm = new BattleAdapter(party, new BattleSystem());
            bm.setup([], 0, 0);
            const events = bm.startTurn({ battler: hero, index: 0, isEnemy: false });
            const drainEvent = events.find(e => e.type === 'passive_drain');

            return { drainValue: drainEvent ? drainEvent.value : 0, heroHp: hero.hp, allyHp: ally.hp };
        });

        expect(result.drainValue).toBeGreaterThan(0);
        expect(result.heroHp).toBe(50 + result.drainValue);
        expect(result.allyHp).toBe(100 - result.drainValue);
    });

    test('Reserve party members do not enter battle (Active Members only)', async ({ page }) => {
        const queueLength = await page.evaluate(() => {
            const { BattleAdapter, BattleSystem, Game_Battler, Game_Party } = window;
            const party = new Game_Party();

            for (let i = 0; i < 4; i++) {
                party.addMember(new Game_Battler({ name: `Member${i}`, maxHp: 100, level: 1, skills: [] }));
            }
            party.addMember(new Game_Battler({ name: "Reserve", maxHp: 100, level: 1, skills: [] }));
            party.removeMember(party.slots[1]);

            const bm = new BattleAdapter(party, new BattleSystem());
            const enemy = new Game_Battler({ name: "Slime", maxHp: 10, level: 1, skills: [] }, 1, true);
            bm.setup([enemy], 0, 0);
            bm.planRound();

            return bm.turnQueue.filter(t => !t.isEnemy).length;
        });

        expect(queueLength).toBe(3);
    });
});
