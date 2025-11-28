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
    // Basic
    attack: {
        id: 'attack',
        name: 'Attack',
        target: 'enemy-any',
        element: 'Physical',
        description: "A basic attack.",
        effects: [
            { type: 'hp_damage', formula: 'a.atk' }
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

    // Campaign Skills
    ashBreath: {
        id: 'ashBreath',
        name: 'Ash Breath',
        target: 'enemy-all',
        element: 'Red',
        description: "Exhales choking hot ash.",
        effects: [
            { type: 'hp_damage', formula: '4 + 1.2 * a.level' },
            { type: 'add_status', status: 'blind', chance: 0.4 }
        ]
    },
    sonicShriek: {
        id: 'sonicShriek',
        name: 'Sonic Shriek',
        target: 'enemy-all',
        element: 'Green',
        description: "A deafening roar that stuns.",
        effects: [
            { type: 'hp_damage', formula: '2 + 1.0 * a.level' },
            { type: 'add_status', status: 'stun', chance: 0.3 }
        ]
    },
    gildedSlam: {
        id: 'gildedSlam',
        name: 'Gilded Slam',
        target: 'enemy-any',
        element: 'Physical',
        description: "A heavy, crushing blow.",
        effects: [
            { type: 'hp_damage', formula: '10 + 2.0 * a.level' }
        ]
    },
    wailOfSorrow: {
        id: 'wailOfSorrow',
        name: 'Wail of Sorrow',
        target: 'enemy-all',
        element: 'Blue',
        description: "Drains the will to fight.",
        effects: [
            { type: 'hp_damage', formula: '5 + 1.1 * a.level' },
            { type: 'add_status', status: 'blind', chance: 0.5 }
        ]
    },
    temporalShift: {
        id: 'temporalShift',
        name: 'Temporal Shift',
        target: 'self',
        element: 'Blue',
        description: "Phases out of sync with time.",
        effects: [
            { type: 'add_status', status: 'regen', chance: 1.0, duration: 2 }
        ]
    },
    gearGrind: {
        id: 'gearGrind',
        name: 'Gear Grind',
        target: 'enemy-any',
        element: 'Physical',
        description: "Grinds flesh like machinery.",
        effects: [
            { type: 'hp_damage', formula: '8 + 1.5 * a.level' }
        ]
    },
    timeStop: {
        id: 'timeStop',
        name: 'Time Stop',
        target: 'enemy-all',
        element: 'Black',
        description: "Freezes time for all opponents.",
        effects: [
            { type: 'hp_damage', formula: '5 + 1.0 * a.level' },
            { type: 'add_status', status: 'stun', chance: 0.8 }
        ]
    },
    doom: {
        id: 'doom',
        name: 'Doom',
        target: 'enemy-any',
        element: 'Black',
        description: "Inflicts a curse of decay.",
        effects: [
             { type: 'add_status', status: 'doom', chance: 1.0 }
        ]
    },
    chronalTrigger: {
        id: 'chronalTrigger',
        name: 'Chronal Trigger',
        target: 'self',
        element: 'White',
        description: "Accelerates personal time. Grants Berserk and Regen.",
        effects: [
             { type: 'add_status', status: 'berserk', chance: 1.0 },
             { type: 'add_status', status: 'regen', chance: 1.0 }
        ]
    },
    holySmite: {
        id: 'holySmite',
        name: 'Holy Smite',
        target: 'enemy-any',
        element: 'White',
        description: "Smite evil with holy light.",
        effects: [
            { type: 'hp_damage', formula: '5 + 1.4 * a.level' }
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
    shadowClaw: {
        id: 'shadowClaw',
        name: 'Shadow Claw',
        target: 'enemy-any',
        element: 'Black',
        description: "Tears at the enemy from the shadows.",
        effects: [
            { type: 'hp_damage', formula: '6 + 1.3 * a.level' }
        ]
    },
    windBlade: {
        id: 'windBlade',
        name: 'Wind Blade',
        target: 'enemy-any',
        element: 'Green',
        description: "Strikes a foe with a blade of wind.",
        effects: [
            { type: 'hp_damage', formula: '5 + 1.2 * a.level' }
        ]
    },
    soothingMote: {
        id: 'soothingMote',
        name: 'Soothing Mote',
        target: 'ally-any',
        element: 'White',
        description: "Heals a small amount of HP for an ally.",
        effects: [
            { type: 'hp_heal', formula: '4 + 1.5 * a.level' }
        ]
    },
    boneRush: {
        id: 'boneRush',
        name: 'Bone Rush',
        target: 'enemy-any',
        element: 'Black',
        description: "A reckless charge.",
        effects: [
            { type: 'hp_damage', formula: '6 + 1.1 * a.level' }
        ]
    },
    infernalPact: {
        id: 'infernalPact',
        name: 'Infernal Pact',
        target: 'self',
        element: 'Red',
        description: "Sacrifice safety for power.",
        effects: [
            { type: 'add_status', status: 'berserk', chance: 1.0, duration: 3 }
        ]
    },
    sleepMist: {
        id: 'sleepMist',
        name: 'Sleep Mist',
        target: 'enemy-all',
        element: 'Blue',
        description: "A mist that lulls enemies to sleep.",
        effects: [
            { type: 'hp_damage', formula: '3 + 1.6 * a.level' },
            { type: 'add_status', status: 'sleep', chance: 0.3 }
        ]
    },
    flameRebirth: {
        id: 'flameRebirth',
        name: 'Flame Rebirth',
        target: 'self',
        element: 'Red',
        description: "Rise from the ashes.",
        effects: []
    }
};
