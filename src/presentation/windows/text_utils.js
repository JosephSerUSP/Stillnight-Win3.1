import { TRAIT_DEFINITIONS } from "../../engine/rules/trait_definitions.js";
import { EffectAdapter } from "../../adapters/effect_adapter.js";

/**
 * Generates a human-readable description for a trait.
 * @param {Object} trait - The trait object { code, dataId, value }.
 * @returns {string} The description.
 */
export function generateTraitDescription(trait) {
    const def = TRAIT_DEFINITIONS[trait.code];
    if (def) {
        const label = def.label ? def.label(trait.dataId) : trait.code;
        const value = def.format ? def.format(trait.value, trait.dataId) : trait.value;
        return `${label} ${value}`;
    }
    return `${trait.code}: ${trait.value}`;
}

/**
 * Generates a human-readable description for an item effect from the same
 * EffectSystem definition used to execute it.
 */
export function generateEffectDescription(key, value) {
    return EffectAdapter.getDescription(key, value);
}
