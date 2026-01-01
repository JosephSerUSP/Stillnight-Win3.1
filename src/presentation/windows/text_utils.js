import { TRAIT_DEFINITIONS } from "../../engine/rules/trait_definitions.js";

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
 * Generates a human-readable description for an item effect.
 * @param {string} key - The effect key (e.g., 'hp', 'recruit_egg').
 * @param {any} value - The effect value.
 * @param {import("../managers/index.js").DataManager} [dataManager] - Optional data manager for lookups.
 * @returns {string} The description.
 */
export function generateEffectDescription(key, value, dataManager) { // eslint-disable-line no-unused-vars
    switch (key) {
        case 'hp': return `Restores ${value} HP`;
        case 'maxHp': return `Max HP +${value}`;
        case 'xp': return `Grants ${value} XP`;
        case 'recruit_egg': return `Recruits a monster`;
        case 'hp_drain': return `Drains ${value} HP`;
        default: return `${key}: ${value}`;
    }
}
