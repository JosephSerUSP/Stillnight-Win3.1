import assert from 'node:assert/strict';
import { BattleSystem } from '../src/engine/systems/battle.js';
import { Registry } from '../src/engine/data/registry.js';
import { Game_Party } from '../src/objects/party.js';
import { Game_Battler } from '../src/objects/battler.js';
import { spells } from '../data/spells.js';

function battler(id, { role = 'Attacker', maxHp = 100, maxMp = 0, isEnemy = false } = {}) {
  return new Game_Battler({
    id,
    name: id,
    role,
    maxHp,
    maxMp,
    level: 1,
    elements: [],
    skills: [],
    passives: [],
    traits: [],
  }, 1, isEnemy);
}

function makeBattle() {
  const party = new Game_Party();
  party.slots[0] = battler('creature');
  party.slots[4] = battler('summoner', { role: 'Summoner', maxHp: 60, maxMp: 30 });
  party.summoner.mp = 20;

  const enemy = battler('enemy', { maxHp: 100, isEnemy: true });
  const system = new BattleSystem();
  const state = system.createSession({ party, enemies: [enemy] });
  return { party, enemy, system, state };
}

Registry.set('spells', spells);
Registry.set('skills', {});
Registry.set('passives', {});

// The Summoner stays out of the ordinary creature turn queue.
{
  const { system, state } = makeBattle();
  system.planRound(state);
  assert.equal(state.turnQueue.some(entry => entry.battler.role === 'Summoner'), false);
}

// Cure resolves through EffectSystem and pays the authored MP cost exactly once.
{
  const { party, system, state } = makeBattle();
  const target = party.slots[0];
  target.hp = 40;
  const beforeHp = target.hp;
  const result = system.castSummonerSpell(state, 'cure', target);

  assert.equal(result.ok, true);
  assert.equal(result.cost, spells.cure.mpCost);
  assert.ok(target.hp > beforeHp);
  assert.equal(party.summoner.mp, 20 - spells.cure.mpCost);
  assert.ok(result.events.some(event => event.type === 'spell_cast' && event.spell.id === 'cure'));
  assert.ok(result.events.some(event => event.type === 'heal' && event.target === target));
  assert.ok(result.events.some(event => event.type === 'summoner_mp_loss' && event.cost === spells.cure.mpCost));
}

// Protect is a non-healing authored spell and applies the ordinary state system.
{
  const { party, system, state } = makeBattle();
  const target = party.slots[0];
  const mpBefore = party.summoner.mp;
  const result = system.castSummonerSpell(state, 'protect', target);

  assert.equal(result.ok, true);
  assert.equal(target.isStateAffected('protect'), true);
  assert.equal(party.summoner.mp, mpBefore - spells.protect.mpCost);
  assert.ok(result.events.some(event => event.type === 'status' && event.status === 'protect'));
}

// A target that cannot benefit is explicitly rejected and costs nothing.
{
  const { party, system, state } = makeBattle();
  const target = party.slots[0];
  target.hp = target.maxHp;
  party.summoner.hp = party.summoner.maxHp;
  const mpBefore = party.summoner.mp;
  const result = system.castSummonerSpell(state, 'cure', target);

  assert.equal(result.ok, false);
  assert.equal(result.reason, 'no_valid_targets');
  assert.equal(party.summoner.mp, mpBefore);
  assert.ok(result.events.some(event => event.type === 'spell_failed'));
}

// Duplicate state targets are invalid even when another party member could receive it.
{
  const { party, system, state } = makeBattle();
  const target = party.slots[0];
  target.addState('protect');
  const mpBefore = party.summoner.mp;
  const result = system.castSummonerSpell(state, 'protect', target);

  assert.equal(result.ok, false);
  assert.equal(result.reason, 'invalid_target');
  assert.equal(party.summoner.mp, mpBefore);
}

// Insufficient MP is explicit and does not mutate spell targets.
{
  const { party, system, state } = makeBattle();
  const target = party.slots[0];
  party.summoner.mp = 0;
  const result = system.castSummonerSpell(state, 'protect', target);

  assert.equal(result.ok, false);
  assert.equal(result.reason, 'insufficient_mp');
  assert.equal(target.isStateAffected('protect'), false);
  assert.equal(party.summoner.mp, 0);
}

// All-target spells derive their target set from the engine rather than UI loops.
{
  const { party, system, state } = makeBattle();
  party.slots[0].hp = 50;
  party.summoner.hp = 30;
  const creatureBefore = party.slots[0].hp;
  const summonerBefore = party.summoner.hp;
  const result = system.castSummonerSpell(state, 'cureAll');

  assert.equal(result.ok, true);
  assert.ok(party.slots[0].hp > creatureBefore);
  assert.ok(party.summoner.hp > summonerBefore);
  assert.equal(party.summoner.mp, 20 - spells.cureAll.mpCost);
  assert.equal(result.targets.length, 2);
}

console.log('summoner spell contract OK');
