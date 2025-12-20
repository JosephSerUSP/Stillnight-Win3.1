import { SessionSerializer } from "../src/engine/session/serializer.js";
import { Registry } from "../src/engine/data/registry.js";
import { Game_Party } from "../src/objects/party.js";
import { Game_Battler } from "../src/objects/battler.js";
import { strict as assert } from 'assert';

// Mock Data
Registry.set('actors', [
    { id: 'hero', name: 'Hero', maxHp: 100, maxMp: 50, traits: [] },
    { id: 'monster', name: 'Monster', maxHp: 50, traits: [] }
]);

async function testSerialization() {
    console.log("Testing SessionSerializer...");

    // Setup Session
    const party = new Game_Party();
    const hero = new Game_Battler(Registry.get('actors')[0]);
    hero.hp = 80; // Damaged
    party.addMember(hero);
    party.gold = 100;

    const session = {
        party: party,
        exploration: { floorIndex: 1, playerX: 5, playerY: 5 },
        battle: null,
        interpreter: null
    };

    // Serialize
    const json = SessionSerializer.toJSON(session);
    console.log("Serialized:", JSON.stringify(json).substring(0, 100) + "...");

    assert.equal(json.party.gold, 100);
    assert.equal(json.party.slots[0].hp, 80);
    assert.equal(json.party.slots[0].actorId, 'hero');

    // Deserialize
    const restored = SessionSerializer.fromJSON(json);

    assert.equal(restored.party.gold, 100);
    assert.equal(restored.party.slots[0].hp, 80);
    assert.equal(restored.party.slots[0].name, 'Hero');
    assert.equal(restored.party.slots[0] instanceof Game_Battler, true);
    assert.equal(restored.exploration.floorIndex, 1);

    console.log("Serialization Test Passed!");
}

testSerialization().catch(e => {
    console.error(e);
    process.exit(1);
});
