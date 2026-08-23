/**
 * Authored direct Summoner spells.
 *
 * Creature skills remain in data/skills.js. Summoner spells are a separate
 * battle command vocabulary with an explicit MP cost and target scope.
 */
export const spells = {
  cure: {
    id: 'cure',
    name: 'Cure',
    target: 'ally-any',
    mpCost: 4,
    description: 'Restore HP to one active ally.',
    effects: [
      { type: 'hp_heal', formula: '8 + 1.5 * a.level' }
    ]
  },

  cureAll: {
    id: 'cureAll',
    name: 'Cure All',
    target: 'ally-all',
    mpCost: 10,
    description: 'Restore HP to all wounded active allies.',
    effects: [
      { type: 'hp_heal', formula: '5 + 1.0 * a.level' }
    ]
  },

  protect: {
    id: 'protect',
    name: 'Protect',
    target: 'ally-any',
    mpCost: 5,
    description: 'Raise one active ally\'s DEF for three turns.',
    effects: [
      { type: 'add_status', status: 'protect', chance: 1.0 }
    ]
  },

  wall: {
    id: 'wall',
    name: 'Wall',
    target: 'ally-all',
    mpCost: 9,
    description: 'Raise the party\'s MDF for three turns.',
    effects: [
      { type: 'add_status', status: 'wall', chance: 1.0 }
    ]
  }
};
