import { randInt, shuffleArray } from "./core.js";
import { passives as passivesData } from "./data/passives.js";
import { states as statesData } from "./data/states.js";

/**
 * @class Game_Base
 * @description The base class for all game units.
 */
class Game_Base {
  /**
   * Creates a new Game_Base instance.
   * @param {Object} unitData - The data for the unit.
   * @param {string} unitData.name - The name of the unit.
   * @param {number} unitData.maxHp - The maximum HP of the unit.
   * @param {number} unitData.level - The level of the unit.
   * @param {string[]} [unitData.elements] - The elemental affinities of the unit.
   */
  constructor(unitData) {
    /**
     * The name of the unit.
     * @type {string}
     */
    this.name = unitData.name;

    /**
     * The base maximum HP of the unit.
     * @type {number}
     * @protected
     */
    this._baseMaxHp = unitData.maxHp;

    /**
     * The current HP of the unit.
     * @type {number}
     */
    this.hp = unitData.maxHp;

    /**
     * The HP of the unit at the beginning of the last event.
     * Used for calculating HP changes for UI animations.
     * @type {number}
     */
    this.prevHp = unitData.maxHp;

    /**
     * The level of the unit.
     * @type {number}
     */
    this.level = unitData.level;

    /**
     * The elemental affinities of the unit.
     * @type {string[]}
     */
    this.elements = unitData.elements || [];
  }

  /**
   * Gets the effective maximum HP, including traits.
   * @type {number}
   */
  get maxHp() {
      return this._baseMaxHp;
  }
}

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
   * Gets the effective maximum HP.
   * @type {number}
   */
  get maxHp() {
      const base = this._baseMaxHp;
      const bonus = this.traits.filter(t => t.code === 'PARAM_PLUS' && t.dataId === 'maxHp')
                               .reduce((sum, t) => sum + t.value, 0);
      return base + bonus;
  }

  set maxHp(value) {
      const bonus = this.traits.filter(t => t.code === 'PARAM_PLUS' && t.dataId === 'maxHp')
                               .reduce((sum, t) => sum + t.value, 0);
      this._baseMaxHp = value - bonus;
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

      const bonus = this.traits.filter(t => t.code === 'PARAM_PLUS' && t.dataId === 'atk')
                               .reduce((sum, t) => sum + t.value, 0);
      return base + bonus;
  }

  xpNeeded(level) {
    return Math.floor(level * (this.expGrowth * 0.5) + 10);
  }

  gainXp(amount) {
    if (amount <= 0) return { leveledUp: false, hpGain: 0, newLevel: this.level };

    this.xp = (this.xp || 0) + amount;
    let leveledUp = false;
    let totalHpGain = 0;

    while (this.xp >= this.xpNeeded(this.level)) {
      this.xp -= this.xpNeeded(this.level);
      this.level++;
      const hpGain = randInt(2, 4);
      this._baseMaxHp += hpGain; // Update base max HP
      this.hp = this.maxHp;      // Heal to full effective max HP? Or just add gain?
      // "Automaticallly increases HP ... and hp = maxHp" - current logic sets hp to maxHp.
      // So fully heal on level up.
      totalHpGain += hpGain;
      leveledUp = true;
    }

    // Ensure HP respects new Max HP (if traits changed? unlikely here)
    if (this.hp > this.maxHp) this.hp = this.maxHp;

    return {
      leveledUp,
      hpGain: totalHpGain,
      newLevel: this.level
    };
  }

  getPassiveValue(code) {
    // New implementation using traits
    // First, check direct traits with this code
    const traitSum = this.traits.filter(t => t.code === code)
                                .reduce((sum, t) => sum + t.value, 0);

    if (traitSum !== 0) return traitSum;

    // Fallback: Check for legacy passives that might use this code but not via traits?
    // Current data/passives.js uses traits for everything now.
    // So if traits are correctly set, this handles it.

    return 0;
  }

  /**
   * Adds a state to the battler.
   * @param {string} stateId - The ID of the state to add.
   */
  addState(stateId) {
      const stateData = statesData[stateId];
      if (!stateData) return;

      // specific resistance check?
      // const resist = this.getPassiveValue('STATE_RESIST_' + stateId);

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

  executeAction(action, target) {
    console.log(`${this.name} uses an action on ${target.name}.`);
  }

  /**
   * Checks if the battler meets any evolution criteria.
   * @param {Array} inventory - The party's inventory.
   * @param {number} floorDepth - The current floor depth.
   * @returns {Object|null} The evolution definition if eligible, or null.
   */
  checkEvolution(inventory = [], floorDepth = 0) {
    if (!this.evolutions || this.evolutions.length === 0) return null;

    for (const evo of this.evolutions) {
        let eligible = true;

        // Level Requirement
        if (evo.level && this.level < evo.level) eligible = false;

        // Item Requirement
        if (evo.item) {
            const hasItem = inventory.some(i => i.id === evo.item);
            if (!hasItem) eligible = false;
        }

        // Floor/Depth Requirement
        if (evo.floorDepth && floorDepth < evo.floorDepth) eligible = false;

        if (eligible) return evo;
    }
    return null;
  }
}

