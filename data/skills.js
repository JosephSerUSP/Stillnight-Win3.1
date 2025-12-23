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

    // FF8 Inspired
    renzokuken: {
        id: 'renzokuken',
        name: 'Renzokuken',
        target: 'enemy-any',
        element: 'Red',
        description: "A flurry of gunblade strikes.",
        effects: [
            { type: 'hp_damage', formula: '12 + 1.5 * a.atk' }
        ]
    },
    fire: {
        id: 'fire',
        name: 'Fire',
        target: 'enemy-any',
        element: 'Red',
        description: "A ball of flame.",
        effects: [
            { type: 'hp_damage', formula: '10 + 1.2 * a.mat' }
        ]
    },
    mightyGuard: {
        id: 'mightyGuard',
        name: 'Mighty Guard',
        target: 'ally-all',
        element: 'Blue',
        description: "Raises defense for the party.",
        effects: [
            { type: 'add_status', status: 'protect', chance: 1.0, duration: 3 }
        ]
    },
    laserEye: {
        id: 'laserEye',
        name: 'Laser Eye',
        target: 'enemy-any',
        element: 'Blue',
        description: "Beams from the eyes.",
        effects: [
            { type: 'hp_damage', formula: '15 + 1.2 * a.mat' }
        ]
    },
    duel: {
        id: 'duel',
        name: 'Duel',
        target: 'enemy-any',
        element: 'Yellow',
        description: "A rapid combo of punches.",
        effects: [
            { type: 'hp_damage', formula: '10 + 2.0 * a.atk' }
        ]
    },
    thunder: {
        id: 'thunder',
        name: 'Thunder',
        target: 'enemy-any',
        element: 'Yellow',
        description: "Calls down lightning.",
        effects: [
            { type: 'hp_damage', formula: '12 + 1.2 * a.mat' }
        ]
    },
    angelWing: {
        id: 'angelWing',
        name: 'Angel Wing',
        target: 'self',
        element: 'White',
        description: "Enhances magical power.",
        effects: [
            { type: 'add_status', status: 'magic_boost', chance: 1.0, duration: 3 }
        ]
    },
    cure: {
        id: 'cure',
        name: 'Cure',
        target: 'ally-any',
        element: 'White',
        description: "Restores HP.",
        effects: [
            { type: 'hp_heal', formula: '20 + 1.5 * a.mat' }
        ]
    },
    shoot: {
        id: 'shoot',
        name: 'Shoot',
        target: 'enemy-any',
        element: 'Red',
        description: "Fires a weapon.",
        effects: [
            { type: 'hp_damage', formula: '8 + 1.0 * a.atk' }
        ]
    },
    bash: {
        id: 'bash',
        name: 'Bash',
        target: 'enemy-any',
        element: 'Red',
        description: "A heavy strike.",
        effects: [
            { type: 'hp_damage', formula: '10 + 1.0 * a.atk' }
        ]
    },
    laser: {
        id: 'laser',
        name: 'Laser',
        target: 'enemy-any',
        element: 'Red',
        description: "Piercing laser beam.",
        effects: [
            { type: 'hp_damage', formula: '15 + 1.0 * a.mat' }
        ]
    },
    bite: {
        id: 'bite',
        name: 'Bite',
        target: 'enemy-any',
        element: 'Red',
        description: "A vicious bite.",
        effects: [
            { type: 'hp_damage', formula: '8 + 1.0 * a.atk' }
        ]
    },
    sleepPowder: {
        id: 'sleepPowder',
        name: 'Sleep Powder',
        target: 'enemy-any',
        element: 'Green',
        description: "Puts target to sleep.",
        effects: [
            { type: 'add_status', status: 'sleep', chance: 0.6, duration: 3 }
        ]
    },
    hellfire: {
        id: 'hellfire',
        name: 'Hellfire',
        target: 'enemy-all',
        element: 'Red',
        description: "Engulfs the battlefield in flames.",
        effects: [
            { type: 'hp_damage', formula: '30 + 1.5 * a.mat' }
        ]
    },
    firaga: {
        id: 'firaga',
        name: 'Firaga',
        target: 'enemy-any',
        element: 'Red',
        description: "A massive explosion.",
        effects: [
            { type: 'hp_damage', formula: '25 + 1.8 * a.mat' }
        ]
    },
    rayBomb: {
        id: 'rayBomb',
        name: 'Ray Bomb',
        target: 'enemy-all',
        element: 'Red',
        description: "Explosive energy wave.",
        effects: [
            { type: 'hp_damage', formula: '40 + 1.5 * a.mat' }
        ]
    },
    crush: {
        id: 'crush',
        name: 'Crush',
        target: 'enemy-any',
        element: 'Red',
        description: "Crushes the target.",
        effects: [
            { type: 'hp_damage', formula: '30 + 1.5 * a.atk' }
        ]
    },
    astralPunch: {
        id: 'astralPunch',
        name: 'Astral Punch',
        target: 'enemy-any',
        element: 'Black',
        description: "Telekinetic strike.",
        effects: [
            { type: 'hp_damage', formula: '50 + 2.0 * a.mat' }
        ]
    },
    maelstrom: {
        id: 'maelstrom',
        name: 'Maelstrom',
        target: 'enemy-all',
        element: 'Black',
        description: "Distorts space and time.",
        effects: [
            { type: 'hp_damage', formula: '40 + 1.5 * a.mat', percent: true }
        ]
    },
    assassinate: {
        id: 'assassinate',
        name: 'Assassinate',
        target: 'enemy-any',
        element: 'Black',
        description: "Attempt to kill instantly.",
        effects: [
             { type: 'hp_damage', formula: '999', chance: 0.2 }
        ]
    }
};
