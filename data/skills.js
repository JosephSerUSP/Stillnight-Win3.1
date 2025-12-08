/**
 * @file data/skills.js
 * @description Defines the skills available in the game.
 */

export const skills = {
    // Sailor Moon
    moonTiara: {
        id: 'moonTiara',
        name: 'Moon Tiara Action',
        target: 'enemy-any',
        element: 'White',
        description: "Throws a glowing tiara at the enemy.",
        effects: [
            { type: 'hp_damage', formula: '10 + 1.5 * a.level' },
            { type: 'add_status', status: 'stun', chance: 0.3, duration: 1 }
        ]
    },
    moonHealing: {
        id: 'moonHealing',
        name: 'Moon Healing',
        target: 'ally-any',
        element: 'White',
        description: "Restores HP and purifies status.",
        effects: [
            { type: 'hp_heal', formula: '15 + 2.0 * a.level' },
            { type: 'remove_status', status: 'poison' },
            { type: 'remove_status', status: 'sleep' }
        ]
    },
    silverCrystal: {
        id: 'silverCrystal',
        name: 'Silver Crystal Power',
        target: 'enemy-all',
        element: 'White',
        description: "Unleashes the legendary power of the Silver Crystal.",
        effects: [
            { type: 'hp_damage', formula: '50 + 3.0 * a.level' }
        ]
    },

    // Sailor Mercury
    bubbleSpray: {
        id: 'bubbleSpray',
        name: 'Bubble Spray',
        target: 'enemy-all',
        element: 'Blue',
        description: "Creates a fog that confuses enemies.",
        effects: [
            { type: 'hp_damage', formula: '5 + 1.0 * a.level' },
            { type: 'add_status', status: 'blind', chance: 0.8, duration: 3 }
        ]
    },
    analysis: {
        id: 'analysis',
        name: 'Analysis',
        target: 'enemy-any',
        element: 'Blue',
        description: "Identifies the enemy weakness (lowers Def).",
        effects: [
            { type: 'add_status', status: 'analyzed', chance: 1.0, duration: 5 }
        ]
    },

    // Sailor Mars
    fireSoul: {
        id: 'fireSoul',
        name: 'Fire Soul',
        target: 'enemy-any',
        element: 'Red',
        description: "Shoots a fireball at the enemy.",
        effects: [
            { type: 'hp_damage', formula: '15 + 1.8 * a.level' },
            { type: 'add_status', status: 'burn', chance: 0.4, duration: 3 }
        ]
    },
    akuryoTaisan: {
        id: 'akuryoTaisan',
        name: 'Akuryo Taisan',
        target: 'enemy-any',
        element: 'Red',
        description: "Exorcises evil spirits. High damage to dark types.",
        effects: [
            { type: 'hp_damage', formula: '20 + 2.0 * a.level' }
        ]
    },

    // Sailor Jupiter
    supremeThunder: {
        id: 'supremeThunder',
        name: 'Supreme Thunder',
        target: 'enemy-all',
        element: 'Green',
        description: "Calls down lightning upon all enemies.",
        effects: [
            { type: 'hp_damage', formula: '12 + 1.6 * a.level' },
            { type: 'add_status', status: 'shock', chance: 0.3, duration: 2 }
        ]
    },
    flowerHurricane: {
        id: 'flowerHurricane',
        name: 'Flower Hurricane',
        target: 'enemy-all',
        element: 'Green',
        description: "A storm of petals that blinds enemies.",
        effects: [
            { type: 'hp_damage', formula: '8 + 1.2 * a.level' },
            { type: 'add_status', status: 'blind', chance: 0.5, duration: 3 }
        ]
    },

    // Sailor Venus
    crescentBeam: {
        id: 'crescentBeam',
        name: 'Crescent Beam',
        target: 'enemy-any',
        element: 'White',
        description: "Fires a beam of light.",
        effects: [
            { type: 'hp_damage', formula: '14 + 1.7 * a.level' }
        ]
    },
    rollingHeart: {
        id: 'rollingHeart',
        name: 'Rolling Heart',
        target: 'enemy-any',
        element: 'Red',
        description: "A charm attack that may confuse the enemy.",
        effects: [
            { type: 'hp_damage', formula: '10 + 1.2 * a.level' },
            { type: 'add_status', status: 'charm', chance: 0.4, duration: 2 }
        ]
    },

    // Enemy Skills
    energyDrain: {
        id: 'energyDrain',
        name: 'Energy Drain',
        target: 'enemy-any',
        element: 'Black',
        description: "Drains HP from the target.",
        effects: [
            { type: 'hp_drain', formula: '5 + 0.8 * a.level' }
        ]
    },
    clawSlash: {
        id: 'clawSlash',
        name: 'Claw Slash',
        target: 'enemy-any',
        element: 'Black',
        description: "Rips with sharp claws.",
        effects: [
            { type: 'hp_damage', formula: '8 + 1.0 * a.level' }
        ]
    },
    freezingTouch: {
        id: 'freezingTouch',
        name: 'Freezing Touch',
        target: 'enemy-any',
        element: 'Blue',
        description: "Chills the target to the bone.",
        effects: [
            { type: 'hp_damage', formula: '10 + 1.2 * a.level' },
            { type: 'add_status', status: 'frozen', chance: 0.3, duration: 2 }
        ]
    },
    illusion: {
        id: 'illusion',
        name: 'Illusion',
        target: 'ally-all',
        element: 'Blue',
        description: "Creates illusions to evade attacks.",
        effects: [
            { type: 'add_status', status: 'evade', chance: 1.0, duration: 3 }
        ]
    },
    starPrediction: {
        id: 'starPrediction',
        name: 'Star Prediction',
        target: 'self',
        element: 'Black',
        description: "Predicts the next move, increasing critical rate.",
        effects: [
            { type: 'add_status', status: 'focus', chance: 1.0, duration: 3 }
        ]
    },
    flowerPetal: {
        id: 'flowerPetal',
        name: 'Petal Storm',
        target: 'enemy-all',
        element: 'Red',
        description: "A storm of sharp petals.",
        effects: [
            { type: 'hp_damage', formula: '12 + 1.4 * a.level' }
        ]
    },
    boomerang: {
        id: 'boomerang',
        name: 'Boomerang',
        target: 'enemy-any',
        element: 'White',
        description: "Throws a bladed boomerang.",
        effects: [
            { type: 'hp_damage', formula: '20 + 1.5 * a.level' }
        ]
    },
    darkEnergy: {
        id: 'darkEnergy',
        name: 'Dark Energy',
        target: 'enemy-all',
        element: 'Black',
        description: "Blasts the party with dark energy.",
        effects: [
            { type: 'hp_damage', formula: '25 + 2.0 * a.level' }
        ]
    },
    metaliaSummon: {
        id: 'metaliaSummon',
        name: 'Summon Metalia',
        target: 'self',
        element: 'Black',
        description: "Calls upon the power of Queen Metalia.",
        effects: [
            { type: 'hp_heal', formula: '100' },
            { type: 'add_status', status: 'berserk', chance: 1.0, duration: 5 }
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
