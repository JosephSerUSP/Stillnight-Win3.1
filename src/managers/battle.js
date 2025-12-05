import { randInt, elementToAscii, probabilisticRound } from "../core/utils.js";
import { SoundManager } from "./sound.js";
import { Game_Action } from "../objects/action.js";

/**
 * @class BattleManager
 * @description Manages the state and flow of a single battle instance.
 * Handles turn order, action execution, and victory/defeat conditions.
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

  /**
   * Sets up a new battle with the given enemies.
   * @method setup
   * @param {import("../objects/objects.js").Game_Battler[]} enemies - The array of enemies for this battle.
   * @param {number} tileX - The X coordinate on the map where the battle started.
   * @param {number} tileY - The Y coordinate on the map where the battle started.
   * @param {boolean} [isSneakAttack=false] - Whether the enemy has the initiative advantage.
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
   * Calculates the damage multiplier based on elemental affinities.
   * Kept for compatibility.
   */
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

  /**
   * Gets the row name ("Front" or "Back") for a party member based on their index.
   * @private
   */
  _partyRow(index) {
    return index <= 1 ? "Front" : "Back";
  }

  /**
   * Initializes a new round of combat by creating a turn queue sorted by the default order.
   * @method startRound
   */
  startRound(isFirstStrike = false) {
    if (this.isBattleFinished) return;
    this.round++;

    // 1. Gather all potential combatants
    const combatants = [];
    this.party.slots.slice(0, 4).forEach((battler, index) => {
        if (battler) {
            combatants.push({ battler, index, isEnemy: false });
        }
    });
    this.enemies.forEach((b, i) => combatants.push({ battler: b, index: i, isEnemy: true }));

    // 2. Plan Actions & Calculate Total Speed
    const plannedQueue = combatants.map(ctx => {
        const action = this.getAIAction(ctx); // Plan the action (Game_Action)
        let actionSpeed = 0;
        if (action && action.item && action.item.speed) {
            actionSpeed = action.item.speed;
        }

        // Total Speed = Battler Speed + Action Speed
        const totalSpeed = ctx.battler.asp + actionSpeed;

        return { ...ctx, action, totalSpeed };
    });

    // 3. Sort by Total Speed
    const sortBySpeed = (queue) => queue.sort((a, b) => b.totalSpeed - a.totalSpeed);

    // 4. Determine Execution Order
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
   * Skips units that are dead.
   * @method getNextBattler
   * @returns {Object|null} The next battler context ({battler, index, isEnemy}) or null if the round is over.
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
   * Processes start-of-turn effects for the battler (e.g., passive drains).
   * @method startTurn
   * @param {Object} battlerContext - The context returned by getNextBattler().
   * @returns {Array} List of events occurring at start of turn.
   */
  startTurn(battlerContext) {
      const { battler, isEnemy } = battlerContext;
      const allies = isEnemy ? this.enemies : this.party.activeMembers;
      const events = battler.onTurnStart(allies, null, this.dataManager);
      this._checkBattleEnd(events);
      return events;
  }

  /**
   * Returns a list of valid targets for the battler based on the specified scope.
   * @method getValidTargets
   * @param {Object} battlerContext - The context of the battler.
   * @param {string} [scope='enemy'] - The target scope ('enemy', 'ally', 'self', etc.).
   * @returns {import("../objects/objects.js").Game_Battler[]} List of valid targets.
   */
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

  /**
   * Factory method to create an action object.
   * @method createAction
   * @param {Object} battlerContext - The source of the action.
   * @param {string} type - The type of action ('attack', 'skill').
   * @param {import("../objects/objects.js").Game_Battler} target - The target of the action.
   * @param {Object} [options] - Additional options (e.g., skillId).
   * @returns {Game_Action} The action object.
   */
  createAction(battlerContext, type, target, options = {}) {
      const action = new Game_Action(battlerContext.battler, this.dataManager);
      action.setTarget(target);
      if (type === 'skill') {
          action.setSkill(options.skillId);
      } else if (type === 'attack') {
          action.setAttack();
      }
      return action;
  }

  /**
   * Determines the AI action for a battler (or auto-battle for player).
   * @method getAIAction
   * @param {Object} battlerContext - The context of the battler.
   * @returns {Game_Action|null} An Action object, or null if no action can be taken.
   */
  getAIAction(battlerContext) {
      const { battler } = battlerContext;

      // 1. Decide Action Type (Skill or Attack)
      // Simple logic: 60% chance to use skill if available
      const skillId = (battler.skills && battler.skills.length && Math.random() < 0.6)
          ? battler.skills[randInt(0, battler.skills.length - 1)]
          : null;

      if (skillId) {
          const skill = this.dataManager.skills[skillId];
          const scope = skill ? skill.target : 'enemy';
          const targets = this.getValidTargets(battlerContext, scope);

          if (targets.length === 0) return null;

          // Smart targeting for healing
          let target;
          if (scope.includes('ally') && (skill.effects && skill.effects.some(e => e.type === 'hp_heal'))) {
              target = targets.reduce((prev, curr) => {
                  return (curr.hp / curr.maxHp) < (prev.hp / prev.maxHp) ? curr : prev;
              });
          } else {
              target = targets[randInt(0, targets.length - 1)];
          }

          return this.createAction(battlerContext, 'skill', target, { skillId });
      } else {
          // Attack (Scope: enemy)
          const targets = this.getValidTargets(battlerContext, 'enemy');
          if (targets.length === 0) return null;
          const target = targets[randInt(0, targets.length - 1)];
          return this.createAction(battlerContext, 'attack', target);
      }
  }

  /**
   * Executes the provided action and returns a list of resulting events.
   * @method executeAction
   * @param {Game_Action} action - The action object.
   * @returns {Array} List of events describing the outcome.
   */
  executeAction(action) {
    if (!action) return [];

    const battler = action.subject;
    let target = action._target;

    if (battler.hp <= 0) return [];

    // Re-validate target
    if (!target || target.hp <= 0) {
        const skill = action.item;
        const scope = skill ? skill.target : 'enemy';
        const context = { battler, isEnemy: battler.isEnemy };
        const targets = this.getValidTargets(context, scope);
        if (targets.length > 0) {
            target = targets[randInt(0, targets.length - 1)];
            action.setTarget(target);
        } else {
            return [];
        }
    }

    action.apply(target);
    const events = this._makeActionEvents(action);

    this._checkBattleEnd(events);
    return events;
  }

  /**
   * Generates events based on the action result.
   * @private
   */
  _makeActionEvents(action) {
      const events = [];
      const subject = action.subject;
      const target = action._target;
      const result = target.result();

      // 1. Use Skill Event
      if (action.item) {
           const skillName = action.item.name;
           const nameWithIcon = action.item.element ? `${elementToAscii(action.item.element)}${skillName}` : skillName;
           events.push({
               type: 'use_skill',
               battler: subject,
               skillName: nameWithIcon,
               msg: `${subject.name} uses ${nameWithIcon}!`
           });
      }

      if (!result.used) return events;

      // 2. Miss/Evade
      if (result.missed || result.evaded) {
           SoundManager.play('UI_CANCEL');
           events.push({
               type: 'miss',
               battler: subject,
               target: target,
               msg: `${subject.name} attacks ${target.name} but misses!`
           });
           return events;
      }

      // 3. Damage / Heal
      if (result.hpDamage !== 0) {
          if (result.hpDamage > 0) {
              SoundManager.play('DAMAGE');
              events.push({
                  type: 'damage',
                  battler: subject,
                  target: target,
                  value: result.hpDamage,
                  hpBefore: target.hp + result.hpDamage,
                  hpAfter: target.hp,
                  isCritical: result.critical,
                  msg: result.critical
                      ? `CRITICAL! ${subject.name} deals ${result.hpDamage} damage to ${target.name}!`
                      : `  ${target.name} takes ${result.hpDamage} damage.`
              });
          } else if (result.hpDamage < 0) {
              const healed = -result.hpDamage;
              SoundManager.play('HEAL');
              events.push({
                  type: 'heal',
                  battler: subject,
                  target: target,
                  value: healed,
                  hpBefore: target.hp - healed,
                  hpAfter: target.hp,
                  animation: 'healing_sparkle',
                  msg: `  ${target.name} heals ${healed} HP.`
              });
          }
      }

      // 4. States
      result.addedStates.forEach(stateId => {
          events.push({
              type: 'status',
              target: target,
              status: stateId,
              msg: `  ${target.name} is afflicted with ${stateId}.`
          });
      });

      return events;
  }

  /**
   * Checks if the battle has ended (win or loss) and appends end events if so.
   * @method _checkBattleEnd
   * @private
   * @param {Array} events - The event list to append to.
   */
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
