/**
 * @file data/skills.js
 */

export const skills = {
    fight: { id: 'fight', name: 'Attack', target: 'enemy-any', element: 'Neutral', description: "Basic attack.", effects: [{ type: 'hp_damage', formula: 'a.atk' }] },
    guard: { id: 'guard', name: 'Guard', target: 'self', element: 'Neutral', description: "Defend against attacks.", effects: [{ type: 'add_status', status: 'guard', duration: 1 }] },

    // Knight
    cover: { id: 'cover', name: 'Cover', target: 'ally-any', description: "Protect an ally.", effects: [{ type: 'add_status', status: 'cover', duration: 1 }] },

    // White Mage
    cure: { id: 'cure', name: 'Cure', target: 'ally-any', element: 'White', description: "Restore HP.", effects: [{ type: 'hp_heal', formula: '10 + a.level * 2' }] },
    holy: { id: 'holy', name: 'Holy', target: 'enemy-any', element: 'White', description: "Holy damage.", effects: [{ type: 'hp_damage', formula: '20 + a.level * 3' }] },

    // Black Mage
    fire: { id: 'fire', name: 'Fire', target: 'enemy-any', element: 'Red', description: "Fire damage.", effects: [{ type: 'hp_damage', formula: '10 + a.level * 2' }] },
    thunder: { id: 'thunder', name: 'Thunder', target: 'enemy-any', element: 'Red', description: "Lightning damage.", effects: [{ type: 'hp_damage', formula: '10 + a.level * 2' }] },

    // Monk
    kick: { id: 'kick', name: 'Kick', target: 'enemy-all', description: "Kick all enemies.", effects: [{ type: 'hp_damage', formula: 'a.atk * 0.8' }] },
    chakra: { id: 'chakra', name: 'Chakra', target: 'self', description: "Heal self.", effects: [{ type: 'hp_heal', formula: '20' }] },

    // Enemy
    goblinPunch: { id: 'goblinPunch', name: 'Goblin Punch', target: 'enemy-any', effects: [{ type: 'hp_damage', formula: 'a.atk * 1.5' }] },
    bite: { id: 'bite', name: 'Bite', target: 'enemy-any', effects: [{ type: 'hp_damage', formula: 'a.atk' }] },
    needleShot: { id: 'needleShot', name: 'Needle Shot', target: 'enemy-any', effects: [{ type: 'hp_damage', formula: 'a.atk' }] },
    tailScrew: { id: 'tailScrew', name: 'Tail Screw', target: 'enemy-any', effects: [{ type: 'hp_damage', formula: 'a.atk' }, { type: 'add_status', status: 'paralyze' }] },
    tentacle: { id: 'tentacle', name: 'Tentacle', target: 'enemy-any', effects: [{ type: 'hp_damage', formula: 'a.atk' }] },
    breathWing: { id: 'breathWing', name: 'Breath Wing', target: 'enemy-all', effects: [{ type: 'hp_damage', formula: 'a.maxHp * 0.25' }] },
    claw: { id: 'claw', name: 'Claw', target: 'enemy-any', effects: [{ type: 'hp_damage', formula: 'a.atk' }] }
};
