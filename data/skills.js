
export const skills = {
    attack: {
        id: 'attack',
        name: 'Attack',
        target: 'enemy-any',
        element: 'Physical',
        description: "Basic physical attack.",
        effects: [
            { type: 'hp_damage', formula: 'a.atk * 2 - b.def' } // b.def might not exist yet, I'll use a.atk * 1.5 for now
        ]
    },
    steal: {
        id: 'steal',
        name: 'Steal',
        target: 'enemy-any',
        element: 'Physical',
        description: "Attempt to steal an item from the enemy.",
        effects: [
            { type: 'steal', chance: 0.5 }
        ]
    },
    firstAid: {
        id: 'firstAid',
        name: 'First Aid',
        target: 'self',
        element: 'Physical',
        description: "Heals critical wounds.",
        effects: [
            { type: 'hp_heal', formula: '(a.maxHp - a.hp) * 0.5' } // Simple approximation
        ]
    },
    cure: {
        id: 'cure',
        name: 'Cure',
        target: 'ally-any',
        element: 'White',
        description: "Restores HP.",
        effects: [
            { type: 'hp_heal', formula: '10 + a.level * 2' }
        ]
    },
    fire: {
        id: 'fire',
        name: 'Fire',
        target: 'enemy-any',
        element: 'Red',
        description: "Deals fire damage.",
        effects: [
            { type: 'hp_damage', formula: '10 + a.level * 3' }
        ]
    },
    thunder: {
        id: 'thunder',
        name: 'Thunder',
        target: 'enemy-any',
        element: 'Black',
        description: "Deals lightning damage.",
        effects: [
            { type: 'hp_damage', formula: '12 + a.level * 2.5' }
        ]
    },
    blizzard: {
        id: 'blizzard',
        name: 'Blizzard',
        target: 'enemy-any',
        element: 'Blue',
        description: "Deals ice damage.",
        effects: [
            { type: 'hp_damage', formula: '10 + a.level * 3' }
        ]
    },
    blindna: {
        id: 'blindna',
        name: 'Blindna',
        target: 'ally-any',
        element: 'White',
        description: "Cures Blind status.",
        effects: [
            { type: 'remove_status', status: 'blind' }
        ]
    },
    bite: {
        id: 'bite',
        name: 'Bite',
        target: 'enemy-any',
        element: 'Physical',
        description: "Chomp.",
        effects: [
            { type: 'hp_damage', formula: 'a.atk * 1.2' }
        ]
    },
    fang: {
        id: 'fang',
        name: 'Fang',
        target: 'enemy-any',
        element: 'Physical',
        description: "Vicious bite.",
        effects: [
            { type: 'hp_damage', formula: 'a.atk * 1.5' }
        ]
    },
    "1000_needles": {
        id: '1000_needles',
        name: '1000 Needles',
        target: 'enemy-any',
        element: 'Physical',
        description: "Deals fixed 10 damage.",
        effects: [
            { type: 'hp_damage', formula: '10' }
        ]
    },
    peck: {
        id: 'peck',
        name: 'Peck',
        target: 'enemy-any',
        element: 'Physical',
        description: "Peck at eyes.",
        effects: [
            { type: 'hp_damage', formula: 'a.atk' },
            { type: 'add_status', status: 'blind', chance: 0.3 }
        ]
    },
    petrify_glance: {
        id: 'petrify_glance',
        name: 'Petrify Glance',
        target: 'enemy-any',
        element: 'Green',
        description: "Turn to stone (slowly).",
        effects: [
            { type: 'add_status', status: 'stone', chance: 0.3 } // stone needs implementation in states
        ]
    },
    fire_breath: {
        id: 'fire_breath',
        name: 'Fire Breath',
        target: 'enemy-all',
        element: 'Red',
        description: "Burns everyone.",
        effects: [
            { type: 'hp_damage', formula: '15 + a.level' }
        ]
    },
    kick: {
        id: 'kick',
        name: 'Kick',
        target: 'enemy-any',
        element: 'Physical',
        description: "Heavy kick.",
        effects: [
            { type: 'hp_damage', formula: 'a.atk * 1.8' }
        ]
    },
    // Legacy support
    windBlade: {
        id: 'windBlade',
        name: 'Wind Blade',
        target: 'enemy-any',
        element: 'Green',
        effects: [{ type: 'hp_damage', formula: '6' }]
    },
    soothingMote: {
        id: 'soothingMote',
        name: 'Soothing Mote',
        target: 'ally-any',
        element: 'White',
        effects: [{ type: 'hp_heal', formula: '5' }]
    },
    wait: {
        id: 'wait',
        name: 'Wait',
        target: 'self',
        element: 'White',
        effects: []
    }
};
