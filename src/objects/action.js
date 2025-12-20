import { randInt, elementToAscii, probabilisticRound, random } from "../core/utils.js";
import { EffectSystem } from "../engine/rules/effects.js";
import { ProgressionSystem } from "../engine/systems/progression.js";

/**
 * @class Game_Action
 * @description Encapsulates the execution of a battle action (Attack, Skill, Item).
 */
export class Game_Action {
    /**
     * @param {import("./battler.js").Game_Battler|import("./party.js").Game_Party} subject - The battler or party performing the action.
     */
    constructor(subject) {
        this.subject = subject;
        this._item = null;
        this._isAttack = false;
        this._skillId = null;
        this._itemId = null;
        this._rowBonus = 0; // -1 for Back, +1 for Front (Player only)
    }

    setAttack() {
        this._isAttack = true;
        this._item = null;
        this._skillId = null;
        this._itemId = null;
    }

    setSkill(skillId, dataManager) {
        this._isAttack = false;
        this._skillId = skillId;
        this._item = dataManager.skills[skillId];
    }

    setItem(itemOrId, dataManager) {
        this._isAttack = false;
        if (typeof itemOrId === 'object' && itemOrId !== null) {
            this._item = itemOrId;
            this._itemId = itemOrId.id;
        } else {
            this._itemId = itemOrId;
            if (Array.isArray(dataManager.items)) {
                this._item = dataManager.items.find(i => i.id === itemOrId);
            } else {
                this._item = dataManager.items[itemOrId];
            }
        }
    }

    setRowBonus(bonus) {
        this._rowBonus = bonus;
    }

    get item() {
        return this._item;
    }

    get isAttack() {
        return this._isAttack;
    }

    get skillId() {
        return this._skillId;
    }

    /**
     * Speed of the action for turn order.
     */
    get speed() {
        let s = this.subject.asp || 0;
        if (this._item && this._item.speed) {
            s += this._item.speed;
        }
        return s;
    }

    /**
     * Returns valid targets for this action.
     * @param {Array} allies - The subject's allies.
     * @param {Array} opponents - The subject's opponents.
     * @returns {Array} List of valid targets.
     */
    makeTargets(allies, opponents) {
        let scope = 'enemy';
        if (this._item && this._item.target) {
            scope = this._item.target;
        }

        // Attack defaults to enemy
        if (this._isAttack) scope = 'enemy';

        if (scope.includes('self')) {
            return [this.subject];
        }

        const targetSide = scope.includes('ally') ? allies : opponents;
        return targetSide.filter(b => b.hp > 0);
    }

    /**
     * Applies the action to the target.
     * @param {import("./battler.js").Game_Battler} target - The target.
     * @param {import("../managers/data.js").DataManager} dataManager - Data manager for lookups.
     * @returns {Array} Events resulting from the action.
     */
    apply(target, dataManager) {
        if (!target || target.hp <= 0) return [];

        const events = [];
        if (this._isAttack) {
            this._applyAttack(target, dataManager, events);
        } else if (this._skillId) {
            this._applySkill(target, dataManager, events);
        } else if (this._itemId) {
            this._applyItem(target, dataManager, events);
        }

        return events;
    }

    _applyAttack(target, dataManager, events) {
        const battler = this.subject;

        // Base Damage
        let base = battler.atk + randInt(-1, 1);
        base += this._rowBonus;
        if (base < 1) base = 1;

        // Evasion
        const evasionChance = target.getPassiveValue("EVA");
        if (evasionChance > 0 && random() < evasionChance) {
            events.push({
                type: "miss",
                battler: battler,
                target: target,
                msg: `${battler.name} attacks ${target.name} but misses!`,
            });
            return;
        }

        // Critical
        let isCritical = false;
        const critChance = battler.getPassiveValue("CRI");
        if (critChance > 0 && random() < critChance) {
            isCritical = true;
        }

        // Element Multiplier
        // Attack uses battler.elements
        const mult = this._elementMultiplier(battler.elements, target.elements, dataManager);

        let dmg = probabilisticRound(base * mult);
        dmg += battler.getPassiveValue("DEAL_DAMAGE_MOD");

        if (isCritical) {
            dmg = Math.floor(dmg * 2);
        }

        if (dmg < 1) dmg = 1;

        const hpBefore = target.hp;
        target.hp = Math.max(0, target.hp - dmg);

        const msg = isCritical
            ? `CRITICAL! ${battler.name} deals ${dmg} damage to ${target.name}!`
            : `${battler.name} attacks ${target.name} for ${dmg}.`;

        events.push({
            type: "damage",
            battler: battler,
            target: target,
            value: dmg,
            hpBefore: hpBefore,
            hpAfter: target.hp,
            isCritical: isCritical,
            msg: msg,
        });
    }

