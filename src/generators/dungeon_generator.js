import { randInt, pickWeighted, random } from "../core/utils.js";
import { Game_Event } from "../objects/event.js";
import { EncounterManager } from "../managers/encounter.js";

/**
 * @class DungeonGenerator
 * @description Base class for dungeon generation algorithms.
 */
export class DungeonGenerator {
    constructor() {
        this.MAX_W = 19;
        this.MAX_H = 19;
    }

    /**
     * Generates a floor.
     * @param {Object} meta
     * @param {number} index
     * @param {Array} eventDefs
     * @param {Array} npcData
     * @param {import("../objects/party.js").Game_Party} party
     * @param {Array} actors
     * @returns {Object} Floor object.
     */
    generate(meta, index, eventDefs, npcData, party, actors) {
        throw new Error("generate() must be implemented by subclass");
    }

    _initTiles() {
        return Array.from({ length: this.MAX_H }, () =>
            Array.from({ length: this.MAX_W }, () => "#")
        );
    }

    _initVisited() {
        return Array.from({ length: this.MAX_H }, () =>
            Array.from({ length: this.MAX_W }, () => false)
        );
    }

    /**
     * Populates events based on meta configuration and available empty tiles.
     * @param {Object} meta
     * @param {Array} eventDefs
     * @param {Array} floorCells - List of [x, y] coordinates that are valid floors.
     * @param {Array} npcData
     * @param {import("../objects/party.js").Game_Party} party
     * @param {Array} actors
     * @returns {Array} List of Game_Event objects.
     */
    _populateEvents(meta, eventDefs, floorCells, npcData, party, actors) {
        const events = [];
        // Track used cells. Start with the start position if known (usually last in floorCells for RandomWalk)
        // For FixedLayout, floorCells might be just all dots.
        // We will manage 'used' set manually.
        const usedSet = new Set();

        // Helper to check usage
        const isUsed = (x, y) => usedSet.has(`${x},${y}`);
        const markUsed = (x, y) => usedSet.add(`${x},${y}`);

        // Helper to pick a random unused cell
        const pickCell = () => {
             // Filter floorCells that are not used
             const candidates = floorCells.filter(([x, y]) => !isUsed(x, y));
             if (candidates.length === 0) return null;
             return candidates[randInt(0, candidates.length - 1)];
        };

        if (meta.events) {
            // 1. Process Fixed Events first
            meta.events.filter(c => c.x !== undefined && c.y !== undefined).forEach(config => {
                 // def might be undefined if id is 'enemy' without a definition in events.json, but usually 'enemy' is a type, not an id?
                 // Wait, events.json has { "id": "enemy", "type": "enemy" }?
                 // Usually eventDefs comes from data/events.json.
                 // Let's handle the case where def is missing but we can infer type?
                 // No, strict dependency on eventDefs.
                 let def = eventDefs.find((e) => e.id === config.id);
                 if (!def) {
                      // Fallback for special IDs like 'stairs' if not in events.json?
                      // 'stairs' is in events.json usually.
                      // If config.id is 'enemy', checking if there's an event named 'enemy'.
                      return;
                 }

                 const eventData = this._createEventData(def, config, npcData, party, actors);
                 events.push(new Game_Event(config.x, config.y, eventData));
                 markUsed(config.x, config.y);
            });

            // 2. Process Random Events
            meta.events.filter(c => c.x === undefined || c.y === undefined).forEach(config => {
                const def = eventDefs.find((e) => e.id === config.id);
                if (!def) return;

                let count = 0;
                if (config.count !== undefined) count = config.count;
                else if (config.min !== undefined && config.max !== undefined)
                    count = randInt(config.min, config.max);
                else if (config.chance !== undefined && random() < config.chance)
                    count = 1;

                for (let i = 0; i < count; i++) {
                    const pos = pickCell();
                    if (pos) {
                        const eventData = this._createEventData(def, config, npcData, party, actors);
                        events.push(new Game_Event(pos[0], pos[1], eventData));
                        markUsed(pos[0], pos[1]);
                    }
                }
            });
        }
        return events;
    }

