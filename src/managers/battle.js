import { randInt, elementToAscii, probabilisticRound } from "../core/utils.js";
import { EffectProcessor } from "./effect_processor.js";

/**
 * @class BattleManager
 * @description Manages the state and flow of a single battle instance.
 * Handles turn order, action execution, and victory/defeat conditions.
 * Pure logic version: No direct EventBus side effects.
 */
export class BattleManager {
  /**
   * Creates a new BattleManager instance.
   * @param {import("../objects/objects.js").Game_Party} party - The player's party.
   * @param {import("./data.js").DataManager} dataManager - The game's data manager.
   */
  constructor(party, dataManager) {
    this.party = party;
    this.dataManager = dataManager;
    this.enemies = [];
    this.round = 0;
    this.isBattleFinished = false;
    this.isVictoryPending = false;
    this.turnQueue = [];
  }

  setup(enemies, tileX, tileY, isSneakAttack = false) {
    this.enemies = enemies;
    this.tileX = tileX;
    this.tileY = tileY;
    this.isSneakAttack = isSneakAttack;
    this.round = 0;
    this.isBattleFinished = false;
    this.isVictoryPending = false;
    this.turnQueue = [];
  }

  elementMultiplier(attackerElements, defenderElements) {
    let multiplier = 1;
    let advantageFound = false;
    let disadvantageFound = false;

    for (const attackerEl of attackerElements) {
      if (advantageFound || disadvantageFound) break;
      for (const defenderEl of defenderElements) {
        const row = this.dataManager.elements[attackerEl];
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

  _partyRow(index) {
    return index <= 1 ? "Front" : "Back";
  }

  startRound(isFirstStrike = false) {
    if (this.isBattleFinished) return;
    this.round++;

    const combatants = [];
    this.party.slots.slice(0, 4).forEach((battler, index) => {
        if (battler) {
            combatants.push({ battler, index, isEnemy: false });
        }
    });
    this.enemies.forEach((b, i) => combatants.push({ battler: b, index: i, isEnemy: true }));

    const plannedQueue = combatants.map(ctx => {
        const action = this.getAIAction(ctx);
        let actionSpeed = 0;
        if (action && action.skillId) {
            const skill = this.dataManager.skills[action.skillId];
            if (skill && skill.speed) actionSpeed = skill.speed;
        }
        const totalSpeed = ctx.battler.asp + actionSpeed;
        return { ...ctx, action, totalSpeed };
    });

    const sortBySpeed = (queue) => queue.sort((a, b) => b.totalSpeed - a.totalSpeed);

    if (isFirstStrike) {
        this.turnQueue = sortBySpeed(plannedQueue.filter(c => !c.isEnemy));
    } else if (this.round === 1 && this.isSneakAttack) {
        const enemies = sortBySpeed(plannedQueue.filter(c => c.isEnemy));
        const party = sortBySpeed(plannedQueue.filter(c => !c.isEnemy));
        this.turnQueue = [...enemies, ...party];
    } else {
        this.turnQueue = sortBySpeed(plannedQueue);
    }
  }

  getNextBattler() {
      if (this.isBattleFinished) return null;
      let p = this.turnQueue.shift();
      while (p && p.battler.hp <= 0) {
           p = this.turnQueue.shift();
      }
      return p || null;
  }

  startTurn(battlerContext) {
      const { battler, isEnemy } = battlerContext;
      const allies = isEnemy ? this.enemies : this.party.activeMembers;
      const events = battler.onTurnStart(allies, null, this.dataManager);
      this._checkBattleEnd(events);
      return events;
  }

  getValidTargets(battlerContext, scope = 'enemy') {
      const { isEnemy } = battlerContext;
      let targetSide = [];

      if (scope.includes('self')) {
          return [battlerContext.battler];
      }

      const myTeam = isEnemy ? this.enemies : this.party.activeMembers;
      const opposingTeam = isEnemy ? this.party.activeMembers : this.enemies;

      if (scope.includes('ally')) {
          targetSide = myTeam;
      } else {
          targetSide = opposingTeam;
      }

      return targetSide.filter(b => b.hp > 0);
  }

  createAction(battlerContext, type, target, options = {}) {
      return {
          type,
          sourceContext: battlerContext,
          target,
          ...options
      };
  }

  getAIAction(battlerContext) {
      const { battler } = battlerContext;
      const skillId = (battler.skills && battler.skills.length && Math.random() < 0.6)
          ? battler.skills[randInt(0, battler.skills.length - 1)]
          : null;

      if (skillId) {
          const skill = this.dataManager.skills[skillId];
          const scope = skill ? skill.target : 'enemy';
          const targets = this.getValidTargets(battlerContext, scope);

          if (targets.length === 0) return null;

          let target;
          if (scope.includes('ally') && (skill.effects.some(e => e.type === 'hp_heal'))) {
              target = targets.reduce((prev, curr) => {
                  return (curr.hp / curr.maxHp) < (prev.hp / prev.maxHp) ? curr : prev;
              });
          } else {
              target = targets[randInt(0, targets.length - 1)];
          }

          return this.createAction(battlerContext, 'skill', target, { skillId });
      } else {
          const targets = this.getValidTargets(battlerContext, 'enemy');
          if (targets.length === 0) return null;
          const target = targets[randInt(0, targets.length - 1)];
          return this.createAction(battlerContext, 'attack', target);
      }
  }

  executeAction(action) {
    if (!action) return [];

    const { sourceContext } = action;
    const { battler } = sourceContext;
    let { target } = action;

    if (battler.hp <= 0) return [];

    if (!target || target.hp <= 0) {
        const skill = action.skillId ? this.dataManager.skills[action.skillId] : null;
        const scope = skill ? skill.target : 'enemy';
        const targets = this.getValidTargets(sourceContext, scope);
        if (targets.length > 0) {
            target = targets[randInt(0, targets.length - 1)];
            action.target = target;
        } else {
            return [];
        }
    }

    let events = [];
    switch (action.type) {
      case 'skill':
        events = this._executeSkill(action);
        break;
      case 'attack':
        events = this._executeAttack(action);
        break;
      default:
        console.warn(`Unknown action type: ${action.type}`);
        break;
    }

    this._checkBattleEnd(events);
    return events;
  }

  _executeSkill(action) {
    const { sourceContext, target } = action;
    const { battler } = sourceContext;
    const events = [];

    const skill = this.dataManager.skills[action.skillId];
    if (skill) {
      let boost = 1;
      if (skill.element) {
        const matches = battler.elements.filter((e) => e === skill.element).length;
        boost += matches * 0.25;
      }
      const skillName = `${elementToAscii(skill.element)}${skill.name}`;
      events.push({ type: 'use_skill', battler: battler, skillName, msg: `${battler.name} uses ${skillName}!` });

      skill.effects.forEach((effect) => {
        const context = { boost };
        let effectKey = effect.type;
        let effectValue = effect.formula || effect.value;

        if (effect.type === 'add_status') {
             effectValue = { id: effect.status, chance: effect.chance };
        }

        const result = EffectProcessor.apply(effectKey, effectValue, battler, target, context);

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
    return events;
  }

  _executeAttack(action) {
    const { sourceContext, target } = action;
    const { battler, index, isEnemy } = sourceContext;
    const events = [];

    let base = battler.atk + randInt(-1, 1);

    if (!isEnemy) {
      const row = this._partyRow(index);
      if (row === "Front") base += 1;
      else base -= 1;
    }

    if (base < 1) base = 1;

    const evasionChance = target.getPassiveValue("EVA");
    if (evasionChance > 0 && Math.random() < evasionChance) {
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

    const mult = this.elementMultiplier(battler.elements, target.elements);
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

    return events;
  }

  _checkBattleEnd(events) {
    const anyEnemyAlive = this.enemies.some((e) => e.hp > 0);
    const anyPartyAlive = this.party.activeMembers.some((p) => p.hp > 0);

    if (!anyPartyAlive) {
      this.isBattleFinished = true;
      this.turnQueue = [];
      events.push({ type: "end", result: "defeat", msg: this.dataManager.terms.battle.your_party_collapses });
    } else if (!anyEnemyAlive) {
      this.isBattleFinished = true;
      this.isVictoryPending = true;
      this.turnQueue = [];
      events.push({ type: "end", result: "victory", msg: this.dataManager.terms.battle.victory });
    }
  }
}
