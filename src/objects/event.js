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
    this.trigger = data.trigger || "touch";
    this.actions = data.actions || [];
    if (data.id) this.id = data.id;
    this.hidden = data.hidden || false;
    this.trapValue = data.trapValue || 0;
    this.behavior = data.behavior || null;
    this.encounterData = data.encounterData || null;
    this.isSneakAttack = data.isSneakAttack || false;
    this.isPlayerFirstStrike = data.isPlayerFirstStrike || false;
  }

  /**
   * Updates the event logic (e.g. movement).
   * @param {import("./map.js").Game_Map} map - The map instance.
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
                  // User Requirement: "pass through non-obstacle events, such as recovery, shrine, other enemies"
                  // We treat 'enemy', 'shrine', 'recovery' as passable for pathfinding purposes.
                  const event = floor.events.find(e => e.x === x && e.y === y && e !== this);
                  if (event) {
                      // Obstacles: maybe chests or NPCs?
                      // For now, let's assume 'enemy', 'shrine', 'recovery' are passable.
                      // If undefined type, treat as obstacle?
                      // Let's invert: what IS an obstacle?
                      // Walls (handled above).
                      // Maybe specific event types?
                      // The prompt implies most things are passable except walls.
                      const passableTypes = ['enemy', 'shrine', 'recovery', 'trap'];
                      if (passableTypes.includes(event.type) || event.id === 'enemy') return true;

                      // Unknown types might be obstacles (e.g. NPC blocking a door)
                      return false;
                  }

                  return true;
              };

              const path = findPath(map.MAX_W, map.MAX_H, isWalkable, start, end);

              // path[0] is start, path[1] is next step
              if (path.length > 1) {
                  const nextStep = path[1];

                  // Check if we can legally occupy nextStep
                  // Even if it was "walkable" for pathfinding (pass through),
                  // we might not want to END our turn on top of another event unless stacking is allowed.
                  // The user said "pass through", which implies transient overlap.
                  // But since movement is discrete (step by step), transient overlap = stacking.
                  // We will allow stacking if the target tile event is "passable".

                  // Re-check specific collision for the destination
                  const isPlayer = (nextStep.x === map.playerX && nextStep.y === map.playerY);
                  if (isPlayer) {
                      // Don't move onto player, stop adjacent
                      // This fulfills "finish movement next to the player"
                      return null;
                  }

                  // If we are here, we are not stepping on player.
                  // Check if we are stepping on another event.
                  const targetEvent = floor.events.find(e => e.x === nextStep.x && e.y === nextStep.y && e !== this);

                  if (!targetEvent) {
                      // Free tile
                      this.x = nextStep.x;
                      this.y = nextStep.y;
                  } else {
                      // Occupied tile.
                      // Can we stack?
                      const passableTypes = ['enemy', 'shrine', 'recovery', 'trap'];
                      if (passableTypes.includes(targetEvent.type) || targetEvent.id === 'enemy') {
                          // Allow stacking
                          this.x = nextStep.x;
                          this.y = nextStep.y;
                      }
                      // Else blocked by obstacle event (NPC?), wait.
                  }
              }
          }
      }
      return null;
  }
}
