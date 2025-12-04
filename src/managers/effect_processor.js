
import { evaluateFormula } from "../core/utils.js";
import { Game_Battler } from "../objects/objects.js"; // Needed for instanceof check if applicable

/**
 * @class EffectProcessor
 * @description Centralizes the logic for applying immediate effects (from items/skills) and generating their UI previews.
 */
export class EffectProcessor {

    /**
     * Applies an immediate effect to a target.
     * @param {string} effectKey - The effect code (e.g., 'hp', 'maxHp', 'recruit_egg').
     * @param {number|string} effectValue - The value/formula of the effect.
     * @param {Object} source - The source of the effect (item/skill object, or battler).
     * @param {Game_Battler} target - The target battler.
     * @param {Object} [context={}] - Additional context (inventory, etc.).
     * @returns {Object|null} Result object describing the outcome.
     */
    static apply(effectKey, effectValue, source, target, context = {}) {
        const value = this._evaluate(effectValue, target);

        switch (effectKey) {
            case 'hp':
            case 'hp_heal':
                const oldHp = target.hp;
                target.hp = Math.min(target.maxHp, target.hp + value);
                return { type: 'heal', value: target.hp - oldHp, target };

            case 'maxHp':
                target.maxHp += value;
                target.hp += value; // Often maxHp boost heals the amount gained
                return { type: 'maxHp', value: value, target };

            case 'xp':
                const result = target.gainXp(value);
                return { type: 'xp', value: value, result, target };

            case 'recruit_egg':
                 // This is a placeholder for specific logic handled elsewhere or here?
                 // Currently Game_Party.useItem just handled hp/maxHp/xp.
                 // recruit_egg logic might be special.
                 // If it returns a result, the caller handles it.
                 return { type: 'recruit_egg', value: effectValue, target };

            default:
                console.warn(`Unknown effect key: ${effectKey}`);
                return null;
        }
    }

    /**
     * Generates a preview string for an effect.
     * @param {string} effectKey - The effect code.
     * @param {number|string} effectValue - The value.
     * @param {Game_Battler} target - The target battler.
     * @returns {string|null} The preview string or null if no visible change.
     */
    static getPreview(effectKey, effectValue, target) {
        const value = this._evaluate(effectValue, target);

        switch (effectKey) {
            case 'hp':
            case 'hp_heal':
                const newHp = Math.min(target.maxHp, target.hp + value);
                if (newHp !== target.hp) {
                    return `HP: ${target.hp}/${target.maxHp} -> ${newHp}/${target.maxHp}`;
                }
                return null;

            case 'maxHp':
                const newMax = target.maxHp + value;
                return `Max HP: ${target.maxHp} -> ${newMax}`;

            case 'xp':
                return `XP: +${value}`;

            case 'recruit_egg':
                return "Hatches an egg";

            default:
                return `${effectKey}: ${value}`;
        }
    }

    /**
     * Helper to evaluate formulas or return raw numbers.
     * @param {number|string} val
     * @param {Game_Battler} target
     * @returns {number}
     */
    static _evaluate(val, target) {
        if (typeof val === 'string') {
            return Math.round(evaluateFormula(val, target));
        }
        return val;
    }
}
