
import { TRAIT_DEFINITIONS } from "../../data/traits.js";

/**
 * @class EffectManager
 * @description Manages the execution of effects derived from traits.
 */
export class EffectManager {

    /**
     * Executes effects associated with a trigger for a battler.
     * @param {string} trigger - The trigger key (e.g., 'turnStart').
     * @param {import("../objects/objects.js").Game_Battler} battler - The owner of the traits.
     * @param {Object} context - Context data (allies, enemies, etc).
     * @returns {Array} List of event objects.
     */
    static processTrigger(trigger, battler, context) {
        const events = [];
        const traits = battler.traits;
        const aggregated = {};

        // Aggregate values for traits that match the trigger
        traits.forEach(t => {
            const def = TRAIT_DEFINITIONS[t.code];
            if (def && def.trigger === trigger) {
                // Apply combine logic from TRAIT_DEFINITIONS if needed (default sum)
                // For now, these traits (HRG, etc.) are additive in value for the trigger execution.
                aggregated[t.code] = (aggregated[t.code] || 0) + t.value;
            }
        });

        // Execute handlers defined in TRAIT_DEFINITIONS
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
