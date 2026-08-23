/**
 * Loads and exposes static game content. Runtime services are initialized by
 * the application/boot composition layer after content acquisition completes.
 */
export class ContentLoader {
  constructor() {
    this.actors = null;
    this.elements = null;
    this.events = null;
    this.maps = null;
    this.items = null;
    this.quests = null;
    this.shops = null;
    this.terms = null;
    this.sounds = null;
    this.skills = null;
    this.passives = null;
    this.states = null;
    this.startingParty = null;
    this.animations = null;
    this.themes = null;
    this.graphs = {};
    this.loaded = false;
  }

  async loadData() {
    const dataSources = {
      actors: "data/actors.json",
      elements: "data/elements.json",
      events: "data/events.json",
      maps: "data/maps.json",
      items: "data/items.json",
      quests: "data/quests.json",
      shops: "data/shops.json",
      terms: "data/terms.json",
      themes: "data/themes.json",
      sounds: "data/sounds.json",
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

    try {
      const { animations } = await import("../../data/animations.js");
      this.animations = animations;
    } catch (error) {
      console.error("Failed to load animations.js:", error);
    }

    try {
      const response = await fetch("data/graphs/index.json");
      const graphList = await response.json();
      for (const graphId of graphList) {
        const gRes = await fetch(`data/graphs/${graphId}.json`);
        this.graphs[graphId] = await gRes.json();
      }
    } catch (error) {
      console.warn("Failed to load graphs:", error);
    }

    this.loaded = true;
  }
}
