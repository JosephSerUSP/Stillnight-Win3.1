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
   * @param {string[]} [actorData.skills] - List of skill IDs (Actions).
   * @param {number} [actorData.maxSkills] - Max number of skills.
   * @param {number} [actorData.maxPassives] - Max number of passives.
   * @param {string} [actorData.spriteKey] - The key for the actor's sprite/portrait.
   * @param {string} [actorData.flavor] - Flavor text for the actor.
   * @param {Object} [actorData.equipment] - Base equipment.
   * @param {number} [actorData.expGrowth] - XP growth rate.
   * @param {Array} [actorData.evolutions] - Evolution paths.
   * @param {number} [actorData.gold] - Gold dropped (for enemies).
   * @param {number} [actorData.cost] - MP cost per map step.
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
    this.maxSkills = actorData.maxSkills || 8;
    this.maxPassives = actorData.maxPassives || 8;

    this.spriteKey = actorData.spriteKey;
    this.flavor = actorData.flavor;
    this.xp = 0;
    this.baseEquipment = actorData.equipment || null;
    this.equipmentItem = null;
    this.expGrowth = actorData.expGrowth || 5;
    this.evolutions = actorData.evolutions || [];
    this.gold = actorData.gold || 0;
    this.cost = actorData.cost || 0;
    this.isEnemy = isEnemy;

    // Tracks current slot index for formation logic. Expected to be updated by Game_Party.
    this.slotIndex = -1;

    /**
     * Active states on the battler.
     * @type {Array<{id: string, turns: number}>}
     */
    this.states = [];

    // Storage for dynamic modifications applied via Effects (MOD_PROPERTY)
    this._paramPlus = {};

    if (this.isEnemy) {
      this._baseMaxHp += (depth - 1) * 4;
      this.hp = this.maxHp;
    }
  }

  /**
   * Aggregates all traits from Actor, Equipment, Passives, and States.
   * Filters passives based on formationSlots.
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

      // Passive traits - CHECK FORMATION SLOTS
      this.passives.forEach(p => {
          // If passive has formationSlots restriction, check against current slotIndex
          if (p.formationSlots && Array.isArray(p.formationSlots)) {
              if (this.slotIndex === -1 || !p.formationSlots.includes(this.slotIndex)) {
                  return; // Passive inactive
              }
          }

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
   * Handles ELEMENT_CHANGE (replace all) and ELEMENT_ADD (append).
   * @type {string[]}
   */
  get elements() {
      const base = this._baseElements || [];
      const traits = this.traits;

      const changeTraits = traits.filter(t => t.code === 'ELEMENT_CHANGE');
      const addTraits = traits.filter(t => t.code === 'ELEMENT_ADD');

      let currentElements = [...base];

      // ELEMENT_CHANGE replaces everything
      if (changeTraits.length > 0) {
          // Apply the most recent one
          const newColor = changeTraits[changeTraits.length - 1].dataId;

          if (currentElements.length === 0) {
              currentElements = [newColor];
          } else {
              currentElements = currentElements.map(() => newColor);
          }
      }

      // ELEMENT_ADD appends
      addTraits.forEach(t => {
          currentElements.push(t.dataId);
      });

      return currentElements;
  }

  /**
   * Generic method to calculate any parameter/statistic.
   * Calculates: (Base + DynamicMods + TraitPlus) * TraitRate
   * Applies Starvation Penalty if applicable.
   * @param {string} statId - The ID of the statistic (e.g., 'maxHp', 'atk', 'maxActions', 'wisdom').
   * @returns {number} The calculated value.
   */
  getStat(statId) {
      // 1. Determine Base
      // Priority: Internal Base Property (_baseX) > ActorData Property > Default 0
      // Special case for maxHp which uses _baseMaxHp
      let base = 0;
      if (statId === 'maxHp') {
          base = this._baseMaxHp;
      } else if (statId === 'atk') {
          // Backward compatibility for existing logic
          if (this.isEnemy) {
               base = this.level;
          } else {
               base = 3 + Math.floor(this.level / 2);
          }
      } else if (statId === 'asp') {
          // ASP base is usually 0 unless defined
          base = this.actorData[statId] || 0;
      } else {
          // Fallback to reading raw property or actorData
          if (this.hasOwnProperty('_base' + statId)) {
              base = this['_base' + statId];
          } else if (this.actorData && this.actorData[statId] !== undefined) {
              base = this.actorData[statId];
          } else if (this[statId] !== undefined && typeof this[statId] === 'number') {
              // Be careful not to recurse if getter calls getStat
              // This branch assumes it's a plain property if accessed directly,
              // but we are usually defining getters that call THIS.
              // So we should look for _base or actorData.
              base = 0;
          }
      }

      // 2. Dynamic Modifications (from Effects)
      const dynamicPlus = this._paramPlus[statId] || 0;

      // 3. Trait Modifications (PARAM_PLUS)
      const traitPlus = this.traits.filter(t => t.code === 'PARAM_PLUS' && t.dataId === statId)
                                   .reduce((sum, t) => sum + t.value, 0);

      // 4. Trait Rate (PARAM_RATE)
      let traitRate = this.traits.filter(t => t.code === 'PARAM_RATE' && t.dataId === statId)
                                   .reduce((acc, t) => acc * t.value, 1.0);

      // 5. Starvation Penalty (if MP 0)
      // We need access to Game_Party stepsAtZeroMp? Or injection.
      // Game_Battler doesn't have direct ref to Game_Party.
      // We can use a global check via window.sceneManager or inject it.
      // Given the architecture, using window global for deep state in generic classes is common in RPG Maker but frowned upon here.
      // However, we implemented 0 MP HP drain in Game_Party.onStep.
      // Stat penalty logic should ideally be here.
      // "When it hits 0, creatures get progressively weaker... penalty to damage and success rates".
      // Let's modify traitRate if this battler is in a starving party.
      // Since we don't have party reference, we might need to rely on a 'starving' state being applied?
      // But requirement says "worse every turn".
      // Let's assume the Party injects a "STARVATION" state or we check a global flag.
      // OR: We check a custom property `this.starvationLevel` which Game_Party updates on step.
      if (this.starvationLevel > 0) {
          // e.g. -5% per step
          const penalty = Math.min(0.9, this.starvationLevel * 0.05); // Cap at 90%?
          traitRate *= (1.0 - penalty);
      }

      return Math.floor((base + dynamicPlus + traitPlus) * traitRate);
  }

  /**
   * Gets the effective maximum HP.
   * @type {number}
   */
  get maxHp() {
      return this.getStat('maxHp');
  }

  set maxHp(value) {
      // Inverse calculation logic remains complex due to rates.
      // We assume setting maxHp sets the BASE.
      // value = (base + plus) * rate
      // base = (value / rate) - plus

      // Re-calculate traits to invert
      const statId = 'maxHp';
      const dynamicPlus = this._paramPlus[statId] || 0;
      const traitPlus = this.traits.filter(t => t.code === 'PARAM_PLUS' && t.dataId === statId)
                                   .reduce((sum, t) => sum + t.value, 0);
      let traitRate = this.traits.filter(t => t.code === 'PARAM_RATE' && t.dataId === statId)
                                   .reduce((acc, t) => acc * t.value, 1.0);

      if (this.starvationLevel > 0) {
          const penalty = Math.min(0.9, this.starvationLevel * 0.05);
          traitRate *= (1.0 - penalty);
      }

      if (traitRate === 0) this._baseMaxHp = 0;
      else this._baseMaxHp = Math.ceil((value / traitRate) - traitPlus - dynamicPlus);
  }

  /**
   * Gets the effective Attack power.
   * @type {number}
   */
  get atk() {
      return this.getStat('atk');
  }

  /**
   * Gets the effective Speed.
   * @type {number}
   */
  get asp() {
      return this.getStat('asp');
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
