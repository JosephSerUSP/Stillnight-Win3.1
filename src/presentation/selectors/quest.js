/**
 * Selects quest log data for the UI.
 * @param {import("../../engine/session/quest_state.js").QuestLogState} questLog
 * @param {Object} dataManager
 * @returns {{ active: Array, completed: Array }}
 */
export function selectQuestLog(questLog, dataManager) {
    if (!questLog) return { active: [], completed: [] };

    const mapQuest = (entry, status) => {
        const def = (dataManager.quests || {})[entry.id];
        if (!def) return null;

        return {
            id: entry.id,
            name: def.name,
            description: def.description || def.summary,
            objectives: def.objectives || [],
            rewards: def.rewards || {},
            giver: def.giver,
            status: status,
            acceptedAt: entry.acceptedAt,
            completedAt: entry.completedAt
        };
    };

    const active = (questLog.active || [])
        .map(q => mapQuest(q, 'active'))
        .filter(Boolean)
        .sort((a, b) => b.acceptedAt - a.acceptedAt);

    const completed = (questLog.completed || [])
        .map(q => mapQuest(q, 'completed'))
        .filter(Boolean)
        .sort((a, b) => b.completedAt - a.completedAt);

    return { active, completed };
}
