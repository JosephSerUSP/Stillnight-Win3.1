export class QuestSystem {
  constructor(dataManager) {
    this.dataManager = dataManager;
  }

  get quests() {
    return this.dataManager.quests || {};
  }

  getQuest(questId) {
    return this.quests[questId];
  }

  isStarted(party, questId) {
    return !!party.quests[questId];
  }

  isCompleted(party, questId) {
    return party.quests[questId] && party.quests[questId].status === 'completed';
  }

  startQuest(party, questId) {
    if (this.isStarted(party, questId)) return false;

    party.quests[questId] = {
      status: 'active',
      stage: 0,
      startedAt: Date.now()
    };
    return true;
  }

  completeQuest(party, questId) {
    if (!this.isStarted(party, questId)) return false;

    party.quests[questId].status = 'completed';
    party.quests[questId].completedAt = Date.now();
    return true;
  }

  checkCondition(party, condition) {
    // Implement condition checking (e.g. hasItem, killCount)
    // This will be expanded later
    if (!party || !condition) return false;
    return true;
  }
}
