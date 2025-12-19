// src/engine/rules/effects.js
import { evaluateFormula, probabilisticRound, random } from "../../core/utils.js";

/**
 * Registry and executor for immediate action effects.
 * Pure logic version of EffectManager.
 */
export class EffectSystem {
    static handlers = {};
    static previewHandlers = {};

    /**
     * Registers an effect handler.
     * @param {string} key - The effect key (e.g., 'damage').
     * @param {Function} applyFn - Function(value, source, target, context) => result.
     * @param {Function} [previewFn] - Function(value, target, source) => string.
     */
    static register(key, applyFn, previewFn) {
        this.handlers[key] = applyFn;
        if (previewFn) {
            this.previewHandlers[key] = previewFn;
        }
    }

    /**
     * Applies an effect.
     * @param {string} key
     * @param {*} value
     * @param {*} source
     * @param {*} target
     * @param {*} context
     */
    static apply(key, value, source, target, context = {}) {
        const handler = this.handlers[key];
        if (!handler) {
            console.warn(`Unknown effect key: ${key}`);
            return null;
        }
        return handler(value, source, target, context);
    }

    /**
     * Gets a preview string.
     * @param {string} key
     * @param {*} value
     * @param {*} target
     * @param {*} source
     */
    static getPreview(key, value, target, source) {
        const handler = this.previewHandlers[key];
        if (handler) {
            return handler(value, target, source);
        }
        const evaluated = this._evaluate(value, target, source);
        return `${key}: ${evaluated}`;
    }

    static _evaluate(val, target, source) {
        if (typeof val === 'string') {
            return Math.round(evaluateFormula(val, source || {}, target));
        }
        return val;
    }
}

// ----------------------------------------------------------------------
// Effect Logic Implementation (Pure)
// ----------------------------------------------------------------------

EffectSystem.register('hp_heal',
    (val, source, target, context) => {
        let base = EffectSystem._evaluate(val, target, source);
        if (context.boost) base *= context.boost;
        let value = probabilisticRound(base);
        if (value < 1) value = 1;

        const oldHp = target.hp;
        // Mutation allowed for now as target is usually a Game_Battler object
        // In the future, this should return a state update object
        target.hp = Math.min(target.maxHp, target.hp + value);
        return { type: 'heal', value: target.hp - oldHp, target };
    },
    (val, target, source) => {
        const value = EffectSystem._evaluate(val, target, source);
        const newHp = Math.min(target.maxHp, target.hp + value);
        if (newHp !== target.hp) {
            return `HP: ${target.hp}/${target.maxHp} -> ${newHp}/${target.maxHp}`;
        }
        return null;
    }
);

EffectSystem.handlers['hp'] = EffectSystem.handlers['hp_heal'];
EffectSystem.previewHandlers['hp'] = EffectSystem.previewHandlers['hp_heal'];

EffectSystem.register('maxHp',
    (val, source, target) => {
        const value = EffectSystem._evaluate(val, target, source);
        target.maxHp += value;
        target.hp += value;
        return { type: 'maxHp', value, target };
    },
    (val, target, source) => {
        const value = EffectSystem._evaluate(val, target, source);
        const newMax = target.maxHp + value;
        return `Max HP: ${target.maxHp} -> ${newMax}`;
    }
);

EffectSystem.register('hp_damage',
    (val, source, target, context) => {
        let base = EffectSystem._evaluate(val, target, source);
        if (context.boost) base *= context.boost;
        let value = probabilisticRound(base);
        if (value < 1) value = 1;

        const oldHp = target.hp;
        target.hp = Math.max(0, target.hp - value);
        return { type: 'damage', value: oldHp - target.hp, target };
    },
    (val, target, source) => {
        const value = EffectSystem._evaluate(val, target, source);
        return `Damage: ${value}`;
    }
);

EffectSystem.register('add_status',
    (val, source, target, context) => {
        const statusId = (typeof val === 'object') ? val.id : val;
        const chance = ((typeof val === 'object' ? val.chance : 1) || 1) * (context.boost || 1);

        if (random() < chance) {
            target.addState(statusId);
            return { type: 'status', status: statusId, target };
        }
        return null;
    },
    (val) => {
        const id = (typeof val === 'object') ? val.id : val;
        return `Adds State: ${id}`;
    }
);

EffectSystem.register('hp_drain',
    (val, source, target, context) => {
        let base = EffectSystem._evaluate(val, target, source);
        if (context.boost) base *= context.boost;
        let value = probabilisticRound(base);
        if (value < 1) value = 1;

        const hpBeforeTarget = target.hp;
        target.hp = Math.max(0, target.hp - value);
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
    (val, target, source) => {
         const value = EffectSystem._evaluate(val, target, source);
         return `Drains: ${value}`;
    }
);

// XP is manager-dependent, so we might need to inject the progression system or return an event
// For now, let's just return the event and let the Manager handle it, OR inject it.
// The pure way is to return { type: 'gain_xp', value } and let the system handle it.
EffectSystem.register('xp',
    (val, source, target) => {
        const value = EffectSystem._evaluate(val, target, source);
        // We cannot import ProgressionSystem here if it is in managers/
        // So we return an event describing the intent.
        return { type: 'gain_xp', value, target };
    },
    (val) => `XP: +${val}`
);

EffectSystem.register('recruit_egg',
    (val, source, target) => {
        return { type: 'recruit_egg', value: val, target };
    },
    () => "Hatches an egg"
);
