/**
 * Pure Data Registry
 * Provides access to static game data (items, skills, enemies, etc.)
 * This separates the "engine" from the "loader".
 */
export const Registry = {
    _data: {},

    // Allow injection of data
    set(type, data) {
        this._data[type] = data;
    },

    get(type) {
        return this._data[type];
    },

    // Helpers
    getSkill(id) {
        const skills = this._data.skills || {};
        return skills[id];
    },

    getItem(id) {
        const items = this._data.items;
        if (!items) return null;
        if (Array.isArray(items)) return items.find(i => i.id === id);
        return items[id];
    },

    getState(id) {
        const states = this._data.states || {};
        return states[id];
    }
};
