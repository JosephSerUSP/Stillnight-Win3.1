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
    return 100;
  },

  /**
   * Generates a random starting inventory.
   * @param {Object[]} allItems - All available items from items.json.
   * @returns {Object[]} The starting inventory.
   */
  getInventory: (allItems) => {
    const inventory = [];

    // 3 Potions
    const potion = allItems.find(item => item.id === 'potion');
    if (potion) {
        for (let i = 0; i < 3; i++) {
            inventory.push(potion);
        }
    }

    // 1 Phoenix Down
    const pd = allItems.find(item => item.id === 'phoenix_down');
    if (pd) inventory.push(pd);

    return inventory;
  },

  /**
   * Generates the starting party members.
   * @param {Object[]} allActors - All available actors from actors.json.
   * @returns {Object[]} The starting party members configuration.
   */
  getMembers: (allActors) => {
    const cloud = allActors.find(a => a.id === 'cloud');
    const barret = allActors.find(a => a.id === 'barret');

    const party = [];
    if (cloud) party.push({ id: 'cloud', level: cloud.level });
    if (barret) party.push({ id: 'barret', level: barret.level });

    return party;
  }
};
