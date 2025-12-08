import { randInt, shuffleArray } from "../src/core/utils.js";

/**
 * @file data/party.js
 * @description Defines logic for generating the starting party configuration.
 */

export const startingParty = {
  /**
   * Generates a random amount of starting gold.
   * @returns {number} The starting gold.
   */
  getGold: () => {
    return 0; // Soldiers don't need gold yet
  },

  /**
   * Generates a random starting inventory.
   * @param {Object[]} allItems - All available items from items.json.
   * @returns {Object[]} The starting inventory.
   */
  getInventory: (allItems) => {
    const inventory = [];
    const tonic = allItems.find(item => item.id === 'tonic');
    const pdown = allItems.find(item => item.id === 'phoenix_down');

    if (tonic) inventory.push(tonic, tonic, tonic);
    if (pdown) inventory.push(pdown);

    return inventory;
  },

  /**
   * Generates the starting party members.
   * @param {Object[]} allActors - All available actors from actors.json.
   * @returns {Object[]} The starting party members configuration.
   */
  getMembers: (allActors) => {
    // Return Terra, Vicks, Wedge
    return [
        { id: 'vicks_armor', level: 1 },
        { id: 'terra_armor', level: 3 },
        { id: 'wedge_armor', level: 1 }
    ];
  }
};
