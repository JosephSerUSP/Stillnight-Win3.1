
import { BattleSystem } from '../../src/engine/systems/battle.js';
import { Registry } from '../../src/engine/data/registry.js';
import { Game_Battler } from '../../src/objects/battler.js';
import { Game_Party } from '../../src/objects/party.js';

// Setup Registry
Registry.set('skills', {
    'fireball': { id: 'fireball', name: 'Fireball', element: 'fire', effects: [{ type: 'hp_damage', value: 20 }] }
});
Registry.set('elements', {
    'fire': { strong: ['ice'], weak: ['water'] },
    'ice': { strong: ['wind'], weak: ['fire'] }
});

// Mock Battler
class MockBattler extends Game_Battler {
    constructor(id, stats, isEnemy = false) {
        // Pass minimal checks
        super({ id, level: 1, ...stats }, 1, isEnemy);
        this.name = id;
        this._stats = stats; // Store raw stats
        this.hp = stats.maxHp;
        this.maxHp = stats.maxHp;
    }

    get atk() { return this._stats.atk || 10; }
    get def() { return this._stats.def || 10; }
    get asp() { return this._stats.asp || 0; }
    get elements() { return this._stats.elements || []; }
}

const party = new Game_Party();
const hero = new MockBattler('Hero', { maxHp: 100, atk: 20, asp: 10, role: 'hero', elements: ['water'] }, false);
party.slots[0] = hero;

// Ensure getter works
console.log(`Hero ATK Check: ${hero.atk}`);

const enemy = new MockBattler('Goblin', { maxHp: 50, atk: 8, asp: 5, skills: ['fireball'], elements: ['fire'] }, true);
const enemies = [enemy];

const battleSystem = new BattleSystem();
const state = battleSystem.createSession({ party, enemies });

console.log("Battle Started.");
battleSystem.planRound(state);

// Hero Turn
const heroAction = { subject: party.slots[0], isAttack: true, target: enemy };
console.log("Hero Attacks...");
const events = battleSystem.executeAction(state, heroAction);
events.forEach(e => console.log(`[Event] ${e.type}: ${e.msg}`));

if (enemy.hp >= 50) console.error("Enemy took no damage!");

// Enemy Turn (AI)
state.turnQueue.shift(); // Remove Hero manually
const enemyTurn = battleSystem.getNextBattler(state);

if (!enemyTurn) {
    console.error("No enemy turn found!");
} else {
    console.log(`Enemy Turn: ${enemyTurn.battler.name}`);

    // Generate AI Action
    const enemyAction = battleSystem.getAIAction(state, enemyTurn);
    if (!enemyAction) console.error("AI generated no action");

    console.log(`Enemy executes ${enemyAction.isAttack ? 'Attack' : 'Skill'} (Speed: ${enemyAction.speed})`);

    // Target should be Hero
    if (enemyAction.target !== hero) {
        console.error(`Enemy targeted ${enemyAction.target ? enemyAction.target.name : 'null'} instead of Hero!`);
    }

    const enemyEvents = battleSystem.executeAction(state, enemyAction);
    enemyEvents.forEach(e => console.log(`[Event] ${e.type}: ${e.msg}`));

    if (hero.hp >= 100) console.error("Hero took no damage!");
}

console.log("Test Complete.");
