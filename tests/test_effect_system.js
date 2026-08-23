import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { EffectSystem } from '../src/engine/rules/effects.js';
import { ContentLoader } from '../src/data/content_loader.js';
import { BattleSystem } from '../src/engine/systems/battle.js';
import { Registry } from '../src/engine/data/registry.js';
import { Game_Battler } from '../src/objects/battler.js';
import { skills } from '../data/skills.js';
import { passives } from '../data/passives.js';

function battler(overrides = {}) {
    return new Game_Battler({
        id: 'effect-test',
        name: 'Effect Test',
        maxHp: 20,
        maxMp: 100,
        level: 1,
        elements: ['Red'],
        skills: [],
        passives: [],
        traits: [],
        ...overrides,
    });
}

// Current authored vocabulary is executable.
const items = JSON.parse(readFileSync(new URL('../data/items.json', import.meta.url), 'utf8'));
const loader = new ContentLoader();
loader.items = items;
loader.skills = skills;
assert.doesNotThrow(() => loader.validateEffectVocabulary());

// Unknown authored keys fail at the content boundary with actionable context.
loader.items = [{ id: 'broken_item', effects: [{ type: 'does_not_exist', value: 1 }] }];
assert.throws(
    () => loader.validateEffectVocabulary(),
    error => error instanceof Error &&
        error.message.includes('data/items.json :: broken_item :: effects[0]') &&
        error.message.includes('does_not_exist')
);

// Current authored MP/status effects execute.
const summoner = battler({ id: 'summoner', role: 'Summoner' });
summoner.mp = 10;
let result = EffectSystem.apply('mp_heal', 25, null, summoner);
assert.equal(result.type, 'mp_heal');
assert.equal(result.value, 25);
assert.equal(summoner.mp, 35);
assert.equal(EffectSystem.getDescription('mp_heal', 25), 'Restores 25 MP');
assert.equal(EffectSystem.getPreview('mp_heal', 25, summoner, null), 'MP: 35/100 -> 60/100');

summoner.addState('weakened');
assert.equal(summoner.isStateAffected('weakened'), true);
result = EffectSystem.apply('remove_status', 'weakened', null, summoner);
assert.equal(result.type, 'status_remove');
assert.equal(summoner.isStateAffected('weakened'), false);

// Learning actions respects duplicates and capacity.
const learner = battler();
result = EffectSystem.apply('learnAction', 'windBlade', null, learner, { skills });
assert.deepEqual(
    { type: result.type, ok: result.ok, actionId: result.actionId },
    { type: 'learn_action', ok: true, actionId: 'windBlade' }
);
assert.deepEqual(learner.skills, ['windBlade']);
assert.equal(EffectSystem.apply('learnAction', 'windBlade', null, learner, { skills }).reason, 'known');
learner.skills = ['windBlade', 'soothingMote', 'boneRush', 'holySmite'];
assert.equal(EffectSystem.apply('learnAction', 'shadowClaw', null, learner, { skills }).reason, 'capacity');
assert.equal(EffectSystem.apply('learnAction', 'missingSkill', null, battler(), { skills }).reason, 'unknown_action');

// Learning passives resolves authored definitions and respects duplicates/capacity.
const passiveLearner = battler();
result = EffectSystem.apply('learnPassive', 'initiative', null, passiveLearner, { passives });
assert.equal(result.type, 'learn_passive');
assert.equal(result.ok, true);
assert.equal(passiveLearner.passives[0], passives.initiative);
assert.equal(EffectSystem.apply('learnPassive', 'initiative', null, passiveLearner, { passives }).reason, 'known');
passiveLearner.passives = [passives.initiative, passives.rearGuard];
assert.equal(EffectSystem.apply('learnPassive', 'symbiosis', null, passiveLearner, { passives }).reason, 'capacity');
assert.equal(EffectSystem.apply('learnPassive', 'missingPassive', null, battler(), { passives }).reason, 'unknown_passive');

// Permanent element mutation preserves repeated-element semantics.
const elemental = battler({ elements: ['Red', 'Blue'] });
result = EffectSystem.apply('elementAdd', 'Green', null, elemental);
assert.equal(result.ok, true);
assert.deepEqual(elemental.elements, ['Red', 'Blue', 'Green']);
result = EffectSystem.apply('elementChange', 'White', null, elemental);
assert.equal(result.ok, true);
assert.deepEqual(elemental.elements, ['White', 'White', 'White']);

const emptyElemental = battler({ elements: [] });
EffectSystem.apply('elementChange', 'Black', null, emptyElemental);
assert.deepEqual(emptyElemental.elements, ['Black']);

// Authored effect normalization keeps add_status metadata intact.
assert.deepEqual(
    EffectSystem.valueFromAuthoredEffect({ type: 'add_status', status: 'poison', chance: 0.4 }),
    { id: 'poison', chance: 0.4 }
);

// BattleSystem is an execution consumer of the same authored effect contract.
Registry.set('items', items);
Registry.set('skills', skills);
Registry.set('passives', passives);
const battleSystem = new BattleSystem();
const battleSummoner = battler({ id: 'battle-summoner', role: 'Summoner' });
const enemy = battler({ id: 'dummy-enemy', isEnemy: true });
enemy.isEnemy = true;
const battleState = battleSystem.createSession({
    party: { summoner: battleSummoner, activeMembers: [battleSummoner] },
    enemies: [enemy]
});
const wine = items.find(item => item.id === 'wine_glass');
battleSummoner.mp = 5;
battleSummoner.addState('weakened');
let battleEvents = battleSystem.executeAction(battleState, {
    subject: battleSummoner,
    target: battleSummoner,
    itemId: wine.id,
    item: wine
});
const wineMpEvent = battleEvents.find(event => event.type === 'mp_heal');
assert.equal(wineMpEvent?.value, 50);
assert.equal(battleSummoner.isStateAffected('weakened'), false);
assert.ok(battleEvents.some(event => event.type === 'status_remove'));

const lesson = {
    id: 'passive_lesson',
    name: 'Passive Lesson',
    type: 'consumable',
    effects: [{ type: 'learnPassive', value: 'initiative' }]
};
const lessonTarget = battler({ id: 'lesson-target' });
battleEvents = battleSystem.executeAction(battleState, {
    subject: battleSummoner,
    target: lessonTarget,
    itemId: lesson.id,
    item: lesson
});
assert.ok(battleEvents.some(event => event.type === 'learn_passive' && event.ok));
assert.equal(lessonTarget.passives[0], passives.initiative);

console.log(`effect contract OK (${EffectSystem.getRegisteredKeys().length} registered keys)`);
