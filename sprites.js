/**
 * The basic sprite class.
 * @class
 */
export class Sprite {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.visible = true;
    this.bitmap = null;
  }
}

/**
 * The sprite for an actor.
 * @class
 * @extends Sprite
 */
export class Sprite_Actor extends Sprite {
  /**
   * @param {import("./objects.js").Game_Actor} actor - The actor to represent.
   */
  constructor(actor) {
    super();
    this.actor = actor;
    // Further implementation would go here.
  }
}
