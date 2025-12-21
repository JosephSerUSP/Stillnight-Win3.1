export function selectQuestLog(state, definitions = {}) {
    const log = state || { active: [], completed: [], failed: [] };
    const mapEntry = (entry) => {
        const def = definitions[entry.id] || {};
        return {
            id: entry.id,
            title: def.title || entry.id,
            giver: def.giver,
            summary: def.summary || def.description,
            description: def.description,
            objectives: (def.objectives || []).map(obj => ({
                id: obj.id,
                description: obj.description,
                status: findObjective(entry, obj.id)?.status || "pending",
                progress: findObjective(entry, obj.id)?.progress || 0,
                required: findObjective(entry, obj.id)?.required ?? obj.required ?? obj.count ?? 1
            })),
            rewards: def.rewards || {},
            status: entry.status || "active"
        };
    };

    return {
        active: (log.active || []).map(mapEntry),
        completed: (log.completed || []).map(mapEntry),
        failed: (log.failed || []).map(mapEntry)
    };
}

function findObjective(entry, id) {
    if (!entry || !entry.objectives) return null;
    return entry.objectives.find(o => o.id === id) || null;
}
