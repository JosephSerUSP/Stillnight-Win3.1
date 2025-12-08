import { randInt, probabilisticRound } from "../core/utils.js";

/**
 * @class ProgressionSystem
 * @description Handles FF2-style usage-based progression.
 */
export class ProgressionSystem {

    /**
     * Checks and applies stat growth based on battle performance.
     * @param {import("../objects/objects.js").Game_Battler} battler - The battler to update.
     * @returns {string[]} Messages describing the growth.
     */
    static checkGrowth(battler) {
        if (battler.isEnemy) return [];

        const messages = [];
        const stats = battler.battleStats || {}; // Ensure default

        // HP Growth: Chance based on HP lost / MaxHP
        if (stats.hpLost > 0) {
            const hpRatio = stats.hpLost / battler.maxHp;
            if (Math.random() < hpRatio + 0.1) {
                const gain = randInt(10, 30);
                battler._baseMaxHp += gain; // Directly modify base
                battler.hp += gain;
                messages.push(`Max HP increased by ${gain}!`);
            }
        }

        // MP Growth: Chance based on MP spent / MaxMP
        if (stats.mpSpent > 0 && battler.maxMp > 0) {
            const mpRatio = stats.mpSpent / battler.maxMp;
            if (Math.random() < mpRatio + 0.1) {
                const gain = randInt(5, 10);
                battler._baseMaxMp = (battler._baseMaxMp || 0); // Logic for MP is usually separate base stat if not derived
                // Our Game_Battler uses maxMp trait derived. Let's assume _baseMaxMp handles both or add _baseMaxMp
                // Game_Battler has _baseMaxHp and _baseMaxMp (from Game_Base usually).
                // Let's check Game_Base... Assuming it exists.
                // If not, we set it.
                if (typeof battler._baseMaxMp === 'undefined') battler._baseMaxMp = battler.maxMp;

                battler._baseMaxMp += gain;
                battler.mp += gain;
                messages.push(`Max MP increased by ${gain}!`);
            }
        }

        // Strength
        let totalAttacks = 0;
        if (stats.attacksMade) {
             for (const k in stats.attacksMade) totalAttacks += stats.attacksMade[k];
        }
        if (totalAttacks > 0 && Math.random() < 0.15) {
            battler.str++;
            messages.push(`Strength increased!`);
        }

        // Magic / Spirit / Int
        // Simplified: usage of magic
        let totalMagic = 0;
        if (stats.magicUsed) {
            for (const k in stats.magicUsed) totalMagic += stats.magicUsed[k];
        }
        if (totalMagic > 0) {
             if (Math.random() < 0.15) {
                 battler.int++;
                 messages.push(`Intelligence increased!`);
             }
             if (Math.random() < 0.15) {
                 battler.spi++;
                 messages.push(`Spirit increased!`);
             }
             if (Math.random() < 0.15) {
                 battler.mag++;
                 messages.push(`Magic increased!`);
             }
        }

        // Vitality
        if (stats.timesAttacked > 0 && Math.random() < 0.1) {
            battler.vit++;
            messages.push(`Vitality increased!`);
        }

        // Agility
        if (Math.random() < 0.05) { // Random chance per battle
             battler.agi++;
             messages.push(`Agility increased!`);
        }

        // Weapon Skills
        if (stats.attacksMade) {
            for (const wType in stats.attacksMade) {
                if (!battler.weaponSkills) battler.weaponSkills = {};
                if (!battler.weaponSkills[wType]) battler.weaponSkills[wType] = 1;

                // Simple level up chance
                if (Math.random() < 0.3) {
                     battler.weaponSkills[wType]++;
                     messages.push(`${wType} skill level up!`);
                }
            }
        }

        // Magic Skills
        if (stats.magicUsed) {
            for (const skillId in stats.magicUsed) {
                if (!battler.magicSkills) battler.magicSkills = {};
                if (!battler.magicSkills[skillId]) battler.magicSkills[skillId] = 1;

                if (Math.random() < 0.3) {
                     battler.magicSkills[skillId]++;
                     messages.push(`${skillId} mastery up!`);
                }
            }
        }

        // Reset
        battler.battleStats = {
            hpLost: 0,
            mpSpent: 0,
            attacksMade: {},
            magicUsed: {},
            timesAttacked: 0
        };

        return messages;
    }

    // Stub for evolution
    static getEvolutionStatus() { return { status: 'NONE', evolution: null }; }
    static gainXp() { return { leveledUp: false }; }
}

if (typeof window !== 'undefined' && window.location.search.includes("test=true")) {
    window.ProgressionSystem = ProgressionSystem;
}