    _createEventData(def, config, npcData, party, actors) {
        const eventData = { ...def, ...config };

        // Special handling for NPC dynamic data
        // Check if npcData exists before accessing length
        if (def.type === "npc" && npcData && npcData.length > 0 && !config.id.startsWith('npc_')) {
             // Only random NPCs if it's a generic 'npc' type, not specific 'npc_alicia'
            const npcDef = npcData[randInt(0, npcData.length - 1)];
            eventData.symbol = npcDef.char || "N";
            eventData.scripts = {
                onInteract: [{ type: "NPC_DIALOGUE", id: npcDef.id }]
            };
            // Retain original ID if needed, or update?
            // Usually generic NPCs get the specific ID for lookup, but let's be careful.
             eventData.id = npcDef.id;
        }

        // Determine Encounter and Sneak Attack for Battle events or Enemies
        if (def.type === 'enemy' || config.id === 'enemy' || def.id === 'enemy') {
            // 1. Resolve Encounter
            if (config.encounters) {
                eventData.encounterData = pickWeighted(config.encounters);
            } else if (config.encounterData) {
                // Already set
            }
             else {
                 // Fallback to meta encounters - handled by caller?
                 // Actually we can't easily access 'meta' here unless we pass it specifically to this helper
                 // or ensure config has it merged.
                 // For now, assume config has it or we missed it.
                 // Wait, random events logic in _populateEvents loop didn't merge meta.encounters.
            }

            // 2. Initiative Check (Sneak Attack)
            if (party && !eventData.isSneakAttack) {
                EncounterManager.determineInitiative(party, eventData, actors);
            }
        }

        return eventData;
    }
}

/**
 * @class RandomWalkGenerator
 * @description Generates maps using a random walk algorithm.
 */
