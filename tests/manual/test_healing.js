
import { BattleSystem } from '../../src/engine/systems/battle.js';
import { Registry } from '../../src/engine/data/registry.js';
import { Game_Battler } from '../../src/objects/battler.js';
import { Game_Party } from '../../src/objects/party.js';

// Setup Registry
Registry.set('skills', {
    'heal': { id: 'heal', name: 'Heal', target: 'ally', effects: [{ type: 'hp_heal', value: 20 }] },
    'fire': { id: 'fire', name: 'Fire', target: 'enemy', effects: [{ type: 'hp_damage', value: 10 }] }
});

// Mock Battler
class MockBattler extends Game_Battler {
    constructor(id, stats) {
        super({ id, level: 1, ...stats }, 1, false);
        this.name = id;
        this._stats = stats;
        this.hp = stats.currentHp || stats.maxHp;
        this.maxHp = stats.maxHp;
        this.skills = stats.skills || [];
    }

    get atk() { return this._stats.atk || 10; }
    get def() { return this._stats.def || 10; }
    get asp() { return this._stats.asp || 0; }
}

const party = new Game_Party();
const cleric = new MockBattler('Cleric', { maxHp: 100, currentHp: 50, atk: 10, role: 'cleric', skills: ['heal'] });
const fighter = new MockBattler('Fighter', { maxHp: 100, currentHp: 50, atk: 10, role: 'fighter' });
party.slots[0] = cleric;
party.slots[1] = fighter;

const enemy = new MockBattler('Goblin', { maxHp: 50, atk: 8, asp: 5 });
const enemies = [enemy];

const battleSystem = new BattleSystem();
const state = battleSystem.createSession({ party, enemies });

console.log("Battle Started.");
battleSystem.planRound(state);

const clericCtx = { battler: cleric, index: 0, isEnemy: false };

// Force Cleric to use Heal via AI
// We mock random to ensure skill usage? Or we manually check getAIAction logic?
// The logic says "60% chance to use skill".
// We can't easily mock random() here without dependency injection, but we can call getAIAction multiple times.

let action = null;
for(let i=0; i<10; i++) {
    action = battleSystem.getAIAction(state, clericCtx);
    if (action.skillId === 'heal') break;
}

if (!action || action.skillId !== 'heal') {
    console.log("AI chose Attack (or failed to choose Heal). Forcing Heal for test.");
    action = {
        subject: cleric,
        skillId: 'heal',
        isAttack: false,
        item: Registry.getSkill('heal')
    };
    // Let's see what getAIAction would have picked for target if we force the skill logic
    // We can't easily.
}

// Current Issue: getAIAction picks target internally.
// If we forced the action structure, we missed the target selection logic.
// Let's inspect the action returned by getAIAction if it WAS heal.
if (action.target) {
    console.log(`AI Selected Target: ${action.target.name}`);
    if (enemies.includes(action.target)) {
        console.error("FAIL: Heal targeted an Enemy!");
    } else if ([cleric, fighter].includes(action.target)) {
        console.log("PASS: Heal targeted an Ally.");
    } else {
        console.error("FAIL: Unknown target.");
    }
} else {
    console.log("Action has no target yet (BattleSystem might assign in executeAction if missing, but getAIAction usually assigns one).");
}

// Execute
const events = battleSystem.executeAction(state, action);
events.forEach(e => console.log(`[Event] ${e.type}: ${e.msg}`));

if (cleric.hp > 50 || fighter.hp > 50) {
    console.log("PASS: HP increased.");
} else {
    // If we targeted enemy, enemy HP might have increased (capped at max).
    if (enemy.hp > 50) console.log("FAIL: Enemy healed!"); // Enemy max is 50 though.
    console.log("Check HP:");
    console.log(`Cleric: ${cleric.hp}`);
    console.log(`Fighter: ${fighter.hp}`);
    console.log(`Goblin: ${enemy.hp}`);
}
