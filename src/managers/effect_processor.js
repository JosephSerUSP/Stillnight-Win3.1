import { GlobalEffectRegistry } from "./effect_registry.js";
import { registerStandardEffects } from "./effect_definitions.js";

// Initialize standard effects
registerStandardEffects();

/**
 * @class EffectProcessor
 * @description Centralizes the logic for applying immediate effects (from items/skills) and generating their UI previews.
 * Now acts as a facade for the GlobalEffectRegistry.
 */
export class EffectProcessor {

    /**
     * Applies an immediate effect to a target.
     * @param {string} effectKey - The effect code (e.g., 'hp', 'maxHp', 'recruit_egg', 'hp_damage').
     * @param {number|string|Object} effectValue - The value/formula/config of the effect.
     * @param {Object} source - The source of the effect (item/skill object, or battler).
     * @param {import("../objects/objects.js").Game_Battler} target - The target battler.
     * @param {Object} [context={}] - Additional context (boost, etc.).
     * @returns {Object|null} Result object describing the outcome.
     */
    static apply(effectKey, effectValue, source, target, context = {}) {
        return GlobalEffectRegistry.execute(effectKey, effectValue, source, target, context);
    }

    /**
     * Generates a preview string for an effect.
     * @param {string} effectKey - The effect code.
     * @param {number|string} effectValue - The value.
     * @param {import("../objects/objects.js").Game_Battler} target - The target battler.
     * @param {Object} [source] - The source.
     * @returns {string|null} The preview string or null if no visible change.
     */
    static getPreview(effectKey, effectValue, target, source) {
        return GlobalEffectRegistry.getPreview(effectKey, effectValue, source, target);
    }
}
