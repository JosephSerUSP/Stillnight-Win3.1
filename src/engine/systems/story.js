import { storylines } from "../../../data/storylines.js";

/**
 * System to coordinate storylines and quest steps using party.storyFlags as the state source of truth.
 */
export class StorySystem {
  static ensureFlags(party) {
    if (!party.storyFlags) party.storyFlags = {};
    storylines.forEach((line) => {
      const key = this._key(line.id);
      if (party.storyFlags[key] === undefined) {
        party.storyFlags[key] = 0;
      }
    });
  }

  static _key(id) {
    return `story_${id}_stage`;
  }

  static getState(party, id) {
    this.ensureFlags(party);
    const storyline = storylines.find((s) => s.id === id);
    if (!storyline) {
      return { storyline: null, stage: 0, step: null, previous: null };
    }
    const stage = party.storyFlags[this._key(id)] || 0;
    return {
      storyline,
      stage,
      step: storyline.steps[stage] || null,
      previous: stage > 0 ? storyline.steps[stage - 1] : null,
    };
  }

  static notify(party, trigger) {
    this.ensureFlags(party);
    const updates = [];
    storylines.forEach((line) => {
      const key = this._key(line.id);
      const stage = party.storyFlags[key] || 0;
      const step = line.steps[stage];
      if (!step) return;
      if (this._triggerMatches(step.trigger, trigger, party)) {
        party.storyFlags[key] = stage + 1;
        updates.push({
          storyline: line,
          step,
          consumeItems: step.consumeItems || [],
        });
      }
    });
    return updates;
  }

  static _triggerMatches(trigger, event, party) {
    if (!trigger || !event) return false;

    const requireItems = (items) =>
      !items || items.every((itemId) => party.hasItem(itemId));

    switch (trigger.type) {
      case "run_started":
        return event.type === "run_started";
      case "reach_floor":
        if (event.type !== "reach_floor") return false;
        if (trigger.requiresItem && !party.hasItem(trigger.requiresItem)) return false;
        return event.depth >= (trigger.depth || 0);
      case "item":
        return event.type === "item" && event.itemId === trigger.itemId;
      case "npc":
        if (event.type !== "npc" || event.id !== trigger.id) return false;
        if (trigger.requiresItem && !party.hasItem(trigger.requiresItem)) return false;
        if (!requireItems(trigger.requiresItems)) return false;
        return true;
      case "action":
        return event.type === "action" && event.id === trigger.id;
      default:
        return false;
    }
  }

  static getJournalEntries(party) {
    this.ensureFlags(party);
    return storylines.map((line) => {
      const key = this._key(line.id);
      const stage = party.storyFlags[key] || 0;
      const current = line.steps[stage] || null;
      const previous = stage > 0 ? line.steps[stage - 1] : null;
      return {
        id: line.id,
        title: line.title,
        overview: line.overview,
        current,
        previous,
        completed: stage >= line.steps.length,
        stage,
      };
    });
  }
}
