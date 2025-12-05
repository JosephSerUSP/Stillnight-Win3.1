import { randInt, elementToAscii, probabilisticRound } from "../core/utils.js";
import { SoundManager } from "./sound.js";
import { EffectProcessor } from "./effect_processor.js";

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

    /**
     * Number of times the player has attempted to flee this battle.
     * @type {number}
     */
    this.fleeAttempts = 0;
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
    this.fleeAttempts = 0;

    // Assign slot indices to party members for this battle
    this.party.slots.forEach((member, index) => {
        if (member) member.slotIndex = index;
    });
  }

  /**
   * Attempts to flee from battle.
   * Consumes MP/Gold and calculates success based on attempts.
   * @returns {Object} Result { success: boolean, cost: { mp: number, gold: number } }
   */
  attemptFlee() {
      this.fleeAttempts++;

      // Calculate costs (semi-random)
      // MP Cost: 1-5 MP?
      // Gold Cost: 1-10% of held gold? Or flat amount?
      // "Costs a semi-random amount of MP and money."
      const mpCost = randInt(2, 5);
      const goldCost = Math.floor(this.party.gold * (randInt(1, 5) / 100)) + randInt(1, 10);

      // Consume costs
      this.party.summoner.consumeMp(mpCost);
      this.party.gold = Math.max(0, this.party.gold - goldCost);

      // Calculate Chance
      // "Chances increase with every attempt."
      // Base chance + bonus per attempt
      let chance = 0.4 + (this.fleeAttempts * 0.1);

      // Add Traits bonus
      // This logic should probably be in Scene_Battle or Game_Party, but BattleManager handles battle logic.
      // We need to iterate party for 'FLEE_CHANCE_BONUS'
      let bonus = 0;
      this.party.activeMembers.forEach(m => {
          if (m.hp > 0) bonus += m.getPassiveValue('FLEE_CHANCE_BONUS');
      });

      chance += bonus;

      const success = Math.random() < chance;

      if (success) {
          this.isBattleFinished = true;
      }

      return { success, cost: { mp: mpCost, gold: goldCost } };
  }

  /**
   * Calculates the damage multiplier based on elemental affinities.
   * @method elementMultiplier
   * @param {string[]} attackerElements - The elements of the attacker.
   * @param {string[]} defenderElements - The elements of the defender.
   * @returns {number} The final damage multiplier (e.g., 1.5 for weakness, 0.75 for resistance).
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
        let actionSpeed = 0;
        if (action && action.skillId) {
            // Check skill speed
            const skill = this.dataManager.skills[action.skillId];
            // Apply actionSpeed trait logic here if skills are Trait Objects (not yet full implementation, using data)
            // Design: 'actionSpeed' is a flat modifier applied to a trait object's Skills' 'actionSpeed'

            // Base skill speed
            let baseSkillSpeed = skill.speed || 0;

            // Apply 'actionSpeed' trait from battler (if battler has traits that modify this skill's speed)
            // Implementation note: The design implies "Trait Objects" (Items/Passives) have actions, and traits on THOSE objects modify THOSE actions.
            // Current system: Skills are on Battler.
            // Simplified: Battler 'actionSpeed' trait adds to ALL skill speeds.
            const speedMod = ctx.battler.getPassiveValue('actionSpeed');
            actionSpeed = baseSkillSpeed + speedMod;
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

      // Determine logical side
      // if scope is 'enemy', we want the Opposing side.
      // if scope is 'ally', we want the Same side.

      let targetSide = [];

      if (scope.includes('self')) {
          return [battlerContext.battler];
      }

      // "Enemy" means "The opposing team"
      // "Ally" means "My team"

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
   * @returns {Object} The action object.
   */
  createAction(battlerContext, type, target, options = {}) {
      return {
          type,
          sourceContext: battlerContext,
          target,
          ...options
      };
  }

  /**
   * Determines the AI action for a battler (or auto-battle for player).
   * @method getAIAction
   * @param {Object} battlerContext - The context of the battler.
   * @returns {Object|null} An Action object, or null if no action can be taken.
   */
  getAIAction(battlerContext) {
      const { battler, index } = battlerContext;

      // Filter usable skills based on formationSlots
      const usableSkills = (battler.skills || []).filter(skillId => {
          const skill = this.dataManager.skills[skillId];
          if (!skill) return false;
          // Check formation restriction
          if (skill.formationSlots && Array.isArray(skill.formationSlots)) {
              if (!skill.formationSlots.includes(index)) return false;
          }
          return true;
      });

      // 1. Decide Action Type (Skill or Attack)
      // Simple logic: 60% chance to use skill if available
      const skillId = (usableSkills.length && Math.random() < 0.6)
          ? usableSkills[randInt(0, usableSkills.length - 1)]
          : null;

      if (skillId) {
          const skill = this.dataManager.skills[skillId];
          const scope = skill ? skill.target : 'enemy';
          const targets = this.getValidTargets(battlerContext, scope);

          if (targets.length === 0) return null; // No valid targets for this skill, maybe fallback to attack?

          // Smart targeting for healing: prefer lowest HP
          let target;
          if (scope.includes('ally') && (skill.effects.some(e => e.type === 'hp_heal'))) {
              // Find ally with lowest HP percentage
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
   * Handles damage calculation, status application, and event generation.
   * @method executeAction
   * @param {Object} action - The action object {type, sourceContext, target, skillId}.
   * @returns {Array} List of events describing the outcome.
   */
  executeAction(action) {
    if (!action) return [];

    const { sourceContext } = action;
    const { battler } = sourceContext;
    let { target } = action;

    if (battler.hp <= 0) return [];

    // Re-validate target (Smart re-targeting)
    if (!target || target.hp <= 0) {
        // If target is dead, try to find a new target
        const skill = action.skillId ? this.dataManager.skills[action.skillId] : null;
        const scope = skill ? skill.target : 'enemy';
        const targets = this.getValidTargets(sourceContext, scope);
        if (targets.length > 0) {
            target = targets[randInt(0, targets.length - 1)];
            action.target = target; // Update action
        } else {
            return []; // Fizzle if no valid targets
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

  /**
   * Internal handler for skill actions.
   * @private
   */
  _executeSkill(action) {
    const { sourceContext, target } = action;
    const { battler } = sourceContext;
    const events = [];

    const skill = this.dataManager.skills[action.skillId];
    if (skill) {
      let boost = 1;
      // Design: Damage is increased by *1.25 for every instance of that element that the caster also has
      if (skill.element) {
        const matches = battler.elements.filter((e) => e === skill.element).length;
        if (matches > 0) {
            // "increased by *1.25" usually means Multiplier += 0.25 * matches, or Multiplier *= (1.25 ^ matches)?
            // Design doc says: "damage is increased by *1.25 for every instance"
            // Interpreting as Multiplier * (1.25 * matches) or Multiplier * (1.25 ^ matches)?
            // Phrasing "increased by *1.25" is slightly ambiguous math.
            // Often means "Apply 1.25 multiplier per instance".
            // So 1 match = x1.25, 2 matches = x1.5625 (1.25*1.25).
            // Code was: boost += matches * 0.25 (Additive).
            // I will switch to Multiplicative to match "*1.25" phrasing strictly.
            boost = Math.pow(1.25, matches);
        }
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
             SoundManager.play('DAMAGE');
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
             SoundManager.play('HEAL');
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
             SoundManager.play('DAMAGE');
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

  /**
   * Internal handler for attack actions.
   * @private
   */
  _executeAttack(action) {
    const { sourceContext, target } = action;
    const { battler, index, isEnemy } = sourceContext;
    const events = [];

    // Normal Attack
    // Base logic moved to Game_Battler.atk (includes traits)
    // BattleManager adds variance (+/- 1)
    let base = battler.atk + randInt(-1, 1);

    if (!isEnemy) {
      const row = this._partyRow(index);
      if (row === "Front") base += 1;
      else base -= 1;
    }

    if (base < 1) base = 1;

    // Evasion Check
    // Evasion is determined by EVA trait on target
    const evasionChance = target.getPassiveValue("EVA");
    if (evasionChance > 0 && Math.random() < evasionChance) {
        SoundManager.play('UI_CANCEL'); // Or miss sound
        events.push({
            type: "miss",
            battler: battler,
            target: target,
            msg: `${battler.name} attacks ${target.name} but misses!`,
        });
        return events;
    }

    // Critical Hit Check
    // Crit chance is determined by CRI trait on attacker
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

    // Play ATTACK/DAMAGE sound
    SoundManager.play('DAMAGE');

    const msg = isCritical
        ? `CRITICAL! ${battler.name} deals ${dmg} damage to ${target.name}!`
        : `${battler.name} attacks ${target.name} for ${dmg}.`;

    if (isCritical) {
        // Flash logic handled by animation helper if needed, but we can signal it in event
        // The animateEvents in Scene_Battle handles 'damage' type.
        // We can add a property to trigger extra flash.
    }

    events.push({
      type: "damage",
      battler: battler,
      target: target,
      value: dmg,
      hpBefore: hpBefore,
      hpAfter: target.hp,
      isCritical: isCritical, // Pass flag for UI
      msg: msg,
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
