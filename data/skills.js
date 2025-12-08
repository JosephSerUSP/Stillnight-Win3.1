export const skills = {
    // Fire
    agi: {
        id: 'agi',
        name: 'Agi',
        target: 'enemy-any',
        element: 'Fire',
        description: "Deals light Fire damage.",
        effects: [{ type: 'hp_damage', formula: '8 + 1.5 * a.mat' }]
    },
    maragi: {
        id: 'maragi',
        name: 'Maragi',
        target: 'enemy-all',
        element: 'Fire',
        description: "Deals light Fire damage to all foes.",
        effects: [{ type: 'hp_damage', formula: '6 + 1.2 * a.mat' }]
    },
    agilao: {
        id: 'agilao',
        name: 'Agilao',
        target: 'enemy-any',
        element: 'Fire',
        description: "Deals medium Fire damage.",
        effects: [{ type: 'hp_damage', formula: '20 + 2.0 * a.mat' }]
    },
    hellFire: {
        id: 'hellFire',
        name: 'Hellfire',
        target: 'enemy-all',
        element: 'Fire',
        description: "Deals heavy Fire damage to all foes.",
        effects: [{ type: 'hp_damage', formula: '40 + 3.0 * a.mat' }]
    },

    // Ice
    bufu: {
        id: 'bufu',
        name: 'Bufu',
        target: 'enemy-any',
        element: 'Ice',
        description: "Deals light Ice damage.",
        effects: [{ type: 'hp_damage', formula: '8 + 1.5 * a.mat' }]
    },
    bufula: {
        id: 'bufula',
        name: 'Bufula',
        target: 'enemy-any',
        element: 'Ice',
        description: "Deals medium Ice damage.",
        effects: [{ type: 'hp_damage', formula: '20 + 2.0 * a.mat' }]
    },
    iceBreath: {
        id: 'iceBreath',
        name: 'Ice Breath',
        target: 'enemy-random', // Assuming engine supports or random selection logic
        element: 'Ice',
        description: "Deals light Ice damage to random foes.",
        effects: [{ type: 'hp_damage', formula: '8 + 1.5 * a.mat' }]
    },

    // Elec
    zio: {
        id: 'zio',
        name: 'Zio',
        target: 'enemy-any',
        element: 'Elec',
        description: "Deals light Elec damage.",
        effects: [{ type: 'hp_damage', formula: '8 + 1.5 * a.mat' }]
    },
    mazan: { // Wait, Mazan is Force. Mazio is Elec.
        id: 'mazio',
        name: 'Mazio',
        target: 'enemy-all',
        element: 'Elec',
        description: "Deals light Elec damage to all foes.",
        effects: [{ type: 'hp_damage', formula: '6 + 1.2 * a.mat' }]
    },

    // Force (Wind)
    zan: {
        id: 'zan',
        name: 'Zan',
        target: 'enemy-any',
        element: 'Force',
        description: "Deals light Force damage.",
        effects: [{ type: 'hp_damage', formula: '8 + 1.5 * a.mat' }]
    },
    mazan: {
        id: 'mazan',
        name: 'Mazan',
        target: 'enemy-all',
        element: 'Force',
        description: "Deals light Force damage to all foes.",
        effects: [{ type: 'hp_damage', formula: '6 + 1.2 * a.mat' }]
    },
    windBlade: { // Legacy support
        id: 'windBlade',
        name: 'Wind Blade',
        target: 'enemy-any',
        element: 'Force',
        description: "Strikes a foe with a blade of wind.",
        effects: [{ type: 'hp_damage', formula: '6 + 1.2 * a.level' }]
    },

    // Light
    hama: {
        id: 'hama',
        name: 'Hama',
        target: 'enemy-any',
        element: 'Light',
        description: "Deals light Light damage.",
        effects: [{ type: 'hp_damage', formula: '10 + 1.5 * a.mat' }]
    },

    // Dark
    mudo: {
        id: 'mudo',
        name: 'Mudo',
        target: 'enemy-any',
        element: 'Dark',
        description: "Deals light Dark damage.",
        effects: [{ type: 'hp_damage', formula: '10 + 1.5 * a.mat' }]
    },
    mudoon: {
        id: 'mudoon',
        name: 'Mudoon',
        target: 'enemy-any',
        element: 'Dark',
        description: "Deals heavy Dark damage.",
        effects: [{ type: 'hp_damage', formula: '30 + 2.5 * a.mat' }]
    },
    evilTouch: {
        id: 'evilTouch',
        name: 'Evil Touch',
        target: 'enemy-any',
        element: 'Dark',
        description: "Inflicts Fear (Not implemented, dmg for now).",
        effects: [{ type: 'hp_damage', formula: '5 + 1.0 * a.mat' }]
    },

    // Phys
    lunge: {
        id: 'lunge',
        name: 'Lunge',
        target: 'enemy-any',
        element: 'Phys',
        description: "Light physical damage.",
        effects: [{ type: 'hp_damage', formula: '10 + 1.2 * a.atk' }]
    },
    heatWave: {
        id: 'heatWave',
        name: 'Heat Wave',
        target: 'enemy-all',
        element: 'Phys',
        description: "Medium physical damage to all.",
        effects: [{ type: 'hp_damage', formula: '15 + 1.2 * a.atk' }]
    },
    sonicPunch: {
        id: 'sonicPunch',
        name: 'Sonic Punch',
        target: 'enemy-any',
        element: 'Phys',
        description: "Medium physical damage.",
        effects: [{ type: 'hp_damage', formula: '18 + 1.5 * a.atk' }]
    },
    gigantomachia: {
        id: 'gigantomachia',
        name: 'Gigantomachia',
        target: 'enemy-all',
        element: 'Phys',
        description: "Heavy physical damage to all.",
        effects: [{ type: 'hp_damage', formula: '40 + 2.0 * a.atk' }]
    },

    // Healing / Support
    dia: {
        id: 'dia',
        name: 'Dia',
        target: 'ally-any',
        element: 'Light',
        description: "Heals an ally.",
        effects: [{ type: 'hp_heal', formula: '20 + 1.5 * a.mat' }]
    },
    media: {
        id: 'media',
        name: 'Media',
        target: 'ally-all',
        element: 'Light',
        description: "Heals all allies.",
        effects: [{ type: 'hp_heal', formula: '15 + 1.2 * a.mat' }]
    },
    marinKarin: {
        id: 'marinKarin',
        name: 'Marin Karin',
        target: 'enemy-any',
        element: 'Force',
        description: "Charms a foe (Damage for now).",
        effects: [{ type: 'hp_damage', formula: '5 + 1.0 * a.mat' }]
    },
    pulinpa: {
        id: 'pulinpa',
        name: 'Pulinpa',
        target: 'enemy-any',
        element: 'Force',
        description: "Confuses a foe (Damage for now).",
        effects: [{ type: 'hp_damage', formula: '5 + 1.0 * a.mat' }]
    },
    powerCharge: {
        id: 'powerCharge',
        name: 'Power Charge',
        target: 'self',
        element: 'Phys',
        description: "Next phys attack deals more damage.",
        effects: [{ type: 'add_status', status: 'charged', chance: 1.0, duration: 1 }]
    },

    // Legacy
    wait: {
        id: 'wait',
        name: 'Wait',
        target: 'self',
        element: 'Phys',
        description: "Do nothing.",
        effects: []
    }
};
