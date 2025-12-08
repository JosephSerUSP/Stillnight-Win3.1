import { randInt, shuffleArray } from "../src/core/utils.js";

export const startingParty = {
  getGold: () => 500,
  getInventory: (allItems) => {
    const inventory = [];
    const potion = allItems.find(i => i.id === 'potion');
    const pd = allItems.find(i => i.id === 'phoenix_down');
    const quezacotl = allItems.find(i => i.id === 'gf_quezacotl');
    const shiva = allItems.find(i => i.id === 'gf_shiva');

    if (potion) for(let i=0; i<5; i++) inventory.push(potion);
    if (pd) for(let i=0; i<2; i++) inventory.push(pd);
    if (quezacotl) inventory.push(quezacotl);
    if (shiva) inventory.push(shiva);

    return inventory;
  },
  getMembers: (allActors) => {
    // We want Squall and Quistis specifically
    const squall = allActors.find(a => a.id === 'squall');
    const quistis = allActors.find(a => a.id === 'quistis');

    const members = [];
    if (squall) members.push({ id: squall.id, level: squall.level });
    if (quistis) members.push({ id: quistis.id, level: quistis.level });

    // Fallback if not found (e.g. during testing if actors aren't loaded properly)
    if (members.length === 0 && allActors.length > 0) {
        members.push({ id: allActors[0].id, level: 1 });
    }

    return members;
  }
};
