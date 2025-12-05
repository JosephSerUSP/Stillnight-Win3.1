import { randInt, shuffleArray, probabilisticRound, pickWeighted } from "../core/utils.js";
import { EffectManager } from "../managers/effects.js";
import { ProgressionSystem } from "../managers/progression.js";
import { passives as passivesData } from "../../data/passives.js";
import { states as statesData } from "../../data/states.js";
import { Game_Base } from "./game_base.js";
import { AttributeSystem } from "../core/attributes.js";

/**
 * @class Game_Battler
 * @description The class representing a participant in a battle (actor or enemy).
 * Handles stats, leveling, skills, and passives. Refactored to use AttributeSystem.
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
    this.depth = depth;

    this.states = [];

    // Initialize Attribute System
    this.attributes = new AttributeSystem();

    // Set initial base stats logic (scaling for enemies)
    if (this.isEnemy) {
      this._baseMaxHp += (depth - 1) * 4;
    }

    // Initial stat refresh
    this.refreshStats();

    // Set current HP to max if new
    if (this.isEnemy) {
        this.hp = this.maxHp;
    }
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
   * Refreshes the AttributeSystem by clearing modifiers and re-adding them from traits.
   * Also recalculates base stats that depend on level.
   */
  refreshStats() {
      this.attributes.clearModifiers();

      // Recalculate Base Stats
      // Max HP Base
      this.attributes.setBase('maxHp', this._baseMaxHp);

      // Attack Base
      let atkBase = 0;
      if (this.isEnemy) {
           atkBase = this.level;
      } else {
           atkBase = 3 + Math.floor(this.level / 2);
      }
      this.attributes.setBase('atk', atkBase);

      // Speed Base (ASP) - usually 0 base, modified by traits
      this.attributes.setBase('asp', 0);

      // Apply Traits
      const traits = this.traits;
      traits.forEach(t => {
          if (t.code === 'PARAM_PLUS') {
              this.attributes.addModifier(t.dataId, 'flat', t.value);
          } else if (t.code === 'PARAM_RATE') {
              this.attributes.addModifier(t.dataId, 'rate', t.value);
          } else {
              // Add other traits as attributes to allow generic lookup
              this.attributes.addModifier(t.code, 'flat', t.value);
          }
      });
  }

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

  get maxHp() {
      return this.attributes.get('maxHp');
  }

  set maxHp(value) {
      // Calculate required base to achieve 'value' given current modifiers
      const flats = this.attributes.modifiers
          .filter(m => m.key === 'maxHp' && m.type === 'flat')
          .reduce((sum, m) => sum + m.value, 0);

      const rates = this.attributes.modifiers
          .filter(m => m.key === 'maxHp' && m.type === 'rate')
          .reduce((prod, m) => prod * m.value, 1.0);

      if (rates === 0) this._baseMaxHp = 0;
      else this._baseMaxHp = Math.ceil((value / rates) - flats);

      this.refreshStats();
  }

  get atk() {
      return this.attributes.get('atk');
  }

  get asp() {
      return this.attributes.get('asp');
  }

  /**
   * Gets the value of a specific passive code from traits.
   * @param {string} code - The trait code (e.g., 'HRG').
   * @returns {number} The aggregated value.
   */
  getPassiveValue(code) {
      return this.attributes.get(code);
  }

  addState(stateId) {
      const stateData = statesData[stateId];
      if (!stateData) return;

      const existing = this.states.find(s => s.id === stateId);
      if (existing) {
          existing.turns = stateData.duration || 3;
      } else {
          this.states.push({ id: stateId, turns: stateData.duration || 3 });
      }
      this.refreshStats();
  }

  removeState(stateId) {
      const index = this.states.findIndex(s => s.id === stateId);
      if (index !== -1) {
          this.states.splice(index, 1);
          this.refreshStats();
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
      if (removed.length > 0) {
          this.refreshStats();
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
      battler.refreshStats();
      return battler;
  }
}
