import './setup.js'; // Must be first to hoist mocks

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Additional Mock: fetch
global.fetch = async (url) => {
    // Map data/X.json to local file system
    if (url.startsWith('data/')) {
        const filePath = path.join(PROJECT_ROOT, url);
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            return {
                ok: true,
                json: async () => JSON.parse(content),
                text: async () => content,
                arrayBuffer: async () => new ArrayBuffer(0) // Mock audio/midi load
            };
        } catch (e) {
            console.warn(`MockFetch: Failed to load ${url}`);
            return { ok: false };
        }
    }
    if (url.includes('assets/midi')) return { ok: false };
    return { ok: false };
};

import { ContentLoader } from '../src/data/content_loader.js';
import { BattleSystem } from '../src/engine/systems/battle.js';
import { BattleAdapter } from '../src/adapters/battle_adapter.js';
import { Registry } from '../src/engine/data/registry.js';
import { RandomWalkGenerator } from '../src/generators/dungeon_generator.js';
import { Game_Party } from '../src/objects/party.js';
import { Game_Battler } from '../src/objects/battler.js';
import { rng } from '../src/core/utils.js';

const dataManager = new ContentLoader();
global.window.dataManager = dataManager;

const party = new Game_Party();
const battleSystem = new BattleSystem();
const battleManager = new BattleAdapter(party, battleSystem);

async function init() {
    await dataManager.loadData();
    if (dataManager.skills) Registry.set('skills', dataManager.skills);
    if (dataManager.items) Registry.set('items', dataManager.items);
    if (dataManager.elements) Registry.set('elements', dataManager.elements);
    if (dataManager.states) Registry.set('states', dataManager.states);
    party.createInitialMembers(dataManager);
}

async function runBattleHarness(seed) {
    rng.seed(seed);
    console.log(`[Harness] Running Battle with seed ${seed}...`);

    party.members.forEach(m => {
        m.hp = m.maxHp;
        m.mp = m.maxMp;
        m.states = [];
        m.exhaustion = 0;
    });

    const oozeData = dataManager.actors.find(a => a.id === 'ooze');
    if (!oozeData) throw new Error("Ooze data not found");

    const enemies = [
        new Game_Battler(oozeData, 1, true),
        new Game_Battler(oozeData, 1, true)
    ];

    battleManager.setup(enemies, 0, 0);
    battleManager.planRound();

    const log = [];
    let turnCount = 0;
    const MAX_TURNS = 20;

    while (!battleManager.isBattleFinished && turnCount < MAX_TURNS) {
        turnCount++;
        log.push({ turn: turnCount, type: 'turn_start' });

        while (true) {
            const battlerContext = battleManager.getNextBattler();
            if (!battlerContext) break;
            const { battler } = battlerContext;
            log.push({ type: 'battler_act', name: battler.name, hp: battler.hp });

            const startEvents = battleManager.startTurn(battlerContext);
            log.push(...simplifyEvents(startEvents));
            if (battleManager.isBattleFinished) break;

            const action = battlerContext.action;
            if (action) {
                const actionEvents = battleManager.executeAction(action);
                log.push(...simplifyEvents(actionEvents));
            }
        }

        battleManager.planRound();
    }

    if (turnCount >= MAX_TURNS) log.push({ type: 'limit_reached' });
    else log.push({ type: 'battle_end', victory: battleManager.isVictoryPending });
    return log;
}

const RESOURCE_EVENT_TYPES = new Set([
    'summoner_mp_loss',
    'exhaustion_start',
    'exhaustion_increase',
    'exhaustion_recovered',
    'exhaustion_damage',
]);

function simplifyEvents(events) {
    if (!events) return [];
    // The historical golden remains a combat-resolution snapshot. #472's new
    // resource-event stream is covered by tests/test_summoner_resource.js.
    return events.filter(e => !RESOURCE_EVENT_TYPES.has(e.type)).map(e => {
        const { target, source, battler, ...rest } = e;
        const out = { ...rest };
        if (target && target.name) out.targetName = target.name;
        if (source && source.name) out.sourceName = source.name;
        if (battler && battler.name) out.battlerName = battler.name;
        return out;
    });
}

function runDungeonHarness(seed) {
    rng.seed(seed);
    console.log(`[Harness] Running Dungeon Gen with seed ${seed}...`);

    const generator = new RandomWalkGenerator();
    const meta = {
        title: "Test Dungeon",
        depth: 1,
        encounters: [{ id: 'ooze', weight: 10 }]
    };

    const eventDefs = dataManager.events || [];
    const npcData = dataManager.npcs || [];
    const floor = generator.generate(meta, 0, eventDefs, npcData, party, dataManager.actors);

    return {
        title: floor.title,
        width: floor.tiles[0].length,
        height: floor.tiles.length,
        startX: floor.startX,
        startY: floor.startY,
        events: floor.events.map(e => ({ x: e.x, y: e.y, type: e.type, id: e.id })),
        tiles: floor.tiles.map(row => row.join(''))
    };
}

async function main() {
    try {
        rng.seed(1);
        await init();

        const BATTLE_SEED = 12345;
        const DUNGEON_SEED = 67890;
        const mode = process.argv[2] || 'verify';
        const battleFixturePath = path.join(PROJECT_ROOT, 'tests/fixtures/battle_log_golden.json');
        const dungeonFixturePath = path.join(PROJECT_ROOT, 'tests/fixtures/dungeon_log_golden.json');

        if (mode === 'generate') {
            const battleLog = await runBattleHarness(BATTLE_SEED);
            const dungeonLog = runDungeonHarness(DUNGEON_SEED);
            fs.writeFileSync(battleFixturePath, JSON.stringify(battleLog, null, 2));
            fs.writeFileSync(dungeonFixturePath, JSON.stringify(dungeonLog, null, 2));
            console.log("Golden logs generated.");
        } else {
            if (!fs.existsSync(battleFixturePath) || !fs.existsSync(dungeonFixturePath)) {
                console.error("Golden logs not found. Run with 'generate' first.");
                process.exit(1);
            }

            const expectedBattle = JSON.parse(fs.readFileSync(battleFixturePath, 'utf8'));
            const expectedDungeon = JSON.parse(fs.readFileSync(dungeonFixturePath, 'utf8'));
            const battleLog = await runBattleHarness(BATTLE_SEED);
            const dungeonLog = runDungeonHarness(DUNGEON_SEED);
            const battleMatch = JSON.stringify(battleLog) === JSON.stringify(expectedBattle);
            const dungeonMatch = JSON.stringify(dungeonLog) === JSON.stringify(expectedDungeon);

            if (battleMatch && dungeonMatch) {
                console.log("SUCCESS: Logs match golden fixtures.");
                process.exit(0);
            }

            console.error("FAILURE: Logs do not match.");
            if (!battleMatch) {
                console.error("Battle Log Mismatch");
                fs.writeFileSync(path.join(PROJECT_ROOT, 'tests/fixtures/debug_actual_battle.json'), JSON.stringify(battleLog, null, 2));
            }
            if (!dungeonMatch) {
                console.error("Dungeon Log Mismatch");
                fs.writeFileSync(path.join(PROJECT_ROOT, 'tests/fixtures/debug_actual_dungeon.json'), JSON.stringify(dungeonLog, null, 2));
            }
            process.exit(1);
        }
    } catch (e) {
        console.error("Harness Error:", e);
        process.exit(1);
    }
}

main();
