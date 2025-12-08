import { randInt, shuffleArray } from "../src/core/utils.js";

export const startingParty = {
  getGold: () => 500,
  getInventory: (allItems) => {
    const inventory = [];
    const potion = allItems.find(i => i.id === 'potion');
    if (potion) inventory.push(potion, potion, potion);

    const jobs = ['job_knight', 'job_white', 'job_black', 'job_monk'];
    jobs.forEach(jid => {
        const item = allItems.find(i => i.id === jid);
        if (item) inventory.push(item);
    });

    const weapons = ['broadsword', 'rod'];
    weapons.forEach(wid => {
        const item = allItems.find(i => i.id === wid);
        if (item) inventory.push(item);
    });

    return inventory;
  },
  getMembers: (allActors) => {
    const heroes = ['bartz', 'lenna', 'galuf', 'faris'];
    return heroes.map(id => ({ id, level: 1 }));
  }
};
