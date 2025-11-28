import { randInt, shuffleArray } from "./core.js";
import { passives as passivesData } from "./data/passives.js";

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
     * The maximum HP of the unit.
     * @type {number}
     */
    this.maxHp = unitData.maxHp;

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
   * @param {number} [depth=1] - The dungeon depth (scales enemy stats).
   * @param {boolean} [isEnemy=false] - Whether this battler is an enemy.
   */
  constructor(actorData, depth = 1, isEnemy = false) {
    super(actorData);

    /**
     * The role or class of the battler (e.g., "Warrior").
     * @type {string}
     */
    this.role = actorData.role;

    /**
     * The list of active passives on this battler.
     * Resolves string IDs to full passive objects.
     * @type {Object[]}
     */
    this.passives = (actorData.passives || []).map(pId => {
        // If it's already an object (legacy/test), try to use it, but prefer lookup if string
        if (typeof pId === 'string') {
            return passivesData[pId] || { id: pId, code: pId, value: 0, name: pId };
        }
        return pId;
    });

    /**
     * The list of skill IDs available to the battler.
     * @type {string[]}
     */
    this.skills = actorData.skills ? actorData.skills.slice() : [];

    /**
     * The key for the sprite image.
     * @type {string}
     */
    this.spriteKey = actorData.spriteKey;

    /**
     * Flavor text description.
     * @type {string}
     */
    this.flavor = actorData.flavor;

    /**
     * Current experience points.
     * @type {number}
     */
    this.xp = 0;

    /**
     * Base equipment configuration.
     * @type {Object|null}
     */
    this.baseEquipment = actorData.equipment || null;

    /**
     * Currently equipped item instance.
     * @type {Object|null}
     */
    this.equipmentItem = null;

    /**
     * Experience growth factor.
     * @type {number}
     */
    this.expGrowth = actorData.expGrowth || 5;

    /**
     * Possible evolutions for this unit.
     * @type {Array}
     */
    this.evolutions = actorData.evolutions || [];

    /**
     * Gold value (dropped by enemies).
     * @type {number}
     */
    this.gold = actorData.gold || 0;

    /**
     * Whether this battler is an enemy.
     * @type {boolean}
     */
    this.isEnemy = isEnemy;

    if (this.isEnemy) {
      this.maxHp += (depth - 1) * 4;
      this.hp = this.maxHp;
    }
  }

  /**
   * Calculates the experience points needed for the next level.
   * @method xpNeeded
   * @param {number} level - The current level.
   * @returns {number} The XP required for the next level.
   */
  xpNeeded(level) {
    return Math.floor(level * (this.expGrowth * 0.5) + 10);
  }

  /**
   * Adds experience points to the battler and handles leveling up logic.
   * Automatically increases HP and Level when thresholds are met.
   * @method gainXp
   * @param {number} amount - The amount of XP to gain.
   * @returns {Object} An object containing level-up details:
   *                   { leveledUp: boolean, hpGain: number, newLevel: number }
   */
  gainXp(amount) {
    if (amount <= 0) return { leveledUp: false, hpGain: 0, newLevel: this.level };

    this.xp = (this.xp || 0) + amount;
    let leveledUp = false;
    let totalHpGain = 0;

    while (this.xp >= this.xpNeeded(this.level)) {
      this.xp -= this.xpNeeded(this.level);
      this.level++;
      const hpGain = randInt(2, 4);
      this.maxHp += hpGain;
      this.hp = this.maxHp;
      totalHpGain += hpGain;
      leveledUp = true;
    }

    return {
      leveledUp,
      hpGain: totalHpGain,
      newLevel: this.level
    };
  }

  /**
   * Gets the numeric value of a specific passive ability.
   * @method getPassiveValue
   * @param {string} code - The code of the passive to lookup (e.g., "PARASITE").
   * @returns {number} The value of the passive, or 0 if not found.
   */
  getPassiveValue(code) {
    const passive = this.passives.find((p) => p.code === code);
    return passive ? (passive.value !== undefined ? passive.value : 0) : 0;
  }

  /**
   * Executes a given action against a target.
   * Future-forward: This is a placeholder for a more robust action system.
   * It will eventually take a Game_Action object and apply its effects.
   * @method executeAction
   * @param {Object} action - The action to execute.
   * @param {Game_Battler} target - The target of the action.
   */
  executeAction(action, target) {
    // To be implemented in a future phase.
    console.log(`${this.name} uses an action on ${target.name}.`);
  }
}

/**
 * @class Game_Party
 * @description Manages the player's party members, inventory, and gold.
 */
export class Game_Party {
  /**
   * Creates a new Game_Party instance.
   */
  constructor() {
    /**
     * The maximum number of party members allowed.
     * @type {number}
     */
    this.MAX_MEMBERS = 24;

    /**
     * The list of current party members.
     * @type {Game_Battler[]}
     */
    this.members = [];

    /**
     * The current amount of gold held by the party.
     * @type {number}
     */
    this.gold = 0;

    /**
     * The party's inventory.
     * @type {Object[]}
     */
    this.inventory = [];
  }

  /**
   * Initializes the party with starting members, gold, and items defined in data.
   * @method createInitialMembers
   * @param {import("./managers.js").DataManager} dataManager - The data manager instance.
   */
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
  /**
   * Creates a new Game_Event.
   * @param {number} x - X coordinate.
   * @param {number} y - Y coordinate.
   * @param {Object} data - Event configuration.
   * @param {string} data.type - Event type (e.g., 'enemy', 'stairs').
   * @param {string} data.symbol - Character to display.
   * @param {string} data.cssClass - CSS class for styling.
   * @param {string} [data.trigger='touch'] - Trigger type ('touch', 'interact').
   * @param {Array<Object>} [data.actions=[]] - List of actions to execute.
   */
  constructor(x, y, data) {
    this.x = x;
    this.y = y;
    this.type = data.type;
    this.symbol = data.symbol || "?";
    this.cssClass = data.cssClass || "";
    this.trigger = data.trigger || "touch";
    this.actions = data.actions || [];

    // Legacy/Data support
    if (data.id) this.id = data.id;
  }
}

