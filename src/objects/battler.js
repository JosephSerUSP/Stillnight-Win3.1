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
    this.exhaustion = Math.max(0, Number(actorData.exhaustion) || 0);

    /** @type {Array<{id: string, turns: number}>} */
    this.states = [];

    if (this.isEnemy) {
      this._baseMaxHp += (depth - 1) * 4;
      this.hp = this.maxHp;
    }
  }

  getEvolutionStatus(inventory, floorDepth, gold) {
      return ProgressionSystem.getEvolutionStatus(this, inventory, floorDepth, gold);
  }

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

  getParam(paramId, baseValue) {
      return TraitRules.getParam(this, paramId, baseValue);
  }

  get maxHp() {
      return this.getParam('maxHp', this._baseMaxHp);
  }

  set maxHp(value) {
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
      if (this.isEnemy) base = lvl;
      else base = 3 + Math.floor(lvl / 2);
      return this.getParam('atk', base);
  }

  get def() {
      return this.getParam('def', 10);
  }

  get mat() {
      return this.getParam('mat', 10);
  }

  get mdf() {
      return this.getParam('mdf', 10);
  }

  get mxa() {
      return this.getParam('mxa', 4);
  }

  get mxp() {
      return this.getParam('mxp', 2);
  }

  /** MP drained from the Summoner whenever this creature performs an action. */
  get mpd() {
      const authored = this.actorData?.mpd;
      const base = this.role === 'Summoner' ? 0 : (Number.isFinite(authored) ? authored : 1);
      return this.getParam('mpd', base);
  }

  get asp() {
      return this.getParam('asp', 0);
  }

  getPassiveValue(code) {
    return TraitRules.getXParam(this, code);
  }

  getSParam(code) {
      return TraitRules.getSParam(this, code);
  }

  addState(stateId) {
      const stateData = statesData[stateId];
      if (!stateData) return;
      const existing = this.states.find(s => s.id === stateId);
      if (existing) existing.turns = stateData.duration || 3;
      else this.states.push({ id: stateId, turns: stateData.duration || 3 });
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
      events.push(...TraitRules.processTrigger('turnStart', this, { allies, enemies, dataManager }));
      return events;
  }

  static create(actorData, targetLevel) {
      const finalLevel = targetLevel || actorData.level || 1;
      const baseData = { ...actorData, level: 1 };
      const battler = new Game_Battler(baseData);
      if (finalLevel > battler.level) ProgressionSystem.growToLevel(battler, finalLevel);
      return battler;
  }
}