/**
 * @class Game_Party
 * @description Manages the party.
 */
export class Game_Party {
  constructor() {
    this.MAX_MEMBERS = 24;
    this.members = [];
    this.gold = 0;
    this.inventory = [];
  }

  createInitialMembers(dataManager) {
    const { startingParty, actors, items } = dataManager;

    this.gold = startingParty.getGold();
    this.inventory = startingParty.getInventory(items);

    const memberConfigs = startingParty.getMembers(actors);
    this.members = memberConfigs.map(config => {
      const actorData = actors.find(a => a.id === config.id);
      if (!actorData) {
        console.error(`Actor data not found for ID: ${config.id}`);
        return null;
      }
      const newActorData = { ...actorData, level: config.level };
      return new Game_Battler(newActorData);
    }).filter(member => member !== null);
  }
}

/**
 * @class Game_Event
 * @description Represents an interactive entity on the map.
 */
export class Game_Event {
  constructor(x, y, data) {
    this.x = x;
    this.y = y;
    this.type = data.type;
    this.symbol = data.symbol || "?";
    this.cssClass = data.cssClass || "";
    this.trigger = data.trigger || "touch";
    this.actions = data.actions || [];
    if (data.id) this.id = data.id;
    this.hidden = data.hidden || false;
    this.trapValue = data.trapValue || 0;
  }
}

/**
 * @class Game_Map
 * @description Represents the game map.
 */
export class Game_Map {
  constructor() {
    this.MAX_W = 16;
    this.MAX_H = 16;
    this.floors = [];
    this.floorIndex = 0;
    this.maxReachedFloorIndex = 0;
    this.playerX = 0;
    this.playerY = 0;
  }

  initFloors(mapData, eventDefs, npcData = []) {
    this.floors = mapData.map((meta, i) => this.generateFloor(meta, i, eventDefs, npcData));
    this.floors[0].discovered = true;
    this.maxReachedFloorIndex = 0;
  }

  generateFloor(meta, index, eventDefs, npcData = []) {
    const tiles = Array.from({ length: this.MAX_H }, () =>
      Array.from({ length: this.MAX_W }, () => "#")
    );
    const events = [];
    const visited = Array.from({ length: this.MAX_H }, () =>
      Array.from({ length: this.MAX_W }, () => false)
    );

    const innerW = randInt(7, 11);
    const innerH = randInt(7, 11);
    const offsetX = Math.floor((this.MAX_W - innerW) / 2);
    const offsetY = Math.floor((this.MAX_H - innerH) / 2);

    let x = offsetX + Math.floor(innerW / 2);
    let y = offsetY + Math.floor(innerH / 2);

    tiles[y][x] = ".";
    const floorCells = [[x, y]];

    const steps = innerW * innerH * 3;
    const dirs = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];

