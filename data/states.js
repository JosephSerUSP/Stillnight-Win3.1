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
        icon: 11,
        restriction: 4,
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
    regen: {
        id: 'regen',
        name: 'Regeneration',
        icon: 1,
        duration: 5,
        traits: [
            { code: 'HRG', value: 0.1 }
        ]
    },
    berserk: {
        id: 'berserk',
        name: 'Berserk',
        icon: 1,
        duration: 3,
        traits: [
            { code: 'PARAM_RATE', dataId: 'atk', value: 1.5 }
        ]
    },
    poison: {
        id: 'poison',
        name: 'Poison',
        icon: 2,
        duration: 4,
        traits: [
            { code: 'HRG', value: -0.1 }
        ]
    },
    haste: {
        id: 'haste',
        name: 'Haste',
        icon: 3,
        duration: 3,
        traits: [
            { code: 'INITIATIVE', value: 0.5 },
            { code: 'ACTION_PLUS', value: 1 }
        ]
    },
    confuse: {
        id: 'confuse',
        name: 'Confuse',
        icon: 4,
        restriction: 1,
        duration: 3,
        traits: []
    },
    evasion: {
        id: 'evasion',
        name: 'Evasion',
        icon: 5,
        duration: 3,
        traits: [
            { code: 'EVA', value: 0.5 }
        ]
    }
};
