/**
 * @file data/skills.js
 * @description Defines the skills available in the game.
 * Skills are used by battlers in combat to deal damage, heal, or apply status effects.
 */

/**
 * @typedef {Object} SkillEffect
 * @property {string} type - The type of effect (e.g., 'hp_damage', 'hp_heal', 'add_status').
 * @property {string} [formula] - The formula for calculating the effect value (e.g., '5 + 1.2 * a.level').
 * @property {string} [status] - The status ID to apply (if type is 'add_status').
 * @property {number} [chance] - The chance to apply the effect (0-1).
 * @property {number} [duration] - The duration of the effect in turns.
 */

/**
 * @typedef {Object} Skill
 * @property {string} id - The unique ID of the skill.
 * @property {string} name - The display name of the skill.
 * @property {string} target - The target scope (e.g., 'enemy-any', 'ally-any', 'self').
 * @property {string} element - The elemental affinity of the skill.
 * @property {string} description - The flavor text description.
 * @property {SkillEffect[]} effects - The list of effects produced by the skill.
 */

/**
 * @type {Object.<string, Skill>}
 */
export const skills = {
    // Pixie
    windBlade: {
        id: 'windBlade',
        name: 'Wind Blade',
        target: 'enemy-any',
        element: 'Green',
        description: "Strikes a foe with a blade of wind.",
        effects: [
            { type: 'hp_damage', formula: '6 + 1.2 * a.level' }
        ]
    },
    soothingMote: {
        id: 'soothingMote',
        name: 'Soothing Mote',
        target: 'ally-any',
        element: 'White',
        description: "Heals a small amount of HP for an ally.",
        effects: [
            { type: 'hp_heal', formula: '5 + 1.5 * a.level' }
        ]
    },

    // Skeleton
    boneRush: {
        id: 'boneRush',
        name: 'Bone Rush',
        target: 'enemy-any',
        element: 'Black',
        description: "A reckless charge.",
        effects: [
            { type: 'hp_damage', formula: '7 + 1.2 * a.level' }
        ]
    },

    // Angel
    holySmite: {
        id: 'holySmite',
        name: 'Holy Smite',
        target: 'enemy-any',
        element: 'White',
        description: "Smite evil with holy light.",
        effects: [
            { type: 'hp_damage', formula: '6 + 1.4 * a.level' }
        ]
    },
    divineFavor: {
        id: 'divineFavor',
        name: 'Divine Favor',
        target: 'ally-any',
        element: 'White',
        description: "Grants regeneration to an ally.",
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
        description: "Tears at the enemy from the shadows.",
        effects: [
            { type: 'hp_damage', formula: '8 + 1.3 * a.level' }
        ]
    },
    infernalPact: {
        id: 'infernalPact',
        name: 'Infernal Pact',
        target: 'self',
        element: 'Red',
        description: "Sacrifice safety for power. (Grants Berserk)",
        effects: [
            { type: 'add_status', status: 'berserk', chance: 1.0, duration: 3 }
        ]
    },

    // Creature identity pass
    graniteCrash: {
        id: 'graniteCrash', name: 'Granite Crash', target: 'enemy-any', element: null,
        description: "A crushing blow from a body too heavy to hurry.",
        speed: -2, effects: [{ type: 'hp_damage', formula: '10 + 1.4 * a.level' }]
    },
    graveHunger: {
        id: 'graveHunger', name: 'Grave Hunger', target: 'enemy-any', element: 'Black',
        description: "The dead borrow warmth they cannot keep.",
        effects: [{ type: 'hp_drain', formula: '5 + 0.8 * a.level' }]
    },
    causticMire: {
        id: 'causticMire', name: 'Caustic Mire', target: 'enemy-any', element: 'Green',
        description: "Clinging slime burns long after the first touch.",
        effects: [
            { type: 'hp_damage', formula: '4 + 0.8 * a.level' },
            { type: 'add_status', status: 'poison', chance: 0.7, duration: 4 }
        ]
    },
    blueFlare: {
        id: 'blueFlare', name: 'Blue Flare', target: 'enemy-any', element: 'Blue',
        description: "A cold flame fed by memory rather than air.",
        effects: [{ type: 'hp_damage', formula: '7 + 1.3 * a.level' }]
    },
    guidingFlame: {
        id: 'guidingFlame', name: 'Guiding Flame', target: 'enemy-any', element: 'Red',
        description: "A small flame points toward the safest path through a foe.",
        effects: [{ type: 'hp_damage', formula: '5 + 1.0 * a.level' }]
    },
    beaconPulse: {
        id: 'beaconPulse', name: 'Beacon Pulse', target: 'ally-any', element: 'White',
        description: "The lantern steadies an ally with a rhythm of warm light.",
        effects: [{ type: 'add_status', status: 'regen', chance: 1.0, duration: 4 }]
    },
    assassinate: {
        id: 'assassinate', name: 'Assassinate', target: 'enemy-any', element: 'Black',
        description: "A patient strike aimed where life is least defended.",
        speed: 3, effects: [{ type: 'hp_damage', formula: '12 + 1.5 * a.level' }]
    },
    stillnightEdict: {
        id: 'stillnightEdict', name: 'Stillnight Edict', target: 'enemy-any', element: 'Black',
        description: "The Warden commands one living thing to become quiet.",
        effects: [
            { type: 'hp_damage', formula: '9 + 1.2 * a.level' },
            { type: 'add_status', status: 'sleep', chance: 0.45, duration: 2 }
        ]
    },

    wait: {
        id: 'wait',
        name: 'Wait',
        target: 'self',
        element: 'White',
        description: "Do nothing.",
        effects: []
    },

    flameRebirth: {
        id: 'flameRebirth',
        name: 'Flame Rebirth',
        target: 'self',
        element: 'Red',
        description: "Rise from the ashes.",
        effects: []
    },

    // Nurse
    needleShot: {
        id: 'needleShot',
        name: 'Needle Shot',
        target: 'enemy-any',
        element: 'Black',
        description: "A precise strike that injects toxins.",
        effects: [
            { type: 'hp_damage', formula: '5 + 1.2 * a.level' },
            { type: 'add_status', status: 'poison', chance: 0.4, duration: 3 }
        ]
    },
    fieldSurgery: {
        id: 'fieldSurgery',
        name: 'Field Surgery',
        target: 'ally-any',
        element: 'Black',
        description: "Emergency medical attention. It might hurt.",
        effects: [
            { type: 'hp_heal', formula: '10 + 2.0 * a.level' }
        ]
    },

    // Incubus
    drainKiss: {
        id: 'drainKiss',
        name: 'Drain Kiss',
        target: 'enemy-any',
        element: 'Black',
        description: "Steals vitality and puts the target to sleep.",
        effects: [
            { type: 'hp_drain', formula: '4 + 0.6 * a.level' },
            { type: 'add_status', status: 'sleep', chance: 0.5, duration: 3 }
        ]
    }
};

// Appended Attack Skill
skills.attack = {
    id: 'attack',
    name: 'Attack',
    target: 'enemy',
    element: null,
    description: "A basic physical attack.",
    spCost: 0,
    mpCost: 0,
    speed: 0,
    effects: [
        {
            type: 'hp_damage',
            formula: 'a.atk'
        }
    ]
};
