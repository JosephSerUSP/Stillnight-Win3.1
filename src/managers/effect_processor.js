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

            case 'learnAction': {
                const skillId = effectValue;
                if (!target.skills.includes(skillId)) {
                    if (target.skills.length < target.maxSkills) {
                        target.skills.push(skillId);
                        return { type: 'learnAction', skillId, target, msg: `${target.name} learned skill ${skillId}!` };
                    } else {
                        return { type: 'learnAction_fail', msg: `${target.name} cannot learn more skills.` };
                    }
                }
                return null;
            }

            case 'learnPassive': {
                const passiveId = effectValue;
                const alreadyHas = target.passives.some(p => (p.id === passiveId || p === passiveId));

                if (!alreadyHas) {
                     if (target.passives.length < target.maxPassives) {
                         if (target.addPassive && typeof target.addPassive === 'function') {
                             target.addPassive(passiveId);
                             return { type: 'learnPassive', passiveId, target, msg: `${target.name} learned passive ${passiveId}!` };
                         } else {
                             target.passives.push({ id: passiveId, name: passiveId, traits: [] }); // Placeholder
                         }
                     } else {
                         return { type: 'learnPassive_fail', msg: `${target.name} cannot learn more passives.` };
                     }
                }
                return null;
            }

            case 'elementAdd': {
                const element = effectValue;
                target._baseElements.push(element);
                return { type: 'elementAdd', element, target, msg: `${target.name} gained element ${element}!` };
            }

            case 'elementChange': {
                const element = effectValue;
                if (target._baseElements.length === 0) {
                    target._baseElements = [element];
                } else {
                    target._baseElements = target._baseElements.map(() => element);
                }
                 return { type: 'elementChange', element, target, msg: `${target.name}'s elements changed to ${element}!` };
            }

            case 'mod_prop':
            case 'set_prop': {
                // Generic Property Modifier
                // { property: 'maxActions', value: 1, operation: 'add' }
                // Supports deep property access? For now, top-level battler properties or `_paramPlus`.

                let propKey = null;
                let value = 0;
                let op = 'add';

                if (typeof effectValue === 'object') {
                    propKey = effectValue.property;
                    value = effectValue.value;
                    op = effectValue.operation || 'add';
                } else {
                    // Fallback or specific parsing? Assumes object structure for flexibility.
                    return null;
                }

                // If modifying a stat managed by `getStat`, we should write to `_paramPlus`.
                // Otherwise, write directly to the property if it exists.

                // Check if target tracks dynamic mods
                if (target._paramPlus) {
                    // It's a Battler
                    if (target._paramPlus[propKey] === undefined) target._paramPlus[propKey] = 0;

                    if (op === 'add') target._paramPlus[propKey] += value;
                    else if (op === 'sub') target._paramPlus[propKey] -= value;
                    else if (op === 'set') target._paramPlus[propKey] = value;

                    return { type: 'mod_prop', property: propKey, value, target, msg: `${target.name}'s ${propKey} modified.` };
                } else {
                    // Direct modification fallback
                    if (target[propKey] !== undefined) {
                        if (op === 'add') target[propKey] += value;
                        else if (op === 'sub') target[propKey] -= value;
                        else if (op === 'set') target[propKey] = value;
                        return { type: 'mod_prop', property: propKey, value, target };
                    }
                }
                return null;
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

            case 'learnAction':
                return `Learn Action: ${value}`;

            case 'learnPassive':
                return `Learn Passive: ${value}`;

            case 'elementAdd':
                return `Add Element: ${value}`;

            case 'elementChange':
                return `Change Element: ${value}`;

            case 'mod_prop':
            case 'set_prop':
                if (typeof effectValue === 'object') {
                    return `Mod ${effectValue.property}: ${effectValue.operation || 'add'} ${effectValue.value}`;
                }
                return `Mod Property`;

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
