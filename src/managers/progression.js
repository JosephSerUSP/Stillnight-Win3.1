import { randInt, probabilisticRound } from "../core/utils.js";

/**
 * @class ProgressionSystem
 * @description Handles experience, leveling, and evolution logic.
 */
export class ProgressionSystem {

    /**
     * Calculates the XP needed for the next level.
     * @param {number} level - Current level.
     * @param {number} [growthRate=5] - XP growth rate.
     * @returns {number} XP needed.
     */
    static xpNeeded(level, growthRate = 5) {
        return Math.floor(level * (growthRate * 0.5) + 10);
    }

    /**
     * Adds XP to a battler and handles leveling.
     * @param {import("../objects/objects.js").Game_Battler} battler - The battler.
     * @param {number} amount - XP amount.
     * @returns {Object} { leveledUp, hpGain, newLevel }
     */
    static gainXp(battler, amount) {
        if (amount <= 0) return { leveledUp: false, hpGain: 0, newLevel: battler.level };

        // Rate trait check requires accessing battler.traits
        const rate = battler.traits.filter(t => t.code === 'XP_RATE')
                                .reduce((acc, t) => acc * t.value, 1.0);

        const actualAmount = probabilisticRound(amount * rate);
        battler.xp = (battler.xp || 0) + actualAmount;
        let leveledUp = false;
        let totalHpGain = 0;

        while (battler.xp >= this.xpNeeded(battler.level, battler.expGrowth)) {
          battler.xp -= this.xpNeeded(battler.level, battler.expGrowth);
          battler.level++;
          const hpGain = randInt(2, 4);
          battler._baseMaxHp += hpGain;
          battler.hp = battler.maxHp;
          totalHpGain += hpGain;
          leveledUp = true;
        }

        if (battler.hp > battler.maxHp) battler.hp = battler.maxHp;

        return {
          leveledUp,
          hpGain: totalHpGain,
          newLevel: battler.level
        };
    }

    /**
     * Checks if a battler meets evolution criteria.
     * @param {import("../objects/objects.js").Game_Battler} battler
     * @param {Array} inventory
     * @param {number} floorDepth
     * @param {number} gold
     * @returns {Object|null} Evolution definition or null.
     */
    static checkEvolution(battler, inventory = [], floorDepth = 0, gold = 0) {
        if (!battler.evolutions || battler.evolutions.length === 0) return null;

        for (const evo of battler.evolutions) {
            let eligible = true;
            if (evo.level && battler.level <= evo.level) eligible = false;
            if (evo.item) {
                const hasItem = inventory.some(i => i.id === evo.item);
                if (!hasItem) eligible = false;
            }
            if (evo.floorDepth && floorDepth < evo.floorDepth) eligible = false;
            if (evo.gold && gold < evo.gold) eligible = false;

            if (eligible) return evo;
        }
        return null;
    }

    /**
     * Gets the evolution status.
     * @param {import("../objects/objects.js").Game_Battler} battler
     * @param {Array} inventory
     * @param {number} floorDepth
     * @param {number} gold
     * @returns {Object} { status, evolution }
     */
    static getEvolutionStatus(battler, inventory = [], floorDepth = 0, gold = 0) {
          if (!battler.evolutions || battler.evolutions.length === 0) {
              return { status: 'NONE', evolution: null };
          }

          const eligible = this.checkEvolution(battler, inventory, floorDepth, gold);
          if (eligible) {
              return { status: 'AVAILABLE', evolution: eligible };
          }

          return { status: 'LOCKED', evolution: null };
    }

    /**
     * Grows a battler to a specific level (simulating leveling).
     * @param {import("../objects/objects.js").Game_Battler} battler
     * @param {number} targetLevel
     */
    static growToLevel(battler, targetLevel) {
        if (targetLevel <= battler.level) return;
        while (battler.level < targetLevel) {
            battler.xp = 0;
            battler.level++;
            const hpGain = randInt(2, 4);
            battler._baseMaxHp += hpGain;
        }
        battler.hp = battler.maxHp;
    }
}

if (typeof window !== 'undefined' && window.location.search.includes("test=true")) {
    window.ProgressionSystem = ProgressionSystem;
}
