/**
 * @file data/states.js
 * @description Defines the states (status effects) available in the game.
 * States are containers for Traits and can affect battler behavior and stats.
 */

/**
 * @typedef {Object} Trait
 * @property {string} code - The code identifying the trait (e.g., 'PARAM_PLUS', 'HRG').
 * @property {string|number} [dataId] - Additional data for the trait (e.g., 'atk', 'sleep').
 * @property {number} value - The value of the trait.
 */

/**
 * @typedef {Object} State
 * @property {string} id - The unique ID of the state.
 * @property {string} name - The display name.
 * @property {number} icon - The icon ID.
 * @property {number} [restriction] - Restriction level (4 = Cannot Act).
 * @property {number} [duration] - Default duration in turns.
 * @property {boolean} [removeAtDamage] - Whether the state is removed upon taking damage.
 * @property {Trait[]} traits - List of traits applied by this state.
 */

export const states = {
    dead: {
        id: 'dead',
        name: 'Dead',
        icon: 11, // Skull-like icon if available, or placeholder
        restriction: 4, // Cannot act
        priority: 100,
        traits: []
    },
    sleep: {
        id: 'sleep',
        name: 'Sleep',
        icon: 1,
        restriction: 4,
        duration: 3,
        removeAtDamage: true,
        traits: []
    },
    poison: {
        id: 'poison',
        name: 'Poison',
        icon: 2,
        duration: 3,
        traits: [
            { code: 'HRG', value: -0.1 } // Drains 10% max HP
        ]
    },
    darkness: {
        id: 'darkness',
        name: 'Darkness',
        icon: 3,
        duration: 3,
        traits: [
             { code: 'PARAM_RATE', dataId: 'hit', value: 0.5 } // Halves hit rate (needs implementation in Action)
        ]
    },
    haste: {
        id: 'haste',
        name: 'Haste',
        icon: 4,
        duration: 5,
        traits: [
            { code: 'PARAM_RATE', dataId: 'asp', value: 1.5 }
        ]
    },
    power_break: {
        id: 'power_break',
        name: 'Power Break',
        icon: 5,
        duration: 3,
        traits: [
            { code: 'PARAM_RATE', dataId: 'atk', value: 0.5 }
        ]
    },
    armor_break: {
        id: 'armor_break',
        name: 'Armor Break',
        icon: 6,
        duration: 3,
        traits: [
            { code: 'PARAM_RATE', dataId: 'def', value: 0.5 }
        ]
    },
    stone: {
        id: 'stone',
        name: 'Petrify',
        icon: 7,
        restriction: 4,
        traits: []
    },
    regen: {
        id: 'regen',
        name: 'Regeneration',
        icon: 1,
        duration: 5,
        traits: [
            { code: 'HRG', value: 0.1 } // Heals 10% max HP per turn
        ]
    },
    berserk: {
        id: 'berserk',
        name: 'Berserk',
        icon: 1,
        duration: 3,
        traits: [
            { code: 'PARAM_PLUS', dataId: 'atk', value: 3 }
        ]
    },
    valefor_form: {
        id: 'valefor_form',
        name: 'Summoned: Valefor',
        icon: 10,
        duration: 3,
        traits: [
            { code: 'SPRITE_OVERRIDE', dataId: 'highPixie', value: 0 },
            { code: 'PARAM_RATE', dataId: 'maxHp', value: 2.0 },
            { code: 'PARAM_RATE', dataId: 'atk', value: 2.0 },
            { code: 'PARAM_RATE', dataId: 'mag', value: 2.0 },
            { code: 'SKILL_ADD', dataId: 'sonicWings', value: 1 },
            { code: 'SKILL_ADD', dataId: 'energyBlast', value: 1 }
            // Ideally we seal other skills, but for now adding these is enough.
        ]
    }
};
