import { findPath } from "../core/utils.js";

/**
 * @class Game_Event
 * @description Represents an interactive entity on the map.
 */
export class Game_Event {
  /**
   * Creates a new Game_Event.
   * @param {number} x - The x-coordinate.
   * @param {number} y - The y-coordinate.
   * @param {Object} data - The event data.
   */
  constructor(x, y, data) {
    this.x = x;
    this.y = y;
    this.type = data.type;
    this.symbol = data.symbol || "?";
    this.cssClass = data.cssClass || "";
    // triggers: 'touch' (interact), 'step' (enter)
    this.trigger = data.trigger || "touch";

    // Scripts: { onInteract: [], onEnter: [], onSight: [] }
    this.scripts = data.scripts || {};

    if (data.id) this.id = data.id;
    this.hidden = data.hidden || false;
    this.trapValue = data.trapValue || 0;
    this.behavior = data.behavior || null;
    this.encounterData = data.encounterData || null;
    this.isSneakAttack = data.isSneakAttack || false;
    this.isPlayerFirstStrike = data.isPlayerFirstStrike || false;

    // By default, events are NOT obstacles unless explicitly set.
    // This allows the player to move onto the tile (triggering onEnter).
    this.isObstacle = data.isObstacle === true;
  }

  /**
   * Updates the event logic (e.g. movement).
   * @param {Object} map - The map state interface (ExplorationAdapter or similar).
   * @param {import("./party.js").Game_Party} party - The party instance.
   * @returns {Object|null} Result of update, e.g., { type: 'battle', event: this }.
   */
  update(map, party) {
      if (this.behavior === 'chase' && !this.hidden) {
          const dx = map.playerX - this.x;
          const dy = map.playerY - this.y;
          const dist = Math.abs(dx) + Math.abs(dy);

          // Aggro range check (e.g., 8 tiles)
          if (dist > 0 && dist < 12) {
              const start = { x: this.x, y: this.y };
              const end = { x: map.playerX, y: map.playerY };
              const floor = map.floors[map.floorIndex];

              const isWalkable = (x, y) => {
                  // Walls are blocked
                  if (floor.tiles[y][x] === '#') return false;

                  // Check events
                  const event = floor.events.find(e => e.x === x && e.y === y && e !== this);
                  if (event) {
                      // Use explicit obstacle property
                      if (event.isObstacle) return false;

                      // If not explicitly an obstacle, it is passable.
                      return true;
                  }

                  return true;
              };

              const path = findPath(map.MAX_W, map.MAX_H, isWalkable, start, end);

              if (path.length > 1) {
                  const nextStep = path[1];
                  const isPlayer = (nextStep.x === map.playerX && nextStep.y === map.playerY);
                  if (isPlayer) {
                      return null;
                  }

                  const targetEvent = floor.events.find(e => e.x === nextStep.x && e.y === nextStep.y && e !== this);

                  if (!targetEvent) {
                      this.x = nextStep.x;
                      this.y = nextStep.y;
                  } else {
                      // Check passability
                      if (!targetEvent.isObstacle) {
                          this.x = nextStep.x;
                          this.y = nextStep.y;
                      }
                  }
              }
          }
      }
      return null;
  }
}