    for (let i = 0; i < steps; i++) {
      const [dx, dy] = dirs[randInt(0, dirs.length - 1)];
      const nx = x + dx;
      const ny = y + dy;
      if (
        nx >= offsetX &&
        nx < offsetX + innerW &&
        ny >= offsetY &&
        ny < offsetY + innerH
      ) {
        x = nx;
        y = ny;
        if (tiles[y][x] === "#") {
          tiles[y][x] = ".";
          floorCells.push([x, y]);
        }
      }
    }

    if (floorCells.length < 10) {
      for (let iy = offsetY + 1; iy < offsetY + innerH - 1; iy++) {
        for (let ix = offsetX + 1; ix < offsetX + innerW - 1; ix++) {
          tiles[iy][ix] = ".";
          floorCells.push([ix, iy]);
        }
      }
    }

    const pickCell = (exclude = []) => {
      const exSet = new Set(exclude.map((c) => c.join(",")));
      const candidates = floorCells.filter((c) => !exSet.has(c.join(",")));
      if (candidates.length === 0) return null;
      return candidates[randInt(0, candidates.length - 1)];
    };

    const startPos = floorCells[floorCells.length - 1];
    const [startX, startY] = startPos;
    const used = [startPos];

    if (meta.events) {
      meta.events.forEach((config) => {
        const def = eventDefs.find((e) => e.id === config.id);
        if (!def) return;

        let count = 0;
        if (config.count !== undefined) count = config.count;
        else if (config.min !== undefined && config.max !== undefined)
          count = randInt(config.min, config.max);
        else if (config.chance !== undefined && Math.random() < config.chance)
          count = 1;

        for (let i = 0; i < count; i++) {
          const pos = pickCell(used);
          if (pos) {
            const eventData = { ...def };

            // Special handling for NPC dynamic data
            if (def.type === "npc" && npcData.length > 0) {
              let npcDef;
              if (config.npcId) {
                npcDef = npcData.find(n => n.id === config.npcId);
              }
              if (!npcDef) {
                npcDef = npcData[randInt(0, npcData.length - 1)];
              }

              if (npcDef) {
                  eventData.symbol = npcDef.char || "N";
                  eventData.actions = [{
                      type: "NPC_DIALOGUE",
                      id: npcDef.id,
                      scriptId: npcDef.scriptId
                  }];
                  eventData.id = npcDef.id; // Compatibility
              }
            }

            // Merge config specific overrides (like scriptId for other events)
            if (config.scriptId) {
                eventData.actions = eventData.actions.map(a => ({ ...a, id: config.scriptId, scriptId: config.scriptId }));
            }

            events.push(new Game_Event(pos[0], pos[1], eventData));
            used.push(pos);
          }
        }
      });
    }

    return {
      id: "F" + (index + 1),
      title: meta.title,
      depth: meta.depth,
      intro: meta.intro,
      encounters: meta.encounters,
      treasures: meta.treasures,
      tiles,
      events,
      visited,
      startX,
      startY,
      discovered: false,
    };
  }

  removeEvent(floorIndex, x, y) {
    if (floorIndex < 0 || floorIndex >= this.floors.length) return;
    const floor = this.floors[floorIndex];
    const idx = floor.events.findIndex(e => e.x === x && e.y === y);
    if (idx !== -1) {
      floor.events.splice(idx, 1);
    }
  }

  revealAroundPlayer() {
    const floor = this.floors[this.floorIndex];
    const r = 1;
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const nx = this.playerX + dx;
        const ny = this.playerY + dy;
        if (ny >= 0 && ny < this.MAX_H && nx >= 0 && nx < this.MAX_W) {
          floor.visited[ny][nx] = true;
        }
      }
    }
  }
}

// Expose classes to the window object for testing if in test mode.
if (typeof window !== 'undefined' && window.location.search.includes("test=true")) {
    window.Game_Battler = Game_Battler;
    window.Game_Party = Game_Party;
    window.Game_Map = Game_Map;
    window.Game_Event = Game_Event;
}
