
export const skills = {
    // Pixie
    windBlade: {
        id: 'windBlade',
        name: 'Wind Blade',
        target: 'enemy-any',
        element: 'Green',
        effects: [
            { type: 'hp_damage', formula: '5 + 1.2 * a.level' }
        ]
    },
    soothingMote: {
        id: 'soothingMote',
        name: 'Soothing Mote',
        target: 'ally-any',
        element: 'White',
        effects: [
            { type: 'hp_heal', formula: '4 + 1.5 * a.level' }
        ]
    },

    // Skeleton
    boneRush: {
        id: 'boneRush',
        name: 'Bone Rush',
        target: 'enemy-any',
        element: 'Black',
        effects: [
            { type: 'hp_damage', formula: '6 + 1.1 * a.level' }
        ]
    },

    // Angel
    holySmite: {
        id: 'holySmite',
        name: 'Holy Smite',
        target: 'enemy-any',
        element: 'White',
        effects: [
            { type: 'hp_damage', formula: '5 + 1.4 * a.level' }
        ]
    },
    divineFavor: {
        id: 'divineFavor',
        name: 'Divine Favor',
        target: 'ally-any',
        element: 'White',
        effects: [
            { type: 'add_status', status: 'regen', chance: 1.0, duration: 3 }
        ]
    },

    // Demon
    shadowClaw: {
        id: 'shadowClaw',
        name: 'Shadow Claw',
        target: 'enemy-any',
        element: 'Black',
        effects: [
            { type: 'hp_damage', formula: '6 + 1.3 * a.level' }
        ]
    },
    infernalPact: {
        id: 'infernalPact',
        name: 'Infernal Pact',
        target: 'self',
        element: 'Red',
        effects: [
            { type: 'add_status', status: 'berserk', chance: 1.0, duration: 3 }
        ]
    },

    // Example from prompt
    sleepMist: {
        id: 'sleepMist',
        name: 'Sleep Mist',
        target: 'enemy-all',
        element: 'Blue',
        effects: [
            { type: 'hp_damage', formula: '3 + 1.6 * a.level' },
            { type: 'add_status', status: 'sleep', chance: 0.3 }
        ]
    },
};
