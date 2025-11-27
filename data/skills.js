
export const skills = {
    // Pixie
    windBlade: {
        id: 'windBlade',
        name: 'Wind Blade',
        target: 'enemy-any',
        element: 'Green',
        description: 'A sharp blade of wind that deals damage to one enemy.',
        effects: [
            { type: 'hp_damage', formula: '5 + 1.2 * a.level' }
        ]
    },
    soothingMote: {
        id: 'soothingMote',
        name: 'Soothing Mote',
        target: 'ally-any',
        element: 'White',
        description: 'Heals an ally for a moderate amount.',
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
        description: 'A reckless charge that deals heavy damage.',
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
        description: 'Strikes an enemy with holy light.',
        effects: [
            { type: 'hp_damage', formula: '5 + 1.4 * a.level' }
        ]
    },
    divineFavor: {
        id: 'divineFavor',
        name: 'Divine Favor',
        target: 'ally-any',
        element: 'White',
        description: 'Grants regeneration to an ally.',
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
        description: 'Rends the target with shadows.',
        effects: [
            { type: 'hp_damage', formula: '6 + 1.3 * a.level' }
        ]
    },
    infernalPact: {
        id: 'infernalPact',
        name: 'Infernal Pact',
        target: 'self',
        element: 'Red',
        description: 'Enters a berserk state for increased power.',
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
        description: 'A mist that damages and may sleep all enemies.',
        effects: [
            { type: 'hp_damage', formula: '3 + 1.6 * a.level' },
            { type: 'add_status', status: 'sleep', chance: 0.3 }
        ]
    },

    // Egg -> Phoenix skills
    flameRebirth: {
        id: 'flameRebirth',
        name: 'Flame Rebirth',
        target: 'ally-dead',
        element: 'Red',
        description: 'Revives a fallen ally with full HP.',
        effects: [
             { type: 'revive', hp: 1.0 }
        ]
    },

    // Default wait
    wait: {
        id: 'wait',
        name: 'Wait',
        target: 'self',
        element: 'White',
        description: 'Do nothing.',
        effects: []
    }
};
