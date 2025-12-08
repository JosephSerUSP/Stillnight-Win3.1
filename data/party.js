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

    // Give some tea and a weapon
    const tea = allItems.find(item => item.id === 'hp_tonic');
    if (tea) {
        inventory.push(tea);
        inventory.push(tea);
    }

    const cake = allItems.find(item => item.id === 'eat_me_cake');
    if (cake) inventory.push(cake);

    const potion = allItems.find(item => item.id === 'drink_me_potion');
    if (potion) inventory.push(potion);

    return inventory;
  },

  /**
   * Generates the starting party members.
   * @param {Object[]} allActors - All available actors from actors.json.
   * @returns {Object[]} The starting party members configuration.
   */
  getMembers: (allActors) => {
    // Alice is mandatory
    return [{ id: 'alice', level: 1 }];
  }
};
