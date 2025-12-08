export const skills = {
  // Magic
  "fire": {
    "name": "Fire",
    "cost": 4,
    "description": "Deals fire damage.",
    "icon": 1,
    "element": "Red",
    "effects": [
      { "type": "hp_damage", "formula": "20 + 2 * a.mat" }
    ]
  },
  "blizzard": {
    "name": "Blizzard",
    "cost": 5,
    "description": "Deals ice damage.",
    "icon": 2,
    "element": "Blue",
    "effects": [
      { "type": "hp_damage", "formula": "22 + 2 * a.mat" }
    ]
  },
  "thunder": {
    "name": "Thunder",
    "cost": 6,
    "description": "Deals lightning damage.",
    "icon": 3,
    "element": "Green",
    "effects": [
      { "type": "hp_damage", "formula": "24 + 2 * a.mat" }
    ]
  },
  "thunder2": {
    "name": "Bolt 2",
    "cost": 12,
    "description": "Deals heavy lightning damage.",
    "icon": 3,
    "element": "Green",
    "effects": [
      { "type": "hp_damage", "formula": "50 + 3 * a.mat" }
    ]
  },
  "cure": {
    "name": "Cure",
    "cost": 5,
    "description": "Restores HP.",
    "icon": 4,
    "element": "White",
    "effects": [
      { "type": "hp_heal", "formula": "30 + 3 * a.mat" }
    ]
  },
  "regen": {
    "name": "Regen",
    "cost": 10,
    "description": "Gradually restores HP.",
    "icon": 4,
    "element": "White",
    "effects": [
      { "type": "add_status", "status": "regen", "chance": 1 }
    ]
  },
  "bio": {
    "name": "Bio",
    "cost": 8,
    "description": "Deals poison damage.",
    "icon": 5,
    "element": "Black",
    "effects": [
      { "type": "hp_damage", "formula": "15 + 1.5 * a.mat" },
      { "type": "add_status", "status": "poison", "chance": 0.8 }
    ]
  },

  // Magitek
  "fire_beam": {
    "name": "Fire Beam",
    "cost": 0,
    "description": "Magitek fire beam.",
    "icon": 1,
    "element": "Red",
    "effects": [
      { "type": "hp_damage", "formula": "40 + 2 * a.mat" }
    ]
  },
  "ice_beam": {
    "name": "Ice Beam",
    "cost": 0,
    "description": "Magitek ice beam.",
    "icon": 2,
    "element": "Blue",
    "effects": [
      { "type": "hp_damage", "formula": "40 + 2 * a.mat" }
    ]
  },
  "missile": {
    "name": "Missile",
    "cost": 0,
    "description": "Magitek missile.",
    "icon": 6,
    "element": "Black",
    "effects": [
      { "type": "hp_damage", "formula": "30 + 1.5 * a.atk" }
    ]
  },

  // Character Skills
  "steal": {
    "name": "Steal",
    "cost": 0,
    "description": "Attempt to steal item.",
    "icon": 10,
    "effects": [
      { "type": "hp_damage", "formula": "5 + 1 * a.atk" }
      // Steal effect requires custom logic in engine, limiting to damage for now
    ]
  },
  "autocrossbow": {
    "name": "Auto Crossbow",
    "cost": 0,
    "description": "Attacks all enemies.",
    "icon": 11,
    "target": "all_enemies",
    "effects": [
      { "type": "hp_damage", "formula": "25 + 1.2 * a.atk" }
    ]
  },
  "pummel": {
    "name": "Pummel",
    "cost": 0,
    "description": "Heavy physical strike.",
    "icon": 12,
    "effects": [
      { "type": "hp_damage", "formula": "40 + 2 * a.atk" }
    ]
  },
  "hawk_eye": {
    "name": "Hawk Eye",
    "cost": 0,
    "description": "Guaranteed hit.",
    "icon": 13,
    "effects": [
      { "type": "hp_damage", "formula": "15 + 1 * a.atk" }
    ]
  },
  "slash": {
      "name": "Slash",
      "cost": 0,
      "description": "Basic attack.",
      "icon": 71,
      "effects": [{ "type": "hp_damage", "formula": "10 + 1 * a.atk" }]
  },

  // Enemy Skills
  "slime": {
      "name": "Slime",
      "cost": 0,
      "description": "Slows target.",
      "icon": 5,
      "effects": [
          { "type": "hp_damage", "formula": "10" },
          { "type": "add_status", "status": "slow", "chance": 1 }
      ]
  },
  "mega_volt": {
      "name": "Mega Volt",
      "cost": 0,
      "description": "Heavy electrical damage.",
      "icon": 3,
      "target": "all_allies",
      "element": "Green",
      "effects": [
          { "type": "hp_damage", "formula": "30 + 2 * a.mat" }
      ]
  },
  "gale_cut": {
      "name": "Gale Cut",
      "cost": 0,
      "description": "Wind slices through the party.",
      "target": "all_allies",
      "icon": 2,
      "element": "Green",
      "effects": [
          { "type": "hp_damage", "formula": "20 + 1 * a.mat" }
      ]
  },
  // Default skills referenced in tests
  "boneRush": { "name": "Bone Rush", "effects": [{ "type": "hp_damage", "formula": "a.atk * 1.5" }] },
  "windBlade": { "name": "Wind Blade", "element": "Green", "effects": [{ "type": "hp_damage", "formula": "a.mat * 1.2" }] },
  "soothingMote": { "name": "Soothing Mote", "element": "White", "effects": [{ "type": "hp_heal", "formula": "a.mat * 1.5" }] },
  "holySmite": { "name": "Holy Smite", "element": "White", "effects": [{ "type": "hp_damage", "formula": "a.mat * 2" }] },
  "shadowClaw": { "name": "Shadow Claw", "element": "Black", "effects": [{ "type": "hp_damage", "formula": "a.atk * 1.5" }] },
  "infernalPact": { "name": "Infernal Pact", "element": "Red", "effects": [{ "type": "hp_damage", "formula": "a.mat * 1.5" }] },
  "drainKiss": { "name": "Drain Kiss", "element": "Black", "effects": [{ "type": "hp_drain", "formula": "a.mat" }] },
  "needleShot": { "name": "Needle Shot", "effects": [{ "type": "hp_damage", "formula": "a.atk" }] },
  "fieldSurgery": { "name": "Field Surgery", "effects": [{ "type": "hp_heal", "formula": "a.mat" }] },
  "wait": { "name": "Wait", "effects": [] },
  "flameRebirth": { "name": "Flame Rebirth", "element": "Red", "effects": [{ "type": "hp_heal", "formula": "999" }] },
  "divineFavor": { "name": "Divine Favor", "element": "White", "effects": [{ "type": "hp_heal", "formula": "a.mat * 2" }] }
};
