import { evaluateFormula, probabilisticRound } from "../core/utils.js";
import { ProgressionSystem } from "./progression.js";

/**
 * @class EffectProcessor
 * @description Centralizes the logic for applying immediate effects (from items/skills) and generating their UI previews.
 */
export class EffectProcessor {

    /**
     * Applies an immediate effect to a target.
     * @param {string} effectKey - The effect code (e.g., 'hp', 'maxHp', 'recruit_egg', 'hp_damage').
     * @param {number|string|Object} effectValue - The value/formula/config of the effect.
     * @param {Object} source - The source of the effect (item/skill object, or battler).
     * @param {Game_Battler} target - The target battler.
     * @param {Object} [context={}] - Additional context (boost, etc.).
     * @returns {Object|null} Result object describing the outcome.
     */
    static apply(effectKey, effectValue, source, target, context = {}) {

        switch (effectKey) {
            case 'hp':
            case 'hp_heal': {
                let base = this._evaluate(effectValue, target, source);
                if (context.boost) base *= context.boost;
                let value = probabilisticRound(base);
                if (value < 1) value = 1;

                const oldHp = target.hp;
                target.hp = Math.min(target.maxHp, target.hp + value);
                return { type: 'heal', value: target.hp - oldHp, target };
            }

            case 'mp_heal': {
                let base = this._evaluate(effectValue, target, source);
                let value = probabilisticRound(base);
                if (value < 1) value = 1;

                target.mp = Math.min(target.maxMp, target.mp + value);
                return { type: 'heal', value, msg: `${target.name} recovers ${value} MP.` };
            }

            case 'maxHp': {
                const value = this._evaluate(effectValue, target, source);
                target.maxHp += value;
                target.hp += value;
                return { type: 'maxHp', value: value, target };
            }

            case 'xp': {
                // Legacy support, or we can repurpose for stat boosting items
                return { type: 'log', msg: 'XP not used in this mode.' };
            }

            case 'recruit_egg':
                 return { type: 'recruit_egg', value: effectValue, target };

            case 'teach_skill': {
                // source is usually the item. target is the actor.
                const skillId = (typeof effectValue === 'object') ? effectValue.skillId : effectValue;
                if (!target.skills.includes(skillId)) {
                    target.skills.push(skillId);
                    // Initialize skill level
                    if (!target.magicSkills[skillId]) target.magicSkills[skillId] = 1;
                    return { type: 'teach_skill', value: skillId, target };
                }
                return { type: 'log', msg: `${target.name} already knows ${skillId}.` };
            }

            case 'revive': {
                if (target.hp > 0) return { type: 'log', msg: 'It had no effect.' };
                let percent = (typeof effectValue === 'object') ? effectValue.value : effectValue;
                if (percent > 1) percent = 1; // if passed as whole number > 1, assume simple heal or handle differently. Usually revive is percent.
                // If effectValue is 1, it might mean 100% or 1 HP? Let's assume percent if float <= 1, else fixed HP.
                // But the items.json has value: 1 for phoenix down.

                let healAmount = 0;
                if (percent <= 1) {
                    healAmount = Math.floor(target.maxHp * percent);
                } else {
                    healAmount = percent;
                }
                if (healAmount < 1) healAmount = 1;

                target.hp = healAmount;
                return { type: 'heal', value: healAmount, msg: `${target.name} is revived!` };
            }

            case 'remove_status': {
                const statusId = (typeof effectValue === 'object') ? effectValue.status : effectValue;
                if (target.isStateAffected(statusId)) {
                    target.removeState(statusId);
                    return { type: 'log', msg: `${target.name} is cured of ${statusId}.` };
                }
                return { type: 'log', msg: 'It had no effect.' };
            }

            case 'hp_damage': {
                let base = this._evaluate(effectValue, target, source);
                if (context.boost) base *= context.boost;
                let val = probabilisticRound(base);
                if (val < 1) val = 1;

                const oldHp = target.hp;
                target.hp = Math.max(0, target.hp - val);
                return { type: 'damage', value: oldHp - target.hp, target };
            }

            case 'add_status': {
                const statusId = (typeof effectValue === 'object') ? effectValue.id : effectValue;
                const chance = ((typeof effectValue === 'object' ? effectValue.chance : 1) || 1) * (context.boost || 1);

                if (Math.random() < chance) {
                    target.addState(statusId);
                    return { type: 'status', status: statusId, target };
                }
                return null;
            }

            case 'hp_drain': {
                let base = this._evaluate(effectValue, target, source);
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
            }

            default:
                console.warn(`Unknown effect key: ${effectKey}`);
                return null;
        }
    }

    /**
     * Generates a preview string for an effect.
     * @param {string} effectKey - The effect code.
     * @param {number|string} effectValue - The value.
     * @param {Game_Battler} target - The target battler.
     * @param {Object} [source] - The source.
     * @returns {string|null} The preview string or null if no visible change.
     */
    static getPreview(effectKey, effectValue, target, source) {
        const value = this._evaluate(effectValue, target, source);

        switch (effectKey) {
            case 'hp':
            case 'hp_heal':
                const newHp = Math.min(target.maxHp, target.hp + value);
                if (newHp !== target.hp) {
                    return `HP: ${target.hp}/${target.maxHp} -> ${newHp}/${target.maxHp}`;
                }
                return null;

            case 'maxHp':
                const newMax = target.maxHp + value;
                return `Max HP: ${target.maxHp} -> ${newMax}`;

            case 'hp_damage':
                return `Damage: ${value}`;

            default:
                return `${effectKey}: ${value}`;
        }
    }

    /**
     * Helper to evaluate formulas or return raw numbers.
     * @param {number|string} val
     * @param {Game_Battler} target
     * @param {Object} [source]
     * @returns {number}
     */
    static _evaluate(val, target, source) {
        if (typeof val === 'string') {
            // Ensure source is an object (could be empty for items)
            return Math.round(evaluateFormula(val, source || {}, target));
        }
        return val;
    }
}
