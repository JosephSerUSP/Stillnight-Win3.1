import { SoundManager } from "./sound.js";

/**
 * @class DataManager
 * @description Central manager for loading and accessing game data.
 * Loads static JSON data and dynamic JS data modules.
 */
export class DataManager {
  /**
   * Creates a new DataManager instance.
   */
  constructor() {
    /**
     * The actor data loaded from actors.json.
     * @type {Object|null}
     */
    this.actors = null;

    /**
     * The element data loaded from elements.json.
     * @type {Object|null}
     */
    this.elements = null;

    /**
     * The event data loaded from events.json.
     * @type {Array|null}
     */
    this.events = null;

    /**
     * The map data loaded from maps.json.
     * @type {Array|null}
     */
    this.maps = null;

    /**
     * The item data loaded from items.json.
     * @type {Array|null}
     */
    this.items = null;

    /**
     * The NPC data loaded from npcs.json.
     * @type {Array|null}
     */
    this.npcs = null;

    /**
     * The shop data loaded from shops.json.
     * @type {Object|null}
     */
    this.shops = null;

    /**
     * The terms/strings data loaded from terms.json.
     * @type {Object|null}
     */
    this.terms = null;

    /**
     * The sound mapping data loaded from sounds.json.
     * @type {Object|null}
     */
    this.sounds = null;

    /**
     * The skill data loaded from skills.js.
     * @type {Object|null}
     */
    this.skills = null;

    /**
     * The passive data loaded from passives.js.
     * @type {Object|null}
     */
    this.passives = null;

    /**
     * The state data loaded from states.js.
     * @type {Object|null}
     */
    this.states = null;

    /**
     * The starting party data loaded from party.js.
     * @type {Object|null}
     */
    this.startingParty = null;

    /**
     * The animation data loaded from animations.js.
     * @type {Object|null}
     */
    this.animations = null;

    /**
     * The theme data loaded from themes.json.
     * @type {Array|null}
     */
    this.themes = null;

    /**
     * The quest data loaded from quests.json.
     * @type {Array|null}
     */
    this.quests = null;
  }

  /**
   * Loads all game data from JSON and JS files.
   * @async
   */
  async loadData() {
    const dataSources = {
      actors: "data/actors.json",
      elements: "data/elements.json",
      events: "data/events.json",
      maps: "data/maps.json",
      items: "data/items.json",
      npcs: "data/npcs.json",
      shops: "data/shops.json",
      terms: "data/terms.json",
      themes: "data/themes.json",
      sounds: "data/sounds.json",
      quests: "data/quests.json",
    };

    try {
      const { skills } = await import("../../data/skills.js");
      this.skills = skills;
      const { passives } = await import("../../data/passives.js");
      this.passives = passives;
      const { states } = await import("../../data/states.js");
      this.states = states;
      const { startingParty } = await import("../../data/party.js");
      this.startingParty = startingParty;
    } catch (error) {
      console.error("Failed to load skills.js, passives.js, or states.js:", error);
    }

    for (const [key, src] of Object.entries(dataSources)) {
      try {
        const response = await fetch(src);
        this[key] = await response.json();
      } catch (error) {
        console.error(`Failed to load ${src}:`, error);
      }
    }

    // Load Animations
    try {
        const { animations } = await import("../../data/animations.js");
        this.animations = animations;
    } catch (error) {
        console.error("Failed to load animations.js:", error);
    }

    // Initialize SoundManager with loaded sound data
    // We await this to ensure MIDI data is ready before the game starts
    if (this.sounds) {
        await SoundManager.init(this.sounds);
    }

    this.loaded = true;
  }
}
