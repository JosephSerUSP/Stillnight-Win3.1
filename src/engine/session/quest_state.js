/**
 * @class QuestLogState
 * @description Represents the player's quest log for the current session.
 */
export class QuestLogState {
    constructor() {
        /**
         * Active quests that have been accepted but not yet completed.
         * @type {Array<{id: string, acceptedAt: number}>}
         */
        this.active = [];

        /**
         * Completed quests with completion timestamps.
         * @type {Array<{id: string, completedAt: number}>}
         */
        this.completed = [];
    }
}

if (typeof window !== 'undefined' && window.location.search.includes("test=true")) {
    window.QuestLogState = QuestLogState;
}
