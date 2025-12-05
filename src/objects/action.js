import { EffectProcessor } from "../managers/effect_processor.js";
import { SoundManager } from "../managers/sound.js";
import { elementToAscii } from "../core/utils.js";

/**
 * @class Game_Action
 * @description Encapsulates an action (Skill, Item, etc.) and its execution.
 */
export class Game_Action {
    /**
     * @param {import("./battler.js").Game_Battler} subject - The source of the action.
     */
    constructor(subject) {
        this.subject = subject;
        this.item = null; // The data object (Skill or Item)
        this.target = null;
    }

    /**
     * Sets the item or skill for this action.
     * @param {Object} item - Skill or Item data object.
     */
    setItem(item) {
        this.item = item;
    }

    /**
     * Sets the target battler.
     * @param {import("./battler.js").Game_Battler} target
     */
    setTarget(target) {
        this.target = target;
    }

    /**
     * Executes the action on the set target.
     * @param {Object} context - Context for effects (e.g. { boost, party }).
     * @returns {Array} List of events.
     */
    execute(context = {}) {
        const events = [];
        if (!this.item || !this.target) return events;

        // Log Use
        if (this.item.name) {
             const name = this.item.element ? `${elementToAscii(this.item.element)}${this.item.name}` : this.item.name;
             events.push({ type: 'use_skill', battler: this.subject, skillName: name, msg: `${this.subject.name} uses ${name}!` });
        }

        // Apply Effects
        let effects = [];
        if (Array.isArray(this.item.effects)) {
            effects = this.item.effects;
        } else if (this.item.effects && typeof this.item.effects === 'object') {
            // Normalize object format to array of { type, value }
            effects = Object.entries(this.item.effects).map(([key, value]) => ({ type: key, value }));
        }

        let boost = context.boost || 1;
        // Calculate boost based on element affinity if skill has element
        if (this.item.element && this.subject.elements) {
            const matches = this.subject.elements.filter(e => e === this.item.element).length;
            boost += matches * 0.25;
        }

        effects.forEach(effect => {
            const effectKey = effect.type;
            let effectValue = effect.formula || effect.value;
             if (effect.type === 'add_status') {
                 effectValue = { id: effect.status, chance: effect.chance };
            }

            const result = EffectProcessor.apply(effectKey, effectValue, this.subject, this.target, { ...context, boost });
            if (result) {
                this._processResult(result, events);
            }
        });

        return events;
    }

    _processResult(result, events) {
         const target = this.target;
         const subject = this.subject;

         if (result.type === 'damage') {
             SoundManager.play('DAMAGE');
             events.push({
                type: 'damage',
                battler: subject,
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
                 battler: subject,
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
                 battler: subject,
                 source: subject,
                 target: target,
                 value: result.value,
                 hpBeforeTarget: result.hpBeforeTarget,
                 hpAfterTarget: result.hpAfterTarget,
                 hpBeforeSource: result.hpBeforeSource,
                 hpAfterSource: result.hpAfterSource,
                 msg: `  ${subject.name} drains ${result.value} HP from ${target.name}.`
             });
        } else if (result.type === 'recruit_egg') {
             events.push({ type: 'recruit_egg', value: result.value });
        }
    }
}
