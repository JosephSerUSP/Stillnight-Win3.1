import { QuestState } from "../session/quest_state.js";

/**
 * @class QuestSystem
 * @description Pure-ish quest progression engine. Evaluates objectives and applies rewards.
 */
export class QuestSystem {
  /**
   * @param {Array<Object>} questDefinitions
   * @param {QuestState} questState
   * @param {import("../../objects/party.js").Game_Party} party
   * @param {Array<Object>} items
   */
  constructor(questDefinitions = [], questState = new QuestState(), party, items = []) {
    this.definitions = questDefinitions;
    this.state = questState;
    this.party = party;
    this.items = items;
  }

  getQuest(questId) {
    return this.definitions.find((q) => q.id === questId);
  }

  getStatus(questId) {
    const entry = this.state.entries[questId];
    return entry ? entry.status : "available";
  }

  isActive(questId) {
    return this.getStatus(questId) === "active";
  }

  isCompleted(questId) {
    return this.getStatus(questId) === "completed";
  }

  ensureEntry(questId) {
    if (!this.state.entries[questId]) {
      this.state.entries[questId] = { status: "available" };
    }
    return this.state.entries[questId];
  }

  acceptQuest(questId) {
    const quest = this.getQuest(questId);
    if (!quest) {
      return { success: false, message: "Quest not found." };
    }
    const entry = this.ensureEntry(questId);
    if (entry.status === "active") {
      return { success: false, message: "Quest already active." };
    }
    if (entry.status === "completed") {
      return { success: false, message: "Quest already completed." };
    }

    entry.status = "active";
    entry.acceptedAt = Date.now();
    return { success: true, message: quest.onAcceptLog || `${quest.title} accepted.` };
  }

  canComplete(questId) {
    const quest = this.getQuest(questId);
    if (!quest) return false;
    const entry = this.state.entries[questId];
    if (!entry || entry.status !== "active") return false;

    return (quest.objectives || []).every((obj) => this._isObjectiveSatisfied(obj));
  }

  completeQuest(questId) {
    const quest = this.getQuest(questId);
    if (!quest) {
      return { success: false, messages: ["Quest not found."] };
    }
    const entry = this.state.entries[questId];
    if (!entry || entry.status !== "active") {
      return { success: false, messages: ["Quest is not active."] };
    }
    if (!this.canComplete(questId)) {
      return { success: false, messages: ["Objectives are not met yet."] };
    }

    const messages = [];
    this._consumeObjectives(quest.objectives || []);
    messages.push(quest.onCompleteLog || `${quest.title} completed.`);
    messages.push(...this._applyRewards(quest.rewards));

    entry.status = "completed";
    entry.completedAt = Date.now();
    return { success: true, messages };
  }

  getQuestView(questId) {
    const quest = this.getQuest(questId);
    if (!quest) return null;
    const objectives = (quest.objectives || []).map((obj) => ({
      label: obj.label || this._describeObjective(obj),
      fulfilled: this._isObjectiveSatisfied(obj),
    }));
    return {
      id: quest.id,
      title: quest.title,
      giver: quest.giver,
      summary: quest.summary,
      description: quest.description,
      rewards: this._decorateRewards(quest.rewards),
      status: this.getStatus(quest.id),
      objectives,
    };
  }

  getAllQuestViews() {
    return this.definitions.map((q) => this.getQuestView(q.id));
  }

  _isObjectiveSatisfied(objective) {
    if (!objective) return true;
    switch (objective.type) {
      case "item": {
        const owned = this.party.countItem(objective.id);
        return owned >= (objective.count || 1);
      }
      case "flag":
        return this.party.hasStoryFlag(objective.id);
      case "gold":
        return this.party.gold >= (objective.amount || 0);
      default:
        return false;
    }
  }

  _consumeObjectives(objectives) {
    objectives.forEach((obj) => {
      if (obj.type === "item" && obj.consume) {
        this.party.removeItemById(obj.id, obj.count || 1);
      }
      if (obj.type === "gold" && obj.consume) {
        this.party.gold = Math.max(0, this.party.gold - (obj.amount || 0));
      }
      if (obj.type === "flag" && obj.consume) {
        this.party.clearStoryFlag(obj.id);
      }
    });
  }

  _applyRewards(rewards = {}) {
    const messages = [];
    if (rewards.gold) {
      this.party.gold += rewards.gold;
      messages.push(`[Reward] Gained ${rewards.gold} gold.`);
    }
    if (Array.isArray(rewards.items)) {
      rewards.items.forEach((itemReward) => {
        const qty = itemReward.qty || 1;
        const item = this.items.find((i) => i.id === itemReward.id);
        if (item) {
          for (let i = 0; i < qty; i++) {
            this.party.addItem(item);
          }
          messages.push(`[Reward] Received ${qty} x ${item.name}.`);
        }
      });
    }
    if (Array.isArray(rewards.flags)) {
      rewards.flags.forEach((flag) => this.party.setStoryFlag(flag));
    }
    return messages;
  }

  _describeObjective(obj) {
    if (obj.type === "item") {
      return `Obtain ${obj.count || 1} x ${obj.id}`;
    }
    if (obj.type === "flag") {
      return `Trigger ${obj.id}`;
    }
    if (obj.type === "gold") {
      return `Hold ${obj.amount || 0} gold`;
    }
    return "Objective";
  }

  _decorateRewards(rewards = {}) {
    const decorated = { ...rewards };
    if (Array.isArray(rewards.items)) {
        decorated.items = rewards.items.map((item) => ({
            ...item,
            name: item.name || this._itemName(item.id)
        }));
    }
    return decorated;
  }

  _itemName(id) {
    const item = this.items.find((i) => i.id === id);
    return item ? item.name : id;
  }
}
