/**
 * @file data/passives.js
 * @description Defines the passive abilities available in the game.
 * Passives provide static bonuses or triggered effects via Traits.
 */

/**
 * @typedef {Object} Passive
 * @property {string} id - Key used for lookup/referencing.
 * @property {string} name - Display name.
 * @property {string} description - Flavor text (Line 1 of tooltip).
 * @property {string} effect - Functional description (Line 2 of tooltip).
 * @property {number} icon - Icon ID (from spritesheet).
 * @property {Array<Object>} traits - List of traits applied by this passive.
 */

export const passives = {
    postBattleHeal: {
        id: 'postBattleHeal',
        name: 'Trick Heal',
        description: 'A playful mending art.',
        effect: 'Restores 1 HP to party on victory.',
        icon: 1,
        traits: [{ code: 'POST_BATTLE_HEAL', value: 1 }]
    },
    goldDigger: {
        id: 'goldDigger',
        name: 'Gold Digger',
        description: 'Greed is good.',
        effect: 'Increases gold found by 5.',
        icon: 1,
        traits: [{ code: 'GOLD_DIGGER', value: 5 }]
    },
    parasite: {
        id: 'parasite',
        name: 'Hunger',
        description: 'An insatiable void.',
        effect: 'Drains 2 HP from a nearby ally every turn.',
        icon: 1,
        traits: [{ code: 'PARASITE', value: 2 }]
    },
    battleStartDamage: {
        id: 'battleStartDamage',
        name: 'Ambush',
        description: 'Strike from the shadows.',
        effect: 'Deals damage to an enemy at start of battle.',
        icon: 1,
        traits: [{ code: 'BATTLE_START_DAMAGE', value: 2 }]
    },
    moveHeal: {
        id: 'moveHeal',
        name: 'Regeneration',
        description: 'Life finds a way.',
        effect: 'Restores HP when moving.',
        icon: 1,
        traits: [{ code: 'MOVE_HEAL', value: 1 }]
    },
    recoveryXpBonus: {
        id: 'recoveryXpBonus',
        name: 'Scholar',
        description: 'Knowledge is power.',
        effect: 'Gains bonus XP at recovery sites.',
        icon: 1,
        traits: [{ code: 'RECOVERY_XP_BONUS', value: 5 }]
    },
    fleeChanceBonus: {
        id: 'fleeChanceBonus',
        name: 'Coward',
        description: 'He who fights and runs away...',
        effect: 'Increases chance to flee.',
        icon: 1,
        traits: [{ code: 'FLEE_CHANCE_BONUS', value: 0.1 }]
    },
    dealDamageMod: {
        id: 'dealDamageMod',
        name: 'Strength',
        description: 'Raw power.',
        effect: 'Increases damage dealt.',
        icon: 1,
        traits: [{ code: 'PARAM_PLUS', dataId: 'atk', value: 1 }]
    }
};
