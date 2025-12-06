import { randInt, elementToAscii, probabilisticRound } from "../core/utils.js";
import { SoundManager } from "./sound.js";
import { Game_Action } from "../objects/action.js";

/**
 * @class BattleManager
 * @description Manages the state and flow of a single battle instance.
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

  // elementMultiplier moved to Game_Action but kept here if needed by other systems?
  // Removing it as it seems unused outside battle logic which is now in Game_Action.

  _partyRow(index) {
    return index <= 1 ? "Front" : "Back";
  }

  startRound(isFirstStrike = false) {
    if (this.isBattleFinished) return;
    this.round++;

    const combatants = [];
    this.party.slots.slice(0, 4).forEach((battler, index) => {
        if (battler) combatants.push({ battler, index, isEnemy: false });
    });
    this.enemies.forEach((b, i) => combatants.push({ battler: b, index: i, isEnemy: true }));

    const plannedQueue = combatants.map(ctx => {
        const action = this.getAIAction(ctx);
        // Note: For player, getAIAction acts as auto-battle or null if manual.
        // But BattleManager.startRound is called BEFORE player input in current Scene_Battle logic?
        // Wait, Scene_Battle calls startRound, then loops getNextBattler.
        // If it's the player's turn, getNextBattler returns the context.
        // Scene_Battle then waits for player input if action is null?
        // Actually, Scene_Battle loop:
        // const action = battlerContext.action;
        // if (action) execute...
        // So startRound plans actions for EVERYONE including player if auto?
        // Yes. If manual, action is null?
        // getAIAction returns action or null.

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

      if (scope.includes('self')) return [battlerContext.battler];

      const myTeam = isEnemy ? this.enemies : this.party.activeMembers;
      const opposingTeam = isEnemy ? this.party.activeMembers : this.enemies;

      if (scope.includes('ally')) targetSide = myTeam;
      else targetSide = opposingTeam;

      return targetSide.filter(b => b.hp > 0);
  }

  getAIAction(battlerContext) {
      const { battler } = battlerContext;
      const action = new Game_Action(battler);

      // Simple logic: 60% chance to use skill if available
      const skillId = (battler.skills && battler.skills.length && Math.random() < 0.6)
          ? battler.skills[randInt(0, battler.skills.length - 1)]
          : null;

      if (skillId) {
          const skill = this.dataManager.skills[skillId];
          const scope = skill ? skill.target : 'enemy';
          const targets = this.getValidTargets(battlerContext, scope);

          if (targets.length === 0) return null;

          let target;
          if (scope.includes('ally') && (skill.effects && skill.effects.some(e => e.type === 'hp_heal'))) {
              target = targets.reduce((prev, curr) => {
                  return (curr.hp / curr.maxHp) < (prev.hp / prev.maxHp) ? curr : prev;
              });
          } else {
              target = targets[randInt(0, targets.length - 1)];
          }

          action.setSkill(skill);
          action.setTarget(target);
          return action;
      } else {
          // Attack
          const targets = this.getValidTargets(battlerContext, 'enemy');
          if (targets.length === 0) return null;
          const target = targets[randInt(0, targets.length - 1)];

          action.setAttack();
          action.setTarget(target);
          return action;
      }
  }

  executeAction(action) {
    if (!action) return [];

    const battler = action.subject;
    // Check if battler is still alive
    if (battler.hp <= 0) return [];

    let target = action._target;

    // Smart re-targeting
    if (!target || target.hp <= 0) {
        // Find new target
        // We need sourceContext to determine scope if we want to be precise,
        // but action has subject and type.
        // If skill, we need scope. If attack, assume enemy.
        let scope = 'enemy';
        if (action.type === 'skill' && action.item) {
            scope = action.item.target;
        }

        // Reconstruct context for getValidTargets
        const isEnemy = this.enemies.includes(battler);
        const context = { battler, isEnemy };

        const targets = this.getValidTargets(context, scope);
        if (targets.length > 0) {
            target = targets[randInt(0, targets.length - 1)];
            action.setTarget(target);
        } else {
            return []; // Fizzle
        }
    }

    const events = action.apply(target, this.dataManager);
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
}
