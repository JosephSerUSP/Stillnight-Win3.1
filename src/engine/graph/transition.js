import { QuestSystem } from "../systems/quest.js";

export class TransitionLogic {
    /**
     * Evaluates a condition string against the session state.
     * @param {string} conditionStr - e.g. "flag:met_alicia", "hasItem:potion", "questStatus:id:active"
     * @param {Object} session - The game session (party, exploration, etc.)
     * @returns {boolean}
     */
    static evaluate(conditionStr, session) {
        if (!conditionStr) return true;

        const parts = conditionStr.split(':');
        const type = parts[0];

        switch (type) {
            case 'flag':
                return !!session.party.storyFlags[parts[1]];

            case '!flag':
                return !session.party.storyFlags[parts[1]];

            case 'hasItem':
                // Assuming session.party.hasItem exists or checking inventory directly
                if (session.party.hasItem) {
                    return session.party.hasItem(parts[1]);
                }
                return session.party.inventory.some(i => i.id === parts[1]);

            case '!hasItem':
                if (session.party.hasItem) {
                    return !session.party.hasItem(parts[1]);
                }
                return !session.party.inventory.some(i => i.id === parts[1]);

            case 'questStatus': {
                // questStatus:id:status
                const questId = parts[1];
                const expectedStatus = parts[2] || 'active';
                const currentStatus = QuestSystem.getStatus(session.quests, questId);
                return currentStatus === expectedStatus;
            }

            case 'questActive':
                return QuestSystem.getStatus(session.quests, parts[1]) === 'active';

            case 'questCompleted':
                return QuestSystem.getStatus(session.quests, parts[1]) === 'completed';

            default:
                console.warn(`TransitionLogic: Unknown condition type '${type}'`);
                return false;
        }
    }
}
