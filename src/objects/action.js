import { ActionEffectSystem } from "../managers/action_effects.js";
import { randInt, probabilisticRound, elementToAscii } from "../core/utils.js";
import { SoundManager } from "../managers/sound.js";

/**
 * @class Game_Action
 * @description Encapsulates an action (Attack, Skill, Item) performed by a battler.
 * Handles targeting, evaluation, and execution.
 */
export class Game_Action {
    /**
     * @param {Game_Battler} subject - The battler performing the action.
     */
    constructor(subject) {
        this.subject = subject;
        this.item = null; // The Skill or Item data object
        this.type = 'attack'; // 'attack', 'skill', 'item'
        this._target = null;
    }

    setAttack() {
        this.type = 'attack';
        this.item = null;
    }

    setSkill(skill) {
        this.type = 'skill';
        this.item = skill;
    }

    setItem(item) {
        this.type = 'item';
        this.item = item;
    }

    setTarget(target) {
        this._target = target;
    }

    /**
     * Executes the action on the target and returns events.
     * @param {Game_Battler} target - The target battler.
     * @param {Object} [dataManager] - Reference to DataManager for lookups if needed.
     * @returns {Array} List of events.
     */
    apply(target, dataManager) {
        if (!target) return [];
        this._target = target;

        if (this.type === 'attack') {
            return this._executeAttack(target, dataManager);
        } else if (this.type === 'skill' || this.type === 'item') {
            return this._executeSkill(target, dataManager);
        }
        return [];
    }

    _executeAttack(target, dataManager) {
        const events = [];
        const battler = this.subject;

        // Evasion Check
        const evasionChance = target.xparam ? target.xparam('eva') : 0;
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

        // Critical Hit Check
        let isCritical = false;
        const critChance = battler.xparam ? battler.xparam('cri') : 0;
        if (critChance > 0 && Math.random() < critChance) {
            isCritical = true;
        }

        // Damage Calculation
        // Base: ATK + Variance
        let base = battler.atk + randInt(-1, 1);

        // Row modifier (if applicable, logic might need to be passed in or checked on battler)
        // For now we assume standard ATK.
        if (base < 1) base = 1;

        // Element Multiplier
        let mult = 1;
        // Logic for element multiplier was in BattleManager.
        // We can replicate it if we have access to element definitions, or simplify.
        // Assuming dataManager has elements.
        if (dataManager && dataManager.elements) {
            mult = this._calcElementMultiplier(battler.elements, target.elements, dataManager.elements);
        }

        let dmg = probabilisticRound(base * mult);

        // Damage Modifiers
        const dealDmgMod = battler.param ? battler.param('deal_damage_mod') : 0; // Assuming this param exists or we use generic traits
        // If it was a trait value summing up:
        dmg += dealDmgMod;

        if (isCritical) {
            dmg = Math.floor(dmg * 2);
        }

        if (dmg < 1) dmg = 1;

        // Apply Damage Effect
        SoundManager.play('DAMAGE');
        const result = ActionEffectSystem.apply('hp_damage', dmg, battler, target, {});

        const msg = isCritical
            ? `CRITICAL! ${battler.name} deals ${dmg} damage to ${target.name}!`
            : `${battler.name} attacks ${target.name} for ${dmg}.`;

        events.push({
            type: "damage",
            battler: battler,
            target: target,
            value: result.value,
            hpBefore: target.hp + result.value, // target.hp is already updated
            hpAfter: target.hp,
            isCritical: isCritical,
            msg: msg,
        });

        return events;
    }

    _executeSkill(target, dataManager) {
        const events = [];
        const battler = this.subject;
        const skill = this.item;

        if (!skill) return events;

        let boost = 1;
        if (skill.element) {
            const matches = battler.elements.filter((e) => e === skill.element).length;
            boost += matches * 0.25;
        }

        const skillName = skill.element ? `${elementToAscii(skill.element)}${skill.name}` : skill.name;
        // Only push use_skill event once per action execution (handled by BattleManager?)
        // BattleManager iterates targets. Here we apply to ONE target.
        // But usually 'use_skill' message is global.
        // We'll return it, BattleManager can filter or we include it.
        // Actually Scene_Battle expects it. We can include it for the first target?
        // Let's assume BattleManager handles the "Uses skill" message separately or we return it here.
        // Current implementation returns it in _executeSkill.

        events.push({ type: 'use_skill', battler: battler, skillName, msg: `${battler.name} uses ${skillName}!` });

        if (skill.effects) {
            skill.effects.forEach((effect) => {
                const context = { boost };
                let effectKey = effect.type;
                let effectValue = effect.formula || effect.value;

                if (effect.type === 'add_status') {
                     effectValue = { id: effect.status, chance: effect.chance };
                }

                const result = ActionEffectSystem.apply(effectKey, effectValue, battler, target, context);

                if (!result) return;

                // Map result to event type
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
                } else if (result.type === 'recruit_egg') {
                    events.push({
                        type: 'recruit_egg',
                        battler: battler,
                        target: target,
                        msg: `  ${battler.name} recruits ${target.name}!`
                    });
                }
            });
        }
        return events;
    }

    _calcElementMultiplier(attackerElements, defenderElements, elementData) {
        let multiplier = 1;
        let advantageFound = false;
        let disadvantageFound = false;

        for (const attackerEl of attackerElements) {
            if (advantageFound || disadvantageFound) break;
            for (const defenderEl of defenderElements) {
                const row = elementData[attackerEl];
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
