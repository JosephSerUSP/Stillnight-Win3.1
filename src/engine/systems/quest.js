
/**
 * System for managing quest logic.
 * Handles starting, tracking, and completing quests.
 */
export class QuestSystem {
    /**
     * Starts a quest for the party.
     * @param {string} questId - The ID of the quest to start.
     * @param {Object} session - The game session (contains party, dataManager).
     * @returns {boolean} True if quest was started, false if already active/completed or invalid.
     */
    static startQuest(questId, session) {
        if (!session.party) {
            console.warn("QuestSystem: No party in session.");
            return false;
        }

        // Initialize quests array if missing
        if (!session.party.quests) {
            session.party.quests = [];
        }

        const existing = session.party.quests.find(q => q.id === questId);
        if (existing) {
            // Already have this quest
            return false;
        }

        // Validate quest exists in data
        const questData = session.dataManager.quests.find(q => q.id === questId);
        if (!questData) {
            console.warn(`QuestSystem: Quest '${questId}' not found in data.`);
            return false;
        }

        session.party.quests.push({
            id: questId,
            status: 'active',
            stage: 0,
            startedAt: Date.now()
        });

        return true;
    }

    /**
     * Checks the status of a quest.
     * @param {string} questId
     * @param {Object} session
     * @returns {string|null} 'active', 'completed', 'failed', or null if not started.
     */
    static getQuestStatus(questId, session) {
        if (!session.party || !session.party.quests) return null;
        const quest = session.party.quests.find(q => q.id === questId);
        return quest ? quest.status : null;
    }

    /**
     * Completes a quest and returns rewards to be processed.
     * @param {string} questId
     * @param {Object} session
     * @returns {Object|null} Quest data and rewards if successful, null otherwise.
     */
    static completeQuest(questId, session) {
        if (!session.party || !session.party.quests) return null;

        const questIndex = session.party.quests.findIndex(q => q.id === questId);
        if (questIndex === -1) return null;

        const questState = session.party.quests[questIndex];
        if (questState.status !== 'active') return null;

        questState.status = 'completed';
        questState.completedAt = Date.now();

        const questData = session.dataManager.quests.find(q => q.id === questId);
        return questData; // Return data so caller can process rewards
    }
}
