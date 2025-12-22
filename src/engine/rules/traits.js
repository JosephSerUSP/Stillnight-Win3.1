import { TRAIT_DEFINITIONS } from "../../../data/traits.js";

/**
 * @class TraitRules
 * @description Pure functions for calculating parameters and processing trait triggers.
 * Unifies the logic for how traits modify battlers.
 */
export class TraitRules {

    /**
     * Calculates the final value of a parameter for a battler based on their traits.
     * Supports 'param' (base + plus * rate), 'xparam' (sum), and 'sparam' (product).
     *
     * @param {Object} battler - The object with a 'traits' property (getter).
     * @param {string} paramId - The parameter ID (e.g., 'atk', 'hit', 'tgr').
     * @param {number} baseValue - The base value from the battler (level-based or static).
     * @returns {number} The calculated value.
     */
    static getParam(battler, paramId, baseValue) {
        const traits = battler.traits;

        // Filter traits relevant to this parameter
        // We look for traits that target this specific dataId (e.g. PARAM_PLUS: 'atk')

        // 1. Additive Modifiers (PARAM_PLUS)
        const plus = traits
            .filter(t => t.code === 'PARAM_PLUS' && t.dataId === paramId)
            .reduce((sum, t) => sum + t.value, 0);

        // 2. Multiplicative Modifiers (PARAM_RATE)
        const rate = traits
            .filter(t => t.code === 'PARAM_RATE' && t.dataId === paramId)
            .reduce((prod, t) => prod * t.value, 1.0);

        return Math.floor((baseValue + plus) * rate);
    }

    /**
     * Calculates an Ex-Parameter (Additive Percentage).
     * Examples: HIT, EVA, CRI.
     * @param {Object} battler
     * @param {string} code - The trait code (e.g., 'HIT').
     * @returns {number} The sum of values (default 0).
     */
    static getXParam(battler, code) {
        return battler.traits
            .filter(t => t.code === code)
            .reduce((sum, t) => sum + t.value, 0);
    }

    /**
     * Calculates a Special Parameter (Multiplicative Rate).
     * Examples: TGR, GRD, FDR (Floor Damage Rate).
     * @param {Object} battler
     * @param {string} code - The trait code (e.g., 'TGR').
     * @returns {number} The product of values (default 1.0).
     */
    static getSParam(battler, code) {
        return battler.traits
            .filter(t => t.code === code)
            .reduce((prod, t) => prod * t.value, 1.0);
    }

    /**
     * Gets a list of unique dataIds for a specific trait code.
     * Useful for things like 'ELEMENT_ADD' or 'STATE_RESIST'.
     * @param {Object} battler
     * @param {string} code
     * @returns {Array} List of dataIds.
     */
    static getTraitSet(battler, code) {
        return battler.traits
            .filter(t => t.code === code)
            .map(t => t.dataId);
    }

    /**
     * Checks if a specific trait exists.
     * @param {Object} battler
     * @param {string} code
     * @param {string} [dataId] - Optional dataId to match.
     * @returns {boolean}
     */
    static hasTrait(battler, code, dataId) {
        return battler.traits.some(t => t.code === code && (!dataId || t.dataId === dataId));
    }

    /**
     * Executes effects associated with a trigger for a battler.
     * @param {string} trigger - The trigger key (e.g., 'turnStart').
     * @param {Object} battler - The owner of the traits.
     * @param {Object} context - Context data (allies, enemies, etc).
     * @returns {Array} List of event objects.
     */
    static processTrigger(trigger, battler, context) {
        const events = [];
        const traits = battler.traits;

        // We group by trait code to handle accumulation if necessary (though most triggers are per-trait or per-code)
        // For simple triggers defined in TRAIT_DEFINITIONS, we usually sum the values if multiple exist (e.g. HRG 5% + HRG 5% = 10%)

        const aggregated = {};

        traits.forEach(t => {
            const def = TRAIT_DEFINITIONS[t.code];
            if (def && def.trigger === trigger) {
                aggregated[t.code] = (aggregated[t.code] || 0) + t.value;
            }
        });

        // Execute handlers
        for (const [code, value] of Object.entries(aggregated)) {
            const def = TRAIT_DEFINITIONS[code];
            if (def && def.execute && value !== 0) {
                const result = def.execute(value, battler, context);
                if (result) events.push(result);
            }
        }

        return events;
    }
}
