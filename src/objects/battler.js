import { TraitRules } from "../engine/rules/traits.js";
import { ProgressionSystem } from "../engine/systems/progression.js";
import { passives as passivesData } from "../../data/passives.js";
import { states as statesData } from "../../data/states.js";
import { Game_Base } from "./game_base.js";

/**
 * @class Game_Battler
 * @description The class representing a participant in a battle (actor or enemy).
 * Handles stats, leveling, skills, and passives via the unified Trait System.
 * @extends Game_Base
 */
export class Game_Battler extends Game_Base {
  /**
   * Creates a new Game_Battler instance.
   * @param {Object} actorData - The data for the actor.
   */
  constructor(actorData, depth = 1, isEnemy = false) {
    super(actorData);

    this.role = actorData.role;
    this.actorData = actorData;

    // Resolve passives
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

    /**
     * Active states on the battler.
     * @type {Array<{id: string, turns: number}>}
     */
    this.states = [];

    // Enemy scaling logic
    if (this.isEnemy) {
      this._baseMaxHp += (depth - 1) * 4;
      this.hp = this.maxHp;
    }
  }

  getEvolutionStatus(inventory, floorDepth, gold) {
      return ProgressionSystem.getEvolutionStatus(this, inventory, floorDepth, gold);
  }

  /**
   * Aggregates all traits from Actor, Equipment, Passives, and States.
   * @type {Array}
   */
  get traits() {
      const traits = [];
      // Actor innate traits
      if (this.actorData && this.actorData.traits) {
          traits.push(...this.actorData.traits);
      }

      // Equipment traits
      if (this.equipmentItem && this.equipmentItem.traits) {
          traits.push(...this.equipmentItem.traits);
      }

      // Passive traits
      this.passives.forEach(p => {
          if (p.traits) traits.push(...p.traits);
      });

      // State traits
      this.states.forEach(s => {
          const stateData = statesData[s.id];
          if (stateData && stateData.traits) {
              traits.push(...stateData.traits);
          }
      });

      return traits;
  }

  /**
   * Gets the effective elements, including traits.
   * @type {string[]}
   */
  get elements() {
      const base = this._baseElements || [];

      // We look for ELEMENT_CHANGE traits
      const changeTraits = this.traits.filter(t => t.code === 'ELEMENT_CHANGE');

      if (changeTraits.length > 0) {
          const newColor = changeTraits[changeTraits.length - 1].dataId;
          if (base.length === 0) {
              return [newColor];
          } else {
              return base.map(() => newColor);
          }
      }
      return base;
  }

  // ========================================================================
  // Unified Parameter System
  // ========================================================================

  /**
   * Generic method to get a parameter value using TraitRules.
   * @param {string} paramId - The parameter ID (e.g., 'atk', 'maxHp').
   * @param {number} baseValue - The base value.
   * @returns {number}
   */
  getParam(paramId, baseValue) {
      return TraitRules.getParam(this, paramId, baseValue);
  }

  get maxHp() {
      return this.getParam('maxHp', this._baseMaxHp);
  }

  set maxHp(value) {
      // Reverse calculation logic: base = (value / rate) - plus
      // This is an approximation since we can't easily invert the traits without fetching them.
      // But commonly this setter is used to FORCE a specific final maxHp (e.g. initialization).

      // To strictly adhere to the system, we should modify _baseMaxHp such that getParam('maxHp') == value.
      // However, simplified:

      const traits = this.traits;
      const plus = traits.filter(t => t.code === 'PARAM_PLUS' && t.dataId === 'maxHp')
                         .reduce((sum, t) => sum + t.value, 0);
      const rate = traits.filter(t => t.code === 'PARAM_RATE' && t.dataId === 'maxHp')
                         .reduce((acc, t) => acc * t.value, 1.0);

      if (rate === 0) this._baseMaxHp = 0;
      else this._baseMaxHp = Math.ceil((value / rate) - plus);
  }

  get maxMp() {
      return this.getParam('maxMp', this._baseMaxMp);
  }

  get atk() {
      let base = 0;
      const lvl = this.level || 1;
      if (this.isEnemy) {
           base = lvl;
      } else {
           base = 3 + Math.floor(lvl / 2);
      }
      return this.getParam('atk', base);
  }

  get def() {
      // Default base is 10 (100%)
      const base = 10;
      return this.getParam('def', base);
  }

  get mat() {
      // Magic Attack, default base 10
      const base = 10;
      return this.getParam('mat', base);
  }

  get mdf() {
      // Magic Defense, default base 10
      const base = 10;
      return this.getParam('mdf', base);
  }

  get mxa() {
      // Max Actions, default 4
      const base = 4;
      return this.getParam('mxa', base);
  }

  get mxp() {
      // Max Passives, default 2
      const base = 2;
      return this.getParam('mxp', base);
  }

  get asp() {
      // Speed (Action Speed Modifier). Base 0.
      return this.getParam('asp', 0);
  }

  /**
   * Gets the value of a specific passive code from traits.
   * Used for 'xparam' (HIT, CRI) or legacy passive codes.
   * @param {string} code - The trait code (e.g., 'HRG').
   * @returns {number} The aggregated value.
   */
  getPassiveValue(code) {
    return TraitRules.getXParam(this, code);
  }

  /**
   * Gets a special parameter (multiplicative).
   * @param {string} code - The trait code (e.g., 'TGR').
   * @returns {number}
   */
  getSParam(code) {
      return TraitRules.getSParam(this, code);
  }

  // ========================================================================
  // State Management
  // ========================================================================

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
      if (index !== -1) {
          this.states.splice(index, 1);
      }
  }

  isStateAffected(stateId) {
      return this.states.some(s => s.id === stateId);
  }

  updateStateTurns() {
      const removed = [];
      this.states.forEach(s => {
          if (s.turns > 0) s.turns--;
      });

      for (let i = this.states.length - 1; i >= 0; i--) {
          if (this.states[i].turns <= 0) {
              removed.push(this.states[i].id);
              this.states.splice(i, 1);
          }
      }
      return removed;
  }

  /**
   * Handles start-of-turn logic (states, passives).
   * @param {Game_Battler[]} allies - List of active allies.
   * @param {Game_Battler[]} enemies - List of active enemies.
   * @param {Object} dataManager - Reference to DataManager.
   * @returns {Array} List of events.
   */
  onTurnStart(allies, enemies, dataManager) {
      const events = [];
      const removedStates = this.updateStateTurns();
      removedStates.forEach(sId => {
          const state = dataManager.states[sId];
          events.push({ type: 'state_remove', target: this, msg: `${this.name}'s ${state ? state.name : sId} wore off.` });
      });

      // Delegate trait effects to TraitRules
      const traitEvents = TraitRules.processTrigger('turnStart', this, { allies, enemies, dataManager });
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
