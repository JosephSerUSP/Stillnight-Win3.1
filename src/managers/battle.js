import { randInt } from "../core/utils.js";
import { SoundManager } from "./sound.js";
import { Game_Action } from "../objects/objects.js";

/**
 * @class BattleManager
 * @description Manages the state and flow of a single battle instance.
 * Handles turn order, action execution, and victory/defeat conditions.
 * The flow is:
 * 1. startRound() - Initializes the turn queue.
 * 2. getNextBattler() - Gets the next active battler.
 * 3. startTurn(battler) - Processes start-of-turn effects (passives).
 * 4. getAIAction(battler) - Generates an action for AI or auto-battle.
 * 5. executeAction(action) - Resolves the action and returns events.
 */
export class BattleManager {
  /**
   * Creates a new BattleManager instance.
   * @param {import("../objects/objects.js").Game_Party} party - The player's party.
   * @param {import("./data.js").DataManager} dataManager - The game's data manager.
   */
  constructor(party, dataManager) {
    /**
     * The player's party.
     * @type {import("../objects/objects.js").Game_Party}
     */
    this.party = party;

    /**
     * The global data manager.
     * @type {import("./data.js").DataManager}
     */
    this.dataManager = dataManager;

    /**
     * The list of enemies in the current battle.
     * @type {import("../objects/objects.js").Game_Battler[]}
     */
    this.enemies = [];

    /**
     * The current round number.
     * @type {number}
     */
    this.round = 0;

    /**
     * Whether the battle has finished.
     * @type {boolean}
     */
    this.isBattleFinished = false;

    /**
     * Whether victory has been achieved and is pending processing.
     * @type {boolean}
     */
    this.isVictoryPending = false;

    /**
     * The queue of battlers for the current turn.
     * @type {Array}
     */
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
   * Gets the row name ("Front" or "Back") for a party member based on their index.
   * @method _partyRow
   * @private
   * @param {number} index - The index of the party member.
   * @returns {string} "Front" or "Back".
   */
  _partyRow(index) {
    return index <= 1 ? "Front" : "Back";
  }

  /**
   * Initializes a new round of combat by creating a turn queue sorted by the default order.
   * @method planRound
   */
  planRound(isFirstStrike = false) {
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
        const action = this.getAIAction(ctx); // Plan the action

        let totalSpeed = ctx.battler.asp;
        if (action) {
            totalSpeed = action.speed;
        }

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
   * Retrieves the intended action for a specific battler from the current turn queue.
   * @method getPlannedAction
   * @param {Object} battler - The battler to query.
   * @returns {Object|null} The planned action info { actionName, target } or null.
   */
  getPlannedAction(battler) {
      const entry = this.turnQueue.find(e => e.battler === battler);
      if (!entry || !entry.action) return null;

      const action = entry.action;
      let actionName = "Attack";
      if (action.skillId) {
          const skill = this.dataManager.skills[action.skillId];
          actionName = skill ? skill.name : "Skill";
      }

      return {
          actionName,
          target: action.target
      };
  }

  /**
   * Calculates the predicted HP for a battler based on queued actions.
   * @method getPredictedHp
   * @param {import("../objects/objects.js").Game_Battler} battler - The battler to predict HP for.
   * @returns {number} The predicted HP (cannot be lower than 0).
   */
  getPredictedHp(battler) {
    let totalDamage = 0;
    let totalHealing = 0;

    this.turnQueue.forEach(entry => {
        const action = entry.action;
        if (action && action.target === battler) {
            // Calculate potential effect
            const prediction = action.calculate(battler, this.dataManager);
            totalDamage += prediction.damage;
            totalHealing += prediction.healing;
        }
    });

    // Calculate result
    // Note: This simple model doesn't account for turn order (who hits first)
    // or whether the battler might die midway. It just sums all incoming intent.
    const result = battler.hp - totalDamage + totalHealing;
    return Math.max(0, result);
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
   * Determines the AI action for a battler (or auto-battle for player).
   * @method getAIAction
   * @param {Object} battlerContext - The context of the battler.
   * @returns {Object|null} An Action object, or null if no action can be taken.
   */
  getAIAction(battlerContext) {
      const { battler, index, isEnemy } = battlerContext;

      // Create Action
      const action = new Game_Action(battler);

      // Set Row Bonus if player
      if (!isEnemy) {
          const row = this._partyRow(index);
          action.setRowBonus(row === "Front" ? 1 : -1);
      }

      // Context for targeting
      const myTeam = isEnemy ? this.enemies : this.party.activeMembers;
      let opposingTeam = isEnemy ? this.party.activeMembers : this.enemies;

      // Special Targeting Rule: Enemies target Summoner if party is empty/dead
      if (isEnemy) {
          const livingParty = this.party.activeMembers.filter(m => m.hp > 0);
          if (livingParty.length === 0 && this.party.summoner && this.party.summoner.hp > 0) {
              opposingTeam = [this.party.summoner];
          } else {
              opposingTeam = livingParty;
          }
      }

      // 1. Decide Action Type (Skill or Attack)
      // Simple logic: 60% chance to use skill if available
      const skillId = (battler.skills && battler.skills.length && Math.random() < 0.6)
          ? battler.skills[randInt(0, battler.skills.length - 1)]
          : null;

      if (skillId) {
          action.setSkill(skillId, this.dataManager);
          const targets = action.makeTargets(myTeam, opposingTeam);

          if (targets.length === 0) return null; // No valid targets for this skill, maybe fallback to attack?

          // Smart targeting for healing: prefer lowest HP
          const skill = this.dataManager.skills[skillId];
          const scope = skill ? skill.target : 'enemy';

          let target;
          if (scope.includes('ally') && (skill.effects.some(e => e.type === 'hp_heal'))) {
              // Find ally with lowest HP percentage
              target = targets.reduce((prev, curr) => {
                  return (curr.hp / curr.maxHp) < (prev.hp / prev.maxHp) ? curr : prev;
              });
          } else {
              target = targets[randInt(0, targets.length - 1)];
          }

          action.target = target;
          return action;
      } else {
          // Attack (Scope: enemy)
          action.setAttack();
          const targets = action.makeTargets(myTeam, opposingTeam);
          if (targets.length === 0) return null;
          const target = targets[randInt(0, targets.length - 1)];
          action.target = target;
          return action;
      }
  }

  /**
   * Executes the provided action and returns a list of resulting events.
   * Handles damage calculation, status application, and event generation.
   * @method executeAction
   * @param {Object} action - The action object {type, sourceContext, target, skillId}.
   * @returns {Array} List of events describing the outcome.
   */
  executeAction(action) {
    if (!action) return [];

    const { subject } = action;
    let { target } = action;

    if (subject.hp <= 0) return [];

    // Summoner MP Drain on Creature Action
    if (!subject.isEnemy && this.party.summoner) {
        // Only drain if it's a creature (in active slots)
        if (this.party.activeMembers.includes(subject)) {
             // Simple cost: 2 MP per action for now (User said calculable, base+multiplier)
             // Defaulting to 2 to be slightly more impactful than steps.
             const drain = 2;
             this.party.summoner.mp = Math.max(0, this.party.summoner.mp - drain);

             // Apply Weakened State logic here too if MP hits 0?
             if (this.party.summoner.mp === 0) {
                  if (!subject.isStateAffected('weakened')) {
                      subject.addState('weakened');
                      // Log it?
                      // events.push({ type: 'text', msg: `${subject.name} weakens!` }); // Can't easily push to events yet, we return them later.
                  }
                  // HP Loss for acting while weakened
                  const damage = Math.max(1, Math.floor(subject.maxHp * 0.05));
                  subject.hp = Math.max(0, subject.hp - damage);
             }
        }
    }

    // Re-validate target (Smart re-targeting)
    if (!target || target.hp <= 0) {
        // If target is dead, try to find a new target
        const isEnemy = subject.isEnemy;
        const myTeam = isEnemy ? this.enemies : this.party.activeMembers;
        let opposingTeam = isEnemy ? this.party.activeMembers : this.enemies;

        if (isEnemy) {
            const livingParty = this.party.activeMembers.filter(m => m.hp > 0);
            if (livingParty.length === 0 && this.party.summoner && this.party.summoner.hp > 0) {
                opposingTeam = [this.party.summoner];
            } else {
                opposingTeam = livingParty;
            }
        }

        const targets = action.makeTargets(myTeam, opposingTeam);
        if (targets.length > 0) {
            target = targets[randInt(0, targets.length - 1)];
            action.target = target; // Update action
        } else {
            return []; // Fizzle if no valid targets
        }
    }

    const events = action.apply(target, this.dataManager);

    this._checkBattleEnd(events);
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
    const summonerAlive = this.party.summoner ? this.party.summoner.hp > 0 : true;

    if (!summonerAlive) {
        this.isBattleFinished = true;
        this.turnQueue = [];
        SoundManager.play('GAME_OVER');
        events.push({ type: "end", result: "defeat", msg: "The Commander has fallen!" });
    } else if (!anyPartyAlive && !anyEnemyAlive) {
         // Mutual destruction (rare), but if party dead and enemies dead, usually victory or draw?
         // Assuming victory if enemies dead.
         this.isBattleFinished = true;
         this.isVictoryPending = true;
         this.turnQueue = [];
         events.push({ type: "end", result: "victory", msg: this.dataManager.terms.battle.victory });
    } else if (!anyPartyAlive) {
       // If creatures are dead but Summoner is alive, battle continues (enemies will target summoner).
       // So we DO NOT end battle here if summoner is alive.
       // However, we need to ensure turnQueue allows for that.
       // But wait, "Summoner doesn't act".
       // If all creatures are dead, the Summoner is just a sitting duck taking hits until they die or flee?
       // User said: "only targeted if there are no creatures".
       // And "actions are the player's actions - Formation, Item, etc."
       // So the player can still use Items/Flee.
       // So battle continues.
    } else if (!anyEnemyAlive) {
      this.isBattleFinished = true;
      this.isVictoryPending = true;
      this.turnQueue = [];
      events.push({ type: "end", result: "victory", msg: this.dataManager.terms.battle.victory });
    }
  }
}
