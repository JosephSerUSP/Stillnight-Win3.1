/**
 * Authored reward packages for sacrificing creatures.
 *
 * Economics live here; the engine resolves level scaling and item references.
 * `gold.perLevel` applies for every level above 1. Item grants may require a
 * minimum level, allowing evolved/high-level creatures to yield richer packs.
 */
export const sacrificeRewards = {
  default: {
    gold: { base: 6, perLevel: 2 },
    items: []
  },

  pixie: {
    gold: { base: 8, perLevel: 3 },
    items: [
      { itemId: 'sigil_ink', quantity: 1, minLevel: 4 }
    ]
  },

  highPixie: {
    gold: { base: 20, perLevel: 4 },
    items: [
      { itemId: 'sigil_ink', quantity: 2 }
    ]
  },

  skeleton: {
    gold: { base: 10, perLevel: 4 },
    items: [
      { itemId: 'bone_plate', quantity: 1, minLevel: 4 }
    ]
  },

  angel: {
    gold: { base: 14, perLevel: 4 },
    items: [
      { itemId: 'light_amulet', quantity: 1, minLevel: 5 }
    ]
  },

  demon: {
    gold: { base: 18, perLevel: 5 },
    items: [
      { itemId: 'silver_blade', quantity: 1, minLevel: 5 }
    ]
  },

  incubus: {
    gold: { base: 35, perLevel: 6 },
    items: [
      { itemId: 'silver_blade', quantity: 1 },
      { itemId: 'whispered_lessons', quantity: 1 }
    ]
  },

  nurse: {
    gold: { base: 12, perLevel: 3 },
    items: [
      { itemId: 'hp_tonic', quantity: 1, minLevel: 3 }
    ]
  },

  imp: {
    gold: { base: 7, perLevel: 3 },
    items: [
      { itemId: 'whispered_lessons', quantity: 1, minLevel: 4 }
    ]
  },

  golem: {
    gold: { base: 20, perLevel: 5 },
    items: [
      { itemId: 'bone_plate', quantity: 1, minLevel: 4 }
    ]
  },

  wisp: {
    gold: { base: 10, perLevel: 3 },
    items: [
      { itemId: 'sigil_ink', quantity: 1, minLevel: 4 }
    ]
  }
};
