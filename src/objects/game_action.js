import { randInt, elementToAscii, probabilisticRound } from "../core/utils.js";
import { SoundManager } from "../managers/sound.js";
import { EffectProcessor } from "../managers/effect_processor.js";

/**
 * @class Game_Action
 * @description Encapsulates a combat action and its execution logic.
 */
export class Game_Action {
  /**
   * Creates a new Game_Action instance.
   * @param {import("../managers/battle.js").BattleManager} battleManager - The battle manager coordinating the action.
   * @param {Object} sourceContext - The battler context ({battler, index, isEnemy}).
   * @param {string} type - The action type ('attack'|'skill').
   * @param {import("./objects.js").Game_Battler} target - The initial target for the action.
   * @param {Object} [options] - Additional options such as skillId.
   */
  constructor(battleManager, sourceContext, type, target, options = {}) {
    this.battleManager = battleManager;
    this.sourceContext = sourceContext;
    this.type = type;
    this.target = target;
    this.skillId = options.skillId || null;
  }

  /**
   * The battler performing the action.
   * @type {import("./objects.js").Game_Battler}
   */
  get battler() {
    return this.sourceContext?.battler;
  }

  /**
   * The skill data associated with this action, if any.
   */
  get skill() {
    if (!this.skillId) return null;
    return this.battleManager.dataManager.skills[this.skillId];
  }

  /**
   * The targeting scope for this action.
   */
  get scope() {
    return this.skill ? this.skill.target : "enemy";
  }

  /**
   * Calculates the total speed for turn ordering.
   */
  get speed() {
    const battlerSpeed = this.battler?.asp || 0;
    const actionSpeed = this.skill?.speed || 0;
    return battlerSpeed + actionSpeed;
  }

  /**
   * Ensures the action has a valid, alive target.
   * @returns {boolean} True if a valid target exists after validation.
   */
  ensureValidTarget() {
    if (this.target && this.target.hp > 0) return true;

    const targets = this.battleManager.getValidTargets(this.sourceContext, this.scope);
    if (targets.length === 0) return false;
    this.target = targets[randInt(0, targets.length - 1)];
    return true;
  }

  /**
   * Executes the action and returns resulting events.
   * @returns {Array} The list of events produced by this action.
   */
  execute() {
    if (!this.battler || this.battler.hp <= 0) return [];
    if (!this.ensureValidTarget()) return [];

    switch (this.type) {
      case "skill":
        return this._executeSkill();
      case "attack":
        return this._executeAttack();
      default:
        console.warn(`Unknown action type: ${this.type}`);
        return [];
    }
  }

  _executeSkill() {
    const { battler, target, skill } = this;
    const events = [];

    if (!skill) return events;

    let boost = 1;
    if (skill.element) {
      const matches = battler.elements.filter((e) => e === skill.element).length;
      boost += matches * 0.25;
    }
    const skillName = `${elementToAscii(skill.element)}${skill.name}`;
    events.push({ type: "use_skill", battler: battler, skillName, msg: `${battler.name} uses ${skillName}!` });

    skill.effects.forEach((effect) => {
      const context = { boost };
      let effectKey = effect.type;
      let effectValue = effect.formula || effect.value;

      if (effect.type === "add_status") {
        effectValue = { id: effect.status, chance: effect.chance };
      }

      const result = EffectProcessor.apply(effectKey, effectValue, battler, target, context);

      if (!result) return;

      if (result.type === "damage") {
        SoundManager.play("DAMAGE");
        events.push({
          type: "damage",
          battler: battler,
          target: target,
          value: result.value,
          hpBefore: target.hp + result.value,
          hpAfter: target.hp,
          msg: `  ${target.name} takes ${result.value} damage.`,
        });
      } else if (result.type === "heal") {
        SoundManager.play("HEAL");
        events.push({
          type: "heal",
          battler: battler,
          target: target,
          value: result.value,
          hpBefore: target.hp - result.value,
          hpAfter: target.hp,
          msg: `  ${target.name} heals ${result.value} HP.`,
          animation: "healing_sparkle",
        });
      } else if (result.type === "status") {
        events.push({ type: "status", target: target, status: result.status, msg: `  ${target.name} is afflicted with ${result.status}.` });
      } else if (result.type === "hp_drain") {
        SoundManager.play("DAMAGE");
        events.push({
          type: "hp_drain",
          battler: battler,
          source: battler,
          target: target,
          value: result.value,
          hpBeforeTarget: result.hpBeforeTarget,
          hpAfterTarget: result.hpAfterTarget,
          hpBeforeSource: result.hpBeforeSource,
          hpAfterSource: result.hpAfterSource,
          msg: `  ${battler.name} drains ${result.value} HP from ${target.name}.`,
        });
      }
    });

    return events;
  }

  _executeAttack() {
    const { battler, target, sourceContext } = this;
    const events = [];

    let base = battler.atk + randInt(-1, 1);

    if (!sourceContext.isEnemy) {
      const row = this.battleManager._partyRow(sourceContext.index);
      if (row === "Front") base += 1;
      else base -= 1;
    }

    if (base < 1) base = 1;

    const evasionChance = target.getPassiveValue("EVA");
    if (evasionChance > 0 && Math.random() < evasionChance) {
      SoundManager.play("UI_CANCEL");
      events.push({
        type: "miss",
        battler: battler,
        target: target,
        msg: `${battler.name} attacks ${target.name} but misses!`,
      });
      return events;
    }

    let isCritical = false;
    const critChance = battler.getPassiveValue("CRI");
    if (critChance > 0 && Math.random() < critChance) {
      isCritical = true;
    }

    const mult = this.battleManager.elementMultiplier(battler.elements, target.elements);
    let dmg = probabilisticRound(base * mult);
    dmg += battler.getPassiveValue("DEAL_DAMAGE_MOD");

    if (isCritical) {
      dmg = Math.floor(dmg * 2);
    }

    if (dmg < 1) dmg = 1;

    const hpBefore = target.hp;
    target.hp = Math.max(0, target.hp - dmg);

    SoundManager.play("DAMAGE");

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
}
