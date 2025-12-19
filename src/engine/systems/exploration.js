import { ExplorationState } from "../session/exploration_state.js";
import { RandomWalkGenerator } from "../../generators/dungeon_generator.js";

/**
 * System for Exploration logic (Movement, Interaction, Visibility).
 */
export class ExplorationSystem {
    constructor() {
        this.generator = new RandomWalkGenerator();
    }

    /**
     * Initializes a new session state with generated floors.
     * @param {Object} mapData - Definitions for maps.
     * @param {Object} context - { eventDefs, npcData, party, actors }
     * @returns {ExplorationState}
     */
    createSession(mapData, context) {
        const state = new ExplorationState();
        // Generate floors
        // Note: Legacy Game_Map used mapData array.
        state.floors = mapData.map((meta, i) =>
            this.generator.generate(meta, i, context.eventDefs, context.npcData, context.party, context.actors)
        );

        if (state.floors.length > 0) {
            const f = state.floors[0];
            state.playerX = f.startX;
            state.playerY = f.startY;
            f.discovered = true;
            this.revealAroundPlayer(state, 1); // Initial reveal
        }

        return state;
    }

    /**
     * Attempts to move the player.
     * @param {ExplorationState} state
     * @param {number} dx
     * @param {number} dy
     * @param {import("../../objects/party.js").Game_Party} party
     * @returns {Object} Result { type: 'SEQUENCE' | 'BLOCKED', results: [] }
     */
    move(state, dx, dy, party) {
        const newX = state.playerX + dx;
        const newY = state.playerY + dy;
        const { MAX_W, MAX_H } = state.config;

        if (newX < 0 || newX >= MAX_W || newY < 0 || newY >= MAX_H) {
            return { type: 'BLOCKED', reason: 'bounds' };
        }

        return this.interact(state, newX, newY, party);
    }

    /**
     * Handles interaction with a tile (movement target or click).
     * @param {ExplorationState} state
     * @param {number} x
     * @param {number} y
     * @param {import("../../objects/party.js").Game_Party} party
     * @returns {Object} Result
     */
    interact(state, x, y, party) {
        const floor = state.floors[state.floorIndex];
        const tile = floor.tiles[y][x];
        const event = floor.events ? floor.events.find(e => e.x === x && e.y === y) : null;

        // Check Event Interaction (Hidden/Traps/Walls)
        if (event) {
            const isHidden = this._isEventHidden(event, party);
            if (!isHidden) {
                // Visible event blocking movement (e.g., breakable wall)
                if (tile === '#') {
                    return { type: 'INTERACT', event };
                }
            }
        }

        if (tile === '#') {
            return { type: 'BLOCKED', reason: 'wall' };
        }

        // Commit Movement
        state.playerX = x;
        state.playerY = y;
        this.revealAroundPlayer(state);

        const results = [];

        // Auto-reveal check
        if (this.checkFloorExploration(state)) {
            this.revealCurrentFloor(state, false);
            results.push({ type: 'EXPLORED_ALL' });
        }

        // Event Trigger (Stepped on)
        if (event) {
            if (event.hidden) {
                event.hidden = false;
                results.push({ type: 'REVEALED', event });
            }
            results.push({ type: 'EVENT', event });
        } else {
            results.push({ type: 'MOVED' });
        }

        return { type: 'SEQUENCE', results };
    }

    /**
     * Updates entities on the current floor (enemies moving).
     * @param {ExplorationState} state
     * @param {import("../../objects/party.js").Game_Party} party
     * @returns {Array} List of results
     */
    updateEntities(state, party) {
        const floor = state.floors[state.floorIndex];
        const results = [];

        // Use a mock/shim for Game_Map if event.update expects it.
        // Legacy event.update(map, party) uses map.playerX, map.floors[...].
        // We can pass `state` as `map` if the structure matches sufficiently.
        // ExplorationState has floors, floorIndex, playerX, playerY.
        // It misses removeEvent, MAX_W (it's in config).
        // I might need to wrap state or modify Event code.
        // For now, assume Event logic handles 'map' interface duck-typing.
        // But Event logic might call map.removeEvent.

        // Let's create a facade for the map argument expected by event.update
        const mapFacade = {
            ...state, // Spread props (playerX, playerY, floorIndex, floors)
            MAX_W: state.config.MAX_W,
            MAX_H: state.config.MAX_H,
            removeEvent: (fi, x, y) => this.removeEvent(state, fi, x, y)
        };

        if (floor.events) {
            floor.events.forEach(event => {
                // We need to ensure event.update is available.
                // Events are likely Game_Event instances.
                if (event.update) {
                    const res = event.update(mapFacade, party);
                    if (res) results.push({ type: 'EVENT', event: res.event || event }); // Wrap collision
                }
            });
        }
        return results;
    }

    removeEvent(state, floorIndex, x, y) {
        if (floorIndex < 0 || floorIndex >= state.floors.length) return;
        const floor = state.floors[floorIndex];
        const idx = floor.events.findIndex(e => e.x === x && e.y === y);
        if (idx !== -1) {
            floor.events.splice(idx, 1);
        }
    }

    /**
     * Reveals tiles around the player.
     * @param {ExplorationState} state
     * @param {number} radius
     */
    revealAroundPlayer(state, radius = 1) {
        const floor = state.floors[state.floorIndex];
        const px = state.playerX;
        const py = state.playerY;
        const { MAX_W, MAX_H } = state.config;

        const startX = Math.max(0, px - radius);
        const endX = Math.min(MAX_W - 1, px + radius);
        const startY = Math.max(0, py - radius);
        const endY = Math.min(MAX_H - 1, py + radius);

        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                floor.visited[y][x] = true;
            }
        }
    }

    checkFloorExploration(state) {
        const floor = state.floors[state.floorIndex];
        const { MAX_W, MAX_H } = state.config;
        if (floor.fullyRevealed) return false;

        for (let y = 0; y < MAX_H; y++) {
            for (let x = 0; x < MAX_W; x++) {
                if (floor.tiles[y][x] !== '#' && !floor.visited[y][x]) {
                    return false;
                }
            }
        }
        return true;
    }

    revealCurrentFloor(state, updateVisited = true) {
        const floor = state.floors[state.floorIndex];
        const { MAX_W, MAX_H } = state.config;
        floor.fullyRevealed = true;
        if (updateVisited) {
            for (let y = 0; y < MAX_H; y++) {
                for (let x = 0; x < MAX_W; x++) {
                    floor.visited[y][x] = true;
                }
            }
        }
    }

    _isEventHidden(event, party) {
        if (!event.hidden) return false;

        let maxSee = 0;
        party.members.forEach(m => {
            const v = m.getPassiveValue ? m.getPassiveValue("SEE_TRAPS") : 0;
            if (v > maxSee) maxSee = v;
        });

        if (event.isSneakAttack) return true;
        if (maxSee > (event.trapValue || 0)) return false;

        return true;
    }
}
