import { evaluateFormula, probabilisticRound } from "../core/utils.js";
import { ProgressionSystem } from "./progression.js";

/**
 * @class ActionEffectSystem
 * @description Registry-based system for handling action effects.
 * Allows for flexible, data-driven effects similar to RPG Maker MZ.
 */
export class ActionEffectSystem {
    static registry = {};

    /**
     * Registers a new effect handler.
     * @param {string} key - The effect code.
     * @param {Object} handler - The handler object { apply, preview }.
     */
    static register(key, handler) {
        this.registry[key] = handler;
    }

    /**
     * Applies an effect to a target.
     * @param {string} effectKey - The effect code.
     * @param {number|string|Object} effectValue - The value/formula/config.
     * @param {Object} source - The source (battler/item).
     * @param {Game_Battler} target - The target battler.
     * @param {Object} [context={}] - Additional context.
     * @returns {Object|null} Result object.
     */
    static apply(effectKey, effectValue, source, target, context = {}) {
        const handler = this.registry[effectKey];
        if (handler && handler.apply) {
            return handler.apply(effectValue, source, target, context);
        }
        console.warn(`Unknown effect key: ${effectKey}`);
        return null;
    }

    /**
     * Generates a preview string for an effect.
     * @param {string} effectKey - The effect code.
     * @param {number|string} effectValue - The value.
     * @param {Game_Battler} target - The target battler.
     * @param {Object} [source] - The source.
     * @returns {string|null} The preview string.
     */
    static getPreview(effectKey, effectValue, target, source) {
        const handler = this.registry[effectKey];
        if (handler && handler.preview) {
            return handler.preview(effectValue, target, source);
        }
        return `${effectKey}: ${effectValue}`;
    }

    /**
     * Helper to evaluate formulas.
     */
    static _evaluate(val, source, target) {
        if (typeof val === 'string') {
            return Math.round(evaluateFormula(val, source || {}, target));
        }
        return val;
    }
}

// Register default effects
ActionEffectSystem.register('hp', {
    apply: (value, source, target, context) => {
        let base = ActionEffectSystem._evaluate(value, source, target);
        if (context.boost) base *= context.boost;
        let val = probabilisticRound(base);
        if (val < 1) val = 1;

        const oldHp = target.hp;
        target.hp = Math.min(target.maxHp, target.hp + val);
        return { type: 'heal', value: target.hp - oldHp, target };
    },
    preview: (value, target, source) => {
        const val = ActionEffectSystem._evaluate(value, source, target);
        const newHp = Math.min(target.maxHp, target.hp + val);
        if (newHp !== target.hp) {
            return `HP: ${target.hp}/${target.maxHp} -> ${newHp}/${target.maxHp}`;
        }
        return null;
    }
});

// Alias hp_heal to hp
ActionEffectSystem.register('hp_heal', ActionEffectSystem.registry['hp']);

ActionEffectSystem.register('maxHp', {
    apply: (value, source, target) => {
        const val = ActionEffectSystem._evaluate(value, source, target);
        target.maxHp += val;
        target.hp += val;
        return { type: 'maxHp', value: val, target };
    },
    preview: (value, target, source) => {
        const val = ActionEffectSystem._evaluate(value, source, target);
        const newMax = target.maxHp + val;
        return `Max HP: ${target.maxHp} -> ${newMax}`;
    }
});

ActionEffectSystem.register('xp', {
    apply: (value, source, target) => {
        const val = ActionEffectSystem._evaluate(value, source, target);
        const result = ProgressionSystem.gainXp(target, val);
        return { type: 'xp', value: val, result, target };
    },
    preview: (value, target, source) => {
        const val = ActionEffectSystem._evaluate(value, source, target);
        return `XP: +${val}`;
    }
});

ActionEffectSystem.register('recruit_egg', {
    apply: (value, source, target) => {
        return { type: 'recruit_egg', value: value, target };
    },
    preview: () => "Hatches an egg"
});

ActionEffectSystem.register('hp_damage', {
    apply: (value, source, target, context) => {
        let base = ActionEffectSystem._evaluate(value, source, target);
        if (context.boost) base *= context.boost;
        let val = probabilisticRound(base);
        if (val < 1) val = 1;

        const oldHp = target.hp;
        target.hp = Math.max(0, target.hp - val);
        return { type: 'damage', value: oldHp - target.hp, target };
    },
    preview: (value, target, source) => {
        const val = ActionEffectSystem._evaluate(value, source, target);
        return `Damage: ${val}`;
    }
});

ActionEffectSystem.register('add_status', {
    apply: (value, source, target, context) => {
        const statusId = (typeof value === 'object') ? value.id : value;
        const chance = ((typeof value === 'object' ? value.chance : 1) || 1) * (context.boost || 1);

        if (Math.random() < chance) {
            target.addState(statusId);
            return { type: 'status', status: statusId, target };
        }
        return null;
    },
    preview: (value) => {
        const statusId = (typeof value === 'object') ? value.id : value;
        return `Add Status: ${statusId}`;
    }
});

ActionEffectSystem.register('hp_drain', {
    apply: (value, source, target, context) => {
        let base = ActionEffectSystem._evaluate(value, source, target);
        if (context.boost) base *= context.boost;
        let val = probabilisticRound(base);
        if (val < 1) val = 1;

        const hpBeforeTarget = target.hp;
        target.hp = Math.max(0, target.hp - val);
        const damageDealt = hpBeforeTarget - target.hp;

        const hpBeforeSource = source.hp;
        source.hp = Math.min(source.maxHp, source.hp + damageDealt);

        return {
            type: 'hp_drain',
            value: damageDealt,
            target,
            source,
            hpBeforeTarget,
            hpAfterTarget: target.hp,
            hpBeforeSource,
            hpAfterSource: source.hp
        };
    },
    preview: (value, target, source) => {
        const val = ActionEffectSystem._evaluate(value, source, target);
        return `Drains ${val} HP`;
    }
});
