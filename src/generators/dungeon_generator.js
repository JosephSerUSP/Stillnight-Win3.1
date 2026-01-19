import { randInt, pickWeighted, random } from "../core/utils.js";
import { Game_Event } from "../objects/event.js";
import { EncounterRules } from "../engine/rules/encounter.js";

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
                EncounterRules.determineInitiative(party, eventData, actors);
            }
        }

        return eventData;
    }

    _addStairsUp(floor, eventDefs) {
        // Find valid neighbor
        const dirs = [
            [0, 1], [0, -1], [1, 0], [-1, 0]
        ];

        // Shuffle dirs to avoid bias
        for (let i = dirs.length - 1; i > 0; i--) {
            const j = randInt(0, i);
            [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
        }

        let placed = false;
        for (const [dx, dy] of dirs) {
            const tx = floor.startX + dx;
            const ty = floor.startY + dy;

            // Check bounds
            if (ty < 0 || ty >= this.MAX_H || tx < 0 || tx >= this.MAX_W) continue;

            // Check tile type (must be floor)
            if (floor.tiles[ty][tx] !== '.') continue;

            // Check if occupied by another event
            if (floor.events.some(e => e.x === tx && e.y === ty)) continue;

            // Place stairs up
            // We need definition from eventDefs?
            // Usually we have access to eventDefs in generate.
            // But here we are passing it.

            const def = eventDefs.find(e => e.id === 'stairs_up');
            if (!def) {
                console.warn("stairs_up definition not found");
                break;
            }

            const eventData = { ...def, x: tx, y: ty };
            floor.events.push(new Game_Event(tx, ty, eventData));
            placed = true;
            break;
        }

        if (!placed) {
             console.warn("Could not place stairs_up next to player.");
             // Fallback: Place under player if absolutely necessary?
             // Or just skip. Request was "next to player".
             // If impossible, we skip.
        }
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
        // Mark start as used? _populateEvents does its own tracking.
        // But we want to ensure we don't spawn on top of start if possible?
        // Actually, start position is just where player spawns.
        // For random walk, it's safer to exclude startPos from spawn candidates if we want.
        // The previous code did: const used = [...floorCells.slice(-1)];
        // Let's replicate that logic in _populateEvents or here?
        // I'll filter floorCells passed to _populateEvents to exclude startPos if desired,
        // OR just pass startPos as 'used' in a more robust way?
        // _populateEvents now manages 'usedSet'.
        // I'll rely on luck or just let it spawn there?
        // Better: Pre-seed usedSet with startPos. But _populateEvents doesn't take 'usedSet'.
        // I'll temporarily remove startPos from floorCells passed to it?
        // Or better, let's just accept that _populateEvents handles it.
        // Wait, I changed _populateEvents to NOT take 'used' array.
        // I should probably manually exclude startPos.

        const events = this._populateEvents(meta, eventDefs, floorCells.filter(c => c[0] !== startPos[0] || c[1] !== startPos[1]), npcData, party, actors);

        const floor = {
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
            startX: startPos[0],
            startY: startPos[1],
            discovered: false,
        };

        if (index > 0) {
            this._addStairsUp(floor, eventDefs);
        }

        return floor;
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

        const floor = {
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

        if (index > 0) {
            this._addStairsUp(floor, eventDefs);
        }

        return floor;
    }
}
