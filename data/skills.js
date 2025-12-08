/**
 * @file data/skills.js
 * @description Defines the skills available in the game.
 */

export const skills = {
    // Basic
    attack: { id: 'attack', name: 'Attack', target: 'enemy-one', element: 'Physical', description: "Physical attack.", effects: [{ type: 'hp_damage', formula: 'a.atk * 2 - b.def' }] },

    // Black Magic
    fire: { id: 'fire', name: 'Fire', target: 'enemy-one', element: 'Fire', description: "Deals Fire damage.", effects: [{ type: 'hp_damage', formula: '10 + a.mat * 1.5' }] },
    blizzard: { id: 'blizzard', name: 'Blizzard', target: 'enemy-one', element: 'Ice', description: "Deals Ice damage.", effects: [{ type: 'hp_damage', formula: '10 + a.mat * 1.5' }] },
    thunder: { id: 'thunder', name: 'Thunder', target: 'enemy-one', element: 'Thunder', description: "Deals Thunder damage.", effects: [{ type: 'hp_damage', formula: '10 + a.mat * 1.5' }] },
    water: { id: 'water', name: 'Water', target: 'enemy-one', element: 'Water', description: "Deals Water damage.", effects: [{ type: 'hp_damage', formula: '10 + a.mat * 1.5' }] },
    fira: { id: 'fira', name: 'Fira', target: 'enemy-one', element: 'Fire', description: "Deals moderate Fire damage.", effects: [{ type: 'hp_damage', formula: '30 + a.mat * 2.2' }] },
    firaga: { id: 'firaga', name: 'Firaga', target: 'enemy-one', element: 'Fire', description: "Deals heavy Fire damage.", effects: [{ type: 'hp_damage', formula: '80 + a.mat * 3.5' }] },
    flare: { id: 'flare', name: 'Flare', target: 'enemy-one', element: 'Physical', description: "Deals massive non-elemental magic damage.", effects: [{ type: 'hp_damage', formula: '150 + a.mat * 5' }] },
    ultima: { id: 'ultima', name: 'Ultima', target: 'enemy-all', element: 'Physical', description: "The ultimate magic. Damages all enemies.", effects: [{ type: 'hp_damage', formula: '200 + a.mat * 6' }] },

    // White Magic
    cure: { id: 'cure', name: 'Cure', target: 'ally-one', element: 'Holy', description: "Restores HP.", effects: [{ type: 'hp_heal', formula: '20 + a.mat * 1.5' }] },
    cura: { id: 'cura', name: 'Cura', target: 'ally-one', element: 'Holy', description: "Restores moderate HP.", effects: [{ type: 'hp_heal', formula: '60 + a.mat * 3' }] },
    curaga: { id: 'curaga', name: 'Curaga', target: 'ally-one', element: 'Holy', description: "Restores heavy HP.", effects: [{ type: 'hp_heal', formula: '150 + a.mat * 6' }] },
    esuna: { id: 'esuna', name: 'Esuna', target: 'ally-one', element: 'Holy', description: "Removes status ailments.", effects: [{ type: 'remove_status', status: 'all' }] },
    haste: { id: 'haste', name: 'Haste', target: 'ally-one', element: 'Time', description: "Increases speed.", effects: [{ type: 'add_status', status: 'haste', chance: 1.0, duration: 3 }] },
    slow: { id: 'slow', name: 'Slow', target: 'enemy-one', element: 'Time', description: "Decreases speed.", effects: [{ type: 'add_status', status: 'slow', chance: 1.0, duration: 3 }] },
    holy: { id: 'holy', name: 'Holy', target: 'enemy-one', element: 'Holy', description: "Deals Holy damage.", effects: [{ type: 'hp_damage', formula: '120 + a.mat * 4' }] },

    // Skills
    darkAttack: { id: 'darkAttack', name: 'Dark Attack', target: 'enemy-one', element: 'Physical', description: "Blinds the enemy.", effects: [{ type: 'hp_damage', formula: 'a.atk * 1.5 - b.def' }, { type: 'add_status', status: 'darkness', chance: 1.0, duration: 3 }] },
    silenceAttack: { id: 'silenceAttack', name: 'Silence Attack', target: 'enemy-one', element: 'Physical', description: "Silences the enemy.", effects: [{ type: 'hp_damage', formula: 'a.atk * 1.5 - b.def' }, { type: 'add_status', status: 'silence', chance: 1.0, duration: 3 }] },
    sleepAttack: { id: 'sleepAttack', name: 'Sleep Attack', target: 'enemy-one', element: 'Physical', description: "Puts the enemy to sleep.", effects: [{ type: 'hp_damage', formula: 'a.atk * 1.5 - b.def' }, { type: 'add_status', status: 'sleep', chance: 1.0, duration: 3 }] },
    armorBreak: { id: 'armorBreak', name: 'Armor Break', target: 'enemy-one', element: 'Physical', description: "Lowers enemy Defense.", effects: [{ type: 'hp_damage', formula: 'a.atk * 2 - b.def' }, { type: 'add_status', status: 'armorBreak', chance: 1.0, duration: 3 }] },
    mentalBreak: { id: 'mentalBreak', name: 'Mental Break', target: 'enemy-one', element: 'Physical', description: "Lowers enemy Magic Defense.", effects: [{ type: 'hp_damage', formula: 'a.atk * 2 - b.def' }, { type: 'add_status', status: 'mentalBreak', chance: 1.0, duration: 3 }] },
    mug: { id: 'mug', name: 'Mug', target: 'enemy-one', element: 'Physical', description: "Attacks and steals an item.", effects: [{ type: 'hp_damage', formula: 'a.atk * 1.5 - b.def' }, { type: 'steal', chance: 1.0 }] },
    quickHit: { id: 'quickHit', name: 'Quick Hit', target: 'enemy-one', element: 'Physical', description: "Attack with reduced delay.", effects: [{ type: 'hp_damage', formula: 'a.atk * 1.8 - b.def' }, { type: 'ctb_delay', value: 0.5 }] },
    delayAttack: { id: 'delayAttack', name: 'Delay Attack', target: 'enemy-one', element: 'Physical', description: "Delays the enemy's turn.", effects: [{ type: 'hp_damage', formula: 'a.atk * 1.8 - b.def' }, { type: 'delay_target', value: 10 }] },
    spiralCut: { id: 'spiralCut', name: 'Spiral Cut', target: 'enemy-one', element: 'Physical', description: "Tidus Overdrive. Heavy damage.", effects: [{ type: 'hp_damage', formula: 'a.atk * 4' }] },
    grandSummon: { id: 'grandSummon', name: 'Grand Summon', target: 'self', element: 'Summon', description: "Summons an Aeon with full Overdrive.", effects: [{ type: 'grand_summon' }] },
    energyRay: { id: 'energyRay', name: 'Energy Ray', target: 'enemy-all', element: 'Holy', description: "Valefor Overdrive. Massive beam attack.", effects: [{ type: 'hp_damage', formula: 'a.mat * 5' }] },
    hellfire: { id: 'hellfire', name: 'Hellfire', target: 'enemy-all', element: 'Fire', description: "Ifrit Overdrive. Incinerates all enemies.", effects: [{ type: 'hp_damage', formula: 'a.atk * 5' }] },
    diamondDust: { id: 'diamondDust', name: 'Diamond Dust', target: 'enemy-all', element: 'Ice', description: "Shiva Overdrive. Freezes all enemies.", effects: [{ type: 'hp_damage', formula: 'a.mat * 5' }] },
    breath: { id: 'breath', name: 'Breath', target: 'ally-all', element: 'Physical', description: "Area breath attack.", effects: [{ type: 'hp_damage', formula: 'a.atk * 1.5' }] },
    photonSpray: { id: 'photonSpray', name: 'Photon Spray', target: 'ally-any', element: 'Physical', description: "Rapid fire attack.", effects: [{ type: 'hp_damage', formula: 'a.atk * 0.8' }] },
    selfDestruct: { id: 'selfDestruct', name: 'Self-Destruct', target: 'ally-one', element: 'Fire', description: "Sacrifice self to deal massive damage.", effects: [{ type: 'hp_damage', formula: 'a.hp' }, { type: 'suicide' }] },

    // Legacy / Tests Compatibility
    windBlade: { id: 'windBlade', name: 'Wind Blade', target: 'enemy-any', element: 'Green', description: "Strikes a foe with a blade of wind.", effects: [{ type: 'hp_damage', formula: '6 + 1.2 * a.level' }] },
    soothingMote: { id: 'soothingMote', name: 'Soothing Mote', target: 'ally-any', element: 'White', description: "Heals a small amount of HP for an ally.", effects: [{ type: 'hp_heal', formula: '5 + 1.5 * a.level' }] },
    boneRush: { id: 'boneRush', name: 'Bone Rush', target: 'enemy-any', element: 'Black', description: "A reckless charge.", effects: [{ type: 'hp_damage', formula: '7 + 1.2 * a.level' }] },
    holySmite: { id: 'holySmite', name: 'Holy Smite', target: 'enemy-any', element: 'White', description: "Smite evil with holy light.", effects: [{ type: 'hp_damage', formula: '6 + 1.4 * a.level' }] },
    divineFavor: { id: 'divineFavor', name: 'Divine Favor', target: 'ally-any', element: 'White', description: "Grants regeneration to an ally.", effects: [{ type: 'add_status', status: 'regen', chance: 1.0, duration: 3 }] },
    shadowClaw: { id: 'shadowClaw', name: 'Shadow Claw', target: 'enemy-any', element: 'Black', description: "Tears at the enemy from the shadows.", effects: [{ type: 'hp_damage', formula: '8 + 1.3 * a.level' }] },
    infernalPact: { id: 'infernalPact', name: 'Infernal Pact', target: 'self', element: 'Red', description: "Sacrifice safety for power.", effects: [{ type: 'add_status', status: 'berserk', chance: 1.0, duration: 3 }] },
    wait: { id: 'wait', name: 'Wait', target: 'self', element: 'White', description: "Do nothing.", effects: [] },
    flameRebirth: { id: 'flameRebirth', name: 'Flame Rebirth', target: 'self', element: 'Red', description: "Rise from the ashes.", effects: [] },
    needleShot: { id: 'needleShot', name: 'Needle Shot', target: 'enemy-any', element: 'Black', description: "A precise strike that injects toxins.", effects: [{ type: 'hp_damage', formula: '5 + 1.2 * a.level' }, { type: 'add_status', status: 'poison', chance: 0.4, duration: 3 }] },
    fieldSurgery: { id: 'fieldSurgery', name: 'Field Surgery', target: 'ally-any', element: 'Black', description: "Emergency medical attention.", effects: [{ type: 'hp_heal', formula: '10 + 2.0 * a.level' }] },
    drainKiss: { id: 'drainKiss', name: 'Drain Kiss', target: 'enemy-any', element: 'Black', description: "Steals vitality.", effects: [{ type: 'hp_drain', formula: '4 + 0.6 * a.level' }, { type: 'add_status', status: 'sleep', chance: 0.5, duration: 3 }] }
};
