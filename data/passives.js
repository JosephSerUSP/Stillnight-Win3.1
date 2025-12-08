export const passives = {
    // Existing
    postBattleHeal: {
        id: 'postBattleHeal',
        name: 'Life Aid',
        description: 'Recovers HP after battle.',
        effect: 'Restores 1 HP.',
        icon: 1,
        traits: [{ code: 'POST_BATTLE_HEAL', value: 1 }]
    },
    initiative: {
        id: 'initiative',
        name: 'Alertness',
        description: 'Senses danger.',
        effect: 'Chance for First Strike.',
        icon: 1,
        traits: [{ code: 'INITIATIVE', value: 0.25 }]
    },

    // New Elemental Boosts (Simulated via MAT/ATK or specific logic if I add it)
    fireBoost: {
        id: 'fireBoost',
        name: 'Fire Boost',
        description: 'Strengthens Fire attacks.',
        effect: 'MAT +10%',
        icon: 1,
        traits: [{ code: 'PARAM_RATE', dataId: 'mat', value: 1.1 }]
    },
    iceBoost: {
        id: 'iceBoost',
        name: 'Ice Boost',
        description: 'Strengthens Ice attacks.',
        effect: 'MAT +10%',
        icon: 1,
        traits: [{ code: 'PARAM_RATE', dataId: 'mat', value: 1.1 }]
    },
    elecBoost: {
        id: 'elecBoost',
        name: 'Elec Boost',
        description: 'Strengthens Elec attacks.',
        effect: 'MAT +10%',
        icon: 1,
        traits: [{ code: 'PARAM_RATE', dataId: 'mat', value: 1.1 }]
    },
    forceBoost: {
        id: 'forceBoost',
        name: 'Force Boost',
        description: 'Strengthens Force attacks.',
        effect: 'MAT +10%',
        icon: 1,
        traits: [{ code: 'PARAM_RATE', dataId: 'mat', value: 1.1 }]
    },
    lightBoost: {
        id: 'lightBoost',
        name: 'Light Boost',
        description: 'Strengthens Light attacks.',
        effect: 'MAT +10%',
        icon: 1,
        traits: [{ code: 'PARAM_RATE', dataId: 'mat', value: 1.1 }]
    },
    darkBoost: {
        id: 'darkBoost',
        name: 'Dark Boost',
        description: 'Strengthens Dark attacks.',
        effect: 'MAT +10%',
        icon: 1,
        traits: [{ code: 'PARAM_RATE', dataId: 'mat', value: 1.1 }]
    },
    charmBoost: {
        id: 'charmBoost',
        name: 'Charm Boost',
        description: 'Increases success of Charm.',
        effect: 'LUK +20%',
        icon: 1,
        traits: [{ code: 'PARAM_RATE', dataId: 'luk', value: 1.2 }]
    },

    // Resistances (Phys Resist)
    physResist: {
        id: 'physResist',
        name: 'Resist Phys',
        description: 'Strong against physical attacks.',
        effect: 'Phys Dmg -20%',
        icon: 1,
        traits: [{ code: 'PDR', value: 0.8 }] // 80% taken
    }
};
