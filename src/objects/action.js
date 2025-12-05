import { EffectProcessor } from "../managers/effect_processor.js";
import { SoundManager } from "../managers/sound.js";
import { randInt, elementToAscii, probabilisticRound } from "../core/utils.js";

/**
 * @class Game_Action
 * @description Encapsulates a battle action (Attack, Skill, Item).
 * Handles target selection, speed calculation, and execution.
 */
export class Game_Action {
    /**
     * @param {import("./battler.js").Game_Battler} subject - The battler performing the action.
     * @param {import("../managers/data.js").DataManager} dataManager - The data manager instance.
     * @param {boolean} [forceAction=false] - Whether this action is forced.
     */
    constructor(subject, dataManager, forceAction = false) {
        this._subject = subject;
        this._dataManager = dataManager;
        this._forcing = forceAction;
        this._item = null; // The data object (skill or item)
        this._skillId = 0;
        this._itemId = 0;
        this._targetIndex = -1;
    }

    /**
     * Sets the action to be a generic attack.
     */
    setAttack() {
        this._skillId = 0;
        this._itemId = 0;
        this._item = null;
    }

    /**
     * Sets the action to use a specific skill.
     * @param {string} skillId
     */
    setSkill(skillId) {
        this._skillId = skillId;
        this._itemId = 0;
        this._item = this._dataManager.skills[skillId];
    }

    /**
     * Sets the action to use a specific item.
     * @param {string} itemId
     */
    setItem(itemId) {
        this._itemId = itemId;
        this._skillId = 0;
        this._item = this._dataManager.items.find(i => i.id === itemId);
    }

    /**
     * Gets the data object for the action (Skill or Item), or null if Attack.
     */
    item() {
        return this._item;
    }

    /**
     * Checks if this action is an attack.
     */
    isAttack() {
        return !this._item;
    }

    /**
     * Checks if this action is a skill.
     */
    isSkill() {
        return !!this._item && !!this._skillId;
    }

    /**
     * Checks if this action is an item.
     */
    isItem() {
        return !!this._item && !!this._itemId;
    }

    /**
     * Calculates the speed of the action.
     * @returns {number}
     */
    speed() {
        let speed = this._subject.asp;
        if (this._item && this._item.speed) {
            speed += this._item.speed;
        }
        return speed;
    }

    /**
     * Determines the validity of the action.
     */
    isValid() {
        if (this._forcing) return true;
        return true;
    }

    /**
     * Resolves the targets for the action.
     * @param {import("./battler.js").Game_Battler[]} friends - The subject's allies.
     * @param {import("./battler.js").Game_Battler[]} opponents - The subject's enemies.
     * @returns {import("./battler.js").Game_Battler[]} List of targets.
     */
    makeTargets(friends, opponents) {
        const item = this.item();
        const scope = item ? item.target : 'enemy';

        let potentialTargets = [];

        if (scope.includes('self')) {
            return [this._subject];
        }

        if (scope.includes('ally')) {
            potentialTargets = friends;
        } else {
            potentialTargets = opponents;
        }

        potentialTargets = potentialTargets.filter(b => b.hp > 0);

        if (potentialTargets.length === 0) return [];

        if (scope.includes('all')) {
            return potentialTargets;
        }

        // Smart targeting for healing
        if (scope.includes('ally') && this._hasHealEffect()) {
            return [potentialTargets.reduce((prev, curr) => {
                return (curr.hp / curr.maxHp) < (prev.hp / prev.maxHp) ? curr : prev;
            })];
        }

        // Default random single target
        return [potentialTargets[randInt(0, potentialTargets.length - 1)]];
    }

    _hasHealEffect() {
        const item = this.item();
        if (!item || !item.effects) return false;

        if (Array.isArray(item.effects)) {
            return item.effects.some(e => e.type === 'hp_heal');
        } else {
            // Object format { hp_heal: val }
            return 'hp_heal' in item.effects || 'hp' in item.effects;
        }
    }

    /**
     * Applies the action to a single target.
     * @param {import("./battler.js").Game_Battler} target
     * @returns {Array} List of events.
     */
    apply(target) {
        if (this.isAttack()) {
            return this._applyAttack(target);
        } else {
            return this._applyItem(target);
        }
    }

    _applyAttack(target) {
        const events = [];
        const battler = this._subject;

        let base = battler.atk + randInt(-1, 1);
        if (base < 1) base = 1;

        // Evasion
        const evasionChance = target.getPassiveValue("EVA");
        if (evasionChance > 0 && Math.random() < evasionChance) {
            SoundManager.play('UI_CANCEL');
            events.push({
                type: "miss",
                battler: battler,
                target: target,
                msg: `${battler.name} attacks ${target.name} but misses!`,
            });
            return events;
        }

        // Critical
        let isCritical = false;
        const critChance = battler.getPassiveValue("CRI");
        if (critChance > 0 && Math.random() < critChance) {
            isCritical = true;
        }

        // Elements
        const mult = this._calcElementMultiplier(battler.elements, target.elements);
        let dmg = probabilisticRound(base * mult);
        dmg += battler.getPassiveValue("DEAL_DAMAGE_MOD");

        if (isCritical) {
            dmg = Math.floor(dmg * 2);
        }

        if (dmg < 1) dmg = 1;

        const hpBefore = target.hp;
        target.hp = Math.max(0, target.hp - dmg);

        SoundManager.play('DAMAGE');

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

        return events;
    }

    _applyItem(target) {
        const events = [];
        const battler = this._subject;
        const item = this.item();

        if (!item) return events;

        let boost = 1;
        if (item.element) {
            const matches = battler.elements.filter((e) => e === item.element).length;
            boost += matches * 0.25;
        }

        // Normalize effects to Array format
        let effects = [];
        if (Array.isArray(item.effects)) {
            effects = item.effects;
        } else if (item.effects && typeof item.effects === 'object') {
            effects = Object.entries(item.effects).map(([key, val]) => {
                return { type: key, value: val };
            });
        }

        effects.forEach((effect) => {
            const context = { boost };
            let effectKey = effect.type;
            let effectValue = effect.formula || effect.value;

            if (effect.type === 'add_status') {
                 effectValue = { id: effect.status, chance: effect.chance };
            }

            const result = EffectProcessor.apply(effectKey, effectValue, battler, target, context);

            if (!result) return;

            if (result.type === 'damage') {
                 SoundManager.play('DAMAGE');
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
                 SoundManager.play('HEAL');
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
                 SoundManager.play('DAMAGE');
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

        return events;
    }

    _calcElementMultiplier(attackerElements, defenderElements) {
        let multiplier = 1;
        let advantageFound = false;
        let disadvantageFound = false;

        const elementsData = this._dataManager.elements;

        for (const attackerEl of attackerElements) {
            if (advantageFound || disadvantageFound) break;
            for (const defenderEl of defenderElements) {
                const row = elementsData[attackerEl];
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