    _applySkill(target, dataManager, events) {
        const battler = this.subject;
        const skill = this._item;

        if (!skill) return;

        let boost = 1;

        // Boost from user element affinity (same element bonus)
        if (skill.element) {
            const matches = battler.elements.filter((e) => e === skill.element).length;
            boost += matches * 0.25;
        }

        // Element Multiplier (Target weakness/resistance)
        let elementMult = 1.0;
        if (skill.element) {
            elementMult = this._elementMultiplier([skill.element], target.elements, dataManager);
        }

        const skillName = `${elementToAscii(skill.element)}${skill.name}`;
        events.push({ type: 'use_skill', battler: battler, skillName, msg: `${battler.name} uses ${skillName}!` });

        skill.effects.forEach((effect) => {
            const context = { boost };
            // Apply element multiplier to damage effects
            if (effect.type === 'hp_damage' || effect.type === 'hp_drain') {
                 context.boost = (context.boost || 1) * elementMult;
            }

            let effectKey = effect.type;
            let effectValue = effect.formula || effect.value;

            if (effect.type === 'add_status') {
                 effectValue = { id: effect.status, chance: effect.chance };
            }

            const result = EffectSystem.apply(effectKey, effectValue, battler, target, {
                ...context,
                progressionSystem: ProgressionSystem
            });

            if (!result) return;

             if (result.type === 'damage') {
                 events.push({
                    type: 'damage',
                    battler: battler,
                    target: target,
                    value: result.value,
                    hpBefore: target.hp + result.value,
                    hpAfter: target.hp,
                    msg: `  ${target.name} takes ${result.value} damage.`
                 });
            } else if (result.type === 'heal') {
                 events.push({
                     type: 'heal',
                     battler: battler,
                     target: target,
                     value: result.value,
                     hpBefore: target.hp - result.value,
                     hpAfter: target.hp,
                     msg: `  ${target.name} heals ${result.value} HP.`,
                     animation: 'healing_sparkle'
                 });
            } else if (result.type === 'status') {
                 events.push({ type: 'status', target: target, status: result.status, msg: `  ${target.name} is afflicted with ${result.status}.` });
            } else if (result.type === 'hp_drain') {
                 events.push({
                     type: 'hp_drain',
                     battler: battler,
                     source: battler,
                     target: target,
                     value: result.value,
                     hpBeforeTarget: result.hpBeforeTarget,
                     hpAfterTarget: result.hpAfterTarget,
                     hpBeforeSource: result.hpBeforeSource,
                     hpAfterSource: result.hpAfterSource,
                     msg: `  ${battler.name} drains ${result.value} HP from ${target.name}.`
                 });
            }
        });
    }

    _applyItem(target, dataManager, events) {
        const subject = this.subject;
        const item = this._item;

        if (!item) return;

        // Consumption logic: if subject has inventory, remove item.
        if (item.type !== 'equipment' && subject.inventory && Array.isArray(subject.inventory)) {
             const idx = subject.inventory.findIndex(i => i.id === item.id);
             if (idx !== -1) {
                 subject.inventory.splice(idx, 1);
             }
        }

        const subjectName = subject.name || "Player";
        events.push({ type: 'use_item', battler: subject, itemName: item.name, msg: `${subjectName} uses ${item.name} on ${target.name}.` });

        if (item.effects) {
            item.effects.forEach(effect => {
                const key = effect.type;
                const value = effect.formula || effect.value;
                const result = EffectSystem.apply(key, value, item, target, {
                    progressionSystem: ProgressionSystem
                });

                if (result) {
                    if (!result.battler) result.battler = subject;

                    if (!result.msg) {
                         if (result.type === 'heal') {
                             result.msg = `  ${target.name} heals ${result.value} HP.`;
                             result.animation = 'healing_sparkle';
                         } else if (result.type === 'damage') {
                             result.msg = `  ${target.name} takes ${result.value} damage.`;
                         } else if (result.type === 'recruit_egg') {
                             result.msg = `  The egg hatches!`;
                         } else if (result.type === 'maxHp') {
                             result.msg = `  ${target.name}'s Max HP increased by ${result.value}.`;
                         } else if (result.type === 'xp') {
                             result.msg = `  ${target.name} gains ${result.value} XP.`;
                         }
                    } else if (result.type === 'heal' && !result.animation) {
                        result.animation = 'healing_sparkle';
                    }

                    events.push(result);
                }
            });
        }
    }

    _elementMultiplier(attackerElements, defenderElements, dataManager) {
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

        if (advantageFound) {
          multiplier = 1.5;
        } else if (disadvantageFound) {
          multiplier = 0.75;
        }

        return multiplier;
    }
}
