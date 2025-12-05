import { evaluateFormula, probabilisticRound } from "../src/core/utils.js";
import { ProgressionSystem } from "../src/managers/progression.js";

function evaluate(val, target, source) {
    if (typeof val === 'string') {
        return Math.round(evaluateFormula(val, source || {}, target));
    }
    return val;
}

export const EFFECT_DEFINITIONS = {
    'hp': {
        apply: (value, target, source, context = {}) => {
             let base = evaluate(value, target, source);
             if (context.boost) base *= context.boost;
             let val = probabilisticRound(base);
             if (val < 1) val = 1;

             const oldHp = target.hp;
             target.hp = Math.min(target.maxHp, target.hp + val);
             return { type: 'heal', value: target.hp - oldHp, target };
        },
        preview: (value, target, source) => {
            const val = evaluate(value, target, source);
            const newHp = Math.min(target.maxHp, target.hp + val);
            if (newHp !== target.hp) {
                return `HP: ${target.hp}/${target.maxHp} -> ${newHp}/${target.maxHp}`;
            }
            return null;
        },
        description: (value) => `Restores ${value} HP`
    },
    'hp_heal': {
        apply: (value, target, source, context = {}) => {
            return EFFECT_DEFINITIONS['hp'].apply(value, target, source, context);
        },
        preview: (value, target, source) => {
            return EFFECT_DEFINITIONS['hp'].preview(value, target, source);
        },
        description: (value) => `Restores ${value} HP`
    },
    'maxHp': {
        apply: (value, target, source, context = {}) => {
             const val = evaluate(value, target, source);
             target.maxHp += val;
             target.hp += val;
             return { type: 'maxHp', value: val, target };
        },
        preview: (value, target, source) => {
            const val = evaluate(value, target, source);
            const newMax = target.maxHp + val;
            return `Max HP: ${target.maxHp} -> ${newMax}`;
        },
        description: (value) => `Max HP +${value}`
    },
    'xp': {
        apply: (value, target, source, context = {}) => {
            const val = evaluate(value, target, source);
            const result = ProgressionSystem.gainXp(target, val);
            return { type: 'xp', value: val, result, target };
        },
        preview: (value, target, source) => {
             const val = evaluate(value, target, source);
             return `XP: +${val}`;
        },
        description: (value) => `Grants ${value} XP`
    },
    'recruit_egg': {
        apply: (value, target, source, context = {}) => {
            return { type: 'recruit_egg', value: value, target };
        },
        preview: (value, target, source) => {
            return "Hatches an egg";
        },
        description: (value) => `Recruits a monster`
    },
    'hp_damage': {
        apply: (value, target, source, context = {}) => {
            let base = evaluate(value, target, source);
            if (context.boost) base *= context.boost;
            let val = probabilisticRound(base);
            if (val < 1) val = 1;

            const oldHp = target.hp;
            target.hp = Math.max(0, target.hp - val);
            return { type: 'damage', value: oldHp - target.hp, target };
        },
        preview: (value, target, source) => {
            const val = evaluate(value, target, source);
            return `Damage: ${val}`;
        },
        description: (value) => `Damage: ${value}`
    },
    'add_status': {
        apply: (value, target, source, context = {}) => {
            const statusId = (typeof value === 'object') ? value.id : value;
            const chance = ((typeof value === 'object' ? value.chance : 1) || 1) * (context.boost || 1);

            if (Math.random() < chance) {
                target.addState(statusId);
                return { type: 'status', status: statusId, target };
            }
            return null;
        },
        preview: (value, target, source) => {
            const statusId = (typeof value === 'object') ? value.id : value;
            return `Add State: ${statusId}`;
        },
        description: (value) => {
            const statusId = (typeof value === 'object') ? value.id : value;
            return `Applies ${statusId}`;
        }
    },
    'hp_drain': {
        apply: (value, target, source, context = {}) => {
            let base = evaluate(value, target, source);
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
             const val = evaluate(value, target, source);
             return `Drain: ${val}`;
        },
        description: (value) => `Drains ${value} HP`
    }
};
