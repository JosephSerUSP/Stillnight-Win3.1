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
        icon: 13,
        restriction: 4,
        duration: 3,
        removeAtDamage: true,
        traits: []
    },
    stun: {
        id: 'stun',
        name: 'Stun',
        icon: 1,
        restriction: 4,
        duration: 1,
        traits: []
    },
    paralysis: {
        id: 'paralysis',
        name: 'Paralysis',
        icon: 1,
        restriction: 4,
        duration: 2,
        traits: []
    },
    poison: {
        id: 'poison',
        name: 'Poison',
        icon: 2,
        duration: 5,
        traits: [
            { code: 'HRG', value: -0.1 }
        ]
    },
    regen: {
        id: 'regen',
        name: 'Regeneration',
        icon: 3,
        duration: 5,
        traits: [
            { code: 'HRG', value: 0.1 }
        ]
    },
    berserk: {
        id: 'berserk',
        name: 'Berserk',
        icon: 4,
        duration: 3,
        traits: [
            { code: 'PARAM_PLUS', dataId: 'atk', value: 3 }
        ]
    }
};
