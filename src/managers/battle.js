import { randInt } from "../core/utils.js";
import { SoundManager } from "./sound.js";
import { Game_Action } from "../objects/objects.js";

export class BattleManager {
  constructor(party, dataManager) {
    this.party = party;
    this.dataManager = dataManager;
    this.enemies = [];
    this.allBattlers = [];
    this.isBattleFinished = false;
    this.isVictoryPending = false;
    this.currentTick = 0;
  }

  setup(enemies, tileX, tileY, isSneakAttack = false) {
    this.enemies = enemies;
    this.tileX = tileX;
    this.tileY = tileY;
    this.isSneakAttack = isSneakAttack;
    this.isBattleFinished = false;
    this.isVictoryPending = false;
    this.currentTick = 0;

    // Initialize CTB
    this.allBattlers = [...this.party.activeMembers, ...this.enemies];
    this.allBattlers.forEach(b => {
        // Initial delay based on agility. Higher agility = lower delay.
        // Formula: 1000 / Agility
        const agi = Math.max(1, b.agi);
        const delay = Math.floor(1000 / agi);
        // Random variance to prevent ties
        b.nextTurnTick = delay + randInt(0, 5);

        // Sneak attack adjustments
        if (isSneakAttack && !b.isEnemy) b.nextTurnTick += 50; // Party delayed
        if (isSneakAttack && b.isEnemy) b.nextTurnTick -= 20; // Enemy faster
    });
  }

  /**
   * Gets the next active battler.
   * Advances time to the next battler's turn.
   */
  getNextBattler() {
      if (this.isBattleFinished) return null;

      // Filter out dead
      this.allBattlers = [...this.party.activeMembers.filter(b => b.hp > 0), ...this.enemies.filter(b => b.hp > 0)];

      if (this.allBattlers.length === 0) return null; // Everyone dead?

      // Find battler with lowest nextTurnTick
      let nextBattler = this.allBattlers[0];
      for (const b of this.allBattlers) {
          if (b.nextTurnTick < nextBattler.nextTurnTick) {
              nextBattler = b;
          }
      }

      // Advance global tick
      this.currentTick = nextBattler.nextTurnTick;

      return {
          battler: nextBattler,
          isEnemy: nextBattler.isEnemy,
          index: nextBattler.isEnemy ? this.enemies.indexOf(nextBattler) : this.party.activeMembers.indexOf(nextBattler)
      };
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

      // AI Logic (Simple)
      const myTeam = isEnemy ? this.enemies : this.party.activeMembers;
      const opposingTeam = isEnemy ? this.party.activeMembers : this.enemies;

      const validSkills = battler.skills.filter(id => {
          // Check costs? (MP not implemented fully yet, assume available)
          return true;
      });

      let skillId = null;
      if (validSkills.length > 0 && Math.random() < 0.6) {
          skillId = validSkills[randInt(0, validSkills.length - 1)];
      }

      if (skillId) {
          action.setSkill(skillId, this.dataManager);
      } else {
          action.setAttack();
      }

      const targets = action.makeTargets(myTeam, opposingTeam);
      if (targets.length === 0) return null;

      // Smart targeting (lowest HP for heals, random for attack)
      if (action.isHeal()) {
           action.target = targets.reduce((p, c) => (c.hp < p.hp ? c : p));
      } else {
           action.target = targets[randInt(0, targets.length - 1)];
      }

      return action;
  }

  executeAction(action) {
    if (!action) return [];

    const { subject } = action;
    let { target } = action;

    if (subject.hp <= 0) return [];

    // Re-validate target
    if (!target || target.hp <= 0) {
        if (!action.isRevive()) { // Allow targeting dead if revive
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
    }

    const events = action.apply(target, this.dataManager);

    // Calculate Delay for Next Turn
    this._applyTurnDelay(subject, action);

    this._checkBattleEnd(events);
    return events;
  }

  _applyTurnDelay(battler, action) {
      // Base calculation
      const agi = Math.max(1, battler.agi);
      let rank = 3; // Default rank

      // Check action rank/speed
      // Using action.item() data if available
      const item = action.item();
      if (item) {
          // Check for ctb_delay effect or property
          // Assuming 'speed' property in item/skill implies rank?
          // Default engine uses speed for priority.
          // I'll look for specific effects.
      }

      // Quick Hit Implementation: Look for 'ctb_delay' effect in executed events?
      // Or in item traits?
      // I'll assume standard Rank 3.

      // If "Quick Hit" (id: quickHit), Rank 1.
      if (item && item.id === 'quickHit') rank = 1;
      if (item && item.id === 'item') rank = 2; // Item usage

      let delay = Math.floor((rank * 1000) / agi);

      // Haste/Slow
      if (battler.isStateAffected('haste')) delay = Math.floor(delay / 2);
      if (battler.isStateAffected('slow')) delay = Math.floor(delay * 2);

      battler.nextTurnTick += delay;
  }

  _checkBattleEnd(events) {
    const anyEnemyAlive = this.enemies.some((e) => e.hp > 0);
    const anyPartyAlive = this.party.activeMembers.some((p) => p.hp > 0);

    if (!anyPartyAlive) {
      this.isBattleFinished = true;
      events.push({ type: "end", result: "defeat", msg: this.dataManager.terms.battle.your_party_collapses });
    } else if (!anyEnemyAlive) {
      this.isBattleFinished = true;
      this.isVictoryPending = true;
      events.push({ type: "end", result: "victory", msg: this.dataManager.terms.battle.victory });
    }
  }

  /**
   * Preview upcoming turns (for UI).
   * Returns sorted list of next N battlers.
   */
  getTurnOrderPreview(count = 10) {
      // Simulation is hard without copying state.
      // Simple preview: sort current allBattlers by nextTurnTick.
      const active = [...this.party.activeMembers.filter(b => b.hp > 0), ...this.enemies.filter(b => b.hp > 0)];
      active.sort((a, b) => a.nextTurnTick - b.nextTurnTick);
      return active.slice(0, count);
  }
}
