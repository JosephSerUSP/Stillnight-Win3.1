import { randInt } from "../core/utils.js";
import { SoundManager } from "./sound.js";
import { Game_Action } from "../objects/objects.js";
import { TemperamentSystem } from "./temperament.js";

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

      // Use TemperamentSystem to decide action
      const decision = TemperamentSystem.determineAction(battler, this);

      if (!decision) return null;

      if (decision.type === 'wait') {
           action.setSkill('wait', this.dataManager);
           action.target = battler;
           return action;
      }

      if (decision.skillId) {
           action.setSkill(decision.skillId, this.dataManager);
      } else {
           action.setAttack();
      }

      action.target = decision.target;
      return action;
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

    // Re-validate target (Smart re-targeting)
    if (!target || target.hp <= 0) {
        // If target is dead, try to find a new target
        const isEnemy = subject.isEnemy;
        const myTeam = isEnemy ? this.enemies : this.party.activeMembers;
        const opposingTeam = isEnemy ? this.party.activeMembers : this.enemies;

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
