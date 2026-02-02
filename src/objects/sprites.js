/**
 * The base class for all sprites.
 * @class Sprite
 * @deprecated Unused in DOM-based architecture.
 */
export class Sprite {
  /**
   * Creates a new Sprite instance.
   */
  constructor() {
    /**
     * The x-coordinate of the sprite.
     * @type {number}
     */
    this.x = 0;

    /**
     * The y-coordinate of the sprite.
     * @type {number}
     */
    this.y = 0;

    /**
     * Whether the sprite is visible.
     * @type {boolean}
     */
    this.visible = true;

    /**
     * The bitmap or image associated with the sprite.
     * @type {Object|null}
     */
    this.bitmap = null;
  }
}

/**
 * Represents a sprite for an actor or battler.
 * @class Sprite_Actor
 * @extends Sprite
 */
export class Sprite_Actor extends Sprite {
  /**
   * Creates a new Sprite_Actor instance.
   * @param {import("./battler.js").Game_Battler} actor - The actor to represent.
   */
  constructor(actor) {
    super();
    /**
     * The actor associated with this sprite.
     * @type {import("./battler.js").Game_Battler}
     */
    this.actor = actor;
    // Further implementation would go here.
  }
}
