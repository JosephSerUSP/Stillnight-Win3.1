import { QuestSystem } from "../systems/quest.js";

export class TransitionLogic {
    constructor(session) {
        this.session = session; // Access to global state (party, flags, quests)
    }

    evaluateCondition(conditionString, context = {}) {
        if (!conditionString) return true;

        // Supports AND logic via comma separator
        const conditions = conditionString.split(',');
        return conditions.every(c => this._checkSingleCondition(c.trim(), context));
    }

    _checkSingleCondition(cond, context) {
        const parts = cond.split(':');
        const type = parts[0];
        const args = parts.slice(1);

        switch (type) {
            case 'flag':
                return this._checkFlag(args[0]);
            case '!flag':
                return !this._checkFlag(args[0]);
            case 'hasItem':
                return this.session.party.hasItem(args[0]);
            case 'questStatus':
                // questStatus:id:status
                return QuestSystem.getStatus(this.session.quests, args[0]) === args[1];
            case 'questActive':
                return QuestSystem.getStatus(this.session.quests, args[0]) === 'active';
            case 'questCompleted':
                return QuestSystem.getStatus(this.session.quests, args[0]) === 'completed';
            case 'random':
                // random:0.5 (50% chance)
                return Math.random() < parseFloat(args[0]);
            default:
                console.warn(`TransitionLogic: Unknown condition type '${type}'`);
                return false;
        }
    }

    _checkFlag(flag) {
        return this.session.party.storyFlags[flag] === true;
    }
}
