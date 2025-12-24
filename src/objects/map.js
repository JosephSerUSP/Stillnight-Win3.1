import { RandomWalkGenerator } from "../generators/dungeon_generator.js";

/**
 * @class Game_Map
 * @description Represents the game map and handles floor generation via generators.
 */
export class Game_Map {
  /**
   * Creates a new Game_Map instance.
   */
  constructor() {
    this.MAX_W = 19;
    this.MAX_H = 19;
    this.floors = [];
    this.floorIndex = 0;
    this.maxReachedFloorIndex = 0;
    this.playerX = 0;
    this.playerY = 0;
    this.lastEventPosition = null;
  }

  /**
   * Initializes floors based on map data.
   * @param {Array} mapData - Data for all floors.
   * @param {Array} eventDefs - Event definitions.
   * @param {Array} [npcData=[]] - NPC definitions.
   * @param {import("./party.js").Game_Party} [party=null] - The party (for initiative checks).
   * @param {Array} [actors=[]] - Actor definitions.
   */
  initFloors(mapData, eventDefs, npcData = [], party = null, actors = []) {
    this.floors = mapData.map((meta, i) => this.generateFloor(meta, i, eventDefs, npcData, party, actors));
    this.floors[0].discovered = true;
    this.maxReachedFloorIndex = 0;
  }

  /**
   * Generates a single floor layout using the appropriate generator.
   * @param {Object} meta - Floor metadata.
   * @param {number} index - Floor index.
   * @param {Array} eventDefs - Event definitions.
   * @param {Array} npcData - NPC definitions.
   * @param {import("./party.js").Game_Party} [party=null] - The party.
   * @param {Array} [actors=[]] - Actor definitions.
   * @returns {Object} The generated floor object.
   */
  generateFloor(meta, index, eventDefs, npcData = [], party = null, actors = []) {
      // In the future, we can switch generator based on meta.type
      const generator = new RandomWalkGenerator();
      return generator.generate(meta, index, eventDefs, npcData, party, actors);
  }

  /**
   * Updates all events on the current floor.
   * @param {import("./party.js").Game_Party} party - The party.
   * @returns {Array} List of results (e.g., collisions).
   */
  updateEvents(party) {
      const floor = this.floors[this.floorIndex];
      const results = [];
      if (floor.events) {
          floor.events.forEach(event => {
              const res = event.update(this, party);
              if (res) results.push(res);
          });
      }
      return results;
  }

  /**
   * Removes an event from the specified floor.
   * @param {number} floorIndex - The index of the floor.
   * @param {number} x - The x-coordinate.
   * @param {number} y - The y-coordinate.
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
   * Reveals tiles around the player (fog of war).
   */
  revealAroundPlayer() {
    this.revealRadius(1);
  }

  /**
   * Reveals tiles within a specific radius around the player.
   * @param {number} radius - The radius to reveal.
   */
  revealRadius(radius) {
    const floor = this.floors[this.floorIndex];
    const px = this.playerX;
    const py = this.playerY;

    const startX = Math.max(0, px - radius);
    const endX = Math.min(this.MAX_W - 1, px + radius);
    const startY = Math.max(0, py - radius);
    const endY = Math.min(this.MAX_H - 1, py + radius);

    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        floor.visited[y][x] = true;
      }
    }
  }

  /**
   * Checks if all accessible (non-wall) tiles on the current floor have been visited.
   * @returns {boolean} True if the floor is fully explored.
   */
  checkFloorExploration() {
      const floor = this.floors[this.floorIndex];
      if (floor.fullyRevealed) return false; // Already handled

      for (let y = 0; y < this.MAX_H; y++) {
          for (let x = 0; x < this.MAX_W; x++) {
              if (floor.tiles[y][x] !== '#' && !floor.visited[y][x]) {
                  return false;
              }
          }
      }
      return true;
  }

  /**
   * Reveals the entire current floor.
   * @param {boolean} [updateVisited=true] - Whether to mark all tiles visited immediately.
   */
  revealCurrentFloor(updateVisited = true) {
      const floor = this.floors[this.floorIndex];
      floor.fullyRevealed = true;
      if (updateVisited) {
          for (let y = 0; y < this.MAX_H; y++) {
              for (let x = 0; x < this.MAX_W; x++) {
                  floor.visited[y][x] = true;
              }
          }
      }
  }
}
