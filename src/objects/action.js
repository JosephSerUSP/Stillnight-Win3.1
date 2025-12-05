import { evaluateFormula, probabilisticRound, randInt } from "../core/utils.js";
import { ProgressionSystem } from "../managers/progression.js";

/**
 * @class Game_ActionResult
 * @description Stores the result of an action execution.
 */
export class Game_ActionResult {
    constructor() {
        this.clear();
    }

    clear() {
        this.used = false;
        this.missed = false;
        this.evaded = false;
        this.critical = false;
        this.success = false;
        this.hpDamage = 0;
        this.mpDamage = 0;
        this.tpDamage = 0;
        this.addedStates = [];
        this.removedStates = [];
        this.addedBuffs = [];
        this.addedDebuffs = [];
        this.removedBuffs = [];
        this.removedDebuffs = [];
        this.drained = 0;
    }

    isHit() {
        return this.used && !this.missed && !this.evaded;
    }

    isStatusAffected(stateId) {
        return this.addedStates.includes(stateId);
    }
}

/**
 * @class Game_Action
 * @description Encapsulates an action (skill, item, or attack) and its execution.
 */
export class Game_Action {
    /**
     * @param {import("./battler.js").Game_Battler} subject
     * @param {import("../managers/data.js").DataManager} dataManager
     */
    constructor(subject, dataManager) {
        this.subject = subject;
        this.dataManager = dataManager;
        this.item = null;
        this.isSkill = false;
        this.isItem = false;
        this.isAttack = false;
        this._target = null;
    }

    /**
     * Sets the action to be a skill.
     * @param {string} skillId
     */
    setSkill(skillId) {
        this.item = this.dataManager.skills[skillId];
        this.isSkill = true;
        this.isItem = false;
        this.isAttack = false;
    }

    /**
     * Sets the action to be a standard attack.
     */
    setAttack() {
        this.item = {
            name: "Attack",
            target: "enemy",
            effects: [
                { type: "hp_damage", value: "a.atk", variance: 1 }
            ]
        };
        this.isSkill = false;
        this.isItem = false;
        this.isAttack = true;
    }

    /**
     * Sets the target for the action.
     * @param {import("./battler.js").Game_Battler} target
     */
    setTarget(target) {
        this._target = target;
    }

    /**
     * Applies the action to the target.
     * @param {import("./battler.js").Game_Battler} target
     */
    apply(target) {
        const result = target.result();
        result.clear();
        result.used = true;

        // Check Hit
        if (Math.random() > this.itemHit(target)) {
            result.missed = true;
            return;
        }

        // Check Evasion
        if (Math.random() < this.itemEva(target)) {
            result.evaded = true;
            return;
        }

        // Normalize effects (handle Object vs Array)
        let effects = [];
        if (this.item.effects) {
            if (Array.isArray(this.item.effects)) {
                effects = this.item.effects;
            } else if (typeof this.item.effects === 'object') {
                effects = Object.entries(this.item.effects).map(([key, value]) => ({ type: key, value: value }));
            }
        } else if (this.isAttack) {
             // Attack fallback already handled by setAttack defining effects
        }

        if (effects.length > 0) {
            effects.forEach(effect => {
                this.applyItemEffect(target, effect);
            });
        }

        // Determine general success
        if (result.hpDamage !== 0 || result.addedStates.length > 0 || result.drained !== 0 || result.success) {
            result.success = true;
        }
    }

    /**
     * Calculates the hit rate.
     */
    itemHit(target) {
        return this.item.successRate !== undefined ? this.item.successRate : 1.0;
    }

    /**
     * Calculates the evasion rate.
     */
    itemEva(target) {
        if (this.isAttack) {
            return target.xparam('eva');
        }
        return 0;
    }

    /**
     * Calculates the critical rate.
     */
    itemCrit(target) {
        if (this.isAttack || (this.item.canCrit)) {
             return this.subject.xparam('cri');
        }
        return 0;
    }

    /**
     * Applies a specific effect to the target.
     * @param {import("./battler.js").Game_Battler} target
     * @param {Object} effect
     */
    applyItemEffect(target, effect) {
        switch (effect.type) {
            case 'hp':
            case 'hp_damage':
            case 'hp_heal':
            case 'hp_drain':
                this.executeDamage(target, effect);
                break;
            case 'add_status':
                this.itemEffectAddState(target, effect);
                break;
            case 'maxHp':
            case 'xp':
                this.executeGrow(target, effect);
                break;
        }
    }

    /**
     * Executes damage/healing logic.
     */
    executeDamage(target, effect) {
        const result = target.result();
        let value = this.makeDamageValue(target, effect);

        // Map 'hp' (from items) to heal if positive, or handle generically
        // If effect type is 'hp', we assume it's heal like 'hp_heal' but value is positive
        const type = effect.type;

        if (type === 'hp_drain') {
            this.executeHpDamage(target, value);
            this.executeHpDrain(this.subject, value);
        } else if (type === 'hp_heal' || type === 'hp') {
             value = Math.abs(value) * -1; // Ensure negative for heal
             this.executeHpDamage(target, value);
        } else {
             // hp_damage
             this.executeHpDamage(target, value);
        }
    }

    executeHpDamage(target, value) {
        const result = target.result();
        const prevHp = target.hp;

        if (value > 0) {
            target.hp = Math.max(0, target.hp - value);
        } else {
            target.hp = Math.min(target.maxHp, target.hp - value);
        }

        result.hpDamage += (prevHp - target.hp);
    }

    executeHpDrain(subject, value) {
        subject.hp = Math.min(subject.maxHp, subject.hp + value);
        // We can track this if needed
    }

    executeGrow(target, effect) {
        if (effect.type === 'maxHp') {
            target.maxHp += effect.value;
            target.hp += effect.value;
            target.result().success = true;
        } else if (effect.type === 'xp') {
            ProgressionSystem.gainXp(target, effect.value);
            target.result().success = true;
        }
    }

    makeDamageValue(target, effect) {
        let baseValue = this.evalDamageFormula(target, effect);

        // Element Rate
        if (this.item.element) {
            baseValue *= this.calcElementRate(target, this.item.element);
        }

        // Critical
        if (Math.random() < this.itemCrit(target)) {
            baseValue *= 2;
            target.result().critical = true;
        }

        // Variance
        if (effect.variance) {
             baseValue += randInt(-effect.variance, effect.variance);
        }

        return Math.max(0, Math.round(baseValue));
    }

    evalDamageFormula(target, effect) {
        const formula = effect.formula || effect.value;
        if (typeof formula === 'string') {
             return evaluateFormula(formula, this.subject, target);
        }
        return formula;
    }

    calcElementRate(target, attackElement) {
        const targetElements = target.elements;
        let multiplier = 1.0;

        const elData = this.dataManager.elements[attackElement];
        if (elData) {
             for (const targetEl of targetElements) {
                 if (elData.strong && elData.strong.includes(targetEl)) {
                     multiplier *= 1.5;
                 }
                 if (elData.weak && elData.weak.includes(targetEl)) {
                     multiplier *= 0.75;
                 }
             }
        }
        return multiplier;
    }

    itemEffectAddState(target, effect) {
        let chance = effect.chance !== undefined ? effect.chance : 1.0;

        if (Math.random() < chance) {
             const statusId = (typeof effect.status === 'object') ? effect.status.id : (effect.status || effect.value);

             target.addState(statusId);
             target.result().addedStates.push(statusId);
        }
    }
}
