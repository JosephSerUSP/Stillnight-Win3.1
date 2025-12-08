
export const licenses = {
    // Weapons
    dagger_license: {
        id: 'dagger_license',
        name: 'Small Swords',
        cost: 15,
        description: 'Allows equipping Daggers.',
        effect: { type: 'equip_type', value: 'Dagger' } // Simplified: In reality we'd check item tags.
        // For this iteration, I'll just make licenses give bonuses or skills.
        // Let's change this: Licenses give skills.
    },

    // Skill Licenses
    white_magick_1: {
        id: 'white_magick_1',
        name: 'White Magick 1',
        cost: 20,
        description: 'Teaches Cure.',
        effect: { type: 'learn_skill', value: 'cure' },
        prerequisites: []
    },
    white_magick_2: {
        id: 'white_magick_2',
        name: 'White Magick 2',
        cost: 30,
        description: 'Teaches Blindna.',
        effect: { type: 'learn_skill', value: 'blindna' },
        prerequisites: ['white_magick_1']
    },
    black_magick_1: {
        id: 'black_magick_1',
        name: 'Black Magick 1',
        cost: 20,
        description: 'Teaches Fire.',
        effect: { type: 'learn_skill', value: 'fire' },
        prerequisites: []
    },
    black_magick_2: {
        id: 'black_magick_2',
        name: 'Black Magick 2',
        cost: 30,
        description: 'Teaches Thunder.',
        effect: { type: 'learn_skill', value: 'thunder' },
        prerequisites: ['black_magick_1']
    },
    technick_1: {
        id: 'technick_1',
        name: 'Technicks 1',
        cost: 25,
        description: 'Teaches Steal.',
        effect: { type: 'learn_skill', value: 'steal' },
        prerequisites: []
    },
    technick_2: {
        id: 'technick_2',
        name: 'Technicks 2',
        cost: 30,
        description: 'Teaches First Aid.',
        effect: { type: 'learn_skill', value: 'firstAid' },
        prerequisites: ['technick_1']
    },

    // Stat Augments
    hp_aug_1: {
        id: 'hp_aug_1',
        name: 'Health +50',
        cost: 30,
        description: 'Increases Max HP by 50.',
        effect: { type: 'stat', stat: 'maxHp', value: 50 },
        prerequisites: []
    },
    atk_aug_1: {
        id: 'atk_aug_1',
        name: 'Battle Lore',
        cost: 30,
        description: 'Increases Attack by 2.',
        effect: { type: 'stat', stat: 'atk', value: 2 },
        prerequisites: []
    },

    // Gambits
    gambit_slot_1: {
        id: 'gambit_slot_1',
        name: 'Gambit Slot',
        cost: 50,
        description: 'Unlocks a Gambit slot.',
        effect: { type: 'gambit_slot', value: 1 },
        prerequisites: []
    }
};
