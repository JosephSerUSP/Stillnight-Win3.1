import { evaluateFormula, probabilisticRound } from "../core/utils.js";
import { SoundManager } from "./index.js";

/**
 * @class EffectRegistry
 * @description Registry for handling battle and item effects.
 * Adheres to Open/Closed Principle.
 */
export class EffectRegistry {
    static _handlers = new Map();

    /**
     * Registers a handler for a specific effect type.
     * @param {string} type - The effect type key.
     * @param {Function} handler - Function(effect, sourceContext, target, context) -> Array<Event>
     */
    static register(type, handler) {
        this._handlers.set(type, handler);
    }

    /**
     * Processes an effect and returns resulting events.
     * @param {Object} effect - The effect definition.
     * @param {Object} sourceContext - The source context { battler, ... }.
     * @param {import("../objects/objects.js").Game_Battler} target - The target battler.
     * @param {Object} [context={}] - Additional context (e.g., boost).
     * @returns {Array} List of events.
     */
    static process(effect, sourceContext, target, context = {}) {
        const handler = this._handlers.get(effect.type);
        if (handler) {
            return handler(effect, sourceContext, target, context);
        }
        return [];
    }
}

// --- Standard Effects ---

EffectRegistry.register('hp_damage', (effect, sourceContext, target, context) => {
    const { battler } = sourceContext;
    const boost = context.boost || 1;

    let skillDmg = probabilisticRound(evaluateFormula(effect.formula, battler, target) * boost);
    if (skillDmg < 1) skillDmg = 1;

    const hpBefore = target.hp;
    target.hp = Math.max(0, target.hp - skillDmg);

    SoundManager.play('DAMAGE');

    return [{
        type: 'damage',
        battler: battler,
        target: target,
        value: skillDmg,
        hpBefore: hpBefore,
        hpAfter: target.hp,
        msg: `  ${target.name} takes ${skillDmg} damage.`
    }];
});

EffectRegistry.register('hp_heal', (effect, sourceContext, target, context) => {
    const { battler } = sourceContext;
    const boost = context.boost || 1;

    let heal = probabilisticRound(evaluateFormula(effect.formula, battler, target) * boost);
    if (heal < 1) heal = 1;

    const hpBefore = target.hp;
    target.hp = Math.min(target.maxHp, target.hp + heal);

    SoundManager.play('HEAL');

    return [{
        type: 'heal',
        battler: battler,
        target: target,
        value: heal,
        hpBefore: hpBefore,
        hpAfter: target.hp,
        msg: `  ${target.name} heals ${heal} HP.`,
        animation: 'healing_sparkle'
    }];
});

EffectRegistry.register('add_status', (effect, sourceContext, target, context) => {
    const boost = context.boost || 1;
    const chance = (effect.chance || 1) * boost;

    if (Math.random() < chance) {
        target.addState(effect.status);
        return [{
            type: 'status',
            target: target,
            status: effect.status,
            msg: `  ${target.name} is afflicted with ${effect.status}.`
        }];
    }
    return [];
});

EffectRegistry.register('hp_drain', (effect, sourceContext, target, context) => {
    const { battler } = sourceContext;
    const boost = context.boost || 1;

    let damage = probabilisticRound(evaluateFormula(effect.formula, battler, target) * boost);
    if (damage < 1) damage = 1;

    const hpBeforeTarget = target.hp;
    target.hp = Math.max(0, target.hp - damage);
    const damageDealt = hpBeforeTarget - target.hp;

    const hpBeforeSource = battler.hp;
    battler.hp = Math.min(battler.maxHp, battler.hp + damageDealt);

    SoundManager.play('DAMAGE');

    return [{
        type: 'hp_drain',
        battler: battler,
        source: battler,
        target: target,
        value: damageDealt,
        hpBeforeTarget: hpBeforeTarget,
        hpAfterTarget: target.hp,
        hpBeforeSource: hpBeforeSource,
        hpAfterSource: battler.hp,
        msg: `  ${battler.name} drains ${damageDealt} HP from ${target.name}.`
    }];
});
