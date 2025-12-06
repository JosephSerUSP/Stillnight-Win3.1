import { randInt, shuffleArray, probabilisticRound, pickWeighted } from "../core/utils.js";
import { EffectManager } from "../managers/effects.js";
import { ProgressionSystem } from "../managers/progression.js";
import { passives as passivesData } from "../../data/passives.js";
import { states as statesData } from "../../data/states.js";
import { Game_Base } from "./game_base.js";

/**
 * @class Game_Battler
 * @description The class representing a participant in a battle (actor or enemy).
 * Handles stats, leveling, skills, and passives.
 * @extends Game_Base
 */
export class Game_Battler extends Game_Base {
  /**
   * Creates a new Game_Battler instance.
   * @param {Object} actorData - The data for the actor.
   * @param {number} [depth=1] - The dungeon depth (scales enemy stats).
   * @param {boolean} [isEnemy=false] - Whether this battler is an enemy.
   */
  constructor(actorData, depth = 1, isEnemy = false) {
    super(actorData);

    this.role = actorData.role;
    this.actorData = actorData;

    this.passives = (actorData.passives || []).map(pId => {
        if (typeof pId === 'string') {
            return passivesData[pId] || { id: pId, code: pId, value: 0, name: pId };
        }
        return pId;
    });

    this.skills = actorData.skills ? actorData.skills.slice() : [];
    this.spriteKey = actorData.spriteKey;
    this.flavor = actorData.flavor;
    this.xp = 0;
    this.baseEquipment = actorData.equipment || null;
    this.equipmentItem = null;
    this.expGrowth = actorData.expGrowth || 5;
    this.evolutions = actorData.evolutions || [];
    this.gold = actorData.gold || 0;
    this.isEnemy = isEnemy;
    this.states = [];

    if (this.isEnemy) {
      this._baseMaxHp += (depth - 1) * 4;
      this.hp = this.maxHp;
    }
  }

  /**
   * Aggregates all traits from Actor, Equipment, Passives, and States.
   * @type {Array}
   */
  get traits() {
      const traits = [];
      if (this.actorData && this.actorData.traits) traits.push(...this.actorData.traits);
      if (this.equipmentItem && this.equipmentItem.traits) traits.push(...this.equipmentItem.traits);
      this.passives.forEach(p => { if (p.traits) traits.push(...p.traits); });
      this.states.forEach(s => {
          const stateData = statesData[s.id];
          if (stateData && stateData.traits) traits.push(...stateData.traits);
      });
      return traits;
  }

  get elements() {
      const base = this._baseElements || [];
      const changeTraits = this.traits.filter(t => t.code === 'ELEMENT_CHANGE');
      if (changeTraits.length > 0) {
          const newColor = changeTraits[changeTraits.length - 1].dataId;
          return base.length === 0 ? [newColor] : base.map(() => newColor);
      }
      return base;
  }

  // --- Parameter System ---

  /**
   * Calculates the value of a parameter.
   * @param {string} id - The parameter ID (e.g., 'atk', 'maxHp').
   * @returns {number} The calculated value.
   */
  param(id) {
      const base = this.baseParam(id);
      const plus = this.traits.filter(t => t.code === 'PARAM_PLUS' && t.dataId === id)
                               .reduce((sum, t) => sum + t.value, 0);
      const rate = this.traits.filter(t => t.code === 'PARAM_RATE' && t.dataId === id)
                               .reduce((acc, t) => acc * t.value, 1.0);
      return Math.floor((base + plus) * rate);
  }

  /**
   * Calculates the value of an extended parameter (rate/chance).
   * @param {string} id - The parameter ID (e.g., 'cri', 'eva').
   * @returns {number} The calculated value (0.0 to 1.0 usually).
   */
  xparam(id) {
      const code = id.toUpperCase();
      // Also check for legacy codes if needed, but assuming definitions map clearly
      return this.traits.filter(t => t.code === code)
                        .reduce((sum, t) => sum + t.value, 0);
  }

  baseParam(id) {
      if (id === 'maxHp') return this._baseMaxHp;
      if (id === 'atk') {
          if (this.isEnemy) return this.level;
          return 3 + Math.floor(this.level / 2);
      }
      if (id === 'asp') return 0;
      if (id === 'deal_damage_mod') return 0;
      return 0;
  }

  // Wrappers for ease of use
  get maxHp() { return this.param('maxHp'); }
  set maxHp(value) {
      // Logic for setting base max hp inversely
      const plus = this.traits.filter(t => t.code === 'PARAM_PLUS' && t.dataId === 'maxHp')
                               .reduce((sum, t) => sum + t.value, 0);
      const rate = this.traits.filter(t => t.code === 'PARAM_RATE' && t.dataId === 'maxHp')
                               .reduce((acc, t) => acc * t.value, 1.0);
      if (rate === 0) this._baseMaxHp = 0;
      else this._baseMaxHp = Math.ceil((value / rate) - plus);
  }

  get atk() { return this.param('atk'); }
  get asp() { return this.param('asp'); }

  getPassiveValue(code) {
      return this.xparam(code);
  }

  // --- State Management ---

  addState(stateId) {
      const stateData = statesData[stateId];
      if (!stateData) return;
      const existing = this.states.find(s => s.id === stateId);
      if (existing) {
          existing.turns = stateData.duration || 3;
      } else {
          this.states.push({ id: stateId, turns: stateData.duration || 3 });
      }
  }

  removeState(stateId) {
      const index = this.states.findIndex(s => s.id === stateId);
      if (index !== -1) this.states.splice(index, 1);
  }

  isStateAffected(stateId) {
      return this.states.some(s => s.id === stateId);
  }

  updateStateTurns() {
      const removed = [];
      this.states.forEach(s => { if (s.turns > 0) s.turns--; });
      for (let i = this.states.length - 1; i >= 0; i--) {
          if (this.states[i].turns <= 0) {
              removed.push(this.states[i].id);
              this.states.splice(i, 1);
          }
      }
      return removed;
  }

  onTurnStart(allies, enemies, dataManager) {
      const events = [];
      const removedStates = this.updateStateTurns();
      removedStates.forEach(sId => {
          const state = dataManager.states[sId];
          events.push({ type: 'state_remove', target: this, msg: `${this.name}'s ${state ? state.name : sId} wore off.` });
      });
      const traitEvents = EffectManager.processTrigger('turnStart', this, { allies, enemies, dataManager });
      events.push(...traitEvents);
      return events;
  }

  static create(actorData, targetLevel) {
      const finalLevel = targetLevel || actorData.level || 1;
      const baseData = { ...actorData, level: 1 };
      const battler = new Game_Battler(baseData);
      if (finalLevel > battler.level) {
          ProgressionSystem.growToLevel(battler, finalLevel);
      }
      return battler;
  }
}
