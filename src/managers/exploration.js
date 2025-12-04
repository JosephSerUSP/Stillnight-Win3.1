import { randInt, pickWeighted } from "../core/utils.js";
import { Game_Battler } from "../objects/objects.js";

/**
 * @class ExplorationManager
 * @description Manages map traversal, collision detection, and event interactions.
 * Decouples exploration logic from the Scene_Map view.
 */
export class ExplorationManager {
    /**
     * @param {import("../objects/objects.js").Game_Map} map - The game map.
     * @param {import("../objects/objects.js").Game_Party} party - The player party.
     * @param {import("../managers/index.js").DataManager} dataManager - The data manager.
     */
    constructor(map, party, dataManager) {
        this.map = map;
        this.party = party;
        this.dataManager = dataManager;
    }

    /**
     * Resolves initiative and sneak attack states for all enemies on the specified floor.
     * @param {number} floorIndex
     */
    resolveAmbushStates(floorIndex) {
        const floor = this.map.floors[floorIndex];
        if (!floor || !floor.events) return;

        const actors = this.dataManager.actors;

        floor.events.forEach(event => {
            // Only process enemies that haven't been resolved yet
            if ((event.type === 'enemy' || event.id === 'enemy') && event.isSneakAttack === undefined && event.isPlayerFirstStrike === undefined) {

                // Defaults
                event.isSneakAttack = false;
                event.isPlayerFirstStrike = false;

                const get_actor_data = (id) => actors.find(a => a.id === id);

                // Player Initiative
                const partyInitChance = this.party.members.reduce((sum, m) => sum + m.getPassiveValue("INITIATIVE"), 0);

                // Enemy Initiative
                let enemyInitChance = 0;
                if (event.encounterData && event.encounterData.enemies) {
                    event.encounterData.enemies.forEach(enemyId => {
                        const enemyActorData = get_actor_data(enemyId);
                        if (enemyActorData) {
                            const tempEnemyBattler = new Game_Battler(enemyActorData);
                            enemyInitChance += tempEnemyBattler.getPassiveValue("INITIATIVE");
                        }
                    });
                }

                // Rear Guard negates enemy initiative
                // Rear Guard: active members in slots 2 or 3 (Back Row)
                // Note: Party slots are 0,1 (Front), 2,3 (Back).
                const hasRearGuard = this.party.activeMembers.some((m, idx) => {
                     // We need the ACTUAL index in the party slots to know if they are back row?
                     // Game_Party.activeMembers returns filtered list.
                     // Logic says "if a party has a member with Rear Guard in the back row (slots 3 or 4)" (1-based in text, 0-based 2,3)

                     // We need to check the member's position.
                     const slotIndex = this.party.slots.indexOf(m);
                     return slotIndex >= 2 && m.getPassiveValue("REAR_GUARD") > 0;
                });

                if (hasRearGuard) {
                    enemyInitChance = 0;
                }

                let partyWins = false;
                let enemyWins = false;

                // If both have initiative, it's a proportional chance
                if (partyInitChance > 0 && enemyInitChance > 0) {
                    const totalInit = partyInitChance + enemyInitChance;
                    if (Math.random() < partyInitChance / totalInit) {
                        partyWins = true;
                    } else {
                        enemyWins = true;
                    }
                } else if (partyInitChance > 0) {
                    if (Math.random() < partyInitChance) {
                        partyWins = true;
                    }
                } else if (enemyInitChance > 0) {
                    if (Math.random() < enemyInitChance) {
                        enemyWins = true;
                    }
                }

                if (enemyWins) {
                    event.isSneakAttack = true;
                    event.hidden = true; // Invisible to player
                } else if (partyWins) {
                    event.isPlayerFirstStrike = true;
                }
            }
        });
    }

    /**
     * Attempts to move the player by a delta.
     * @param {number} dx
     * @param {number} dy
     * @returns {Object} Result { success: boolean, x: number, y: number, messages: [], sound: string|null, interaction: Object|null }
     */
    moveBy(dx, dy) {
        const newX = this.map.playerX + dx;
        const newY = this.map.playerY + dy;

        if (newX >= 0 && newX < this.map.MAX_W && newY >= 0 && newY < this.map.MAX_H) {
            return this.interactWithTile(newX, newY, true); // true = isAdjacent check implicit by delta
        }

        return { success: false, messages: [], sound: null, interaction: null };
    }

    /**
     * Handles interaction with a specific tile (movement or event trigger).
     * @param {number} x
     * @param {number} y
     * @param {boolean} [isKeyboard=false] - Whether this was triggered by keyboard (skips adjacency check if trusted).
     * @returns {Object} Result object.
     */
    interactWithTile(x, y, isKeyboard = false) {
        const result = {
            success: false,
            moved: false,
            x: this.map.playerX,
            y: this.map.playerY,
            messages: [],
            sound: null,
            interaction: null, // { type: 'battle'|'event', data: ... }
            refresh: false
        };

        // Adjacency Check
        if (!isKeyboard) {
            const dx = Math.abs(x - this.map.playerX);
            const dy = Math.abs(y - this.map.playerY);
            const isAdjacent = dx + dy === 1;
            const isSelf = x === this.map.playerX && y === this.map.playerY;

            if (!isAdjacent && !isSelf) {
                result.messages.push("Only adjacent tiles can be explored.");
                result.sound = 'UI_ERROR';
                return result;
            }
        }

        const floor = this.map.floors[this.map.floorIndex];
        const tileChar = floor.tiles[y][x];
        const event = floor.events ? floor.events.find(e => e.x === x && e.y === y) : null;

        // 1. Check for Event Interactions (Blockers or Triggers)
        if (event) {
            let isHidden = false;
            if (event.hidden) {
                let maxSee = 0;
                this.party.members.forEach(m => {
                    const v = m.getPassiveValue("SEE_TRAPS");
                    if (v > maxSee) maxSee = v;
                });
                if (maxSee <= event.trapValue && !event.isSneakAttack) {
                    isHidden = true;
                }
                // Sneak attacks stay hidden until triggered
                if (event.isSneakAttack) isHidden = true;
            }

            // Blocking Events (e.g., Breakable Walls)
            if (!isHidden && tileChar === '#') {
                result.interaction = { event: event };
                result.success = true;
                return result;
            }
        }

        // 2. Check Walls
        if (tileChar === "#") {
            result.messages.push("A wall blocks your path.");
            result.sound = 'UI_ERROR';
            return result;
        }

        // 3. Move Player
        this.map.playerX = x;
        this.map.playerY = y;
        this.map.revealAroundPlayer();
        result.x = x;
        result.y = y;
        result.moved = true;
        result.success = true;
        result.refresh = true;

        // 4. Handle Event Trigger (Stepped on)
        if (event) {
            if (event.hidden) {
                event.hidden = false; // Reveal it
                // Interact immediately
                result.interaction = { event: event };
            } else {
                result.interaction = { event: event };
            }
            return result;
        }

        // 5. Standard Step
        if (tileChar === ".") {
            result.messages.push("[Step] Your footsteps echo softly.");
            result.sound = 'UI_SELECT';
        }

        return result;
    }

    /**
     * Process autonomous map updates (moving enemies).
     * @returns {Object} { collisions: [], refresh: boolean }
     */
    updateEntities() {
        const results = this.map.updateEvents(this.party);
        const collisions = results.filter(r => r.type === 'collision').map(r => r.event);
        return {
            collisions: collisions,
            refresh: results.length > 0
        };
    }
}
