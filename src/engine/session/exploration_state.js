/**
 * @class ExplorationState
 * @description Pure data class for holding the runtime state of exploration (dungeon, position).
 */
export class ExplorationState {
  constructor() {
    this.floors = [];
    this.floorIndex = 0;
    this.playerX = 0;
    this.playerY = 0;
    this.maxReachedFloorIndex = 0;
    this.config = {
        MAX_W: 19,
        MAX_H: 19
    };
  }
}
