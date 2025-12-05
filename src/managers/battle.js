import { randInt } from "../core/utils.js";
import { SoundManager } from "./sound.js";
import { Game_Action } from "../objects/action.js";
import { ActionEffectSystem } from "./action_effects.js";

/**
 * @class BattleManager
 * @description Manages the state and flow of a single battle instance.
 * Refactored to use Game_Action and ActionEffectSystem.
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

    // Default Attack Skill Definition
    this.ATTACK_SKILL = {
        id: 'attack',
        name: 'Attack',
        target: 'enemy',
        effects: [{ type: 'phys_damage', formula: 'a.atk' }]
    };
  }

  /**
   * Sets up a new battle with the given enemies.
   */
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

  /**
   * Initializes a new round of combat.
   */
  startRound(isFirstStrike = false) {
    if (this.isBattleFinished) return;
    this.round++;

    const combatants = [];
    this.party.activeMembers.forEach((battler, index) => {
        combatants.push({ battler, index, isEnemy: false });
    });
    this.enemies.forEach((b, i) => combatants.push({ battler: b, index: i, isEnemy: true }));

    const plannedQueue = combatants.map(ctx => {
        const action = this.getAIAction(ctx);
        let actionSpeed = 0;
        if (action && action.item && action.item.speed) {
            actionSpeed = action.item.speed;
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

  /**
   * Retrieves the next active participant from the turn queue.
   */
  getNextBattler() {
      if (this.isBattleFinished) return null;
      let p = this.turnQueue.shift();
      while (p && p.battler.hp <= 0) {
           p = this.turnQueue.shift();
      }
      return p || null;
  }

  /**
   * Processes start-of-turn effects.
   */
  startTurn(battlerContext) {
      const { battler, isEnemy } = battlerContext;
      const allies = isEnemy ? this.enemies : this.party.activeMembers;
      const enemies = isEnemy ? this.party.activeMembers : this.enemies;

      const events = battler.onTurnStart(allies, enemies, this.dataManager);
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

  getAIAction(battlerContext) {
      const { battler } = battlerContext;

      const skillId = (battler.skills && battler.skills.length && Math.random() < 0.6)
          ? battler.skills[randInt(0, battler.skills.length - 1)]
          : null;

      if (skillId) {
          const skill = this.dataManager.skills[skillId];
          if (skill) {
              const scope = skill.target || 'enemy';
              const targets = this.getValidTargets(battlerContext, scope);

              if (targets.length > 0) {
                  let target = targets[randInt(0, targets.length - 1)];

                  // Smart Healing Logic
                  if (scope.includes('ally') && skill.effects && skill.effects.some(e => e.type === 'hp_heal' || e.type === 'hp')) {
                      target = targets.reduce((prev, curr) => (curr.hp / curr.maxHp) < (prev.hp / prev.maxHp) ? curr : prev);
                  }

                  const action = new Game_Action(battler, skill);
                  action.setTarget(target);
                  return action;
              }
          }
      }

      // Default Attack
      const targets = this.getValidTargets(battlerContext, 'enemy');
      if (targets.length > 0) {
          const target = targets[randInt(0, targets.length - 1)];
          const action = new Game_Action(battler, this.ATTACK_SKILL);
          action.setTarget(target);
          return action;
      }

      return null;
  }

  executeAction(action) {
    if (!action) return [];

    const battler = action.subject;
    if (battler.hp <= 0) return [];

    // Retargeting
    let target = action._target;
    if (!target || target.hp <= 0) {
        const scope = (action.item && action.item.target) || 'enemy';
        const isEnemy = this.enemies.includes(battler);
        const context = { battler, isEnemy };
        const targets = this.getValidTargets(context, scope);
        if (targets.length > 0) {
            target = targets[randInt(0, targets.length - 1)];
            action.setTarget(target);
        } else {
            return [];
        }
    }

    const context = {
        dataManager: this.dataManager
    };

    const events = action.execute(context);
    this._checkBattleEnd(events);
    return events;
  }

  _checkBattleEnd(events) {
    const anyEnemyAlive = this.enemies.some((e) => e.hp > 0);
    const anyPartyAlive = this.party.activeMembers.some((p) => p.hp > 0);

    if (!anyPartyAlive) {
      this.isBattleFinished = true;
      this.turnQueue = [];
      SoundManager.play('GAME_OVER');
      events.push({ type: "end", result: "defeat", msg: this.dataManager.terms.battle.your_party_collapses });
    } else if (!anyEnemyAlive) {
      this.isBattleFinished = true;
      this.isVictoryPending = true;
      this.turnQueue = [];
      events.push({ type: "end", result: "victory", msg: this.dataManager.terms.battle.victory });
    }
  }

  // Compatibility method for createAction used by BattleScene and Tests
  createAction(battlerContext, type, target, options = {}) {
      const { battler } = battlerContext;
      let item;
      if (type === 'attack') {
          item = this.ATTACK_SKILL;
      } else if (type === 'skill') {
          item = this.dataManager.skills[options.skillId];
      }

      const action = new Game_Action(battler, item);
      action.setTarget(target);
      return action;
  }

  // Compatibility method for elementMultiplier used by Tests
  elementMultiplier(attackerElements, defenderElements) {
      return ActionEffectSystem.elementMultiplier(attackerElements, defenderElements, this.dataManager);
  }
}
