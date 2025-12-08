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
    return 100; // Standard JRPG start
  },

  /**
   * Generates a random starting inventory.
   * @param {Object[]} allItems - All available items from items.json.
   * @returns {Object[]} The starting inventory.
   */
  getInventory: (allItems) => {
    const inventory = [];

    // Guaranteed starters
    const blueberries = allItems.find(item => item.id === 'blueberries');
    const blackberries = allItems.find(item => item.id === 'blackberries');

    if (blueberries) {
        inventory.push(blueberries, blueberries, blueberries);
    }
    if (blackberries) {
        inventory.push(blackberries);
    }

    return inventory;
  },

  /**
   * Generates the starting party members.
   * @param {Object[]} allActors - All available actors from actors.json.
   * @returns {Object[]} The starting party members configuration.
   */
  getMembers: (allActors) => {
    // Force Fayt
    const fayt = allActors.find(a => a.id === 'fayt');
    if (fayt) {
        return [{ id: 'fayt', level: 1 }];
    }
    // Fallback
    return [{ id: 'skeleton', level: 1 }];
  }
};
