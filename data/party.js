export const startingParty = {
    getMembers: (actors) => [
        { id: "terra", level: 3 },
        { id: "biggs", level: 2 },
        { id: "wedge", level: 2 }
    ],
    getGold: () => 0,
    getInventory: (items) => {
        const inventory = [];
        const add = (id, count) => {
            const item = items.find(i => i.id === id);
            if (item) {
                for (let i = 0; i < count; i++) {
                     // Create a shallow copy so instances are unique in inventory (important for equipment)
                     // If items are immutable data, we might just push the ref, but Game_Party uses splice on inventory,
                     // so unique references for equipment logic is safer.
                     // However, items from dataManager are usually shared refs.
                     // If we equip it, it moves out of inventory.
                     // If we unequip, it moves back.
                     // The engine seems to rely on object identity for `indexOf`.
                     // So we should clone if we want multiple of the same item to be distinct entities in inventory?
                     // Or just push the same ref multiple times?
                     // Looking at `src/objects/party.js`, `createInitialMembers` calls `getInventory(items)`.
                     // The original `data/party.js` (implied) likely mapped IDs to objects.
                     // Let's use `Object.assign({}, item)` or similar to ensure they are distinct objects if they are equipment.
                     // For consumables, it might not matter, but for equipment it does.
                     inventory.push(Object.assign({}, item));
                }
            }
        };
        add("potion", 3);
        add("phoenix_down", 1);
        return inventory;
    }
};
