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
   * @param {string} actorData.name - The name of the actor.
   * @param {number} actorData.maxHp - The base max HP.
   * @param {number} actorData.level - The starting level.
   * @param {string[]} [actorData.elements] - Elemental types.
   * @param {string} [actorData.role] - The role or class of the actor.
   * @param {Array<string|Object>} [actorData.passives] - List of passive IDs or objects.
   * @param {string[]} [actorData.skills] - List of skill IDs.
   * @param {string} [actorData.spriteKey] - The key for the actor's sprite/portrait.
   * @param {string} [actorData.flavor] - Flavor text for the actor.
   * @param {Object} [actorData.equipment] - Base equipment.
   * @param {number} [actorData.expGrowth] - XP growth rate.
   * @param {Array} [actorData.evolutions] - Evolution paths.
   * @param {number} [actorData.gold] - Gold dropped (for enemies).
   * @param {Array} [actorData.traits] - Innate traits.
   * @param {number} [depth=1] - The dungeon depth (scales enemy stats).
   * @param {boolean} [isEnemy=false] - Whether this battler is an enemy.
   */
  constructor(actorData, depth = 1, isEnemy = false) {
    super(actorData);

    this.role = actorData.role;

    // Store actorData for trait access
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

    // FFX Mechanics
    this.tp = 0;
    this.maxTp = 100;

    /**
     * Active states on the battler.
     * @type {Array<{id: string, turns: number}>}
     */
    this.states = [];

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

  /**
   * Gets the effective maximum HP.
   * @type {number}
   */
  get maxHp() {
      const base = this._baseMaxHp;
      const plus = this.traits.filter(t => t.code === 'PARAM_PLUS' && t.dataId === 'maxHp')
                               .reduce((sum, t) => sum + t.value, 0);
      const rate = this.traits.filter(t => t.code === 'PARAM_RATE' && t.dataId === 'maxHp')
                               .reduce((acc, t) => acc * t.value, 1.0);
      return Math.floor((base + plus) * rate);
  }

  set maxHp(value) {
      // Inverse calculation for setting base max hp is tricky with rates.
      // We assume this setter is mostly used for initialization or direct manipulation where
      // we want the FINAL value to be 'value'.
      const plus = this.traits.filter(t => t.code === 'PARAM_PLUS' && t.dataId === 'maxHp')
                               .reduce((sum, t) => sum + t.value, 0);
      const rate = this.traits.filter(t => t.code === 'PARAM_RATE' && t.dataId === 'maxHp')
                               .reduce((acc, t) => acc * t.value, 1.0);

      // (base + plus) * rate = value  =>  base = (value / rate) - plus
      if (rate === 0) this._baseMaxHp = 0; // Avoid division by zero
      else this._baseMaxHp = Math.ceil((value / rate) - plus);
  }

  /**
   * Gets the effective Attack power.
   * @type {number}
   */
  get atk() {
      let base = 0;
      if (this.isEnemy) {
           // Base enemy logic: ~level. Variance handled in BattleManager.
           base = this.level;
      } else {
           // Base actor logic: 3 + level/2.
           base = 3 + Math.floor(this.level / 2);
      }

      const plus = this.traits.filter(t => t.code === 'PARAM_PLUS' && t.dataId === 'atk')
                               .reduce((sum, t) => sum + t.value, 0);
      const rate = this.traits.filter(t => t.code === 'PARAM_RATE' && t.dataId === 'atk')
                               .reduce((acc, t) => acc * t.value, 1.0);
      return Math.floor((base + plus) * rate);
  }

  /**
   * Gets the effective Speed.
   * @type {number}
   */
  get asp() {
      const plus = this.traits.filter(t => t.code === 'PARAM_PLUS' && t.dataId === 'asp')
                               .reduce((sum, t) => sum + t.value, 0);
      const rate = this.traits.filter(t => t.code === 'PARAM_RATE' && t.dataId === 'asp')
                               .reduce((acc, t) => acc * t.value, 1.0);
      return Math.floor(plus * rate);
  }

  /**
   * Gets the value of a specific passive code from traits.
   * @param {string} code - The trait code (e.g., 'HRG').
   * @returns {number} The aggregated value.
   */
  getPassiveValue(code) {
    // New implementation using traits
    // First, check direct traits with this code
    const traitSum = this.traits.filter(t => t.code === code)
                                .reduce((sum, t) => sum + t.value, 0);

    if (traitSum !== 0) return traitSum;

    return 0;
  }

  gainTp(value) {
      this.tp = Math.min(this.tp + value, this.maxTp);
  }

  /**
   * Adds a state to the battler.
   * @param {string} stateId - The ID of the state to add.
   */
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

  /**
   * Removes a state from the battler.
   * @param {string} stateId - The ID of the state to remove.
   */
  removeState(stateId) {
      const index = this.states.findIndex(s => s.id === stateId);
      if (index !== -1) {
          this.states.splice(index, 1);
      }
  }

  /**
   * Checks if the battler is affected by a state.
   * @param {string} stateId - The ID of the state.
   * @returns {boolean}
   */
  isStateAffected(stateId) {
      return this.states.some(s => s.id === stateId);
  }

  /**
   * Updates state turns and removes expired states.
   * @returns {string[]} List of removed state IDs.
   */
  updateStateTurns() {
      const removed = [];
      this.states.forEach(s => {
          if (s.turns > 0) s.turns--;
      });

      // Remove expired states
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

      // Delegate trait effects to EffectManager
      const traitEvents = EffectManager.processTrigger('turnStart', this, { allies, enemies, dataManager });
      events.push(...traitEvents);

      return events;
  }

  /**
   * Factory method to create a battler and scale it to a target level.
   * @param {Object} actorData - The actor definition.
   * @param {number} [targetLevel] - The desired level.
   * @returns {Game_Battler}
   */
  static create(actorData, targetLevel) {
      // Determine the final target level: explicit > intrinsic > 1
      const finalLevel = targetLevel || actorData.level || 1;

      // Force initialization at Level 1 to ensure base stats are treated as Lv 1 stats
      // and growth is applied correctly up to the target level.
      const baseData = { ...actorData, level: 1 };
      const battler = new Game_Battler(baseData);

      if (finalLevel > battler.level) {
          ProgressionSystem.growToLevel(battler, finalLevel);
      }
      return battler;
  }
}
