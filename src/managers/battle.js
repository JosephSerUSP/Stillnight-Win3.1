import { randInt } from "../core/utils.js";
import { SoundManager } from "./sound.js";
import { Game_Action } from "../objects/objects.js";
import { ProgressionSystem } from "./progression.js";

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
        let totalSpeed = ctx.battler.asp;
        if (action) totalSpeed = action.speed;
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

  getAIAction(battlerContext) {
      const { battler, index, isEnemy } = battlerContext;
      const action = new Game_Action(battler);
      if (!isEnemy) {
          const row = this._partyRow(index);
          action.setRowBonus(row === "Front" ? 1 : -1);
      }
      const myTeam = isEnemy ? this.enemies : this.party.activeMembers;
      const opposingTeam = isEnemy ? this.party.activeMembers : this.enemies;

      const skillId = (battler.skills && battler.skills.length && Math.random() < 0.6)
          ? battler.skills[randInt(0, battler.skills.length - 1)]
          : null;

      if (skillId) {
          action.setSkill(skillId, this.dataManager);
          const targets = action.makeTargets(myTeam, opposingTeam);
          if (targets.length === 0) return null;
          const skill = this.dataManager.skills[skillId];
          const scope = skill ? skill.target : 'enemy';
          let target;
          if (scope.includes('ally') && (skill.effects.some(e => e.type === 'hp_heal'))) {
              target = targets.reduce((prev, curr) => (curr.hp / curr.maxHp) < (prev.hp / prev.maxHp) ? curr : prev);
          } else {
              target = targets[randInt(0, targets.length - 1)];
          }
          action.target = target;
          return action;
      } else {
          action.setAttack();
          const targets = action.makeTargets(myTeam, opposingTeam);
          if (targets.length === 0) return null;
          const target = targets[randInt(0, targets.length - 1)];
          action.target = target;
          return action;
      }
  }

  executeAction(action) {
    if (!action) return [];
    const { subject } = action;
    let { target } = action;
    if (subject.hp <= 0) return [];

    if (!target || target.hp <= 0) {
        const isEnemy = subject.isEnemy;
        const myTeam = isEnemy ? this.enemies : this.party.activeMembers;
        const opposingTeam = isEnemy ? this.party.activeMembers : this.enemies;
        const targets = action.makeTargets(myTeam, opposingTeam);
        if (targets.length > 0) {
            target = targets[randInt(0, targets.length - 1)];
            action.target = target;
        } else {
            return [];
        }
    }

    // --- Growth Tracking Hooks ---
    if (!subject.isEnemy) {
        if (action.isSkill) {
            subject.battleStats.magicUsed[action.skillId] = (subject.battleStats.magicUsed[action.skillId] || 0) + 1;
            subject.battleStats.mpSpent += action.mpCost;
        } else {
            // Weapon attack
            // Assuming we can get weapon type from equipped weapon
            const wType = (subject.equipmentItem && subject.equipmentItem.weaponType) || 'fist';
            subject.battleStats.attacksMade[wType] = (subject.battleStats.attacksMade[wType] || 0) + 1;
        }
    }
    // ----------------------------

    const events = action.apply(target, this.dataManager);

    // --- Damage Tracking Hooks ---
    events.forEach(ev => {
        if (ev.type === 'hp_damage' && !ev.target.isEnemy) {
             ev.target.battleStats.hpLost += ev.value;
             ev.target.battleStats.timesAttacked++;
        }
    });
    // -----------------------------

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

      // Process Stat Growth
      this.party.activeMembers.forEach(p => {
          const msgs = ProgressionSystem.checkGrowth(p);
          msgs.forEach(m => events.push({ type: 'log', msg: m }));
      });

      events.push({ type: "end", result: "victory", msg: this.dataManager.terms.battle.victory });
    }
  }
}
