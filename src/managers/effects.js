
/**
 * @class EffectManager
 * @description Manages the execution of effects derived from traits.
 */
export class EffectManager {

    static get handlers() {
        return {
            'HRG': { trigger: 'turnStart', fn: this.handleHrg },
            'PARASITE': { trigger: 'turnStart', fn: this.handleParasite },
            'SYMBIOSIS': { trigger: 'turnStart', fn: this.handleSymbiosis },
        };
    }

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
            const handlerDef = this.handlers[t.code];
            if (handlerDef && handlerDef.trigger === trigger) {
                aggregated[t.code] = (aggregated[t.code] || 0) + t.value;
            }
        });

        // Execute handlers
        for (const [code, value] of Object.entries(aggregated)) {
            const handlerDef = this.handlers[code];
            if (handlerDef && value !== 0) {
                const result = handlerDef.fn.call(this, value, battler, context);
                if (result) events.push(result);
            }
        }

        return events;
    }

    /**
     * Handles Health Regeneration (HRG) trait.
     * @param {number} value - The regeneration rate (e.g., 0.05 for 5%).
     * @param {import("../objects/objects.js").Game_Battler} battler - The battler.
     * @param {Object} context - The context.
     * @returns {Object|null} The event object or null.
     */
    static handleHrg(value, battler, context) {
        const amount = Math.floor(battler.maxHp * value);
        if (amount <= 0) return null;

        const hpBefore = battler.hp;
        battler.hp = Math.min(battler.maxHp, battler.hp + amount);

        return {
            type: 'heal',
            battler: battler,
            target: battler,
            value: amount,
            hpBefore: hpBefore,
            hpAfter: battler.hp,
            msg: `${battler.name} regenerates ${amount} HP.`,
            animation: 'healing_sparkle'
        };
    }

    /**
     * Handles Parasite trait (draining HP from allies).
     * @param {number} value - The amount to drain.
     * @param {import("../objects/objects.js").Game_Battler} battler - The battler.
     * @param {Object} context - The context containing allies.
     * @returns {Object|null} The event object or null.
     */
    static handleParasite(value, battler, context) {
        const { allies } = context;
        if (!allies || value <= 0) return null;

        const myIndex = allies.indexOf(battler);
        if (myIndex === -1) return null;

        // Drain from neighbor (Front <-> Front, Back <-> Back in same column)
        const targetIndex = myIndex % 2 === 0 ? myIndex + 1 : myIndex - 1;

        if (targetIndex < 0 || targetIndex >= allies.length) return null;

        const target = allies[targetIndex];
        if (!target || target.hp <= 0) return null;

        const parasiteDrain = value;

        const hpBeforeTarget = target.hp;
        const hpBeforeSource = battler.hp;

        target.hp = Math.max(0, target.hp - parasiteDrain);
        battler.hp = Math.min(battler.maxHp, battler.hp + parasiteDrain);

        return {
            type: 'passive_drain',
            source: battler,
            target: target,
            value: parasiteDrain,
            hpBeforeTarget: hpBeforeTarget,
            hpAfterTarget: target.hp,
            hpBeforeSource: hpBeforeSource,
            hpAfterSource: battler.hp,
            msg: `[Passive] ${battler.name} drains ${parasiteDrain} HP from ${target.name}.`
        };
    }

    /**
     * Handles Symbiosis trait (Healing neighbors).
     * @param {number} value - The amount to heal.
     * @param {import("../objects/objects.js").Game_Battler} battler - The battler.
     * @param {Object} context - The context containing allies.
     * @returns {Object|null} The event object or null.
     */
    static handleSymbiosis(value, battler, context) {
        const { allies } = context;
        if (!allies || value <= 0) return null;

        const myIndex = allies.indexOf(battler);
        if (myIndex === -1) return null;

        // Heal neighbor (Front <-> Front, Back <-> Back in same column)
        const targetIndex = myIndex % 2 === 0 ? myIndex + 1 : myIndex - 1;

        if (targetIndex < 0 || targetIndex >= allies.length) return null;

        const target = allies[targetIndex];
        if (!target || target.hp <= 0) return null;

        const healAmount = value;

        const hpBeforeTarget = target.hp;
        target.hp = Math.min(target.maxHp, target.hp + healAmount);

        if (target.hp === hpBeforeTarget) return null; // No effective heal

        return {
            type: 'heal',
            battler: battler,
            target: target,
            value: healAmount,
            hpBefore: hpBeforeTarget,
            hpAfter: target.hp,
            msg: `[Passive] ${battler.name} heals ${target.name} for ${healAmount} HP via Symbiosis.`,
            animation: 'healing_sparkle'
        };
    }
}
