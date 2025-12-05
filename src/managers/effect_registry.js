/**
 * @class EffectRegistry
 * @description A centralized registry for game effects.
 * Allows registering and executing effects dynamically.
 */
export class EffectRegistry {
    constructor() {
        this.effects = {};
    }

    /**
     * Registers a new effect.
     * @param {string} key - The effect code (e.g., 'hp_damage').
     * @param {Function} handler - Function(value, source, target, context) => ResultObject.
     * @param {Function} [previewHandler] - Function(value, source, target) => string|null.
     */
    register(key, handler, previewHandler = null) {
        this.effects[key] = { handler, previewHandler };
    }

    /**
     * Executes an effect.
     * @param {string} key - The effect code.
     * @param {any} value - The effect configuration/value.
     * @param {Object} source - The source of the effect.
     * @param {Object} target - The target of the effect.
     * @param {Object} [context] - Additional context.
     * @returns {Object|null} The result of the effect.
     */
    execute(key, value, source, target, context = {}) {
        const entry = this.effects[key];
        if (!entry) {
            console.warn(`Effect '${key}' not registered.`);
            return null;
        }
        return entry.handler(value, source, target, context);
    }

    /**
     * Gets the preview string for an effect.
     * @param {string} key
     * @param {any} value
     * @param {Object} source
     * @param {Object} target
     * @returns {string|null}
     */
    getPreview(key, value, source, target) {
        const entry = this.effects[key];
        if (!entry || !entry.previewHandler) {
            return `${key}: ${value}`;
        }
        return entry.previewHandler(value, source, target);
    }
}

// Singleton instance
export const GlobalEffectRegistry = new EffectRegistry();
