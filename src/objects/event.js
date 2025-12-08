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

          // Simple Manhattan chase
          if (dist > 0 && dist < 8) { // Aggro range
              let nx = this.x;
              let ny = this.y;

              if (Math.abs(dx) > Math.abs(dy)) {
                  nx += Math.sign(dx);
              } else {
                  ny += Math.sign(dy);
              }

              // Collision check with walls
              if (map.floors[map.floorIndex].tiles[ny][nx] !== '#') {
                   // Check collision with player
                   const isPlayer = (nx === map.playerX && ny === map.playerY);

                   // Check collision with other events
                   const otherEvent = map.floors[map.floorIndex].events.find(e => e !== this && e.x === nx && e.y === ny);

                   if (!otherEvent && !isPlayer) {
                       this.x = nx;
                       this.y = ny;
                   }
              }
          }
      }
      return null;
  }
}