export class RandomWalkGenerator extends DungeonGenerator {
    generate(meta, index, eventDefs, npcData, party, actors) {
        const tiles = this._initTiles();
        const visited = this._initVisited();

        const innerW = randInt(7, 11);
        const innerH = randInt(7, 11);
        const offsetX = Math.floor((this.MAX_W - innerW) / 2);
        const offsetY = Math.floor((this.MAX_H - innerH) / 2);

        let x = offsetX + Math.floor(innerW / 2);
        let y = offsetY + Math.floor(innerH / 2);

        tiles[y][x] = ".";
        const floorCells = [[x, y]];

        const steps = innerW * innerH * 3;
        const dirs = [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
        ];

        for (let i = 0; i < steps; i++) {
            const [dx, dy] = dirs[randInt(0, dirs.length - 1)];
            const nx = x + dx;
            const ny = y + dy;
            if (
                nx >= offsetX &&
                nx < offsetX + innerW &&
                ny >= offsetY &&
                ny < offsetY + innerH
            ) {
                x = nx;
                y = ny;
                if (tiles[y][x] === "#") {
                    tiles[y][x] = ".";
                    floorCells.push([x, y]);
                }
            }
        }

        // Ensure minimum size
        if (floorCells.length < 10) {
            for (let iy = offsetY + 1; iy < offsetY + innerH - 1; iy++) {
                for (let ix = offsetX + 1; ix < offsetX + innerW - 1; ix++) {
                    tiles[iy][ix] = ".";
                    floorCells.push([ix, iy]);
                }
            }
        }

        // Pass meta.encounters down to config for random enemies if not present
        if (meta.events) {
            meta.events.forEach(e => {
                if (!e.encounters && meta.encounters) {
                    e.encounters = meta.encounters;
                }
            });
        }

        // Start position is the last cell generated
        const startPos = floorCells[floorCells.length - 1];

        // Find a valid neighbor for spawn to place stairs at startPos but spawn next to it
        let spawnPos = startPos;
        let stairsPos = startPos;

        // Only look for a neighbor if this is a deeper dungeon floor (index > 0)
        // Floor 0 is usually town, but if RandomWalk is used for Floor 0, we might want stairs back too if applicable.
        // Usually index > 0 means we came from somewhere.
        const neighbors = [
            [startPos[0] + 1, startPos[1]],
            [startPos[0] - 1, startPos[1]],
            [startPos[0], startPos[1] + 1],
            [startPos[0], startPos[1] - 1]
        ].filter(([nx, ny]) => {
            // Check bounds and if tile is floor
            return nx >= 0 && nx < this.MAX_W && ny >= 0 && ny < this.MAX_H && tiles[ny][nx] === '.';
        });

        if (neighbors.length > 0) {
            spawnPos = neighbors[0]; // Pick first valid neighbor
        }

        // Add stairs_up event at original startPos
        // We always add stairs_up for dungeon floors (RandomWalk) to allow returning to previous floor/town
        const extraEvents = [];
        if (index >= 0) {
             extraEvents.push({
                 id: 'stairs_up',
                 x: stairsPos[0],
                 y: stairsPos[1]
             });
        }

        // Filter out both stairsPos and spawnPos from random event generation to avoid blocking path or stacking
        const events = this._populateEvents(meta, eventDefs, floorCells.filter(c =>
            (c[0] !== stairsPos[0] || c[1] !== stairsPos[1]) &&
            (c[0] !== spawnPos[0] || c[1] !== spawnPos[1])
        ), npcData, party, actors);

        // Add explicit events
        extraEvents.forEach(e => {
            // Find def if needed, or just push raw config if Game_Event handles it
            // Game_Event needs full data. _populateEvents does the merge.
            // We should use _createEventData-like logic or just fetch def manually.
            const def = eventDefs.find(def => def.id === e.id);
            if (def) {
                 events.push(new Game_Event(e.x, e.y, { ...def, ...e }));
            }
        });

        return {
            id: "F" + (index + 1),
            title: meta.title,
            depth: meta.depth,
            intro: meta.intro,
            music: meta.music,
            image: meta.image,
            encounters: meta.encounters,
            treasures: meta.treasures,
            safe: meta.safe,
            tiles,
            events,
            visited,
            startX: spawnPos[0],
            startY: spawnPos[1],
            discovered: false,
        };
    }
}

export class FixedLayoutGenerator extends DungeonGenerator {
    generate(meta, index, eventDefs, npcData, party, actors) {
        const tiles = this._initTiles();
        const visited = this._initVisited();
        const floorCells = [];
        let startX = 0;
        let startY = 0;

        // Parse Layout
        // meta.layout is array of strings
        // We centre it? Or just assume it fits 19x19?
        // Let's assume it fits.

        meta.layout.forEach((row, y) => {
            [...row].forEach((char, x) => {
                if (y < this.MAX_H && x < this.MAX_W) {
                    if (char === 'S') {
                        startX = x;
                        startY = y;
                        tiles[y][x] = '.';
                        floorCells.push([x, y]);
                    } else if (char === '#') {
                        tiles[y][x] = '#';
                    } else {
                        // Treat any other character (including '.') as walkable floor
                        tiles[y][x] = '.';
                        floorCells.push([x, y]);
                    }
                }
            });
        });

         // Pass meta.encounters down
        if (meta.events) {
            meta.events.forEach(e => {
                if (!e.encounters && meta.encounters) {
                    e.encounters = meta.encounters;
                }
            });
        }

        // Exclude start pos from random spawns
        const spawnCells = floorCells.filter(c => c[0] !== startX || c[1] !== startY);
        const events = this._populateEvents(meta, eventDefs, spawnCells, npcData, party, actors);

        return {
            id: "F" + (index + 1),
            title: meta.title,
            depth: meta.depth,
            intro: meta.intro,
            music: meta.music,
            image: meta.image,
            encounters: meta.encounters,
            treasures: meta.treasures,
            safe: meta.safe,
            tiles,
            events,
            visited,
            startX,
            startY,
            discovered: false
        };
    }
}
