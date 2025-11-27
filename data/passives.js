export const passives = {
    // Standardized Passive Data
    // id: Key used for lookup/referencing
    // name: Display name
    // description: Flavor text (Line 1 of tooltip)
    // effect: Functional description (Line 2 of tooltip)
    // icon: Icon ID (from spritesheet)
    // code: Logic code used in engine (backward compat for logic, but forward for data)
    // value: Numerical value used by logic

    postBattleHeal: {
        id: 'postBattleHeal',
        name: 'Trick Heal',
        description: 'A playful mending art.',
        effect: 'Restores 1 HP to party on victory.',
        icon: 1,
        code: 'POST_BATTLE_HEAL',
        value: 1
    },
    goldDigger: {
        id: 'goldDigger',
        name: 'Gold Digger',
        description: 'Greed is good.',
        effect: 'Increases gold found by 5.',
        icon: 1,
        code: 'GOLD_DIGGER',
        value: 5
    },
    parasite: {
        id: 'parasite',
        name: 'Hunger',
        description: 'An insatiable void.',
        effect: 'Drains 2 HP from a nearby ally every turn.',
        icon: 1,
        code: 'PARASITE',
        value: 2
    },
    battleStartDamage: {
        id: 'battleStartDamage',
        name: 'Ambush',
        description: 'Strike from the shadows.',
        effect: 'Deals damage to an enemy at start of battle.',
        icon: 1,
        code: 'BATTLE_START_DAMAGE',
        value: 2
    },
    moveHeal: {
        id: 'moveHeal',
        name: 'Regeneration',
        description: 'Life finds a way.',
        effect: 'Restores HP when moving.',
        icon: 1,
        code: 'MOVE_HEAL',
        value: 1
    },
    recoveryXpBonus: {
        id: 'recoveryXpBonus',
        name: 'Scholar',
        description: 'Knowledge is power.',
        effect: 'Gains bonus XP at recovery sites.',
        icon: 1,
        code: 'RECOVERY_XP_BONUS',
        value: 5
    },
    fleeChanceBonus: {
        id: 'fleeChanceBonus',
        name: 'Coward',
        description: 'He who fights and runs away...',
        effect: 'Increases chance to flee.',
        icon: 1,
        code: 'FLEE_CHANCE_BONUS',
        value: 0.1
    },
    dealDamageMod: {
        id: 'dealDamageMod',
        name: 'Strength',
        description: 'Raw power.',
        effect: 'Increases damage dealt.',
        icon: 1,
        code: 'DEAL_DAMAGE_MOD',
        value: 1
    }
};
