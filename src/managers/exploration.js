/**
 * @class ExplorationEngine
 * @description Handles exploration logic: movement, collisions, interactions.
 */
export class ExplorationEngine {
    constructor(map, party) {
        this.map = map;
        this.party = party;
    }

    /**
     * Attempts to move the player by delta.
     * @param {number} dx
     * @param {number} dy
     * @returns {Object} Result { type: 'MOVED' | 'BLOCKED' | 'SEQUENCE' | ... }
     */
    tryMove(dx, dy) {
        const newX = this.map.playerX + dx;
        const newY = this.map.playerY + dy;

        if (newX < 0 || newX >= this.map.MAX_W || newY < 0 || newY >= this.map.MAX_H) {
            return { type: 'BLOCKED', reason: 'bounds' };
        }

        return this.handleTileInteraction(newX, newY);
    }

    /**
     * Handles interaction logic for a specific tile coordinates (e.g. click or move target).
     * @param {number} x
     * @param {number} y
     * @returns {Object} Result
     */
    handleTileInteraction(x, y) {
        const floor = this.map.floors[this.map.floorIndex];
        const tile = floor.tiles[y][x];
        const event = floor.events ? floor.events.find(e => e.x === x && e.y === y) : null;

        // Event Handling (Hidden/Traps/Walls)
        if (event) {
            const isHidden = this._isEventHidden(event);
            if (!isHidden) {
                // If it's a visible event that blocks movement (like a breakable wall on '#')
                if (tile === '#') {
                     return { type: 'INTERACT', event: event };
                }
            }
        }

        if (tile === '#') {
            return { type: 'BLOCKED', reason: 'wall' };
        }

        // Move Player
        this.map.playerX = x;
        this.map.playerY = y;
        this.map.revealAroundPlayer();

        const results = [];

        // Auto-reveal check
        if (this.map.checkFloorExploration()) {
            this.map.revealCurrentFloor(false);
            results.push({ type: 'EXPLORED_ALL' });
        }

        // Check for Event Trigger (Stepped on)
        if (event) {
             if (event.hidden) {
                 event.hidden = false;
                 results.push({ type: 'REVEALED', event });
             }
             // Always return event interaction if stepped on (even traps)
             results.push({ type: 'EVENT', event });
        } else {
             results.push({ type: 'MOVED' });
        }

        // Return a sequence of things that happened
        return { type: 'SEQUENCE', results };
    }

    /**
     * Process moving enemies or time-based updates.
     * @returns {Array<Object>} List of results
     */
    updateEntities() {
        const results = this.map.updateEvents(this.party);
        return results.map(r => {
             if (r.type === 'collision') {
                 return { type: 'EVENT', event: r.event };
             }
             return { type: 'NONE' };
        }).filter(r => r.type !== 'NONE');
    }

    _isEventHidden(event) {
        if (!event.hidden) return false;

        let maxSee = 0;
        this.party.members.forEach(m => {
            const v = m.getPassiveValue("SEE_TRAPS");
            if (v > maxSee) maxSee = v;
        });

        if (event.isSneakAttack) return true; // Always hidden until triggered
        if (maxSee > event.trapValue) return false;

        return true;
    }
}
