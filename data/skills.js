/**
 * @file data/skills.js
 */

export const skills = {
    pyrokinesis: {
        id: "pyrokinesis",
        name: "Pyrokinesis",
        target: "enemy",
        element: "Fire",
        description: "Projects focused heat energy.",
        effects: [{ type: "damage", formula: "a.mat * 2" }]
    },
    healing: {
        id: "healing",
        name: "Healing",
        target: "ally",
        element: "Light",
        description: "Accelerates cellular regeneration.",
        effects: [{ type: "heal", formula: "a.mat * 2 + 20" }]
    },
    bite: {
        id: "bite",
        name: "Bite",
        target: "enemy",
        description: "A vicious bite.",
        effects: [{ type: "damage", formula: "a.atk" }]
    },
    peck: {
        id: "peck",
        name: "Peck",
        target: "enemy",
        description: "A sharp peck.",
        effects: [{ type: "damage", formula: "a.atk * 1.2" }]
    },
    tongue_lash: {
        id: "tongue_lash",
        name: "Tongue Lash",
        target: "enemy",
        description: "A long reaching strike.",
        effects: [{ type: "damage", formula: "a.atk" }, { type: "add_status", status: "stun", chance: 0.3 }]
    },
    combustion: {
        id: "combustion",
        name: "Combustion",
        target: "enemy",
        element: "Fire",
        description: "Explosive energy.",
        effects: [{ type: "damage", formula: "a.mat * 3" }]
    },
    levitate: {
        id: "levitate",
        name: "Levitate",
        target: "self",
        element: "Dark",
        description: "Defy gravity.",
        effects: [{ type: "add_status", status: "levitate", chance: 1.0 }]
    }
};
