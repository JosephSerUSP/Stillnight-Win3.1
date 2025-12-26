import { BattleState } from "../session/battle_state.js";
import { EffectSystem } from "../rules/effects.js";
import { ProgressionSystem } from "./progression.js";
import { Registry } from "../data/registry.js";
import { randInt, random, elementToAscii } from "../../core/utils.js";

/**
 * Pure-ish system for Battle logic.
 */
export class BattleSystem {
  constructor() {
    this._hooks = {};
  }

  /**
   * Initializes a new battle state.
   */
  createSession(participants, options = {}) {
    const state = new BattleState(participants);
    state.tileX = options.tileX || 0;
    state.tileY = options.tileY || 0;
    state.isSneakAttack = !!options.isSneakAttack;
    return state;
  }

  /**
   * Calculates turn order for the round.
   * @param {BattleState} state
   * @param {boolean} isFirstStrike
   */
  planRound(state, isFirstStrike = false) {
    if (state.result) return;
    state.round++;

    // 1. Gather all potential combatants
    const combatants = [];

    // Use activeMembers (now includes Summoner) but filter Summoner out of turn queue
    let partyMembers = [];
    if (state.participants.party.activeMembers) {
        partyMembers = state.participants.party.activeMembers;
    } else {
        // Fallback for mocks
        partyMembers = (state.participants.party.slots || []).slice(0, 5).filter(b => b);
    }

    partyMembers.forEach((battler, index) => {
        // Requirement: Summoner does not participate in the turn queue
        if (battler.role === 'Summoner') return;

        combatants.push({ battler, index, isEnemy: false });
    });

    const enemies = state.participants.enemies || [];
    enemies.forEach((b, i) => combatants.push({ battler: b, index: i, isEnemy: true }));

    // 2. Plan Actions & Calculate Total Speed
    const plannedQueue = combatants.map(ctx => {
        const action = this.getAIAction(state, ctx);

        let totalSpeed = ctx.battler.asp || 0;
        if (action) {
            totalSpeed = action.speed || totalSpeed;
        }

        return { ...ctx, action, totalSpeed };
    });

    // 3. Sort by Total Speed
    const sortBySpeed = (queue) => queue.sort((a, b) => b.totalSpeed - a.totalSpeed);

    // 4. Determine Execution Order
    if (isFirstStrike) {
        state.turnQueue = sortBySpeed(plannedQueue.filter(c => !c.isEnemy));
    } else if (state.round === 1 && state.isSneakAttack) {
        const enemies = sortBySpeed(plannedQueue.filter(c => c.isEnemy));
        const party = sortBySpeed(plannedQueue.filter(c => !c.isEnemy));
        state.turnQueue = [...enemies, ...party];
    } else {
        state.turnQueue = sortBySpeed(plannedQueue);
    }
  }

  /**
   * Retrieves the intended action for a specific battler from the current turn queue.
   * @param {BattleState} state
   * @param {Object} battler - The battler to query.
   * @returns {Object|null} The planned action info { actionName, target } or null.
   */
  getPlannedAction(state, battler) {
      if (!state.turnQueue) return null;

      const entry = state.turnQueue.find(e => e.battler === battler);
      if (!entry || !entry.action) return null;

      const action = entry.action;
      let actionName = "Action";

      if (action.skillId) {
          const skill = Registry.getSkill(action.skillId);
          actionName = skill ? skill.name : "Skill";
      } else if (action._item) { // Legacy Game_Action property
          actionName = action._item.name;
      }

      return {
          actionName,
          target: action.target
      };
  }

  /**
   * Gets the next battler from the queue.
   * @param {BattleState} state
   */
  getNextBattler(state) {
      if (state.result) return null;

      let p = state.turnQueue.shift();
      while (p && p.battler.hp <= 0) {
           p = state.turnQueue.shift();
      }
      return p || null;
  }

  /**
   * Determines AI action.
   * @param {BattleState} state
   * @param {Object} battlerContext
   */
  getAIAction(state, battlerContext) {
      const { battler, isEnemy } = battlerContext;

      const skills = battler.skills || [];
      if (skills.length === 0) {
          return null; // Do nothing if no skills
      }

      const skillId = skills[randInt(0, skills.length - 1)];

      let action = {
          subject: battler,
          speed: battler.asp || 0
      };

      const skill = Registry.getSkill(skillId);
      let scope = 'enemy';

      if (skill) {
           action.skillId = skillId;
           action.speed += (skill.speed || 0);
           action.item = skill; // Attach data for convenience
           scope = skill.target || 'enemy';
      } else {
           // Skill defined in actor but not in registry?
           // Fallback to null (wait)
           return null;
      }

      const validTargets = this._getValidTargets(state, battler, scope);

      if (validTargets.length > 0) {
          // Smart targeting for healing
          if (scope.includes('ally') && action.item && action.item.effects.some(e => e.type === 'hp_heal' || e.type === 'hp')) {
              action.target = validTargets.reduce((prev, curr) => {
                  return (curr.hp / curr.maxHp) < (prev.hp / prev.maxHp) ? curr : prev;
              });
          } else {
              action.target = validTargets[randInt(0, validTargets.length - 1)];
          }
      }

      return action;
  }

