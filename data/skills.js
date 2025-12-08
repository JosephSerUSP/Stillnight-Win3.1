export const skills = {
    // Basic Magic
    fire: {
        id: 'fire',
        name: 'Fire',
        target: 'enemy-any',
        element: 'Fire',
        description: "Deals Fire damage.",
        effects: [{ type: 'hp_damage', formula: '10 + 2 * a.mat' }]
    },
    blizzard: {
        id: 'blizzard',
        name: 'Blizzard',
        target: 'enemy-any',
        element: 'Ice',
        description: "Deals Ice damage.",
        effects: [{ type: 'hp_damage', formula: '10 + 2 * a.mat' }]
    },
    thunder: {
        id: 'thunder',
        name: 'Thunder',
        target: 'enemy-any',
        element: 'Thunder',
        description: "Deals Thunder damage.",
        effects: [{ type: 'hp_damage', formula: '10 + 2 * a.mat' }]
    },
    cure: {
        id: 'cure',
        name: 'Cure',
        target: 'ally-any',
        element: 'Holy',
        description: "Restores HP.",
        effects: [{ type: 'hp_heal', formula: '20 + 3 * a.mat' }]
    },
    scan: {
        id: 'scan',
        name: 'Scan',
        target: 'enemy-any',
        element: 'Holy',
        description: "Reveals enemy data.",
        effects: [{ type: 'scan_enemy' }]
    },

    // Limit Breaks / Character Skills
    renzokuken: {
        id: 'renzokuken',
        name: 'Renzokuken',
        target: 'enemy-any',
        element: 'White',
        description: "A flurry of gunblade strikes.",
        effects: [
            { type: 'hp_damage', formula: '15 + 2.5 * a.atk' }
        ]
    },
    laser_eye: {
        id: 'laser_eye',
        name: 'Laser Eye',
        target: 'enemy-any',
        element: 'White',
        description: "Shoots a laser from the eyes.",
        effects: [{ type: 'hp_damage', formula: '20 + 2 * a.mat' }]
    },
    punch_rush: {
        id: 'punch_rush',
        name: 'Punch Rush',
        target: 'enemy-any',
        element: 'White',
        description: "A rapid series of punches.",
        effects: [{ type: 'hp_damage', formula: '12 + 2.2 * a.atk' }]
    },
    bite: {
        id: 'bite',
        name: 'Bite',
        target: 'enemy-any',
        element: 'White',
        description: "Sharp teeth bite.",
        effects: [{ type: 'hp_damage', formula: '5 + 1.5 * a.atk' }]
    },
    hellfire: {
        id: 'hellfire',
        name: 'Hellfire',
        target: 'enemy-all',
        element: 'Fire',
        description: "Incinerates all enemies.",
        effects: [{ type: 'hp_damage', formula: '30 + 3 * a.mat' }]
    },

    // Commands
    draw: {
        id: 'draw',
        name: 'Draw',
        target: 'enemy-any',
        element: 'White',
        description: "Draw magic from enemy.",
        effects: [{ type: 'draw_magic' }]
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