/**
 * @class Game_Map
 * @description Represents the game map, managing floors, tiles, and player position.
 * Handles procedural generation of dungeon floors.
 */
export class Game_Map {
  /**
   * Creates a new Game_Map instance.
   */
  constructor() {
    /**
     * The width of the map grid.
     * @type {number}
     */
    this.MAX_W = 16;

    /**
     * The height of the map grid.
     * @type {number}
     */
    this.MAX_H = 16;

    /**
     * The array of generated floors.
     * @type {Object[]}
     */
    this.floors = [];

    /**
     * The index of the current floor.
     * @type {number}
     */
    this.floorIndex = 0;

    /**
     * The maximum floor index reached by the player.
     * @type {number}
     */
    this.maxReachedFloorIndex = 0;

    /**
     * The player's X position on the current floor.
     * @type {number}
     */
    this.playerX = 0;

    /**
     * The player's Y position on the current floor.
     * @type {number}
     */
    this.playerY = 0;
  }

  /**
   * Initializes the map floors using provided map metadata.
   * @method initFloors
   * @param {Array} mapData - The array of map metadata objects from data manager.
   * @param {Array} eventDefs - The array of event definitions.
   * @param {Array} [npcData] - Optional array of NPC definitions.
   */
  initFloors(mapData, eventDefs, npcData = []) {
    this.floors = mapData.map((meta, i) => this.generateFloor(meta, eventDefs, i, npcData));
    this.floors[0].discovered = true;
    this.maxReachedFloorIndex = 0;
  }

  /**
   * Procedurally generates a single floor layout.
   * Places tiles, stairs, enemies, shrines, and shops.
   * @method generateFloor
   * @param {Object} meta - The metadata for the floor (title, depth, etc.).
   * @param {Array} eventDefs - The array of event definitions.
   * @param {number} index - The index of the floor in the dungeon.
   * @param {Array} [npcData] - Optional array of NPC definitions.
   * @returns {Object} The generated floor object containing layout and entity positions.
   */
  generateFloor(meta, eventDefs, index, npcData = []) {
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

    if (meta.spawns && eventDefs) {
      meta.spawns.forEach((spawnRule) => {
        const eventDef = eventDefs.find((e) => e.id === spawnRule.id || e.id === spawnRule.eventId);
        if (!eventDef) return;

        let count = 0;
        if (spawnRule.count !== undefined) {
          if (typeof spawnRule.count === "number") count = spawnRule.count;
          else if (typeof spawnRule.count === "string") {
            const parts = spawnRule.count.split("-");
            if (parts.length === 2)
              count = randInt(parseInt(parts[0]), parseInt(parts[1]));
            else count = parseInt(spawnRule.count);
          }
        } else if (spawnRule.chance !== undefined) {
          if (Math.random() < spawnRule.chance) count = 1;
        }

        // Special handling for stairs to ensure they are placed far from start
        if (eventDef.type === 'stairs') {
           // Try to place at 1/3 point like before, or just pick random if not available
           const preferredPos = floorCells[Math.floor(floorCells.length / 3)] || floorCells[0];
           // Check if preferredPos is already used
           if (!used.some(u => u[0] === preferredPos[0] && u[1] === preferredPos[1])) {
               events.push(new Game_Event(preferredPos[0], preferredPos[1], {
                   ...eventDef,
                   id: eventDef.id
               }));
               used.push(preferredPos);
               count--; // One placed
           }
        }

        for (let i = 0; i < count; i++) {
          const pos = pickCell(used);
          if (pos) {
            events.push(
              new Game_Event(pos[0], pos[1], {
                ...eventDef,
                id: eventDef.id,
              })
            );
            used.push(pos);
          }
        }
      });
    }

    // Place random NPC (small chance)
    if (npcData.length > 0 && Math.random() < 0.3) {
      const npcPos = pickCell(used);
      if (npcPos) {
        const npcDef = npcData[randInt(0, npcData.length - 1)];
        events.push(new Game_Event(npcPos[0], npcPos[1], {
            type: 'npc',
            symbol: npcDef.char || 'N',
            cssClass: 'tile-npc',
            trigger: 'touch',
            actions: [{ type: 'NPC_DIALOGUE', id: npcDef.id }],
            id: npcDef.id // Keep ID on event for test compatibility
        }));
        used.push(npcPos);
      }
    }

    return {
      id: "F" + (index + 1),
      title: meta.title,
      depth: meta.depth,
      intro: meta.intro,
      tiles,
      events,
      visited,
      startX,
      startY,
      discovered: false,
    };
  }

  /**
   * Removes an event from the map at the specified coordinates.
   * @method removeEvent
   * @param {number} floorIndex - The floor index.
   * @param {number} x - The x coordinate.
   * @param {number} y - The y coordinate.
   */
  removeEvent(floorIndex, x, y) {
    if (floorIndex < 0 || floorIndex >= this.floors.length) return;
    const floor = this.floors[floorIndex];
    const idx = floor.events.findIndex(e => e.x === x && e.y === y);
    if (idx !== -1) {
      floor.events.splice(idx, 1);
    }
  }

  /**
   * Reveals the map tiles around the player (fog of war mechanic).
   * @method revealAroundPlayer
   */
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
