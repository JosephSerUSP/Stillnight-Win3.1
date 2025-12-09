/**
 * @file data/skills.js
 * @description FFX Skills
 */

export const skills = {
    // Tidus
    attack: {
        id: 'attack',
        name: 'Attack',
        target: 'enemy-single',
        element: 'Physical',
        description: "Standard physical attack.",
        effects: [{ type: 'hp_damage', formula: 'a.atk * 1.5 - b.def' }]
    },
    quickHit: {
        id: 'quickHit',
        name: 'Quick Hit',
        target: 'enemy-single',
        element: 'Physical',
        description: "A fast attack with reduced delay.",
        effects: [{ type: 'hp_damage', formula: 'a.atk * 1.2 - b.def' }],
        // TODO: Implement delay reduction in battle system if possible
    },
    spiralCut: {
        id: 'spiralCut',
        name: 'Spiral Cut',
        target: 'enemy-single',
        element: 'Physical',
        description: "Overdrive: A spinning slash dealing massive damage.",
        effects: [{ type: 'hp_damage', formula: 'a.atk * 3.5 - b.def' }]
    },
    haste: {
        id: 'haste',
        name: 'Haste',
        target: 'ally-single',
        element: 'Time',
        description: "Increases action speed.",
        effects: [{ type: 'add_status', status: 'haste', chance: 1.0, duration: 5 }]
    },

    // Yuna
    cure: {
        id: 'cure',
        name: 'Cure',
        target: 'ally-single',
        element: 'White',
        description: "Restores HP.",
        effects: [{ type: 'hp_heal', formula: '20 + a.spi * 2' }]
    },
    esuna: {
        id: 'esuna',
        name: 'Esuna',
        target: 'ally-single',
        element: 'White',
        description: "Removes negative status effects.",
        effects: [{ type: 'remove_status', status: 'all_bad' }] // Needs implementation
    },
    holy: {
        id: 'holy',
        name: 'Holy',
        target: 'enemy-single',
        element: 'White',
        description: "Powerful holy magic damage.",
        effects: [{ type: 'hp_damage', formula: 'a.mag * 3.0 - b.res' }]
    },
    grandSummon: {
        id: 'grandSummon',
        name: 'Grand Summon',
        target: 'self',
        element: 'Summon',
        description: "Overdrive: Call forth Valefor.",
        effects: [
            { type: 'add_status', status: 'valefor_form', chance: 1.0, duration: 3 }
        ]
    },

    // Auron
    powerBreak: {
        id: 'powerBreak',
        name: 'Power Break',
        target: 'enemy-single',
        element: 'Physical',
        description: "Damages and lowers Strength.",
        effects: [
            { type: 'hp_damage', formula: 'a.atk * 1.5 - b.def' },
            { type: 'add_status', status: 'power_break', chance: 1.0, duration: 3 }
        ]
    },
    armorBreak: {
        id: 'armorBreak',
        name: 'Armor Break',
        target: 'enemy-single',
        element: 'Physical',
        description: "Damages and lowers Defense.",
        effects: [
            { type: 'hp_damage', formula: 'a.atk * 1.5 - b.def' },
            { type: 'add_status', status: 'armor_break', chance: 1.0, duration: 3 }
        ]
    },
    shootingStar: {
        id: 'shootingStar',
        name: 'Shooting Star',
        target: 'enemy-single',
        element: 'Wind',
        description: "Overdrive: Ejects an enemy from battle.",
        effects: [{ type: 'hp_damage', formula: 'a.atk * 4.0 - b.def' }]
    },

    // Wakka
    darkAttack: {
        id: 'darkAttack',
        name: 'Dark Attack',
        target: 'enemy-single',
        element: 'Physical',
        description: "Inflicts Darkness.",
        effects: [
            { type: 'hp_damage', formula: 'a.atk * 1.2 - b.def' },
            { type: 'add_status', status: 'darkness', chance: 1.0, duration: 3 }
        ]
    },
    statusReels: {
        id: 'statusReels',
        name: 'Status Reels',
        target: 'enemy-group',
        element: 'Physical',
        description: "Overdrive: Inflicts multiple statuses on enemies.",
        effects: [
            { type: 'hp_damage', formula: 'a.atk * 2.0 - b.def' },
            { type: 'add_status', status: 'poison', chance: 0.8, duration: 3 },
            { type: 'add_status', status: 'darkness', chance: 0.8, duration: 3 }
        ]
    },

    // Lulu
    fire: {
        id: 'fire',
        name: 'Fire',
        target: 'enemy-single',
        element: 'Red',
        description: "Deals Fire damage.",
        effects: [{ type: 'hp_damage', formula: '10 + a.mag * 1.5 - b.res' }]
    },
    blizzard: {
        id: 'blizzard',
        name: 'Blizzard',
        target: 'enemy-single',
        element: 'Blue',
        description: "Deals Ice damage.",
        effects: [{ type: 'hp_damage', formula: '10 + a.mag * 1.5 - b.res' }]
    },
    thunder: {
        id: 'thunder',
        name: 'Thunder',
        target: 'enemy-single',
        element: 'Yellow',
        description: "Deals Lightning damage.",
        effects: [{ type: 'hp_damage', formula: '10 + a.mag * 1.5 - b.res' }]
    },
    water: {
        id: 'water',
        name: 'Water',
        target: 'enemy-single',
        element: 'Blue',
        description: "Deals Water damage.",
        effects: [{ type: 'hp_damage', formula: '10 + a.mag * 1.5 - b.res' }]
    },
    fury: {
        id: 'fury',
        name: 'Fury',
        target: 'enemy-group',
        element: 'Black',
        description: "Overdrive: Barrage of magic.",
        effects: [{ type: 'hp_damage', formula: 'a.mag * 4.0 - b.res' }]
    },

    // Kimahri
    lancet: {
        id: 'lancet',
        name: 'Lancet',
        target: 'enemy-single',
        element: 'Physical',
        description: "Drains HP and MP.",
        effects: [
            { type: 'hp_drain', formula: 'a.atk * 1.0' },
            { type: 'mp_drain', formula: 'a.mag * 0.5' }
        ]
    },
    jump: {
        id: 'jump',
        name: 'Jump',
        target: 'enemy-single',
        element: 'Physical',
        description: "Leaps into the air and strikes.",
        effects: [{ type: 'hp_damage', formula: 'a.atk * 2.0 - b.def' }]
    },
    ronsoRage: {
        id: 'ronsoRage',
        name: 'Ronso Rage',
        target: 'enemy-group',
        element: 'Physical',
        description: "Overdrive: Unleashes beastly power.",
        effects: [{ type: 'hp_damage', formula: 'a.atk * 3.0 - b.def' }]
    },

    // Rikku
    steal: {
        id: 'steal',
        name: 'Steal',
        target: 'enemy-single',
        element: 'Physical',
        description: "Steals an item from the enemy.",
        effects: [
             { type: 'steal', chance: 1.0 }, // Needs implementation
             { type: 'hp_damage', formula: 'a.atk * 0.5' }
        ]
    },
    use: {
        id: 'use',
        name: 'Use',
        target: 'friend-single',
        element: 'Item',
        description: "Use an item with enhanced effect.",
        effects: [] // Driven by item choice logic
    },
    mix: {
        id: 'mix',
        name: 'Mix',
        target: 'enemy-group',
        element: 'Special',
        description: "Overdrive: Concocts a dangerous explosive.",
        effects: [{ type: 'hp_damage', formula: '500' }] // Flat damage
    },

    // Enemy Skills
    breath: {
        id: 'breath',
        name: 'Bad Breath',
        target: 'party',
        element: 'Green',
        description: "Malboro's signature move.",
        effects: [
             { type: 'hp_damage', formula: 'a.atk * 1.5' },
             { type: 'add_status', status: 'poison', chance: 1.0 },
             { type: 'add_status', status: 'sleep', chance: 0.5 }
        ]
    },
    firaga: {
        id: 'firaga',
        name: 'Firaga',
        target: 'ally-single',
        element: 'Red',
        description: "Massive fire damage.",
        effects: [{ type: 'hp_damage', formula: '30 + a.mag * 2.5' }]
    },
    gravija: {
        id: 'gravija',
        name: 'Gravija',
        target: 'party',
        element: 'Black',
        description: "Reduces HP by 50%.",
        effects: [{ type: 'hp_damage', formula: 'b.hp * 0.5' }]
    },
    jechtBeam: {
        id: 'jechtBeam',
        name: 'Jecht Beam',
        target: 'ally-single',
        element: 'Special',
        description: "Petrifies a target.",
        effects: [
            { type: 'hp_damage', formula: '50' },
            { type: 'add_status', status: 'stone', chance: 1.0 }
        ]
    },

    // Valefor
    sonicWings: {
        id: 'sonicWings',
        name: 'Sonic Wings',
        target: 'enemy-single',
        element: 'Wind',
        description: "Valefor: Delays enemy turn.",
        effects: [{ type: 'hp_damage', formula: 'a.atk * 2.0' }]
    },
    energyBlast: {
        id: 'energyBlast',
        name: 'Energy Blast',
        target: 'enemy-group',
        element: 'Special',
        description: "Valefor's Overdrive.",
        effects: [{ type: 'hp_damage', formula: 'a.atk * 5.0' }]
    }
};
