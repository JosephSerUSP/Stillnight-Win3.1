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
    const getItem = (id) => allItems.find(i => i.id === id);

    const potion = getItem('healing_potion');
    if (potion) {
        for(let i=0; i<3; i++) inventory.push(potion);
    }

    const scroll = getItem('town_portal_scroll');
    if (scroll) {
        inventory.push(scroll);
    }

    return inventory;
  },

  /**
   * Generates the starting party members.
   * @param {Object[]} allActors - All available actors from actors.json.
   * @returns {Object[]} The starting party members configuration.
   */
  getMembers: (allActors) => {
    const heroes = ['hero_warrior', 'hero_rogue', 'hero_sorcerer'];
    return heroes.map(id => {
        const actor = allActors.find(a => a.id === id);
        return { id: actor.id, level: actor.level };
    });
  }
};
