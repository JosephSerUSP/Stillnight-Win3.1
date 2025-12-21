import { QuestSystem } from "../../engine/systems/quest.js";

function resolveQuestDefinition(quests, questId) {
    if (!quests) return null;
    if (Array.isArray(quests)) {
        return quests.find(q => q.id === questId) || null;
    }
    return quests[questId] ? { id: questId, ...quests[questId] } : null;
}

function findNpcPortraitByName(npcs, name) {
    if (!name || !npcs) return null;
    const npcList = Array.isArray(npcs) ? npcs : Object.values(npcs);
    const npc = npcList.find(n => n.name === name);
    return npc ? npc.portrait : null;
}

function countItem(party, itemId) {
    if (!party || !Array.isArray(party.inventory)) return 0;
    return party.inventory.reduce((sum, item) => sum + (item.id === itemId ? 1 : 0), 0);
}

export function selectQuestLog(log, dataManager, party) {
    if (!log || !dataManager?.quests) return [];

    const questIds = new Set([
        ...(log.active || []).map(q => q.id),
        ...(log.completed || []).map(q => q.id),
    ]);

    const items = dataManager.items || [];
    const statusOrder = { active: 0, completed: 1, inactive: 2 };

    const quests = [];
    for (const questId of questIds) {
        const base = resolveQuestDefinition(dataManager.quests, questId);
        if (!base) continue;

        const status = QuestSystem.getStatus(log, questId);
        const requirements = (base.requirements?.items || []).map(req => {
            const def = items.find(i => i.id === req.id);
            const owned = countItem(party, req.id);
            const qty = req.qty || 1;
            return {
                id: req.id,
                qty,
                owned,
                name: req.name || def?.name || req.id,
                icon: req.icon || def?.icon,
                complete: owned >= qty,
            };
        });

        const objectives = (base.objectives || []).map(obj => ({
            text: obj,
            complete: status === 'completed' || (requirements.length > 0 && requirements.every(r => r.complete)),
        }));

        const progressSummary = requirements.length > 0
            ? requirements.map(r => `${Math.min(r.owned, r.qty)}/${r.qty} ${r.name}`).join(' • ')
            : (status === 'completed' ? 'Completed' : 'In progress');

        quests.push({
            id: questId,
            name: base.name,
            giver: base.giver,
            summary: base.summary || base.description,
            description: base.description || base.summary,
            status,
            portrait: base.portrait || findNpcPortraitByName(dataManager.npcs, base.giver),
            portraitEmotion: base.portraitEmotion || 'neutral',
            objectives,
            progress: requirements,
            progressSummary,
            rewards: base.rewards || {},
        });
    }

    return quests.sort((a, b) => {
        const statusDiff = (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0);
        if (statusDiff !== 0) return statusDiff;
        return a.name.localeCompare(b.name);
    });
}
