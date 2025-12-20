export class QuestSystem {
    static ensureState(party) {
        if (!party.storyFlags) party.storyFlags = {};
        if (!party.storyFlags.quests) party.storyFlags.quests = {};
    }

    static getStage(party, questId) {
        this.ensureState(party);
        return party.storyFlags.quests[questId] ?? 0;
    }

    static advanceTo(party, questId, stage) {
        this.ensureState(party);
        const current = this.getStage(party, questId);
        if (stage <= current) return null;
        party.storyFlags.quests[questId] = stage;
        return this.describeStage(this.findQuest(questId), stage);
    }

    static findQuest(questId) {
        if (typeof window !== 'undefined' && window.Registry) {
            const qs = window.Registry.get ? window.Registry.get('quests') : null;
            if (qs) return qs.find((q) => q.id === questId);
        }
        return null;
    }

    static describeStage(quest, stage) {
        if (!quest || !quest.stages) {
            return { title: '', summary: '', hint: '', logOnAdvance: '' };
        }
        const exact = quest.stages.find((s) => s.id === stage);
        if (exact) return exact;
        // Fallback to the highest stage below the requested stage
        const fallback = [...quest.stages].reverse().find((s) => s.id < stage);
        return fallback || quest.stages[0];
    }

    static buildJournalEntries(quests = [], party) {
        return quests.map((q) => {
            const stage = this.getStage(party, q.id);
            const stageData = this.describeStage(q, stage);
            const maxStage = q.stages[q.stages.length - 1]?.id ?? stage;
            return {
                id: q.id,
                name: q.name,
                giver: q.giver,
                type: q.type,
                stage,
                isComplete: stage >= maxStage,
                stageData,
            };
        });
    }

    static handleFloorReached(party, quests = [], depth) {
        const updates = [];
        quests.forEach((quest) => {
            const current = this.getStage(party, quest.id);
            const candidates = quest.stages.filter((s) => s.autoFloor !== undefined && s.autoFloor <= depth);
            const target = candidates.sort((a, b) => b.id - a.id).find((s) => s.id > current);
            if (target) {
                this.advanceTo(party, quest.id, target.id);
                updates.push({ questId: quest.id, stage: target.id, log: target.logOnAdvance });
            }
        });
        return updates;
    }

    static handleEnemiesDefeated(party, quests = [], defeatedIds = []) {
        if (!defeatedIds || defeatedIds.length === 0) return [];
        const updates = [];
        quests.forEach((quest) => {
            const current = this.getStage(party, quest.id);
            const candidates = quest.stages.filter((s) => Array.isArray(s.autoKill) && s.autoKill.some((id) => defeatedIds.includes(id)));
            const target = candidates.sort((a, b) => b.id - a.id).find((s) => s.id > current);
            if (target) {
                this.advanceTo(party, quest.id, target.id);
                updates.push({ questId: quest.id, stage: target.id, log: target.logOnAdvance });
            }
        });
        return updates;
    }
}

if (typeof window !== 'undefined') {
    window.QuestSystem = QuestSystem;
}
