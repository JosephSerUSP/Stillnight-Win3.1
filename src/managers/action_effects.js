import { evaluateFormula, probabilisticRound } from "../core/utils.js";
import { ProgressionSystem } from "./progression.js";
import { SoundManager } from "./sound.js";

const EFFECT_REGISTRY = {};

/**
 * @class ActionEffectSystem
 * @description Registry and executor for action effects.
 */
export class ActionEffectSystem {
    static register(type, handler) {
        EFFECT_REGISTRY[type] = handler;
    }

    static apply(effectData, source, target, context = {}) {
        const type = effectData.type;
        const handler = EFFECT_REGISTRY[type];
        if (!handler) {
            console.warn(`Unknown effect type: ${type}`);
            return null;
        }
        return handler.apply(effectData, source, target, context);
    }

    static getPreview(effectKey, effectValue, target, source) {
         // Handle both (key, value) legacy style and generic lookup
         const handler = EFFECT_REGISTRY[effectKey];
         if (handler && handler.preview) {
             return handler.preview(effectValue, target, source);
         }
         return `${effectKey}: ${effectValue}`;
    }

    static _evaluate(val, target, source) {
        if (typeof val === 'string') {
            return Math.round(evaluateFormula(val, source || {}, target));
        }
        return val;
    }

    static elementMultiplier(attackerElements, defenderElements, dataManager) {
        if (!dataManager || !dataManager.elements) return 1;

        let multiplier = 1;
        let advantageFound = false;
        let disadvantageFound = false;

        for (const attackerEl of attackerElements) {
            if (advantageFound || disadvantageFound) break;
            for (const defenderEl of defenderElements) {
                const row = dataManager.elements[attackerEl];
                if (row) {
                    if (row.strong && row.strong.includes(defenderEl)) {
                        advantageFound = true;
                        break;
                    }
                    if (row.weak && row.weak.includes(defenderEl)) {
                        disadvantageFound = true;
                        break;
                    }
                }
            }
        }

        if (advantageFound) multiplier = 1.5;
        else if (disadvantageFound) multiplier = 0.75;

        return multiplier;
    }
}

// --- Register Standard Effects ---

// HP Heal
ActionEffectSystem.register('hp_heal', {
    apply: (data, source, target, context) => {
        let base = ActionEffectSystem._evaluate(data.formula || data.value, target, source);
        if (context.boost) base *= context.boost;
        let value = probabilisticRound(base);
        if (value < 1) value = 1;

        const oldHp = target.hp;
        target.hp = Math.min(target.maxHp, target.hp + value);

        SoundManager.play('HEAL');
        return {
            type: 'heal',
            battler: source,
            target: target,
            value: target.hp - oldHp,
            hpBefore: oldHp,
            hpAfter: target.hp,
            msg: `  ${target.name} heals ${target.hp - oldHp} HP.`,
            animation: 'healing_sparkle'
        };
    },
    preview: (val, target, source) => {
        const value = ActionEffectSystem._evaluate(val, target, source);
        const newHp = Math.min(target.maxHp, target.hp + value);
        if (newHp !== target.hp) {
             return `HP: ${target.hp}/${target.maxHp} -> ${newHp}/${target.maxHp}`;
        }
        return null;
    }
});
// Alias 'hp' to 'hp_heal'
EFFECT_REGISTRY['hp'] = EFFECT_REGISTRY['hp_heal'];

// Max HP
ActionEffectSystem.register('maxHp', {
    apply: (data, source, target) => {
        const value = ActionEffectSystem._evaluate(data.value, target, source);
        target.maxHp += value;
        target.hp += value;
        return { type: 'maxHp', value, target };
    },
    preview: (val, target, source) => {
        const value = ActionEffectSystem._evaluate(val, target, source);
        const newMax = target.maxHp + value;
        return `Max HP: ${target.maxHp} -> ${newMax}`;
    }
});

// XP
ActionEffectSystem.register('xp', {
    apply: (data, source, target) => {
        const value = ActionEffectSystem._evaluate(data.value, target, source);
        const result = ProgressionSystem.gainXp(target, value);
        return { type: 'xp', value, result, target };
    },
    preview: (val, target, source) => `XP: +${val}`
});

// Recruit Egg
ActionEffectSystem.register('recruit_egg', {
    apply: (data, source, target) => {
        return { type: 'recruit_egg', value: data.value, target };
    },
    preview: () => "Hatches an egg"
});

// Generic Damage
ActionEffectSystem.register('hp_damage', {
    apply: (data, source, target, context) => {
        let base = ActionEffectSystem._evaluate(data.formula || data.value, target, source);
        if (context.boost) base *= context.boost;

        if (context.dataManager) {
             const mult = ActionEffectSystem.elementMultiplier(source.elements, target.elements, context.dataManager);
             base *= mult;
        }

        if (context.isCritical) base *= 2;

        if (source.getPassiveValue) {
             base += source.getPassiveValue("DEAL_DAMAGE_MOD");
        }

        let val = probabilisticRound(base);
        if (val < 1) val = 1;

        const oldHp = target.hp;
        target.hp = Math.max(0, target.hp - val);

        SoundManager.play('DAMAGE');
        return {
            type: 'damage',
            battler: source,
            target: target,
            value: oldHp - target.hp,
            hpBefore: oldHp,
            hpAfter: target.hp,
            msg: `  ${target.name} takes ${oldHp - target.hp} damage.`
        };
    },
    preview: (val, target, source) => {
         const value = ActionEffectSystem._evaluate(val, target, source);
         return `Damage: ${value}`;
    }
});

// Physical Damage
ActionEffectSystem.register('phys_damage', {
    apply: (data, source, target, context) => {
        return EFFECT_REGISTRY['hp_damage'].apply(data, source, target, context);
    },
    preview: EFFECT_REGISTRY['hp_damage'].preview
});

// Add Status
ActionEffectSystem.register('add_status', {
    apply: (data, source, target, context) => {
        const statusId = (typeof data === 'object') ? (data.status || data.id) : data;
        let chance = (typeof data === 'object' ? data.chance : 1) || 1;
        if (context.boost) chance *= context.boost;

        if (Math.random() < chance) {
            target.addState(statusId);
            return { type: 'status', status: statusId, target, msg: `  ${target.name} is afflicted with ${statusId}.` };
        }
        return null;
    },
    preview: (val) => `Adds Status: ${val.status || val}`
});

// HP Drain
ActionEffectSystem.register('hp_drain', {
    apply: (data, source, target, context) => {
        let base = ActionEffectSystem._evaluate(data.formula || data.value, target, source);
        if (context.boost) base *= context.boost;

        let val = probabilisticRound(base);
        if (val < 1) val = 1;

        const hpBeforeTarget = target.hp;
        target.hp = Math.max(0, target.hp - val);
        const damageDealt = hpBeforeTarget - target.hp;

        const hpBeforeSource = source.hp;
        source.hp = Math.min(source.maxHp, source.hp + damageDealt);

        SoundManager.play('DAMAGE');
        return {
            type: 'hp_drain',
            value: damageDealt,
            target,
            source,
            hpBeforeTarget,
            hpAfterTarget: target.hp,
            hpBeforeSource,
            hpAfterSource: source.hp,
            msg: `  ${source.name} drains ${damageDealt} HP from ${target.name}.`
        };
    },
    preview: (val, target, source) => {
        const value = ActionEffectSystem._evaluate(val, target, source);
        return `Drains: ${value}`;
    }
});
