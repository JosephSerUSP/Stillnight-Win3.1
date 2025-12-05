/**
 * @class AttributeSystem
 * @description Manages attributes (stats) for an entity.
 * Supports base values, flat modifiers, and rate modifiers.
 */
export class AttributeSystem {
    constructor() {
        this.baseValues = {};
        this.modifiers = []; // { key, type, value, source }
    }

    /**
     * Sets the base value for an attribute.
     * @param {string} key - Attribute key (e.g., 'atk').
     * @param {number} value - Base value.
     */
    setBase(key, value) {
        this.baseValues[key] = value;
    }

    /**
     * Gets the base value for an attribute.
     * @param {string} key
     * @returns {number}
     */
    getBase(key) {
        return this.baseValues[key] || 0;
    }

    /**
     * Adds a modifier to an attribute.
     * @param {string} key - Attribute key.
     * @param {string} type - 'flat' (add) or 'rate' (multiply).
     * @param {number} value - Value to add or multiply factor.
     * @param {Object} [source] - Source of the modifier.
     */
    addModifier(key, type, value, source = null) {
        this.modifiers.push({ key, type, value, source });
    }

    /**
     * Clears all modifiers.
     */
    clearModifiers() {
        this.modifiers = [];
    }

    /**
     * Calculates the final value of an attribute.
     * Formula: (Base + Sum(Flat)) * Product(Rate)
     * @param {string} key
     * @returns {number}
     */
    get(key) {
        const base = this.getBase(key);

        const flats = this.modifiers
            .filter(m => m.key === key && m.type === 'flat')
            .reduce((sum, m) => sum + m.value, 0);

        const rates = this.modifiers
            .filter(m => m.key === key && m.type === 'rate')
            .reduce((prod, m) => prod * m.value, 1.0);

        return Math.floor((base + flats) * rates);
    }
}
