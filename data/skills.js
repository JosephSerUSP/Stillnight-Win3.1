/**
 * @file data/skills.js
 * @description Defines the skills available in the game.
 * Skills are used by battlers in combat to deal damage, heal, or apply status effects.
 */

export const skills = {
    // Magitek Skills
    fire_beam: {
        id: 'fire_beam',
        name: 'Fire Beam',
        target: 'enemy-any',
        element: 'Red',
        description: "Fires a beam of intense heat.",
        effects: [{ type: 'hp_damage', formula: '15 + 1.2 * a.mat' }]
    },
    ice_beam: {
        id: 'ice_beam',
        name: 'Ice Beam',
        target: 'enemy-any',
        element: 'Blue',
        description: "Fires a beam of absolute zero.",
        effects: [{ type: 'hp_damage', formula: '15 + 1.2 * a.mat' }]
    },
    bolt_beam: {
        id: 'bolt_beam',
        name: 'Bolt Beam',
        target: 'enemy-any',
        element: 'Green', // Closest to Yellow/Thunder
        description: "Fires a beam of lightning.",
        effects: [{ type: 'hp_damage', formula: '15 + 1.2 * a.mat' }]
    },
    bio_blast: {
        id: 'bio_blast',
        name: 'Bio Blast',
        target: 'enemy-all',
        element: 'Black',
        description: "Unleashes a cloud of poison gas.",
        effects: [
            { type: 'hp_damage', formula: '10 + 1.0 * a.mat' },
            { type: 'add_status', status: 'poison', chance: 1.0, duration: 3 }
        ]
    },
    magitek_missile: {
        id: 'magitek_missile',
        name: 'Magitek Missile',
        target: 'enemy-any',
        element: 'Red',
        description: "Launches a powerful missile.",
        effects: [{ type: 'hp_damage', formula: '25 + 1.5 * a.atk' }]
    },
    heal_force: {
        id: 'heal_force',
        name: 'Heal Force',
        target: 'ally-any',
        element: 'White',
        description: "Repairs the Magitek Armor.",
        effects: [{ type: 'hp_heal', formula: '50 + 2.0 * a.mat' }]
    },

    // Enemy Skills
    attack: {
        id: 'attack',
        name: 'Attack',
        target: 'enemy-any',
        element: 'Physical', // Should check if 'Physical' is a valid element or just empty
        description: "A basic physical attack.",
        effects: [{ type: 'hp_damage', formula: 'a.atk * 1.0' }]
    },
    fangs: {
        id: 'fangs',
        name: 'Fangs',
        target: 'enemy-any',
        element: 'Red',
        description: "Bites the target.",
        effects: [{ type: 'hp_damage', formula: '5 + 1.0 * a.atk' }]
    },
    slime: {
        id: 'slime',
        name: 'Slime',
        target: 'enemy-any',
        element: 'Green',
        description: "Covers the target in sticky slime.",
        effects: [
             { type: 'hp_damage', formula: '8 + 1.0 * a.mat' },
             { type: 'add_status', status: 'slow', chance: 0.5, duration: 3 }
        ]
    },
    mega_volt: {
        id: 'mega_volt',
        name: 'Mega Volt',
        target: 'enemy-all',
        element: 'Green',
        description: "Discharges a massive electric shock.",
        effects: [{ type: 'hp_damage', formula: '30 + 1.5 * a.mat' }]
    }
};