  _getValidTargets(state, subject, scope = 'enemy') {
      const isEnemy = subject.isEnemy;

      // Define Teams
      let myTeam = [];
      let opposingTeam = [];

      // Get Opposing Team (Player Party vs Enemies)
      if (isEnemy) {
           // Enemy pov
           opposingTeam = this._getPartyActive(state);
           myTeam = state.participants.enemies || [];
      } else {
           // Player pov
           opposingTeam = (state.participants.enemies || []).filter(m => m.hp > 0);
           myTeam = this._getPartyActive(state);
      }

      // Filter by Scope
      if (scope.includes('self')) {
          return [subject];
      }

      let targets = [];
      if (scope.includes('ally')) {
          targets = myTeam;
      } else {
          targets = opposingTeam;
      }

      // Default filter: alive
      if (!scope.includes('dead')) {
          targets = targets.filter(b => b.hp > 0);
      } else {
          targets = targets.filter(b => b.hp <= 0);
      }

      return targets;
  }

  _getPartyActive(state) {
      if (state.participants.party.activeMembers) {
          return state.participants.party.activeMembers.filter(m => m.hp > 0);
      }
      return (state.participants.party.slots || []).slice(0, 5).filter(m => m && m.hp > 0);
  }

  /**
   * Executes an action.
   * @param {BattleState} state
   * @param {Object} action
   * @returns {Array} List of events.
   */
  executeAction(state, action) {
      if (!action) return [];
      const events = [];
      const { subject } = action;
      let { target } = action;

      if (!subject || subject.hp <= 0) return [];

      // Re-targeting logic
      if (!target || target.hp <= 0) {
           let scope = 'enemy';
           if (action.item) scope = action.item.target || 'enemy';

           const targets = this._getValidTargets(state, subject, scope);

           if (targets.length > 0) {
               target = targets[randInt(0, targets.length - 1)];
               action.target = target;
           } else {
               return []; // Fizzle
           }
      }

      if (action.skillId) {
           this._executeSkill(state, action, events);
      } else if (action.itemId) {
           this._executeItem(state, action, events);
      }

      this._checkBattleEnd(state, events);
      return events;
  }

  _executeSkill(state, action, events) {
      const battler = action.subject;
      const target = action.target;
      const skill = action.item || Registry.getSkill(action.skillId);

      if (!skill) return;

      const skillName = skill.element ? `${elementToAscii(skill.element)}${skill.name}` : skill.name;
      events.push({ type: 'use_skill', battler, skillName, msg: `${battler.name} uses ${skillName}!` });

      let boost = 1;
      // Element Boost (Self)
      if (skill.element && battler.elements.includes(skill.element)) {
          boost += 0.25;
      }

      // Element Multiplier (Target)
      let elementMult = 1.0;
      if (skill.element) {
          elementMult = this._elementMultiplier([skill.element], target.elements);
      }

      skill.effects.forEach((effect) => {
          const context = { boost };
          if (effect.type === 'hp_damage' || effect.type === 'hp_drain') {
               context.boost = (context.boost || 1) * elementMult;
          }

          let effectKey = effect.type;
          let effectValue = effect.formula || effect.value;

          if (effect.type === 'add_status') {
               effectValue = { id: effect.status, chance: effect.chance };
          }

          const result = EffectSystem.apply(effectKey, effectValue, battler, target, {
              ...context,
              progressionSystem: ProgressionSystem
          });

          if (result) {
               if (result.type === 'damage') {
                   result.msg = `  ${target.name} takes ${result.value} damage.`;
               } else if (result.type === 'heal') {
                   result.msg = `  ${target.name} heals ${result.value} HP.`;
               } else if (result.type === 'status') {
                    result.msg = `  ${target.name} is afflicted with ${result.status}.`;
               }
               events.push(result);
          }
      });
  }

  _executeItem(state, action, events) {
      const subject = action.subject;
      const target = action.target;
      const item = action.item || Registry.getItem(action.itemId);

      if (!item) return;

      if (item.type !== 'equipment' && subject.inventory && Array.isArray(subject.inventory)) {
            const idx = subject.inventory.findIndex(i => i.id === item.id);
            if (idx !== -1) subject.inventory.splice(idx, 1);
      }

      events.push({ type: 'use_item', battler: subject, itemName: item.name, msg: `${subject.name} uses ${item.name} on ${target.name}.` });

      if (item.effects) {
          item.effects.forEach(effect => {
               const result = EffectSystem.apply(effect.type, effect.formula || effect.value, item, target, {
                   progressionSystem: ProgressionSystem
               });
               if (result) {
                    if (result.type === 'heal') result.msg = `  ${target.name} heals ${result.value} HP.`;
                    events.push(result);
               }
          });
      }
  }

  _elementMultiplier(attackerElements, defenderElements) {
      let multiplier = 1;
      if (!attackerElements || !defenderElements) return 1;

      let advantageFound = false;
      let disadvantageFound = false;

      for (const attackerEl of attackerElements) {
          if (advantageFound || disadvantageFound) break;
          for (const defenderEl of defenderElements) {
               const row = Registry.elements ? Registry.elements[attackerEl] : null;
               if (row) {
                   if (row.strong && row.strong.includes(defenderEl)) advantageFound = true;
                   if (row.weak && row.weak.includes(defenderEl)) disadvantageFound = true;
               }
          }
      }

      if (advantageFound) multiplier = 1.5;
      else if (disadvantageFound) multiplier = 0.75;

      return multiplier;
  }

  _checkBattleEnd(state, events) {
    const enemies = state.participants.enemies || [];
    // activeMembers includes Summoner now
    const summoner = state.participants.party.summoner; // Still exists as getter
    const summonerAlive = summoner ? summoner.hp > 0 : true;

    const anyEnemyAlive = enemies.some((e) => e.hp > 0);

    if (!summonerAlive) {
        state.result = { outcome: 'defeat' };
        events.push({ type: "end", result: "defeat", msg: "The Commander has fallen!" });
    } else if (!anyEnemyAlive) {
        state.result = { outcome: 'victory' };
        events.push({ type: "end", result: "victory", msg: "Victory!" });
    }
  }
}
