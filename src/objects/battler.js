import { randInt, shuffleArray, probabilisticRound, pickWeighted } from "../core/utils.js";
import { EffectManager } from "../managers/effects.js";
import { ProgressionSystem } from "../managers/progression.js";
import { passives as passivesData } from "../../data/passives.js";
import { states as statesData } from "../../data/states.js";
import { Game_Base } from "./game_base.js";

export class Game_Battler extends Game_Base {
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

    // CTB State
    this.ctbTicks = 0;
    this.overdrive = 0;

    // MP
    this._baseMaxMp = actorData.mp || 0;
    this.mp = this.maxMp; // Initialize full MP

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
          return [newColor];
      }
      return base;
  }

  // --- STATS ---

  _getParam(paramId, baseValue) {
      const plus = this.traits.filter(t => t.code === 'PARAM_PLUS' && t.dataId === paramId)
                               .reduce((sum, t) => sum + t.value, 0);
      const rate = this.traits.filter(t => t.code === 'PARAM_RATE' && t.dataId === paramId)
                               .reduce((acc, t) => acc * t.value, 1.0);
      return Math.floor((baseValue + plus) * rate);
  }

  get maxHp() {
      return this._getParam('maxHp', this._baseMaxHp);
  }
  set maxHp(value) {
      const plus = this.traits.filter(t => t.code === 'PARAM_PLUS' && t.dataId === 'maxHp').reduce((s, t) => s + t.value, 0);
      const rate = this.traits.filter(t => t.code === 'PARAM_RATE' && t.dataId === 'maxHp').reduce((a, t) => a * t.value, 1.0);
      if (rate === 0) this._baseMaxHp = 0;
      else this._baseMaxHp = Math.ceil((value / rate) - plus);
  }

  get maxMp() {
      return this._getParam('maxMp', this._baseMaxMp);
  }

  get atk() {
      const base = this.isEnemy ? this.level : (3 + Math.floor(this.level / 2));
      return this._getParam('atk', base);
  }

  get def() {
      const base = this.isEnemy ? Math.floor(this.level / 2) : Math.floor(this.level / 3);
      return this._getParam('def', base);
  }

  get mat() {
      // Magic Attack
      const base = this.isEnemy ? this.level : Math.floor(this.level * 0.8);
      return this._getParam('mat', base);
  }

  get mdf() {
      // Magic Defense
      const base = this.isEnemy ? Math.floor(this.level / 2) : Math.floor(this.level / 3);
      return this._getParam('mdf', base);
  }

  get agi() {
      // Agility (Speed)
      const base = 10 + Math.floor(this.level / 2);
      return this._getParam('agi', base);
  }

  get luk() {
      return this._getParam('luk', 10);
  }

  get asp() {
      return this._getParam('asp', 0); // Action Speed bonus (Haste etc)
  }

  getPassiveValue(code) {
    const traitSum = this.traits.filter(t => t.code === code).reduce((sum, t) => sum + t.value, 0);
    return traitSum;
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
      if (index !== -1) {
          this.states.splice(index, 1);
      }
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
