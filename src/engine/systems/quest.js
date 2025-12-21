/**
 * @class QuestSystem
 * @description Pure helpers for managing quest state and rewards.
 */
export class QuestSystem {
    /**
     * Returns the quest status for a given quest id.
     * @param {import("../session/quest_state.js").QuestLogState} log
     * @param {string} questId
     * @returns {'inactive'|'active'|'completed'}
     */
    static getStatus(log, questId) {
        if (!log) return 'inactive';
        if (log.completed.some(q => q.id === questId)) return 'completed';
        if (log.active.some(q => q.id === questId)) return 'active';
        return 'inactive';
    }

    /**
     * Accepts a quest if not already active or completed.
     * @param {import("../session/quest_state.js").QuestLogState} log
     * @param {string} questId
     * @returns {{ ok: boolean, reason?: string }}
     */
    static acceptQuest(log, questId) {
        if (!log) return { ok: false, reason: 'missing_log' };
        log.active = log.active || [];
        log.completed = log.completed || [];
        const status = this.getStatus(log, questId);
        if (status === 'completed') return { ok: false, reason: 'completed' };
        if (status === 'active') return { ok: false, reason: 'active' };

        log.active.push({ id: questId, acceptedAt: Date.now() });
        return { ok: true };
    }

    /**
     * Attempts to complete a quest.
     * @param {import("../session/quest_state.js").QuestLogState} log
     * @param {Object} questDef
     * @param {import("../../objects/party.js").Game_Party} party
     * @param {Object} dataManager
     * @returns {{ ok: boolean, reason?: string }}
     */
    static completeQuest(log, questDef, party, dataManager) {
        if (!log) return { ok: false, reason: 'missing_log' };
        log.active = log.active || [];
        log.completed = log.completed || [];
        const status = this.getStatus(log, questDef.id);
        if (status !== 'active') return { ok: false, reason: status };

        if (!this.requirementsMet(questDef, party)) {
            return { ok: false, reason: 'requirements' };
        }

        this.consumeRequirements(questDef, party);
        this.applyRewards(questDef, party, dataManager);

        log.active = log.active.filter(q => q.id !== questDef.id);
        log.completed.push({ id: questDef.id, completedAt: Date.now() });

        return { ok: true };
    }

    /**
     * Checks if the quest requirements are met.
     * @param {Object} questDef
     * @param {import("../../objects/party.js").Game_Party} party
     * @returns {boolean}
     */
    static requirementsMet(questDef, party) {
        const requirements = questDef.requirements || {};
        if (requirements.items) {
            for (const req of requirements.items) {
                if (!party.hasItem(req.id, req.qty || 1)) {
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * Consumes required items when configured.
     * @param {Object} questDef
     * @param {import("../../objects/party.js").Game_Party} party
     */
    static consumeRequirements(questDef, party) {
        const requirements = questDef.requirements || {};
        if (requirements.items) {
            for (const req of requirements.items) {
                if (req.consume !== false) {
                    party.removeItemById(req.id, req.qty || 1);
                }
            }
        }
    }

    /**
     * Grants quest rewards.
     * @param {Object} questDef
     * @param {import("../../objects/party.js").Game_Party} party
     * @param {Object} dataManager
     */
    static applyRewards(questDef, party, dataManager) {
        const rewards = questDef.rewards || {};
        if (rewards.gold) {
            party.gold += rewards.gold;
        }
        if (Array.isArray(rewards.items)) {
            for (const r of rewards.items) {
                const itemDef = (dataManager.items || []).find(i => i.id === r.id);
                if (itemDef) {
                    party.addItem(itemDef, r.qty || 1);
                }
            }
        }
    }
}

if (typeof window !== 'undefined' && window.location.search.includes("test=true")) {
    window.QuestSystem = QuestSystem;
}
