/**
 * Pure Data Registry
 * Provides access to static game data (items, skills, enemies, etc.)
 * This separates the "engine" from the "loader".
 */
export const Registry = {
    skills: {},
    items: {},
    enemies: {},
    states: {},
    elements: {},

    // Allow injection of data
    set(type, data) {
        this[type] = data;
    },

    get(type, id) {
        return this[type] ? this[type][id] : null;
    },

    getSkill(id) { return this.skills[id]; },
    getItem(id) { return this.items[id] || (Array.isArray(this.items) ? this.items.find(i => i.id === id) : null); },
    getState(id) { return this.states[id]; }
};
