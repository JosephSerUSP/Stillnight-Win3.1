import { GlobalEffectRegistry } from "./effect_registry.js";
import { evaluateFormula, probabilisticRound } from "../core/utils.js";
import { ProgressionSystem } from "./progression.js";

/**
 * Resolves a value which might be a formula string or a number.
 * @param {string|number} val
 * @param {Object} source
 * @param {Object} target
 * @returns {number}
 */
function resolveValue(val, source, target) {
    if (typeof val === 'string') {
        return Math.round(evaluateFormula(val, source || {}, target));
    }
    return val;
}

/**
 * Registers the standard game effects to the global registry.
 */
export function registerStandardEffects() {

    GlobalEffectRegistry.register('hp', (value, source, target, context) => {
        let base = resolveValue(value, source, target);
        if (context.boost) base *= context.boost;
        let amount = probabilisticRound(base);
        if (amount < 1) amount = 1;

        const oldHp = target.hp;
        target.hp = Math.min(target.maxHp, target.hp + amount);
        return { type: 'heal', value: target.hp - oldHp, target };
    }, (value, source, target) => {
        const amount = resolveValue(value, source, target);
        const newHp = Math.min(target.maxHp, target.hp + amount);
        if (newHp !== target.hp) {
            return `HP: ${target.hp}/${target.maxHp} -> ${newHp}/${target.maxHp}`;
        }
        return null;
    });

    GlobalEffectRegistry.register('hp_heal', (value, source, target, context) => {
        return GlobalEffectRegistry.execute('hp', value, source, target, context);
    }, (value, source, target) => {
        return GlobalEffectRegistry.getPreview('hp', value, source, target);
    });

    GlobalEffectRegistry.register('maxHp', (value, source, target) => {
        const amount = resolveValue(value, source, target);
        target.maxHp += amount;
        target.hp += amount;
        return { type: 'maxHp', value: amount, target };
    }, (value, source, target) => {
        const amount = resolveValue(value, source, target);
        const newMax = target.maxHp + amount;
        return `Max HP: ${target.maxHp} -> ${newMax}`;
    });

    GlobalEffectRegistry.register('xp', (value, source, target) => {
        const amount = resolveValue(value, source, target);
        const result = ProgressionSystem.gainXp(target, amount);
        return { type: 'xp', value: amount, result, target };
    }, (value, source, target) => {
        const amount = resolveValue(value, source, target);
        return `XP: +${amount}`;
    });

    GlobalEffectRegistry.register('recruit_egg', (value, source, target) => {
        return { type: 'recruit_egg', value: value, target };
    }, () => "Hatches an egg");

    GlobalEffectRegistry.register('hp_damage', (value, source, target, context) => {
        let base = resolveValue(value, source, target);
        if (context.boost) base *= context.boost;
        let amount = probabilisticRound(base);
        if (amount < 1) amount = 1;

        const oldHp = target.hp;
        target.hp = Math.max(0, target.hp - amount);
        return { type: 'damage', value: oldHp - target.hp, target };
    }, (value, source, target) => {
        const amount = resolveValue(value, source, target);
        return `Damage: ${amount}`;
    });

    GlobalEffectRegistry.register('add_status', (value, source, target, context) => {
        const statusId = (typeof value === 'object') ? value.id : value;
        const chance = ((typeof value === 'object' ? value.chance : 1) || 1) * (context.boost || 1);

        if (Math.random() < chance) {
            target.addState(statusId);
            return { type: 'status', status: statusId, target };
        }
        return null;
    }, (value) => {
        const statusId = (typeof value === 'object') ? value.id : value;
        return `Apply Status: ${statusId}`;
    });

    GlobalEffectRegistry.register('hp_drain', (value, source, target, context) => {
        let base = resolveValue(value, source, target);
        if (context.boost) base *= context.boost;
        let amount = probabilisticRound(base);
        if (amount < 1) amount = 1;

        const hpBeforeTarget = target.hp;
        target.hp = Math.max(0, target.hp - amount);
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
    }, (value, source, target) => {
        const amount = resolveValue(value, source, target);
        return `Drain: ${amount}`;
    });
}
