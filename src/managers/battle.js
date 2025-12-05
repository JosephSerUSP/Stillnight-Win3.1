import { randInt, elementToAscii } from "../core/utils.js";
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
        const totalSpeed = action ? action.speed() : ctx.battler.asp;
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
      // We assume enemies is Opponents for Player and Allies for Enemy?
      // wait, onTurnStart signature is (allies, enemies, dataManager)
      // For Player: allies = party, enemies = this.enemies
      // For Enemy: allies = this.enemies, enemies = party
      const opponents = isEnemy ? this.party.activeMembers : this.enemies;

      const events = battler.onTurnStart(allies, opponents, this.dataManager);
      this._checkBattleEnd(events);
      return events;
  }

  /**
   * Determines the AI action for a battler (or auto-battle for player).
   * @method getAIAction
   * @param {Object} battlerContext - The context of the battler.
   * @returns {Game_Action|null} An Action object, or null if no action can be taken.
   */
  getAIAction(battlerContext) {
      const { battler } = battlerContext;
      const action = new Game_Action(battler, this.dataManager);

      // 1. Decide Action Type (Skill or Attack)
      const skillId = (battler.skills && battler.skills.length && Math.random() < 0.6)
          ? battler.skills[randInt(0, battler.skills.length - 1)]
          : null;

      if (skillId) {
          action.setSkill(skillId);
          // Pre-check targets? If no valid targets, fallback to attack?
          // Game_Action logic for makeTargets is context dependent.
          // AI Logic should check if it's usable.
          // For simplicity in this rewrite, we assume random skill usage is "valid" attempt.
          // Ideally, we'd check action.isValid() and action.makeTargets() count.

          const allies = battlerContext.isEnemy ? this.enemies : this.party.activeMembers;
          const opponents = battlerContext.isEnemy ? this.party.activeMembers : this.enemies;

          const potentialTargets = action.makeTargets(allies, opponents);
          if (potentialTargets.length === 0) {
              // Fallback
              action.setAttack();
          }
      } else {
          action.setAttack();
      }

      return action;
  }

  /**
   * Executes the provided action and returns a list of resulting events.
   * @method executeAction
   * @param {Game_Action} action
   * @returns {Array} List of events describing the outcome.
   */
  executeAction(action) {
    if (!action) return [];

    const battler = action._subject;
    // We need to determine if battler is enemy or ally to pass correct friends/opponents
    const isEnemy = this.enemies.includes(battler);
    const allies = isEnemy ? this.enemies : this.party.activeMembers;
    const opponents = isEnemy ? this.party.activeMembers : this.enemies;

    if (battler.hp <= 0) return [];

    const targets = action.makeTargets(allies, opponents);
    if (targets.length === 0) return [];

    const events = [];

    // "Uses Skill" Log
    if (action.isSkill()) {
        const item = action.item();
        const skillName = item.element ? `${elementToAscii(item.element)}${item.name}` : item.name;
        events.push({ type: 'use_skill', battler: battler, skillName, msg: `${battler.name} uses ${skillName}!` });
    }

    targets.forEach(target => {
        if (target.hp > 0) { // Double check target is alive before applying
            events.push(...action.apply(target));
        }
    });

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
      // SoundManager.play('GAME_OVER'); // Scene handles sound usually? Or Manager?
      // Original handled it here.
      events.push({ type: "end", result: "defeat", msg: this.dataManager.terms.battle.your_party_collapses });
    } else if (!anyEnemyAlive) {
      this.isBattleFinished = true;
      this.isVictoryPending = true;
      this.turnQueue = [];
      events.push({ type: "end", result: "victory", msg: this.dataManager.terms.battle.victory });
    }
  }
}
