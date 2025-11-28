/**
 * @file data/states.js
 * @description Defines the states/status effects available in the game.
 * States are temporary conditions that affect battlers via traits.
 */

/**
 * @typedef {Object} State
 * @property {string} id - Unique ID.
 * @property {string} name - Display name.
 * @property {number} icon - Icon ID.
 * @property {string} [restriction] - Restriction type (e.g. 'cannot_move').
 * @property {Array<Object>} traits - List of traits applied by this state.
 */

export const states = {
    regen: {
        id: 'regen',
        name: 'Regeneration',
        icon: 1, // Placeholder
        traits: [
            { code: 'XPARAM_PLUS', dataId: 'hrg', value: 0.10 } // HP Regeneration 10%
        ]
    },
    berserk: {
        id: 'berserk',
        name: 'Berserk',
        icon: 1,
        traits: [
            { code: 'PARAM_RATE', dataId: 'atk', value: 1.5 }, // Deals 150% damage
            { code: 'SPARAM_RATE', dataId: 'pdr', value: 1.5 } // Takes 150% physical damage
        ]
    },
    sleep: {
        id: 'sleep',
        name: 'Sleep',
        icon: 1,
        restriction: 'cannot_move',
        traits: [
             { code: 'RESTRICTION', dataId: 'cannot_move', value: 1 }
        ]
    }
};
