/**
 * @file data/skills.js
 * @description Defines the skills available in the game.
 */

export const skills = {
    // Common
    wait: {
        id: 'wait',
        name: 'Wait',
        target: 'self',
        element: 'White',
        description: "Do nothing.",
        effects: []
    },

    // Warrior
    heavyBash: {
        id: 'heavyBash',
        name: 'Heavy Bash',
        target: 'enemy-any',
        element: 'Red',
        description: "A powerful blow that can stun.",
        effects: [
            { type: 'hp_damage', formula: '8 + 1.5 * a.atk' },
            { type: 'add_status', status: 'stun', chance: 0.3, duration: 1 }
        ]
    },
    whirlwind: {
        id: 'whirlwind',
        name: 'Whirlwind',
        target: 'enemy-all',
        element: 'Red',
        description: "Spin around, hitting all enemies.",
        effects: [
            { type: 'hp_damage', formula: '5 + 1.0 * a.atk' }
        ]
    },

    // Rogue
    backstab: {
        id: 'backstab',
        name: 'Backstab',
        target: 'enemy-any',
        element: 'Black',
        description: "Critical strike from the shadows.",
        effects: [
            { type: 'hp_damage', formula: '(8 + 1.2 * a.atk) * (a.cri > 0 ? 1.5 : 1)' } // Simplified logic
        ]
    },
    arrowVolley: {
        id: 'arrowVolley',
        name: 'Arrow Volley',
        target: 'enemy-random',
        element: 'Green',
        description: "Fire multiple arrows at random targets.",
        effects: [
            { type: 'hp_damage', formula: '4 + 0.8 * a.atk' }
        ]
    },

    // Sorcerer
    firebolt: {
        id: 'firebolt',
        name: 'Firebolt',
        target: 'enemy-any',
        element: 'Red',
        description: "Launch a bolt of fire.",
        effects: [
            { type: 'hp_damage', formula: '10 + 2.0 * a.mat' }
        ]
    },
    teleport: {
        id: 'teleport',
        name: 'Teleport',
        target: 'self',
        element: 'Blue',
        description: "Shift position to evade attacks.",
        effects: [
            { type: 'add_status', status: 'evasion_up', chance: 1.0, duration: 2 }
        ]
    },

    // Deckard
    identify: {
        id: 'identify',
        name: 'Identify',
        target: 'enemy-any',
        element: 'White',
        description: "Reveals enemy weaknesses.",
        effects: [
             // Mechanics for this might need code support, for now just a small damage or nothing
             { type: 'message', value: "You listen to the lore..." }
        ]
    },

    // Enemies
    scratch: {
        id: 'scratch',
        name: 'Scratch',
        target: 'enemy-any',
        element: 'Red',
        description: "Weak claw attack.",
        effects: [
            { type: 'hp_damage', formula: '3 + 1.0 * a.atk' }
        ]
    },
    bite: {
        id: 'bite',
        name: 'Bite',
        target: 'enemy-any',
        element: 'Black',
        description: "Nasty bite.",
        effects: [
            { type: 'hp_damage', formula: '4 + 1.1 * a.atk' }
        ]
    },
    boneSlash: {
        id: 'boneSlash',
        name: 'Bone Slash',
        target: 'enemy-any',
        element: 'Black',
        description: "Slash with a rusted blade.",
        effects: [
            { type: 'hp_damage', formula: '6 + 1.2 * a.atk' }
        ]
    },
    sneakAttack: {
        id: 'sneakAttack',
        name: 'Sneak Attack',
        target: 'enemy-any',
        element: 'Black',
        description: "Attack from nowhere.",
        effects: [
            { type: 'hp_damage', formula: '8 + 1.5 * a.atk' }
        ]
    },
    freshMeat: {
        id: 'freshMeat',
        name: 'Fresh Meat',
        target: 'self',
        element: 'Red',
        description: "The Butcher enrages!",
        effects: [
            { type: 'add_status', status: 'berserk', chance: 1.0, duration: 3 },
            { type: 'message', value: "Ahhh, Fresh Meat!" }
        ]
    },
    cleaver: {
        id: 'cleaver',
        name: 'Cleaver',
        target: 'enemy-any',
        element: 'Red',
        description: "Giant chop.",
        effects: [
            { type: 'hp_damage', formula: '15 + 1.5 * a.atk' }
        ]
    },
    kingSmite: {
        id: 'kingSmite',
        name: 'King\'s Smite',
        target: 'enemy-any',
        element: 'Black',
        description: "A crushingly heavy blow.",
        effects: [
            { type: 'hp_damage', formula: '20 + 2.0 * a.atk' },
            { type: 'add_status', status: 'stun', chance: 0.5, duration: 1 }
        ]
    },
    summonSkeletons: {
        id: 'summonSkeletons',
        name: 'Raise Dead',
        target: 'enemy-random',
        element: 'Black',
        description: "Spirits of the dead assault the party.",
        effects: [
             { type: 'hp_damage', formula: '5 + 0.5 * a.mat' },
             { type: 'hp_damage', formula: '5 + 0.5 * a.mat' },
             { type: 'hp_damage', formula: '5 + 0.5 * a.mat' }
        ]
    }
};
