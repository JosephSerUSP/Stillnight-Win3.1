/**
 * @file data/skills.js
 * @description Defines the skills available in the game.
 */

export const skills = {
    // FFVII Skills
    braver: {
        id: 'braver',
        name: 'Braver',
        target: 'enemy-any',
        element: 'Physical',
        description: "A powerful jumping slash.",
        effects: [
            { type: 'hp_damage', formula: '15 + 2.0 * a.atk' }
        ]
    },
    big_shot: {
        id: 'big_shot',
        name: 'Big Shot',
        target: 'enemy-any',
        element: 'Physical',
        description: "Fires a concentrated burst of energy.",
        effects: [
            { type: 'hp_damage', formula: '12 + 1.8 * a.atk' }
        ]
    },
    bolt: {
        id: 'bolt',
        name: 'Bolt',
        target: 'enemy-any',
        element: 'Lightning',
        description: "Strikes a foe with lightning.",
        effects: [
            { type: 'hp_damage', formula: '10 + 1.5 * a.mat' }
        ]
    },
    fire: {
        id: 'fire',
        name: 'Fire',
        target: 'enemy-any',
        element: 'Fire',
        description: "Burns a foe with fire.",
        effects: [
            { type: 'hp_damage', formula: '10 + 1.5 * a.mat' }
        ]
    },
    ice: {
        id: 'ice',
        name: 'Ice',
        target: 'enemy-any',
        element: 'Ice',
        description: "Freezes a foe with ice.",
        effects: [
            { type: 'hp_damage', formula: '10 + 1.5 * a.mat' }
        ]
    },
    cure: {
        id: 'cure',
        name: 'Cure',
        target: 'ally-any',
        element: 'Holy',
        description: "Restores HP to an ally.",
        effects: [
            { type: 'hp_heal', formula: '20 + 2.0 * a.mat' }
        ]
    },
    tail_laser: {
        id: 'tail_laser',
        name: 'Tail Laser',
        target: 'enemy-all',
        element: 'Lightning',
        description: "Sweeping laser attack.",
        effects: [
            { type: 'hp_damage', formula: '8 + 1.2 * a.atk' }
        ]
    },
    machine_gun_burst: {
        id: 'machine_gun_burst',
        name: 'Burst Fire',
        target: 'enemy-any',
        element: 'Physical',
        description: "Rapid fire.",
        effects: [
            { type: 'hp_damage', formula: '4 + 1.0 * a.atk' }
        ]
    },
    bite: {
        id: 'bite',
        name: 'Bite',
        target: 'enemy-any',
        element: 'Physical',
        description: "A vicious bite.",
        effects: [
            { type: 'hp_damage', formula: '3 + 1.0 * a.atk' }
        ]
    },
    search_scope: {
        id: 'search_scope',
        name: 'Search Scope',
        target: 'enemy-any',
        element: 'Physical',
        description: "Target locking.",
        effects: [
            { type: 'hp_damage', formula: '1' }
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
