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
                // Not standard yet, but supported for consistency if MP exists
                if (target.mp !== undefined) {
                    let base = this._evaluate(effectValue, target, source);
                    const oldMp = target.mp;
                    target.mp = Math.min(target.maxMp, target.mp + base);
                    return { type: 'heal', value: target.mp - oldMp, target, msg: `${target.name} recovers ${target.mp - oldMp} MP.` };
                }
                return null;
            }

            case 'revive': {
                if (target.hp <= 0) {
                     const rate = this._evaluate(effectValue, target, source);
                     const healAmount = Math.max(1, Math.floor(target.maxHp * rate));
                     target.hp = healAmount;
                     target.removeState('dead');
                     return { type: 'heal', value: healAmount, target, msg: `${target.name} is revived!` };
                }
                return null;
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

            case 'mp_drain': {
                // Simplified MP drain logic
                 if (target.mp !== undefined && source.mp !== undefined) {
                     let base = this._evaluate(effectValue, target, source);
                     const drain = Math.min(target.mp, base);
                     target.mp -= drain;
                     source.mp = Math.min(source.maxMp, source.mp + drain);
                     return { type: 'mp_drain', value: drain, target, msg: `${source.name} drains ${drain} MP from ${target.name}.` };
                 }
                 return null;
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

            case 'remove_status': {
                // 'all_bad' logic
                if (effectValue === 'all_bad' || (typeof effectValue === 'object' && effectValue.status === 'all_bad')) {
                     // Filter negative states - for now hardcoded list or assume all but 'regen'/'haste' etc?
                     // Or define "isBad" in states.js?
                     // Simplified: remove common bad ones.
                     const badStates = ['poison', 'sleep', 'darkness', 'stone', 'power_break', 'armor_break'];
                     badStates.forEach(s => target.removeState(s));
                     return { type: 'status_remove', msg: `${target.name} is cured of all ailments.` };
                } else {
                     const sId = (typeof effectValue === 'object') ? effectValue.status : effectValue;
                     if (target.isStateAffected(sId)) {
                         target.removeState(sId);
                         return { type: 'status_remove', msg: `${target.name} is cured of ${sId}.` };
                     }
                }
                return null;
            }

            case 'steal': {
                 // Logic: check target drops, pick one, add to source inventory
                 if (target.actorData && target.actorData.drops && target.actorData.drops.length > 0) {
                      // Attempt steal
                      const drop = target.actorData.drops[0]; // Simplification: steal first
                      if (context.party && context.party.inventory) {
                           // We need item object.
                           // Assuming we can't easily access dataManager here without passing it.
                           // But often drops have itemId.
                           // We'll return a special 'steal_success' result and let Scene handle adding item if possible,
                           // or if we have Game_Party instance we can try adding.
                           // But usually EffectProcessor doesn't have dataManager.
                           // Let's assume we just log success for now or require caller to handle.
                           return { type: 'steal_success', itemId: drop.itemId, msg: `Stole ${drop.itemId}!` };
                      }
                 }
                 return { type: 'steal_fail', msg: "Nothing to steal!" };
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
