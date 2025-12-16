import { randInt, pickWeighted } from "../core/utils.js";
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
        const used = [...floorCells.slice(-1)]; // Reserve start position

        const pickCell = (exclude = []) => {
            const exSet = new Set(exclude.map((c) => c.join(",")));
            const candidates = floorCells.filter((c) => !exSet.has(c.join(",")));
            if (candidates.length === 0) return null;
            return candidates[randInt(0, candidates.length - 1)];
        };

        if (meta.events) {
            meta.events.forEach((config) => {
                const def = eventDefs.find((e) => e.id === config.id);
                if (!def) return;

                let count = 0;
                if (config.count !== undefined) count = config.count;
                else if (config.min !== undefined && config.max !== undefined)
                    count = randInt(config.min, config.max);
                else if (config.chance !== undefined && Math.random() < config.chance)
                    count = 1;

                for (let i = 0; i < count; i++) {
                    const pos = pickCell(used);
                    if (pos) {
                        const eventData = { ...def };

                        // Apply overrides from config (like behavior, symbol)
                        Object.assign(eventData, config);

                        // Special handling for NPC dynamic data
                        if (def.type === "npc" && npcData.length > 0) {
                            const npcDef = npcData[randInt(0, npcData.length - 1)];
                            eventData.symbol = npcDef.char || "N";
                            eventData.actions = [{ type: "NPC_DIALOGUE", id: npcDef.id }];
                            eventData.id = npcDef.id; // Compatibility
                        }

                        // Determine Encounter and Sneak Attack for Battle events or Enemies
                        if (def.type === 'enemy' || config.id === 'enemy' || def.id === 'enemy') {
                            // 1. Resolve Encounter
                            if (config.encounters) {
                                eventData.encounterData = pickWeighted(config.encounters);
                            } else if (meta.encounters && meta.encounters.length > 0) {
                                eventData.encounterData = pickWeighted(meta.encounters);
                            }

                            // 2. Initiative Check (Sneak Attack)
                            if (party && !eventData.isSneakAttack) {
                                EncounterManager.determineInitiative(party, eventData, actors);
                            }
                        }

                        events.push(new Game_Event(pos[0], pos[1], eventData));
                        used.push(pos);
                    }
                }
            });
        }
        return events;
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

        if (floorCells.length < 10) {
            for (let iy = offsetY + 1; iy < offsetY + innerH - 1; iy++) {
                for (let ix = offsetX + 1; ix < offsetX + innerW - 1; ix++) {
                    tiles[iy][ix] = ".";
                    floorCells.push([ix, iy]);
                }
            }
        }

        const events = this._populateEvents(meta, eventDefs, floorCells, npcData, party, actors);
        const startPos = floorCells[floorCells.length - 1];

        return {
            id: "F" + (index + 1),
            title: meta.title,
            depth: meta.depth,
            intro: meta.intro,
            music: meta.music,
            encounters: meta.encounters,
            treasures: meta.treasures,
            tiles,
            events,
            visited,
            startX: startPos[0],
            startY: startPos[1],
            discovered: false,
        };
    }
}
