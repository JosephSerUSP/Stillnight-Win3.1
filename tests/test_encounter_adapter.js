import { EncounterAdapter } from "../src/engine/adapters/encounter_adapter.js";
import { Registry } from "../src/engine/data/registry.js";

// Mock Data
const actors = [
    { id: 'slime', name: 'Slime', role: 'Minion' },
    { id: 'wolf', name: 'Wolf', role: 'Minion' },
    { id: 'boss', name: 'Boss', role: 'Boss' }
];
const mapFloor = {
    encounters: [{ id: 'slime', weight: 1 }, { id: 'wolf', weight: 1 }]
};
const dataManager = { actors };

// Populate Registry mock
Registry.set('actors', actors);

async function test() {
    console.log("Testing EncounterAdapter...");

    // Test 1: Random Encounter
    const enemies = EncounterAdapter.generateEnemies(mapFloor, null, 1, dataManager);
    console.log("Random Encounter:", enemies.map(e => e.name));
    if (enemies.length < 1 || enemies.length > 3) console.error("FAIL: Enemy count out of range");
    if (!enemies[0].name) console.error("FAIL: Enemy missing name (Game_Battler instantiation failed?)");

    // Test 2: Specific Encounter
    const specificEnemies = EncounterAdapter.generateEnemies(mapFloor, 'wolf', 1, dataManager);
    console.log("Specific Encounter (Wolf):", specificEnemies.map(e => e.name));
    if (specificEnemies.length === 0) console.error("FAIL: No enemies generated");
    if (specificEnemies[0].name !== 'Wolf') console.error("FAIL: Expected Wolf, got " + specificEnemies[0].name);

    // Test 3: Boss
    const boss = EncounterAdapter.createBoss(5, dataManager);
    console.log("Boss:", boss.name);
    if (boss.name !== "🌑 Eternal Warden") console.error("FAIL: Boss name mismatch");

    console.log("Done.");
}

test();
