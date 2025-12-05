
/**
 * @class Game_Summoner
 * @description Represents the player character who manages resources.
 * Contains MP, stats, and equipment (party-wide effects).
 */
export class Game_Summoner {
    /**
     * Creates a new Game_Summoner instance.
     */
    constructor() {
        this.mp = 100;
        this.maxMp = 100;
        this.level = 1;
        this.stats = {
            strength: 5,
            magic: 5,
            endurance: 5,
            agility: 5,
            luck: 5
        };
        this.equipment = {
            weapon: null,
            armor: null,
            accessory: null
        };
        /**
         * List of spell IDs known by the Summoner.
         * @type {string[]}
         */
        this.spells = [];
    }

    /**
     * Restores MP by a given amount.
     * @param {number} amount
     */
    recoverMp(amount) {
        this.mp = Math.min(this.maxMp, this.mp + amount);
    }

    /**
     * Consumes MP.
     * @param {number} amount
     * @returns {boolean} True if MP was sufficient and consumed (or if amount was 0). False if MP reached 0 (starvation logic handled elsewhere).
     */
    consumeMp(amount) {
        if (amount <= 0) return true;
        this.mp = Math.max(0, this.mp - amount);
        return this.mp > 0; // Return strict positive if we want to check for exhaustion
    }
}
