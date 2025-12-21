import { QuestLogState } from "../session/quest_state.js";

export class QuestSystem {
    /**
     * Ensures a QuestLogState instance with normalized structure.
     * @param {QuestLogState|Object|null} state
     * @returns {QuestLogState}
     */
    static createState(state = null) {
        const base = state instanceof QuestLogState ? state : Object.assign(new QuestLogState(), state || {});
        base.active = (base.active || []).map(QuestSystem._cloneEntry);
        base.completed = (base.completed || []).map(QuestSystem._cloneEntry);
        base.failed = (base.failed || []).map(QuestSystem._cloneEntry);
        return base;
    }

    static serialize(state) {
        if (!state) return null;
        return JSON.parse(JSON.stringify(state));
    }

    static deserialize(data) {
        if (!data) return new QuestLogState();
        return QuestSystem.createState(data);
    }

    static acceptQuest(state, questDef) {
        if (!questDef) {
            return { status: "missing" };
        }
        const log = QuestSystem.createState(state);
        if (QuestSystem.getStatus(log, questDef.id) === "completed") {
            return { status: "completed" };
        }
        if (QuestSystem.getStatus(log, questDef.id) === "active") {
            return { status: "active" };
        }

        const entry = {
            id: questDef.id,
            status: "active",
            acceptedAt: Date.now(),
            objectives: (questDef.objectives || []).map(obj => ({
                id: obj.id,
                status: "pending",
                progress: 0,
                required: obj.required ?? obj.count ?? 1,
                description: obj.description
            }))
        };

        log.active.push(entry);
        return { status: "accepted", entry };
    }

    static completeQuest(state, questId) {
        const log = QuestSystem.createState(state);
        const status = QuestSystem.getStatus(log, questId);
        if (status === "completed") return { status: "completed" };
        if (status === "failed") return { status: "failed" };
        const idx = log.active.findIndex(q => q.id === questId);
        if (idx === -1) return { status: "missing" };

        const [entry] = log.active.splice(idx, 1);
        entry.status = "completed";
        entry.completedAt = Date.now();
        log.completed.push(entry);
        return { status: "completed", entry };
    }

    static getStatus(state, questId) {
        if (!state) return "available";
        if ((state.completed || []).some(q => q.id === questId)) return "completed";
        if ((state.failed || []).some(q => q.id === questId)) return "failed";
        if ((state.active || []).some(q => q.id === questId)) return "active";
        return "available";
    }

    static updateObjectiveProgress(state, questId, objectiveId, amount = 1) {
        const quest = (state.active || []).find(q => q.id === questId);
        if (!quest) return { status: "missing" };

        const obj = (quest.objectives || []).find(o => o.id === objectiveId);
        if (!obj) return { status: "missing" };

        obj.progress = Math.min(obj.required, (obj.progress || 0) + amount);
        if (obj.progress >= obj.required) {
            obj.status = "complete";
        }
        return { status: "updated", objective: obj };
    }

    static areObjectivesComplete(entry) {
        if (!entry || !entry.objectives || entry.objectives.length === 0) return false;
        return entry.objectives.every(o => o.status === "complete");
    }

    static _cloneEntry(entry) {
        return {
            ...entry,
            objectives: (entry.objectives || []).map(obj => ({ ...obj }))
        };
    }
}
