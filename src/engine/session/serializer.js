import { Game_Party } from "../../objects/party.js";
import { Game_Battler } from "../../objects/battler.js";
import { Registry } from "../data/registry.js";
import { ExplorationState } from "./exploration_state.js";
import { BattleState } from "./battle_state.js";
import { InterpreterState } from "./interpreter_state.js";
import { QuestLogState } from "./quest_state.js";

export class SessionSerializer {
    /**
     * Serializes the session state to a JSON-compatible object.
     * @param {Object} session - The session object { party, exploration, battle, interpreter }.
     * @returns {Object}
     */
    static toJSON(session) {
        return {
            version: 1,
            timestamp: Date.now(),
            party: this.serializeParty(session.party),
            exploration: session.exploration ? this.serializeExploration(session.exploration) : null,
            battle: session.battle ? this.serializeBattle(session.battle) : null,
            interpreter: session.interpreter ? this.serializeInterpreter(session.interpreter) : null,
            quests: session.quests ? this.serializeQuestLog(session.quests) : null
        };
    }

    /**
     * Restores the session state from a JSON object.
     * @param {Object} json - The serialized data.
     * @returns {Object} The session object.
     */
    static fromJSON(json) {
        if (!json) return null;

        const session = {};
        session.party = this.deserializeParty(json.party);

        if (json.exploration) {
            session.exploration = this.deserializeExploration(json.exploration);
        }

        if (json.battle) {
            session.battle = this.deserializeBattle(json.battle, session.party);
        }

        if (json.interpreter) {
            session.interpreter = this.deserializeInterpreter(json.interpreter);
        }

        if (json.quests) {
            session.quests = this.deserializeQuestLog(json.quests);
        }

        if (!session.quests) {
            session.quests = new QuestLogState();
        }

        return session;
    }

    // --- Party ---

    static serializeParty(party) {
        if (!party) return null;
        return {
            gold: party.gold,
            inventory: party.inventory,
            slots: party.slots.map(s => s ? this.serializeBattler(s) : null),
            knownWords: party.knownWords || [],
            storyFlags: party.storyFlags || {}
        };
    }

    static deserializeParty(data) {
        if (!data) return new Game_Party();
        const party = new Game_Party();
        party.gold = data.gold;
        party.inventory = data.inventory || [];
        party.knownWords = data.knownWords || [];
        party.storyFlags = data.storyFlags || {};

        party.slots = data.slots.map(s => s ? this.deserializeBattler(s) : null);
        return party;
    }

    // --- Battler ---

    static serializeBattler(battler) {
        // Battler has a link to actorData (static). We only save the ID.
        return {
            actorId: battler.actorData ? battler.actorData.id : battler.id,
            name: battler.name,
            level: battler.level,
            xp: battler.xp,
            hp: battler.hp,
            mp: battler.mp,
            _baseMaxHp: battler._baseMaxHp,
            _baseMaxMp: battler._baseMaxMp,
            _baseElements: battler._baseElements,
            stats: battler.stats,
            equipmentItem: battler.equipmentItem,
            skills: battler.skills,
            passives: battler.passives,
            states: battler.states,
            spriteKey: battler.spriteKey,
            flavor: battler.flavor,
            isEnemy: battler.isEnemy
        };
    }

    static deserializeBattler(data) {
        const actors = Registry.get('actors') || [];
        const actorData = actors.find(a => a.id === data.actorId) || { id: data.actorId };

        // Use create but we want to manually restore state
        const battler = new Game_Battler(actorData, 1, data.isEnemy);

        // Restore properties
        battler.name = data.name;
        battler.level = data.level;
        battler.xp = data.xp;
        battler.hp = data.hp;
        battler.mp = data.mp;
        battler._baseMaxHp = data._baseMaxHp;
        battler._baseMaxMp = data._baseMaxMp;
        battler._baseElements = data._baseElements;
        if (data.stats) battler.stats = data.stats;
        battler.equipmentItem = data.equipmentItem;
        battler.skills = data.skills || [];
        battler.passives = data.passives || [];
        battler.states = data.states || [];
        battler.spriteKey = data.spriteKey;
        battler.flavor = data.flavor;
        // isEnemy is handled in constructor but safe to set again if needed (it's used for scaling)

        return battler;
    }

    // --- Exploration ---

    static serializeExploration(exploration) {
        // Pure data
        return JSON.parse(JSON.stringify(exploration));
    }

    static deserializeExploration(data) {
        const state = new ExplorationState();
        Object.assign(state, data);
        return state;
    }

    // --- Battle ---

    static serializeBattle(battle) {
        const copy = { ...battle };
        copy.participants = {
            party: 'REF_PARTY',
            enemies: battle.participants.enemies.map(e => this.serializeBattler(e))
        };
        return copy;
    }

    static deserializeBattle(data, party) {
        const battle = new BattleState({ party, enemies: [] });
        Object.assign(battle, data);
        battle.participants = {
            party: party,
            enemies: data.participants.enemies.map(e => this.deserializeBattler(e))
        };
        return battle;
    }

    // --- Interpreter ---

    static serializeInterpreter(interpreter) {
        return JSON.parse(JSON.stringify(interpreter));
    }

    static deserializeInterpreter(data) {
        const state = new InterpreterState();
        Object.assign(state, data);
        return state;
    }

    // --- Quest Log ---

    static serializeQuestLog(log) {
        return JSON.parse(JSON.stringify(log));
    }

    static deserializeQuestLog(data) {
        const state = new QuestLogState();
        Object.assign(state, data);
        return state;
    }
}
