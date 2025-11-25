/**
 * The data manager for the game.
 * @class
 */
export class DataManager {
  /**
   * The actor data.
   * @type {Object}
   */
  actors = null;

  /**
   * The element data.
   * @type {Object}
   */
  elements = null;

  /**
   * The enemy data.
   * @type {Array}
   */
  enemies = null;

  /**
   * The event data.
   * @type {Array}
   */
  events = null;

  /**
   * The floor data.
   * @type {Array}
   */
  floors = null;

  /**
   * The item data.
   * @type {Array}
   */
  items = null;

  /**
   * The terms data.
   * @type {Object}
   */
  terms = null;

  /**
   * Loads all the game data.
   */
  async loadData() {
    const dataSources = {
      actors: "data/actors.json",
      elements: "data/elements.json",
      enemies: "data/enemies.json",
      events: "data/events.json",
      floors: "data/floors.json",
      items: "data/items.json",
      terms: "data/terms.json",
    };

    for (const [key, src] of Object.entries(dataSources)) {
      try {
        const response = await fetch(src);
        this[key] = await response.json();
      } catch (error) {
        console.error(`Failed to load ${src}:`, error);
      }
    }
  }
}
