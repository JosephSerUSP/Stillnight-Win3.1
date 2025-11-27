export const passives = {
    // Example format:
    // passiveId: {
    //    id: 'passiveId',
    //    name: 'Passive Name',
    //    description: 'Description of the passive.',
    //    icon: 1, // Placeholder icon ID as requested
    //    effects: [] // Optional effects list, similar to skills
    // }

    // Existing passives extracted from actors.json/code
    postBattleHeal: {
        id: 'postBattleHeal',
        name: 'Trick Heal',
        description: 'Small heal to party on victory.',
        icon: 1,
        code: 'POST_BATTLE_HEAL' // For backward compatibility with existing logic
    },
    goldDigger: {
        id: 'goldDigger',
        name: 'Gold Digger',
        description: 'Increases gold found.',
        icon: 1,
        code: 'GOLD_DIGGER'
    },
    parasite: {
        id: 'parasite',
        name: 'Hunger',
        description: 'Drains HP of a nearby ally every turn.',
        icon: 1,
        code: 'PARASITE'
    },
    battleStartDamage: {
        id: 'battleStartDamage',
        name: 'Ambush',
        description: 'Deals damage to an enemy at start of battle.',
        icon: 1,
        code: 'BATTLE_START_DAMAGE'
    },
    moveHeal: {
        id: 'moveHeal',
        name: 'Regeneration',
        description: 'Heals HP when moving.',
        icon: 1,
        code: 'MOVE_HEAL'
    },
    recoveryXpBonus: {
        id: 'recoveryXpBonus',
        name: 'Scholar',
        description: 'Gains bonus XP at recovery sites.',
        icon: 1,
        code: 'RECOVERY_XP_BONUS'
    },
    fleeChanceBonus: {
        id: 'fleeChanceBonus',
        name: 'Coward',
        description: 'Increases chance to flee.',
        icon: 1,
        code: 'FLEE_CHANCE_BONUS'
    },
    dealDamageMod: {
        id: 'dealDamageMod',
        name: 'Strength',
        description: 'Increases damage dealt.',
        icon: 1,
        code: 'DEAL_DAMAGE_MOD'
    }
};
