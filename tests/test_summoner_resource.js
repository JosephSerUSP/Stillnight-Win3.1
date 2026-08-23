import assert from 'node:assert/strict';
import { Game_Party } from '../src/objects/party.js';
import { Game_Battler } from '../src/objects/battler.js';
import { SummonerResourceSystem } from '../src/engine/systems/summoner_resource.js';
import { SessionSerializer } from '../src/engine/session/serializer.js';
import { BattleSystem } from '../src/engine/systems/battle.js';
import { Registry } from '../src/engine/data/registry.js';

function makeBattler(id, { role = 'Attacker', maxHp = 100, maxMp = 0, mpd, isEnemy = false } = {}) {
  return new Game_Battler({
    id,
    name: id,
    role,
    maxHp,
    maxMp,
    mpd,
    level: 1,
    elements: [],
    skills: [],
    passives: [],
    traits: [],
  }, 1, isEnemy);
}

function makeParty() {
  const party = new Game_Party();
  party.slots[0] = makeBattler('light', { mpd: 1 });
  party.slots[1] = makeBattler('heavy', { mpd: 3 });
  party.slots[4] = makeBattler('summoner', { role: 'Summoner', maxHp: 50, maxMp: 100 });
  party.summoner.mp = 6;
  return party;
}

const party = makeParty();
assert.equal(party.slots[0].mpd, 1);
assert.equal(party.slots[1].mpd, 3);
assert.equal(party.summoner.mpd, 0);
assert.equal(SummonerResourceSystem.getMovementCost(party), 5); // 1 overhead + 1 + 3

let events = SummonerResourceSystem.consumeMovement(party);
assert.equal(party.summoner.mp, 1);
assert.equal(party.summoner.exhaustion, 0);
assert.equal(events[0].type, 'summoner_mp_loss');

const hpBeforeLevel1 = party.slots[0].hp;
events = SummonerResourceSystem.consumeMovement(party);
assert.equal(party.summoner.mp, 0);
assert.equal(party.summoner.exhaustion, 1);
assert.equal(party.slots[0].isStateAffected('weakened'), true);
assert.equal(hpBeforeLevel1 - party.slots[0].hp, 5);
assert.ok(events.some(event => event.type === 'exhaustion_start'));

const hpBeforeLevel2 = party.slots[0].hp;
events = SummonerResourceSystem.consumeCreatureAction(party, party.slots[0]);
assert.equal(party.summoner.exhaustion, 2);
assert.equal(hpBeforeLevel2 - party.slots[0].hp, 10);
assert.ok(events.some(event => event.type === 'exhaustion_increase' && event.level === 2));

// Restoring MP resolves the persisted pressure state deterministically.
party.summoner.mp = 20;
events = SummonerResourceSystem.recoverIfPossible(party, 'test_restore');
assert.equal(party.summoner.exhaustion, 0);
assert.equal(party.slots[0].isStateAffected('weakened'), false);
assert.ok(events.some(event => event.type === 'exhaustion_recovered'));

// Safe movement never charges MP and clears exhaustion even at zero MP.
party.summoner.mp = 0;
SummonerResourceSystem.consumeCreatureAction(party, party.slots[0]);
assert.equal(party.summoner.exhaustion, 1);
events = SummonerResourceSystem.consumeMovement(party, { safe: true });
assert.equal(party.summoner.mp, 0);
assert.equal(party.summoner.exhaustion, 0);
assert.equal(party.slots[0].isStateAffected('weakened'), false);
assert.ok(events.some(event => event.type === 'exhaustion_recovered'));

// The existing Game_Party map entry point delegates to the same rule source.
party.summoner.mp = 10;
events = party.onStep(false);
assert.equal(party.summoner.mp, 5);
assert.equal(events[0].kind, 'movement');

// Direct Summoner commands use the shared contract.
events = SummonerResourceSystem.consumeDirectAction(party, 'formation');
assert.equal(party.summoner.mp, 4);
assert.equal(events[0].kind, 'summoner_formation');

// Battle creature actions drain that creature's mpd; enemy actions do not.
const battleParty = makeParty();
battleParty.summoner.mp = 20;
const enemy = makeBattler('enemy', { maxHp: 20, isEnemy: true });
Registry.set('skills', {
  testStrike: {
    id: 'testStrike',
    name: 'Test Strike',
    target: 'enemy',
    effects: [{ type: 'hp_damage', value: 1 }],
  }
});
Registry.set('elements', {});
const battle = new BattleSystem();
const state = battle.createSession({ party: battleParty, enemies: [enemy] });
const actor = battleParty.slots[1];
battle.executeAction(state, { subject: actor, target: enemy, skillId: 'testStrike', item: Registry.getSkill('testStrike') });
assert.equal(battleParty.summoner.mp, 17);
const mpBeforeEnemy = battleParty.summoner.mp;
battle.executeAction(state, { subject: enemy, target: actor, skillId: 'testStrike', item: Registry.getSkill('testStrike') });
assert.equal(battleParty.summoner.mp, mpBeforeEnemy);

// Exhaustion survives save/load on the Summoner battler.
const saveParty = makeParty();
saveParty.summoner.mp = 0;
SummonerResourceSystem.consumeCreatureAction(saveParty, saveParty.slots[0]);
SummonerResourceSystem.consumeCreatureAction(saveParty, saveParty.slots[0]);
assert.equal(saveParty.summoner.exhaustion, 2);
Registry.set('actors', [
  saveParty.slots[0].actorData,
  saveParty.slots[1].actorData,
  saveParty.summoner.actorData,
]);
const serialized = SessionSerializer.toJSON({ party: saveParty, exploration: null, battle: null, interpreter: null, quests: null });
const restored = SessionSerializer.fromJSON(serialized);
assert.equal(restored.summoner?.exhaustion, undefined); // party has no direct summoner alias
assert.equal(restored.party.summoner.exhaustion, 2);
assert.equal(restored.party.summoner.mp, 0);

console.log('summoner resource contract OK');
