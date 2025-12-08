/**
 * @file data/states.js
 * @description Defines the states (status effects) available in the game.
 */

export const states = {
    dead: {
        id: 'dead',
        name: 'Knocked Out',
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
    stun: {
        id: 'stun',
        name: 'Stunned',
        icon: 2,
        restriction: 4,
        duration: 1,
        traits: []
    },
    frozen: {
        id: 'frozen',
        name: 'Frozen',
        icon: 3,
        restriction: 4,
        duration: 2,
        traits: []
    },
    blind: {
        id: 'blind',
        name: 'Blind',
        icon: 4,
        duration: 3,
        traits: [
            { code: 'HIT', value: -0.5 }
        ]
    },
    burn: {
        id: 'burn',
        name: 'Burn',
        icon: 5,
        duration: 3,
        traits: [
            { code: 'HRG', value: -0.1 }
        ]
    },
    poison: {
        id: 'poison',
        name: 'Poison',
        icon: 6,
        duration: 5,
        traits: [
            { code: 'HRG', value: -0.1 }
        ]
    },
    shock: {
        id: 'shock',
        name: 'Shock',
        icon: 7,
        duration: 2,
        restriction: 4,
        traits: []
    },
    charm: {
        id: 'charm',
        name: 'Charmed',
        icon: 8,
        restriction: 2, // Attack allies? Not implemented, maybe just restrict
        duration: 2,
        traits: []
    },
    focus: {
        id: 'focus',
        name: 'Focused',
        icon: 9,
        duration: 3,
        traits: [
            { code: 'CRI', value: 0.5 }
        ]
    },
    evade: {
        id: 'evade',
        name: 'Evasive',
        icon: 10,
        duration: 3,
        traits: [
            { code: 'EVA', value: 0.5 }
        ]
    },
    analyzed: {
        id: 'analyzed',
        name: 'Analyzed',
        icon: 12,
        duration: 5,
        traits: [
            { code: 'PARAM_RATE', dataId: 'def', value: 0.8 } // Lower defense if possible? No DEF param.
            // Maybe increase damage taken? No trait for that yet.
            // Just placeholder for now.
        ]
    },
    regen: {
        id: 'regen',
        name: 'Regeneration',
        icon: 13,
        duration: 5,
        traits: [
            { code: 'HRG', value: 0.1 }
        ]
    },
    berserk: {
        id: 'berserk',
        name: 'Berserk',
        icon: 14,
        duration: 3,
        traits: [
            { code: 'PARAM_PLUS', dataId: 'atk', value: 5 }
        ]
    }
};
