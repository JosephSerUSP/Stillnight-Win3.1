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

    // Initialize FF2 stats
    const stats = actorData.stats || { str: 10, agi: 10, int: 10, spi: 10, vit: 10, mag: 10 };
    this._str = stats.str;
    this._agi = stats.agi;
    this._int = stats.int;
    this._spi = stats.spi;
    this._vit = stats.vit;
    this._mag = stats.mag;

    // Initialize skill levels
    this.weaponSkills = { ...(actorData.weaponSkills || {}) };
    this.magicSkills = { ...(actorData.magicSkills || {}) };

    // Growth check tracking
    this.battleStats = {
        hpLost: 0,
        mpSpent: 0,
        attacksMade: {}, // by weapon type
        magicUsed: {}, // by spell id
        timesAttacked: 0
    };

    if (this.isEnemy) {
      this._baseMaxHp += (depth - 1) * 20; // Scale HP more aggressively for bosses/enemies
      this.hp = this.maxHp;
    }
  }

  // --- Base Stats (FF2 style) ---

  get str() { return this._str; }
  get agi() { return this._agi; }
  get int() { return this._int; }
  get spi() { return this._spi; }
  get vit() { return this._vit; }
  get mag() { return this._mag; }

  set str(v) { this._str = v; }
  set agi(v) { this._agi = v; }
  set int(v) { this._int = v; }
  set spi(v) { this._spi = v; }
  set vit(v) { this._vit = v; }
  set mag(v) { this._mag = v; }

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

  get maxHp() {
      const base = this._baseMaxHp;
      const plus = this.traits.filter(t => t.code === 'PARAM_PLUS' && t.dataId === 'maxHp').reduce((sum, t) => sum + t.value, 0);
      const rate = this.traits.filter(t => t.code === 'PARAM_RATE' && t.dataId === 'maxHp').reduce((acc, t) => acc * t.value, 1.0);
      return Math.floor((base + plus) * rate);
  }

  set maxHp(value) {
      const plus = this.traits.filter(t => t.code === 'PARAM_PLUS' && t.dataId === 'maxHp').reduce((sum, t) => sum + t.value, 0);
      const rate = this.traits.filter(t => t.code === 'PARAM_RATE' && t.dataId === 'maxHp').reduce((acc, t) => acc * t.value, 1.0);
      if (rate === 0) this._baseMaxHp = 0;
      else this._baseMaxHp = Math.ceil((value / rate) - plus);
  }

  get maxMp() {
      const base = this._baseMaxMp || 0;
      const plus = this.traits.filter(t => t.code === 'PARAM_PLUS' && t.dataId === 'maxMp').reduce((sum, t) => sum + t.value, 0);
      const rate = this.traits.filter(t => t.code === 'PARAM_RATE' && t.dataId === 'maxMp').reduce((acc, t) => acc * t.value, 1.0);
      return Math.floor((base + plus) * rate);
  }

  // Derived Stats
  get atk() {
      // Str + Equipment Atk
      let base = this.str;
      const plus = this.traits.filter(t => t.code === 'PARAM_PLUS' && t.dataId === 'atk').reduce((sum, t) => sum + t.value, 0);
      return base + plus;
  }

  get def() {
      // Equipment Def (Vit affects HP growth, not direct Def in simple FF2 model usually, or partial)
      // We'll stick to Def = Equipment Def
      const plus = this.traits.filter(t => t.code === 'PARAM_PLUS' && t.dataId === 'def').reduce((sum, t) => sum + t.value, 0);
      return plus;
  }

  get asp() { // Speed/Agility
      let base = this.agi;
      const plus = this.traits.filter(t => t.code === 'PARAM_PLUS' && t.dataId === 'asp').reduce((sum, t) => sum + t.value, 0);
      return base + plus;
  }

  // Magic Defense (MDF) - usually based on Mag/Spirit + Equipment
  get mdf() {
      let base = this.mag;
      const plus = this.traits.filter(t => t.code === 'PARAM_PLUS' && t.dataId === 'mdf').reduce((sum, t) => sum + t.value, 0);
      return base + plus;
  }

  getPassiveValue(code) {
    return this.traits.filter(t => t.code === code).reduce((sum, t) => sum + t.value, 0);
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

  getEvolutionStatus(inventory, floorDepth, gold) {
      return ProgressionSystem.getEvolutionStatus(this, inventory, floorDepth, gold);
  }

  static create(actorData, targetLevel) {
      // FF2 style doesn't use standard leveling for creation usually, but we keep this for compatibility
      const battler = new Game_Battler(actorData);
      return battler;
  }
}
