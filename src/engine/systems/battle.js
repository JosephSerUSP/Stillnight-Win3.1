import { BattleState } from "../session/battle_state.js";
import { EffectSystem } from "../rules/effects.js";
import { ProgressionSystem } from "./progression.js";
import { SummonerResourceSystem } from "./summoner_resource.js";
import { SummonerSpellSystem } from "./summoner_spell.js";
import { Registry } from "../data/registry.js";
import { randInt, elementToAscii } from "../../core/utils.js";

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

    const combatants = [];
    let partyMembers = [];
    if (state.participants.party.activeMembers) {
        partyMembers = state.participants.party.activeMembers;
    } else {
        partyMembers = (state.participants.party.slots || []).slice(0, 5).filter(b => b);
    }

    partyMembers.forEach((battler, index) => {
        if (battler.role === 'Summoner') return;
        combatants.push({ battler, index, isEnemy: false });
    });

    const enemies = state.participants.enemies || [];
    enemies.forEach((b, i) => combatants.push({ battler: b, index: i, isEnemy: true }));

    const plannedQueue = combatants.map(ctx => {
        const action = this.getAIAction(state, ctx);
        let totalSpeed = ctx.battler.asp || 0;
        if (action) totalSpeed = action.speed || totalSpeed;
        return { ...ctx, action, totalSpeed };
    });

    const sortBySpeed = (queue) => queue.sort((a, b) => b.totalSpeed - a.totalSpeed);
    if (isFirstStrike) {
        state.turnQueue = sortBySpeed(plannedQueue.filter(c => !c.isEnemy));
    } else if (state.round === 1 && state.isSneakAttack) {
        const enemiesFirst = sortBySpeed(plannedQueue.filter(c => c.isEnemy));
        const partyFirst = sortBySpeed(plannedQueue.filter(c => !c.isEnemy));
        state.turnQueue = [...enemiesFirst, ...partyFirst];
    } else {
        state.turnQueue = sortBySpeed(plannedQueue);
    }
  }

  getPlannedAction(state, battler) {
      if (!state.turnQueue) return null;
      const entry = state.turnQueue.find(e => e.battler === battler);
      if (!entry || !entry.action) return null;
      const action = entry.action;
      let actionName = "Action";
      if (action.skillId) {
          const skill = Registry.getSkill(action.skillId);
          actionName = skill ? skill.name : "Skill";
      } else if (action._item) {
          actionName = action._item.name;
      }
      return { actionName, target: action.target };
  }

  getNextBattler(state) {
      if (state.result) return null;
      let p = state.turnQueue.shift();
      while (p && p.battler.hp <= 0) p = state.turnQueue.shift();
      return p || null;
  }

  getAIAction(state, battlerContext) {
      const { battler } = battlerContext;
      const skills = battler.skills || [];
      if (skills.length === 0) return null;
      const skillId = skills[randInt(0, skills.length - 1)];
      const action = { subject: battler, speed: battler.asp || 0 };
      const skill = Registry.getSkill(skillId);
      let scope = 'enemy';
      if (skill) {
           action.skillId = skillId;
           action.speed += (skill.speed || 0);
           action.item = skill;
           scope = skill.target || 'enemy';
      } else {
           return null;
      }

      const validTargets = this._getValidTargets(state, battler, scope);
      if (validTargets.length > 0) {
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
      let myTeam = [];
      let opposingTeam = [];

      if (isEnemy) {
           opposingTeam = this._getPartyActive(state);
           myTeam = state.participants.enemies || [];
      } else {
           opposingTeam = (state.participants.enemies || []).filter(m => m.hp > 0);
           myTeam = this._getPartyActive(state);
      }

      if (scope.includes('self')) return [subject];
      let targets = scope.includes('ally') ? myTeam : opposingTeam;
      if (!scope.includes('dead')) targets = targets.filter(b => b.hp > 0);
      else targets = targets.filter(b => b.hp <= 0);
      return targets;
  }

  _getPartyActive(state) {
      if (state.participants.party.activeMembers) {
          return state.participants.party.activeMembers.filter(m => m.hp > 0);
      }
      return (state.participants.party.slots || []).slice(0, 5).filter(m => m && m.hp > 0);
  }

  executeAction(state, action) {
      if (!action) return [];
      const events = [];
      const { subject } = action;
      let { target } = action;

      if (!subject || subject.hp <= 0) return [];

      if (!target || target.hp <= 0) {
           let scope = 'enemy';
           if (action.item) scope = action.item.target || 'enemy';
           const targets = this._getValidTargets(state, subject, scope);
           if (targets.length > 0) {
               target = targets[randInt(0, targets.length - 1)];
               action.target = target;
           } else {
               return [];
           }
      }

      let executed = false;
      if (action.skillId) {
           this._executeSkill(state, action, events);
           executed = true;
      } else if (action.itemId) {
           this._executeItem(state, action, events);
           executed = true;
      }

      if (executed) {
          const party = state.participants.party;
          if (subject.role === 'Summoner') {
              events.push(...SummonerResourceSystem.consumeDirectAction(party, action.itemId ? 'item' : 'action'));
          } else {
              events.push(...SummonerResourceSystem.consumeCreatureAction(party, subject));
          }
      }

      this._checkBattleEnd(state, events);
      return events;
  }

  /** Shared direct-Summoner resource entry point for Formation/Flee. */
  consumeSummonerAction(state, kind, explicitCost = null) {
      const events = SummonerResourceSystem.consumeDirectAction(
          state.participants.party,
          kind,
          explicitCost
      );
      this._checkBattleEnd(state, events);
      return events;
  }

  getSummonerSpellOptions(state) {
      return SummonerSpellSystem.getOptions(state.participants.party);
  }

  getSummonerSpellTargets(state, spellId) {
      return SummonerSpellSystem.getValidTargets(state.participants.party, spellId);
  }

  castSummonerSpell(state, spellId, target = null) {
      const result = SummonerSpellSystem.cast(state.participants.party, spellId, target);
      if (result.ok) this._checkBattleEnd(state, result.events);
      return result;
  }

  _executeSkill(state, action, events) {
      const battler = action.subject;
      const target = action.target;
      const skill = action.item || Registry.getSkill(action.skillId);
      if (!skill) return;

      const skillName = skill.element ? `${elementToAscii(skill.element)}${skill.name}` : skill.name;
      events.push({ type: 'use_skill', battler, skillName, msg: `${battler.name} uses ${skillName}!` });

      let boost = 1;
      if (skill.element && battler.elements.includes(skill.element)) boost += 0.25;
      let elementMult = 1.0;
      if (skill.element) elementMult = this._elementMultiplier([skill.element], target.elements);

      skill.effects.forEach((effect) => {
          const context = { boost };
          if (effect.type === 'hp_damage' || effect.type === 'hp_drain') {
               context.boost = (context.boost || 1) * elementMult;
          }

          const effectValue = EffectSystem.valueFromAuthoredEffect(effect);
          const result = EffectSystem.apply(effect.type, effectValue, battler, target, {
              ...context,
              progressionSystem: ProgressionSystem,
              skills: Registry.get('skills'),
              passives: Registry.get('passives')
          });

          if (result) {
               if (result.type === 'damage') result.msg = `  ${target.name} takes ${result.value} damage.`;
               else if (result.type === 'heal') result.msg = `  ${target.name} heals ${result.value} HP.`;
               else if (result.type === 'status') result.msg = `  ${target.name} is afflicted with ${result.status}.`;
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
               const effectValue = EffectSystem.valueFromAuthoredEffect(effect);
               const result = EffectSystem.apply(effect.type, effectValue, item, target, {
                   progressionSystem: ProgressionSystem,
                   skills: Registry.get('skills'),
                   passives: Registry.get('passives')
               });
               if (result) {
                    if (result.type === 'heal') result.msg = `  ${target.name} heals ${result.value} HP.`;
                    else if (result.type === 'mp_heal') result.msg = `  ${target.name} recovers ${result.value} MP.`;
                    else if (result.type === 'status_remove') result.msg = `  ${target.name} is no longer ${result.status}.`;
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
    const summoner = state.participants.party.summoner;
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
