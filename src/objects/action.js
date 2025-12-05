import { randInt, probabilisticRound, elementToAscii } from "../core/utils.js";
import { ActionEffectSystem } from "../managers/action_effects.js";
import { SoundManager } from "../managers/sound.js";

/**
 * @class Game_Action
 * @description Encapsulates the execution of a battle action (Skill, Item, Attack).
 */
export class Game_Action {
    /**
     * @param {Game_Battler} subject - The user of the action.
     * @param {Object} item - The skill or item data object.
     */
    constructor(subject, item) {
        this.subject = subject;
        this.item = item;
        this._target = null;
    }

    /**
     * Sets the target of the action.
     * @param {Game_Battler} target
     */
    setTarget(target) {
        this._target = target;
    }

    /**
     * Checks if the action can be executed.
     * @returns {boolean}
     */
    isValid() {
        return this.subject && this.item && this.subject.hp > 0;
    }

    /**
     * Executes the action and returns a list of resulting events.
     * @param {Object} globalContext - Context provided by the battle manager (e.g. dataManager).
     * @returns {Array} List of events.
     */
    execute(globalContext = {}) {
        if (!this.isValid()) return [];
        if (!this._target || this._target.hp <= 0) return []; // Target dead check should be done by caller or retargeting?
        // Caller (BattleManager) should have handled retargeting. If we get here with dead target, we fizzle?
        // Or we just proceed (maybe revive?)
        // Standard RPG logic: if single target and dead, fizzle.

        const events = [];
        const subject = this.subject;
        const target = this._target;
        const item = this.item;

        // Display Use Message
        const itemName = `${elementToAscii(item.element)}${item.name}`;
        events.push({
            type: 'use_skill',
            battler: subject,
            skillName: itemName,
            msg: `${subject.name} uses ${itemName}!`
        });

        // Determine Action Properties
        // "Attack" is identified by ID 'attack'.
        const isAttack = (item.id === 'attack');
        const isPhysical = isAttack; // Expansion point: check item.hitType

        // 1. Evasion Check (Physical only)
        if (isPhysical) {
             const evasionChance = target.getPassiveValue("EVA");
             // Hit Rate (HIT) could counter EVA, but for now strictly EVA.
             if (evasionChance > 0 && Math.random() < evasionChance) {
                 SoundManager.play('UI_CANCEL');
                 events.push({
                    type: "miss",
                    battler: subject,
                    target: target,
                    msg: `${subject.name} attacks ${target.name} but misses!`,
                });
                return events;
             }
        }

        // 2. Critical Check (Physical only)
        let isCritical = false;
        if (isPhysical) {
            const critChance = subject.getPassiveValue("CRI");
            const critEvasion = target.getPassiveValue("CEV");
            if (Math.random() < (critChance - critEvasion)) {
                isCritical = true;
            }
        }

        // 3. Apply Effects
        // Calculate Elemental Boost
        let boost = 1;
        if (item.element) {
            const matches = subject.elements.filter((e) => e === item.element).length;
            boost += matches * 0.25;
        }

        // Iterate Effects
        if (item.effects) {
            item.effects.forEach(effectData => {
                const context = { ...globalContext, boost, isCritical, isPhysical };

                // Variance handling logic could be here or in EffectSystem.
                // BattleManager previously added +/- 1 to base damage for attacks.
                // We'll let EffectSystem handle variance if it evaluates formulas.

                const result = ActionEffectSystem.apply(effectData, subject, target, context);

                if (result) {
                    // Inject critical flag into event if damage
                    if (isCritical && result.type === 'damage') {
                        result.isCritical = true;
                        result.msg = `CRITICAL! ` + result.msg.trim();
                    }
                    events.push(result);
                }
            });
        }

        return events;
    }
}
