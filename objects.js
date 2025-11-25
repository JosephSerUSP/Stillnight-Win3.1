
import { randInt, shuffleArray } from "./core.js";

/**
 * The base class for all game units.
 * @class
 */
class Game_Base {
  /**
   * @param {Object} unitData - The data for the unit.
   */
  constructor(unitData) {
    this.name = unitData.name;
    this.maxHp = unitData.maxHp;
    this.hp = unitData.maxHp;
    this.level = unitData.level;
    this.elements = unitData.elements || [];
  }
}

/**
 * The class for game actors.
 * @class
 * @extends Game_Base
 */
export class Game_Battler extends Game_Base {
  /**
   * @param {Object} actorData - The data for the actor.
   * @param {number} depth - The depth of the floor.
   */
  constructor(actorData, depth = 1, isEnemy = false) {
    super(actorData);
    this.role = actorData.role;
    this.passives = actorData.passives || [];
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

    if (this.isEnemy) {
      this.maxHp += (depth - 1) * 4;
      this.hp = this.maxHp;
    }
  }

  /**
   * The experience needed to level up.
   * @param {number} level - The current level.
   * @returns {number} The experience needed for the next level.
   */
  xpNeeded(level) {
    return Math.floor(level * (this.expGrowth * 0.5) + 10);
  }

  /**
   * Gets the value of a specific passive.
   * @param {string} code - The code of the passive to get.
   * @returns {number} The value of the passive, or 0 if not found.
   */
  getPassiveValue(code) {
    const passive = this.passives.find((p) => p.code === code);
    return passive ? passive.value : 0;
  }
}

/**
 * The class for the game party.
 * @class
 */
export class Game_Party {
  /**
   * The maximum number of party members.
   * @type {number}
   */
  MAX_MEMBERS = 24;

  /**
   * The party members.
   * @type {Game_Battler[]}
   */
  members = [];

  /**
   * The party's gold.
   * @type {number}
   */
  gold = 0;

  /**
   * The party's inventory.
   * @type {Object[]}
   */
  inventory = [];

  /**
   * Creates the initial party members.
   * @param {Object} actorData - The actor data from the data manager.
   */
  createInitialMembers(actorData, initialSetupData) {
    this.gold = initialSetupData.initialGold;
    this.inventory = initialSetupData.initialItems.slice();

    const startingPool = actorData.filter(creature =>
        initialSetupData.startingParty.includes(creature.id)
    );

    this.members = shuffleArray(startingPool)
        .slice(0, 3)
        .map(data => new Game_Battler(data));
  }
}

/**
 * The class for the game map.
 * @class
 */
export class Game_Map {
  /**
   * The width of the map.
   * @type {number}
   */
  MAX_W = 16;

  /**
   * The height of the map.
   * @type {number}
   */
  MAX_H = 16;

  /**
   * The array of floors.
   * @type {Object[]}
   */
  floors = [];

  /**
   * The current floor index.
   * @type {number}
   */
  floorIndex = 0;

  /**
   * The maximum reached floor index.
   * @type {number}
   */
  maxReachedFloorIndex = 0;

  /**
   * The player's X position.
   * @type {number}
   */
  playerX = 0;

  /**
   * The player's Y position.
   * @type {number}
   */
  playerY = 0;

  /**
   * Initializes the floors.
   * @param {Array} floorData - The floor data from the data manager.
   */
  initFloors(floorData) {
    this.floors = floorData.map((meta, i) => this.generateFloor(meta, i));
    this.floors[0].discovered = true;
    this.maxReachedFloorIndex = 0;
  }

  /**
   * Generates a floor.
   * @param {Object} meta - The metadata for the floor.
   * @param {number} index - The index of the floor.
   * @returns {Object} The generated floor object.
   */
  generateFloor(meta, index) {
    const tiles = Array.from({ length: this.MAX_H }, () =>
      Array.from({ length: this.MAX_W }, () => "#")
    );
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

    const stairsPos =
      floorCells[Math.floor(floorCells.length / 3)] || floorCells[0];
    tiles[stairsPos[1]][stairsPos[0]] = "S";

    const used = [startPos, stairsPos];

    const recPos = pickCell(used);
    if (recPos) {
      tiles[recPos[1]][recPos[0]] = "R";
      used.push(recPos);
    }

    const enemyCount = randInt(2, 4);
    for (let i = 0; i < enemyCount; i++) {
      const ePos = pickCell(used);
      if (!ePos) break;
      tiles[ePos[1]][ePos[0]] = "E";
      used.push(ePos);
    }

    if (meta.depth >= 1 && index >= 1) {
      const shrinePos = pickCell(used);
      if (shrinePos) {
        tiles[shrinePos[1]][shrinePos[0]] = "♱";
        used.push(shrinePos);
      }
    }
    if (meta.depth >= 2 || index === 0) { // Always on first floor for testing
      const shopPos = pickCell(used);
      if (shopPos) {
        tiles[shopPos[1]][shopPos[0]] = "¥";
        used.push(shopPos);
      }
    }

    if (meta.depth >= 1) {
      const recruitPos = pickCell(used);
      if (recruitPos) {
        tiles[recruitPos[1]][recruitPos[0]] = "U";
        used.push(recruitPos);
      }
    }

    return {
      id: "F" + (index + 1),
      title: meta.title,
      depth: meta.depth,
      intro: meta.intro,
      tiles,
      visited,
      startX,
      startY,
      discovered: false,
    };
  }

  /**
   * Reveals the tiles around the player.
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
