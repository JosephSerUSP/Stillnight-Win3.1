import { EFFECT_DEFINITIONS } from "../../data/effects.js";
import { evaluateFormula } from "../core/utils.js";

/**
 * @class EffectProcessor
 * @description Centralizes the logic for applying immediate effects (from items/skills) and generating their UI previews.
 */
export class EffectProcessor {

    /**
     * Applies an immediate effect to a target.
     * @param {string} effectKey - The effect code (e.g., 'hp', 'maxHp', 'recruit_egg', 'hp_damage').
     * @param {number|string|Object} effectValue - The value/formula/config of the effect.
     * @param {Object} source - The source of the effect (item/skill object, or battler).
     * @param {Game_Battler} target - The target battler.
     * @param {Object} [context={}] - Additional context (boost, etc.).
     * @returns {Object|null} Result object describing the outcome.
     */
    static apply(effectKey, effectValue, source, target, context = {}) {
        const def = EFFECT_DEFINITIONS[effectKey];
        if (def && def.apply) {
            return def.apply(effectValue, target, source, context);
        }
        console.warn(`Unknown effect key: ${effectKey}`);
        return null;
    }

    /**
     * Generates a preview string for an effect.
     * @param {string} effectKey - The effect code.
     * @param {number|string} effectValue - The value.
     * @param {Game_Battler} target - The target battler.
     * @param {Object} [source] - The source.
     * @returns {string|null} The preview string or null if no visible change.
     */
    static getPreview(effectKey, effectValue, target, source) {
        const def = EFFECT_DEFINITIONS[effectKey];
        if (def && def.preview) {
            return def.preview(effectValue, target, source);
        }

        let value = effectValue;
        if (typeof value === 'string') {
             value = Math.round(evaluateFormula(value, source || {}, target));
        }
        return `${effectKey}: ${value}`;
    }
}
