export const skills = {
    // Alice
    vorpal_strike: {
        id: 'vorpal_strike',
        name: 'Vorpal Strike',
        target: 'enemy-any',
        element: 'White',
        description: "One, two! One, two! And through and through!",
        effects: [
            { type: 'hp_damage', formula: '10 + 2.0 * a.atk' }
        ]
    },
    curiosity: {
        id: 'curiosity',
        name: 'Curious Touch',
        target: 'enemy-any',
        element: 'White',
        description: "Curiosity killed the cat.",
        effects: [
            { type: 'hp_damage', formula: '5 + 1.0 * a.mat' }
        ]
    },

    // White Rabbit
    pocket_watch_haste: {
        id: 'pocket_watch_haste',
        name: 'Late!',
        target: 'ally-any',
        element: 'White',
        description: "Grants Haste to an ally.",
        effects: [
            { type: 'add_status', status: 'haste', chance: 1.0, duration: 3 }
        ]
    },

    // Cheshire Cat
    vanish: {
        id: 'vanish',
        name: 'Vanish',
        target: 'self',
        element: 'Blue',
        description: "Fade away.",
        effects: [
            { type: 'add_status', status: 'evasion', chance: 1.0, duration: 3 } // Needs 'evasion' state if not exists, fallback to nothing
        ]
    },
    confuse_grin: {
        id: 'confuse_grin',
        name: 'Confusing Grin',
        target: 'enemy-any',
        element: 'Blue',
        description: "We're all mad here.",
        effects: [
             { type: 'add_status', status: 'confuse', chance: 0.8, duration: 3 }
        ]
    },

    // Mad Hatter
    tea_splash: {
        id: 'tea_splash',
        name: 'Hot Tea',
        target: 'enemy-any',
        element: 'Green',
        description: "Scalding hot tea!",
        effects: [
            { type: 'hp_damage', formula: '8 + 1.2 * a.mat' }
        ]
    },
    riddle: {
        id: 'riddle',
        name: 'Riddle',
        target: 'enemy-any',
        element: 'Green',
        description: "Stuns the enemy with a confusing riddle.",
        effects: [
            { type: 'add_status', status: 'sleep', chance: 0.6, duration: 2 }
        ]
    },

    // March Hare
    teacup_smash: {
        id: 'teacup_smash',
        name: 'Teacup Smash',
        target: 'enemy-any',
        element: 'Red',
        description: "Smashes crockery on the foe.",
        effects: [
            { type: 'hp_damage', formula: '12 + 1.5 * a.atk' }
        ]
    },

    // Dormouse
    sleep_powder: {
        id: 'sleep_powder',
        name: 'Sleepy Dust',
        target: 'enemy-any',
        element: 'Blue',
        description: "Puts the target to sleep.",
        effects: [
            { type: 'add_status', status: 'sleep', chance: 0.8, duration: 3 }
        ]
    },

    // Caterpillar
    smoke_ring: {
        id: 'smoke_ring',
        name: 'Smoke Ring',
        target: 'enemy-any',
        element: 'Green',
        description: "A ring of smoke that confuses.",
        effects: [
            { type: 'hp_damage', formula: '5 + 1.0 * a.mat' },
            { type: 'add_status', status: 'confuse', chance: 0.5, duration: 3 }
        ]
    },
    metamorphosis: {
        id: 'metamorphosis',
        name: 'Metamorphosis',
        target: 'self',
        element: 'Green',
        description: "Fully heals self.",
        effects: [
            { type: 'hp_heal', formula: '999' }
        ]
    },

    // Bread and Butterfly
    buttered_wing: {
        id: 'buttered_wing',
        name: 'Buttered Wing',
        target: 'enemy-any',
        element: 'Green',
        description: "Slippery attack.",
        effects: [
            { type: 'hp_damage', formula: '10 + 1.2 * a.atk' }
        ]
    },

    // Mouse
    bite: {
        id: 'bite',
        name: 'Bite',
        target: 'enemy-any',
        element: 'Green',
        description: "A small nip.",
        effects: [
            { type: 'hp_damage', formula: '4 + 1.0 * a.atk' }
        ]
    },

    // Dodo
    caucus_race: {
        id: 'caucus_race',
        name: 'Caucus Race',
        target: 'ally-any',
        element: 'Blue',
        description: "Everyone run in circles!",
        effects: [
            { type: 'add_status', status: 'haste', chance: 1.0, duration: 3 }
        ]
    },

    // Cards
    spear_thrust: {
        id: 'spear_thrust',
        name: 'Spear Thrust',
        target: 'enemy-any',
        element: 'Black',
        description: "A standard guard attack.",
        effects: [
            { type: 'hp_damage', formula: '8 + 1.0 * a.atk' }
        ]
    },
    club_smash: {
        id: 'club_smash',
        name: 'Club Smash',
        target: 'enemy-any',
        element: 'Green',
        description: "Heavy blow.",
        effects: [
            { type: 'hp_damage', formula: '10 + 1.2 * a.atk' }
        ]
    },
    glitter_cut: {
        id: 'glitter_cut',
        name: 'Glitter Cut',
        target: 'enemy-any',
        element: 'White',
        description: "Sharp and shiny.",
        effects: [
            { type: 'hp_damage', formula: '9 + 1.1 * a.atk' }
        ]
    },

    // Queen
    off_with_head: {
        id: 'off_with_head',
        name: 'Off With Their Head!',
        target: 'enemy-any',
        element: 'Red',
        description: "A lethal command.",
        effects: [
            { type: 'hp_damage', formula: '20 + 2.0 * a.atk' }
        ]
    },
    croquet_smash: {
        id: 'croquet_smash',
        name: 'Croquet Smash',
        target: 'enemy-any',
        element: 'Red',
        description: "Hit with a flamingo.",
        effects: [
            { type: 'hp_damage', formula: '15 + 1.5 * a.atk' }
        ]
    },

    // Jabberwocky
    flame_breath: {
        id: 'flame_breath',
        name: 'Flame Breath',
        target: 'enemy-all', // Assuming enemy-all is supported? Or separate actions.
        element: 'Red',
        description: "Eyes of flame!",
        effects: [
            { type: 'hp_damage', formula: '15 + 1.5 * a.mat' }
        ]
    },
    burble_smash: {
        id: 'burble_smash',
        name: 'Burble',
        target: 'enemy-any',
        element: 'Black',
        description: "Burbled as it came.",
        effects: [
            { type: 'hp_damage', formula: '12 + 1.2 * a.atk' },
            { type: 'add_status', status: 'poison', chance: 0.5, duration: 3 }
        ]
    },

    // Misc
    claw_rake: {
        id: 'claw_rake',
        name: 'Claw Rake',
        target: 'enemy-any',
        element: 'White',
        description: "Sharp claws.",
        effects: [
            { type: 'hp_damage', formula: '10 + 1.2 * a.atk' }
        ]
    },
    axe_chop: {
        id: 'axe_chop',
        name: 'Axe Chop',
        target: 'enemy-any',
        element: 'Black',
        description: "Chop!",
        effects: [
            { type: 'hp_damage', formula: '14 + 1.4 * a.atk' }
        ]
    }
};
