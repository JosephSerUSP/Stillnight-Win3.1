import { QuestSystem } from "../engine/systems/quest.js";
import { QuestLogState } from "../engine/session/quest_state.js";

export class QuestAdapter {
    constructor(session, dataManager) {
        this.session = session || {};
        this.dataManager = dataManager;
        this.state = QuestSystem.createState(this.session?.quests || new QuestLogState());
        if (this.session) {
            this.session.quests = this.state;
        }
    }

    get definitions() {
        return this.dataManager?.quests || {};
    }

    reset() {
        this.state = QuestSystem.createState(new QuestLogState());
        if (this.session) {
            this.session.quests = this.state;
        }
        return this.state;
    }

    getStatus(questId) {
        return QuestSystem.getStatus(this.state, questId);
    }

    getQuestView(questId) {
        const definition = this.definitions[questId];
        if (!definition) return null;

        const entry = this._findEntry(questId);
        const status = this.getStatus(questId);

        return {
            id: questId,
            title: definition.title || questId,
            giver: definition.giver,
            summary: definition.summary || definition.description,
            description: definition.description,
            objectives: (definition.objectives || []).map(obj => ({
                id: obj.id,
                description: obj.description,
                status: this._objectiveStatus(entry, obj.id),
                required: obj.required ?? obj.count ?? 1,
                progress: this._objectiveProgress(entry, obj.id)
            })),
            rewards: definition.rewards || {},
            status
        };
    }

    acceptQuest(questId) {
        const definition = this.definitions[questId];
        const result = QuestSystem.acceptQuest(this.state, definition);
        return { ...result, quest: definition };
    }

    completeQuest(questId) {
        const definition = this.definitions[questId];
        const result = QuestSystem.completeQuest(this.state, questId);
        if (result.status === 'completed') {
            this._applyRewards(definition?.rewards);
        }
        return { ...result, quest: definition };
    }

    listLog() {
        return this.state;
    }

    _findEntry(questId) {
        return (this.state.active || []).find(q => q.id === questId)
            || (this.state.completed || []).find(q => q.id === questId)
            || (this.state.failed || []).find(q => q.id === questId);
    }

    _objectiveStatus(entry, objectiveId) {
        if (!entry || !entry.objectives) return "locked";
        const obj = entry.objectives.find(o => o.id === objectiveId);
        return obj ? (obj.status || "pending") : "locked";
    }

    _objectiveProgress(entry, objectiveId) {
        if (!entry || !entry.objectives) return 0;
        const obj = entry.objectives.find(o => o.id === objectiveId);
        return obj ? (obj.progress || 0) : 0;
    }

    _applyRewards(rewards) {
        if (!rewards) return;
        if (rewards.gold && this.session?.party) {
            this.session.party.gold += rewards.gold;
        }
        if (Array.isArray(rewards.items) && this.session?.party && Array.isArray(this.dataManager?.items)) {
            rewards.items.forEach(r => {
                const item = this.dataManager.items.find(i => i.id === r.id) || r;
                this.session.party.inventory.push(item);
            });
        }
    }
}
