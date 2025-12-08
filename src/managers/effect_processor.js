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

            case 'maxHp': {
                const value = this._evaluate(effectValue, target, source);
                target.maxHp += value;
                target.hp += value;
                return { type: 'maxHp', value: value, target };
            }

            case 'xp': {
                const value = this._evaluate(effectValue, target, source);
                const result = ProgressionSystem.gainXp(target, value);
                return { type: 'xp', value: value, result, target };
            }

            case 'gold': {
                const value = this._evaluate(effectValue, target, source);
                if (context && context.party) {
                    context.party.gold += value;
                    return { type: 'gold', value: value, target };
                }
                return null;
            }

            case 'recruit_egg':
                 return { type: 'recruit_egg', value: effectValue, target };

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

            case 'xp':
                return `XP: +${value}`;

            case 'gold':
                return `Gold: +${value}`;

            case 'recruit_egg':
                return "Hatches an egg";

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
