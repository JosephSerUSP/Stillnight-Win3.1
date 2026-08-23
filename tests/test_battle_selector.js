import { selectBattlerView, selectBattleScreen } from '../src/presentation/selectors/battle.js';

// Mock Data
const mockBattler = {
    name: "Hero",
    hp: 10,
    maxHp: 20,
    mp: 5,
    maxMp: 10,
    level: 1,
    expGrowth: 5,
    xp: 0,
    elements: ['Fire'],
    spriteKey: 'hero',
    role: 'Warrior',
    traits: [],
    evolutions: []
};

const mockParty = {
    slots: [mockBattler, null, null, null, { ...mockBattler, name: "Summoner", role: "Summoner" }],
    inventory: [],
    gold: 100
};

const mockEnemies = [
    { ...mockBattler, name: "Slime", traits: [] }
];

const mockBattleManager = {
    enemies: mockEnemies,
    getPlannedAction: () => null
};

async function runTests() {
    console.log("Running Battle Selector Tests...");

    // Test 1: selectBattlerView
    const view = selectBattlerView(mockBattler, 0, 'party', mockParty, mockBattleManager);

    if (view.name !== "Hero") throw new Error("Name mismatch");
    if (view.id !== "battler-party-0") throw new Error("ID mismatch");
    if (view.source !== mockBattler) throw new Error("Source mismatch");

    // Test 2: selectBattleScreen
    const screen = selectBattleScreen(mockParty, mockEnemies, mockBattleManager);

    if (screen.party.length !== 4) throw new Error("Party length mismatch");
    if (screen.party[0].name !== "Hero") throw new Error("Party 0 name mismatch");
    if (screen.party[1] !== null) throw new Error("Party 1 should be null");

    if (screen.enemies.length !== 1) throw new Error("Enemies length mismatch");
    if (screen.enemies[0].name !== "Slime") throw new Error("Enemy name mismatch");

    if (!screen.summoner) throw new Error("Summoner missing");
    if (screen.summoner.name !== "Summoner") throw new Error("Summoner name mismatch");

    console.log("Selector Tests Passed");
}

runTests().catch(e => {
    console.error(e);
    process.exit(1);
});
