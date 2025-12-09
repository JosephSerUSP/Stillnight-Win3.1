
import { dataManager } from '../src/managers/data.js';

export const startingParty = {
    getMembers: function(actors) {
        // Find Tidus and Yuna by ID
        const tidus = actors.find(a => a.id === 'tidus');
        const yuna = actors.find(a => a.id === 'yuna');
        const auron = actors.find(a => a.id === 'auron');

        // Fallback if not found (though they should be there)
        const members = [tidus, yuna, auron].filter(m => m);

        return members;
    },
    getGold: function() {
        return 500;
    },
    getInventory: function(items) {
        const potion = items.find(i => i.id === 'potion');
        const phoenixDown = items.find(i => i.id === 'phoenix_down');

        const inventory = [];
        if (potion) {
             for(let k=0; k<5; k++) inventory.push(potion);
        }
        if (phoenixDown) {
             for(let k=0; k<2; k++) inventory.push(phoenixDown);
        }

        return inventory;
    }
};
