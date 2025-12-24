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
    },

    // New Skills for Expansion
    // Naga
    hydroPump: {
        id: 'hydroPump',
        name: 'Hydro Pump',
        target: 'enemy-any',
        element: 'Blue',
        description: "Blasts the target with high-pressure water.",
        effects: [
            { type: 'hp_damage', formula: '10 + 1.5 * a.level' }
        ]
    },
    poisonBite: {
        id: 'poisonBite',
        name: 'Poison Bite',
        target: 'enemy-any',
        element: 'Green',
        description: "A venomous bite.",
        effects: [
            { type: 'hp_damage', formula: '8 + 1.2 * a.level' },
            { type: 'add_status', status: 'poison', chance: 0.6, duration: 3 }
        ]
    },

    // Aquan
    healingRain: {
        id: 'healingRain',
        name: 'Healing Rain',
        target: 'ally-all',
        element: 'Blue',
        description: "Restores HP to all allies.",
        effects: [
            { type: 'hp_heal', formula: '5 + 1.0 * a.level' }
        ]
    },

    // Salamander
    flameBreath: {
        id: 'flameBreath',
        name: 'Flame Breath',
        target: 'enemy-all',
        element: 'Red',
        description: "Exhales scorching fire on all enemies.",
        effects: [
            { type: 'hp_damage', formula: '8 + 1.1 * a.level' }
        ]
    },
    heatWave: {
        id: 'heatWave',
        name: 'Heat Wave',
        target: 'enemy-all',
        element: 'Red',
        description: "A wave of intense heat.",
        effects: [
            { type: 'hp_damage', formula: '5 + 1.0 * a.level' }
        ]
    },

    // Efreet
    fireball: {
        id: 'fireball',
        name: 'Fireball',
        target: 'enemy-any',
        element: 'Red',
        description: "Hurls a massive ball of fire.",
        effects: [
            { type: 'hp_damage', formula: '15 + 1.8 * a.level' }
        ]
    },
    inferno: {
        id: 'inferno',
        name: 'Inferno',
        target: 'enemy-all',
        element: 'Red',
        description: "Engulfs the battlefield in flames.",
        effects: [
            { type: 'hp_damage', formula: '12 + 1.5 * a.level' }
        ]
    },

    // Void Wisp
    voidRay: {
        id: 'voidRay',
        name: 'Void Ray',
        target: 'enemy-any',
        element: 'Black',
        description: "A beam of pure darkness.",
        effects: [
            { type: 'hp_damage', formula: '10 + 1.6 * a.level' }
        ]
    },
    silence: {
        id: 'silence',
        name: 'Silence',
        target: 'enemy-any',
        element: 'White',
        description: "Prevents the target from using magic.",
        effects: [
            { type: 'add_status', status: 'silence', chance: 0.8, duration: 3 }
        ]
    },

    // Lich
    deathTouch: {
        id: 'deathTouch',
        name: 'Death Touch',
        target: 'enemy-any',
        element: 'Black',
        description: "Drains life force.",
        effects: [
            { type: 'hp_drain', formula: '10 + 1.0 * a.level' }
        ]
    },
    raiseDead: {
        id: 'raiseDead',
        name: 'Raise Dead',
        target: 'self',
        element: 'Black',
        description: "Summons a skeleton (Flavor only for now).",
        effects: [] // Not implemented fully, mostly for flavor/text
    },

    // Bosses
    tailSwipe: {
        id: 'tailSwipe',
        name: 'Tail Swipe',
        target: 'enemy-all',
        element: 'White',
        description: "A sweeping physical attack.",
        effects: [
            { type: 'hp_damage', formula: '15 + 1.5 * a.level' }
        ]
    },
    roar: {
        id: 'roar',
        name: 'Roar',
        target: 'enemy-all',
        element: 'White',
        description: "Terrifies enemies, lowering their defense.",
        effects: [
            { type: 'add_status', status: 'weak', chance: 0.7, duration: 3 }
        ]
    },
    voidCollapse: {
        id: 'voidCollapse',
        name: 'Void Collapse',
        target: 'enemy-any',
        element: 'Black',
        description: "Crushes the target with gravity.",
        effects: [
            { type: 'hp_damage', formula: '50 + 2.0 * a.level' }
        ]
    },
    eraseExistence: {
        id: 'eraseExistence',
        name: 'Erase Existence',
        target: 'enemy-any',
        element: 'Black',
        description: "Attempts to instantly kill the target.",
        effects: [
             { type: 'hp_damage', formula: '999', chance: 0.1 },
             { type: 'hp_damage', formula: '20 + 2.0 * a.level' }
        ]
    },
    summonVoid: {
        id: 'summonVoid',
        name: 'Summon Void',
        target: 'self',
        element: 'Black',
        description: "Calls forth void creatures.",
        effects: []
    },
    assassinate: {
        id: 'assassinate',
        name: 'Assassinate',
        target: 'enemy-any',
        element: 'Black',
        description: "A lethal strike from the shadows.",
        effects: [
            { type: 'hp_damage', formula: '25 + 2.5 * a.level' }
        ]
    }
};
