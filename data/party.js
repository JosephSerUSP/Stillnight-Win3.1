
export const startingParty = {
  getGold: () => 100,
  getInventory: (allItems) => {
      const inventory = [];
      const potion = allItems.find(i => i.id === 'potion');
      if (potion) { inventory.push(potion); inventory.push(potion); inventory.push(potion); }
      const phoenix = allItems.find(i => i.id === 'phoenix_down');
      if (phoenix) inventory.push(phoenix);
      return inventory;
  },
  getMembers: (allActors) => {
      return [
          { id: 'vaan', level: 1 },
          { id: 'penelo', level: 1 }
      ];
  }
};
