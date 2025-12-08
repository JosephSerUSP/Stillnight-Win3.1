import { randInt } from "../core/utils.js";
import { glimmers } from "../../data/glimmers.js";

export class SparkSystem {
    /**
     * Checks if a new skill should be sparked (learned) based on the current action.
     * @param {import("../objects/objects.js").Game_Battler} battler - The battler performing the action.
     * @param {import("../objects/objects.js").Game_Action} action - The action being performed.
     * @param {import("./data.js").DataManager} dataManager - The data manager.
     * @returns {string|null} The ID of the sparked skill, or null.
     */
    static checkSpark(battler, action, dataManager) {
        if (!battler || !action) return null;
        if (battler.isEnemy) return null; // Enemies don't spark usually

        // Determine Weapon Type
        let weaponType = 'unarmed';
        if (battler.equipmentItem && battler.equipmentItem.equipType === 'Weapon') {
             const id = battler.equipmentItem.id;
             if (id.includes('blade') || id.includes('sword') || id.includes('gram')) weaponType = 'sword';
             else if (id.includes('spear') || id.includes('lance')) weaponType = 'spear';
             else if (id.includes('bow')) weaponType = 'bow';
             else if (id.includes('scepter') || id.includes('staff')) weaponType = 'staff';
             else weaponType = 'sword'; // Default to sword if unknown weapon
        } else {
             weaponType = 'unarmed';
        }

        // Determine Source Skill
        let sourceSkillId = 'attack';
        if (!action.isAttack && action.skillId) {
            sourceSkillId = action.skillId;
        }

        // Filter potential sparks
        const candidates = glimmers.filter(g =>
            g.weaponType === weaponType &&
            g.sourceSkillId === sourceSkillId &&
            battler.skills && !battler.skills.includes(g.learnedSkillId)
        );

        if (candidates.length === 0) return null;

        // Try to spark
        for (const candidate of candidates) {
            const roll = randInt(0, 100);
            if (roll < candidate.difficulty) {
                return candidate.learnedSkillId;
            }
        }

        return null;
    }
}
