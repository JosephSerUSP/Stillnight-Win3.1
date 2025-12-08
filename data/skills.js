export const skills = {
    // Fayt
    bladeOfFury: {
        id: 'bladeOfFury',
        name: 'Blade of Fury',
        target: 'enemy-any',
        element: 'White',
        description: "A rapid flurry of sword strikes.",
        effects: [
            { type: 'hp_damage', formula: '5 + 1.2 * a.atk' }
        ]
    },
    sideKick: {
        id: 'sideKick',
        name: 'Side Kick',
        target: 'enemy-any',
        element: 'White',
        description: "A powerful kick that knocks enemies back.",
        effects: [
            { type: 'hp_damage', formula: '10 + 1.5 * a.atk' }
        ]
    },
    airRaid: {
        id: 'airRaid',
        name: 'Air Raid',
        target: 'enemy-all',
        element: 'Red',
        description: "Bombards the battlefield with energy.",
        effects: [
            { type: 'hp_damage', formula: '8 + 1.0 * a.atk' }
        ]
    },

    // Sophia
    healing: {
        id: 'healing',
        name: 'Healing',
        target: 'ally-any',
        element: 'White',
        description: "Restores HP to an ally.",
        effects: [
            { type: 'hp_heal', formula: '15 + 2.0 * a.level' }
        ]
    },
    fireBolt: {
        id: 'fireBolt',
        name: 'Fire Bolt',
        target: 'enemy-any',
        element: 'Red',
        description: "Shoots a bolt of fire.",
        effects: [
            { type: 'hp_damage', formula: '8 + 1.5 * a.level' }
        ]
    },
    thunderFlare: {
        id: 'thunderFlare',
        name: 'Thunder Flare',
        target: 'enemy-all',
        element: 'Green', // Closest to Wind/Thunder
        description: "Calls down lightning on all foes.",
        effects: [
            { type: 'hp_damage', formula: '12 + 1.2 * a.level' },
            { type: 'add_status', status: 'paralysis', chance: 0.3, duration: 2 }
        ]
    },

    // Cliff
    sphereOfMight: {
        id: 'sphereOfMight',
        name: 'Sphere of Might',
        target: 'enemy-any',
        element: 'Red',
        description: "Traps the enemy in a sphere of energy.",
        effects: [
            { type: 'hp_damage', formula: '8 + 1.4 * a.atk' },
            { type: 'add_status', status: 'stun', chance: 0.5, duration: 1 }
        ]
    },
    hammerOfMight: {
        id: 'hammerOfMight',
        name: 'Hammer of Might',
        target: 'enemy-any',
        element: 'Red',
        description: "Crushes the enemy with a giant hammer.",
        effects: [
            { type: 'hp_damage', formula: '20 + 2.0 * a.atk' }
        ]
    },

    // Nel
    iceDaggers: {
        id: 'iceDaggers',
        name: 'Ice Daggers',
        target: 'enemy-any',
        element: 'Blue',
        description: "Throws shards of ice.",
        effects: [
            { type: 'hp_damage', formula: '7 + 1.3 * a.atk' }
        ]
    },
    shockwave: {
        id: 'shockwave',
        name: 'Shockwave',
        target: 'enemy-all',
        element: 'White',
        description: "Creates a shockwave along the ground.",
        effects: [
            { type: 'hp_damage', formula: '6 + 1.0 * a.atk' }
        ]
    },

    // Maria
    aimedShot: {
        id: 'aimedShot',
        name: 'Aimed Shot',
        target: 'enemy-any',
        element: 'Blue',
        description: "Takes aim for a precise hit.",
        effects: [
            { type: 'hp_damage', formula: '15 + 1.8 * a.atk' }
        ]
    },
    magneticField: {
        id: 'magneticField',
        name: 'Magnetic Field',
        target: 'enemy-all',
        element: 'Blue',
        description: "Disrupts enemy movement.",
        effects: [
            { type: 'hp_damage', formula: '5 + 0.5 * a.atk' },
            { type: 'add_status', status: 'sleep', chance: 0.6, duration: 2 }
        ]
    },

    // Enemy Skills
    tackle: {
        id: 'tackle',
        name: 'Tackle',
        target: 'enemy-any',
        element: 'White',
        description: "A weak physical attack.",
        effects: [
            { type: 'hp_damage', formula: '4 + 1.0 * a.level' }
        ]
    },
    shoot: {
        id: 'shoot',
        name: 'Shoot',
        target: 'enemy-any',
        element: 'Black',
        description: "Fires a weapon.",
        effects: [
            { type: 'hp_damage', formula: '6 + 1.1 * a.level' }
        ]
    },
    laser: {
        id: 'laser',
        name: 'Laser',
        target: 'enemy-any',
        element: 'Blue',
        description: "Fires a piercing laser.",
        effects: [
            { type: 'hp_damage', formula: '8 + 1.2 * a.level' }
        ]
    },
    crystalBreath: {
        id: 'crystalBreath',
        name: 'Crystal Breath',
        target: 'enemy-all',
        element: 'White',
        description: "Exhales a cloud of crystal dust.",
        effects: [
            { type: 'hp_damage', formula: '15 + 1.5 * a.level' }
        ]
    },
    trample: {
        id: 'trample',
        name: 'Trample',
        target: 'enemy-any',
        element: 'Red',
        description: "Stomps on the target.",
        effects: [
            { type: 'hp_damage', formula: '25 + 2.0 * a.level' }
        ]
    },
    wait: {
        id: 'wait',
        name: 'Wait',
        target: 'self',
        element: 'White',
        description: "Do nothing.",
        effects: []
    }
};
