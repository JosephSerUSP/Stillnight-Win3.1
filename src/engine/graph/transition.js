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

            case 'var':
                // Format: var:variableName:operator:value
                // e.g., var:trust:>:10, var:faction:==:mages
                if (parts.length < 4) return false;
                const varName = parts[1];
                const op = parts[2];
                const targetVal = isNaN(parts[3]) ? parts[3] : parseFloat(parts[3]);

                const currentVal = session.party.getVariable(varName);

                // If variable is undefined, treat as 0 for numeric comparisons
                const val = (currentVal === undefined && typeof targetVal === 'number') ? 0 : currentVal;

                switch (op) {
                    case '>': return val > targetVal;
                    case '<': return val < targetVal;
                    case '>=': return val >= targetVal;
                    case '<=': return val <= targetVal;
                    case '==': return val == targetVal;
                    case '!=': return val != targetVal;
                    default: return false;
                }

            case 'random':
                // Format: random:0.5 (50% chance)
                const chance = parseFloat(parts[1]);
                return Math.random() < chance;

            default:
                console.warn(`TransitionLogic: Unknown condition type '${type}'`);
                return false;
        }
    }
}
