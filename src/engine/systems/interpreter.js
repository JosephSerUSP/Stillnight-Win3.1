import { InterpreterState } from "../session/interpreter_state.js";
import { randInt, pickWeighted, random } from "../../core/utils.js";
import { interpolateText } from "../utils/text_interpolator.js";
import { TransitionLogic } from "../graph/transition.js";

/**
 * System for executing event commands (Interpreter).
 * Pure-ish: Returns side-effect descriptions (GameEvents) instead of calling UI directly.
 */
export class InterpreterSystem {
    constructor() {
        // Handlers map command types to logic
        // Signature: (state, command, session) -> GameEvent[] | null
        this._handlers = {
            'BATTLE': this._handleBattle,
            'SHOP': this._handleShop,
            'RECRUIT': this._handleRecruit,
            'NPC_DIALOGUE': this._handleNpcDialogue,
            'DESCEND': this._handleDescend,
            'ASCEND': this._handleAscend,
            'HEAL_PARTY': this._handleHealParty,
            'DAMAGE_PARTY': this._handleDamageParty,
            'GIVE_GOLD': this._handleGiveGold,
            'TAKE_GOLD': this._handleTakeGold,
            'GIVE_ITEM': this._handleGiveItem,
            'TAKE_ITEM': this._handleTakeItem,
            'GIVE_XP': this._handleGiveXp,
            'MESSAGE': this._handleMessage,
            'TEXT': this._handleMessage, // Alias
            'BREAKABLE_WALL': this._handleBreakableWall,
            'WAIT': this._handleWait,
            'RANDOM_EVENT': this._handleRandomEvent,
            'WEIGHTED_BRANCH': this._handleWeightedBranch,
            'CHOICE': this._handleChoice,
            'IF': this._handleIf,
            'LOG': this._handleLog,
            // Quest handlers
            'OFFER_QUEST': this._handleOfferQuest,
            'COMPLETE_QUEST': this._handleCompleteQuest,
            // Variable handlers
            'SET_VARIABLE': this._handleSetVariable,
            'MODIFY_VARIABLE': this._handleModifyVariable
        };
    }

    /**
     * Runs the interpreter until it pauses (wait/input) or finishes.
     * @param {InterpreterState} state
     * @param {Object} session - Game session (party, map, dataManager, etc.)
     * @returns {Array} List of GameEvents (side effects)
     */
    runUntilPause(state, session) {
        const events = [];

        if (state.waitMode === 'time') {
            return events;
        }

        while (state.stack.length > 0) {
            const frame = state.currentFrame;
            if (frame.pc >= frame.commands.length) {
                state.stack.pop();
                continue;
            }

            const command = frame.commands[frame.pc];
            frame.pc++; // Advance immediately

            const handler = this._handlers[command.type];
            if (handler) {
                const result = handler.call(this, state, command, session);
                if (result) {
                    events.push(...result);
                    if (state.waitMode) {
                        break;
                    }
                }
            } else {
                console.warn(`InterpreterSystem: Unknown command '${command.type}'`, command);
            }
        }

        return events;
    }

    /**
     * Executes a single action immediately (Legacy support).
     * @param {Object} action
     * @param {Object} eventContext
     * @param {Object} session
     */
    executeAction(action, eventContext, session) {
        const state = new InterpreterState();
        state.start([action], eventContext);
        return this.runUntilPause(state, session);
    }

    // --- Handlers ---

    _handleBattle(state, command, session) {
        const event = state.activeEvent;
        const x = event ? event.x : 0;
        const y = event ? event.y : 0;
        // Pass specific encounter data if present on the event
        const encounterData = event ? event.encounterData : null;
        const isSneakAttack = event ? event.isSneakAttack : false;
        const isPlayerFirstStrike = event ? event.isPlayerFirstStrike : false;

        return [{
            type: 'BATTLE_START',
            x: x,
            y: y,
            encounterData,
            isSneakAttack,
            isPlayerFirstStrike
        }];
    }

    _handleShop(state, command, session) {
        return [{ type: 'SHOP_START', shopId: command.shopId }];
    }

    _handleRecruit(state, command, session) {
        return [{ type: 'RECRUIT_OPEN', options: command }];
    }

    _handleNpcDialogue(state, command, session) {
        return [{
            type: 'NPC_DIALOGUE_OPEN',
            id: command.id
        }, {
            type: 'UPDATE_UI'
        }];
    }

    _handleDescend(state, command, session) {
        return [{ type: 'DESCEND' }, { type: 'PLAY_SOUND', name: 'STAIRS' }];
    }

    _handleAscend(state, command, session) {
        return [{ type: 'ASCEND' }, { type: 'PLAY_SOUND', name: 'STAIRS' }];
    }

    _handleHealParty(state, command, session) {
        const events = [];
        if (session.party) {
            session.party.members.forEach(m => {
                m.hp = m.maxHp;
            });
            events.push({ type: 'LOG', text: command.message || "[Recover] A soft glow restores your party." });

            // Handle passives
            session.party.members.forEach((member) => {
                const xpBonus = member.getPassiveValue("RECOVERY_XP_BONUS");
                if (xpBonus > 0) {
                    events.push({ type: 'GAIN_XP', member: member, amount: xpBonus });
                    events.push({ type: 'LOG', text: `[Passive] ${member.name} gains ${xpBonus} bonus XP.` });
                }
            });
        }

        events.push({ type: 'SET_STATUS', text: "Recovered HP." });
        events.push({ type: 'PLAY_SOUND', name: 'HEAL' });
        events.push({ type: 'APPLY_MOVE_PASSIVES' });
        events.push({ type: 'UPDATE_UI' });
        return events;
    }

    _handleDamageParty(state, command, session) {
        const events = [];
        const dmg = command.amount || 5;

        if (session.party) {
             session.party.members.forEach(m => {
                m.hp = Math.max(0, m.hp - dmg);
            });
            events.push({ type: 'LOG', text: command.message || `The party takes ${dmg} damage.` });
            events.push({ type: 'CHECK_PERMADEATH' });
        }

        events.push({ type: 'PLAY_SOUND', name: 'DAMAGE' });
        events.push({ type: 'UPDATE_UI' });
        return events;
    }

    _handleGiveGold(state, command, session) {
        if (session.party) {
            session.party.gold += command.value;
            return [{ type: 'LOG', text: `Gained ${command.value} Gold.` }, { type: 'UPDATE_UI' }];
        }
        return null;
    }

    _handleTakeGold(state, command, session) {
        if (session.party) {
            session.party.gold = Math.max(0, session.party.gold - command.value);
            return [{ type: 'LOG', text: `Lost ${command.value} Gold.` }, { type: 'UPDATE_UI' }];
        }
        return null;
    }

    _handleGiveItem(state, command, session) {
        if (session.party && session.dataManager) {
            let item;
            if (command.itemId) {
                 item = session.dataManager.items.find(i => i.id === command.itemId);
            } else if (command.itemType) {
                 // Random Logic
                 const candidates = session.dataManager.items.filter(i => i.type !== 'key'); // Default filter
                 if (candidates.length > 0) {
                     item = candidates[randInt(0, candidates.length - 1)];
                 }
            }

            if (item) {
                session.party.inventory.push(item);
                return [
                    { type: 'LOG', text: `Obtained: ${item.name}` },
                    { type: 'PLAY_SOUND', name: 'ITEM_GET' },
                    { type: 'UPDATE_UI' }
                ];
            }
        }
        return null;
    }

    _handleTakeItem(state, command, session) {
         return null;
    }

    _handleGiveXp(state, command, session) {
        return [{
            type: 'GIVE_XP',
            amount: command.amount
        }];
    }

    _handleMessage(state, command, session) {
        const events = [{ type: 'UPDATE_UI' }];
        const text = interpolateText(command.text, session);

        if (command.style === 'log' || !command.style) {
             if (text) events.unshift({ type: 'LOG', text: text });
        } else {
             events.push({
                 type: 'SHOW_TEXT',
                 text: text,
                 style: command.style,
                 title: command.title,
                 image: command.image
             });
             state.waitMode = 'input';
        }
        return events;
    }

    _handleLog(state, command, session) {
        const text = interpolateText(command.text, session);
        return [{ type: 'LOG', text: text }];
    }

    _handleBreakableWall(state, command, session) {
        const event = state.activeEvent;
        if (!event) return null;

        if (event.hp === undefined) event.hp = command.hp || 3;
        event.hp--;

        const events = [];
        if (event.hp > 0) {
            events.push({ type: 'LOG', text: command.hitMessage || "The wall shudders under your touch." });
            events.push({ type: 'SET_STATUS', text: "It seems weak..." });
            events.push({ type: 'PLAY_SOUND', name: 'UI_SELECT' });
        } else {
            events.push({ type: 'LOG', text: command.breakMessage || "The wall crumbles away!" });
            events.push({ type: 'SET_STATUS', text: "Path opened." });
            events.push({ type: 'PLAY_SOUND', name: 'DAMAGE' });
            events.push({ type: 'WALL_BROKEN', x: event.x, y: event.y });
        }
        events.push({ type: 'UPDATE_UI' });
        return events;
    }

    _handleWait(state, command, session) {
        state.waitMode = 'time';
        state.waitValue = command.duration || 1000;
        return null;
    }

    _handleRandomEvent(state, command, session) {
        if (!session.dataManager) return null;

        const category = command.category;
        const candidates = session.dataManager.events.filter(e => e.type === category);

        if (candidates.length === 0) return [{ type: 'LOG', text: "Nothing happens." }];

        const chosen = candidates[randInt(0, candidates.length - 1)];

        if (chosen.script) {
            state.push(chosen.script);
        } else {
             console.warn(`Random event ${chosen.id} has no script.`);
        }

        return null;
    }

    _handleWeightedBranch(state, command, session) {
        const roll = Math.random();
        let accumulated = 0;
        let selected = null;

        for (const o of command.outcomes) {
            accumulated += o.chance;
            if (roll < accumulated) {
                selected = o;
                break;
            }
        }

        if (!selected && command.outcomes.length > 0) {
            selected = command.outcomes[command.outcomes.length - 1];
        }

        if (selected && selected.script) {
            state.push(selected.script);
        }

        return null;
    }

    _handleChoice(state, command, session) {
        const events = [{
            type: 'SHOW_CHOICES',
            options: command.options
        }];
        state.waitMode = 'input';
        return events;
    }

    _handleIf(state, command, session) {
        // command: { type: 'IF', condition: 'var:trust:>:10', then: [scripts], else: [scripts] }
        const result = TransitionLogic.evaluate(command.condition, session);

        if (result && command.then) {
            state.push(command.then);
        } else if (!result && command.else) {
            state.push(command.else);
        }

        return null;
    }

    _handleSetVariable(state, command, session) {
        // command: { type: 'SET_VARIABLE', key: 'trust', value: 10 }
        if (session.party) {
            session.party.setVariable(command.key, command.value);
        }
        return null;
    }

    _handleModifyVariable(state, command, session) {
        // command: { type: 'MODIFY_VARIABLE', key: 'trust', operation: 'add', value: 5 }
        if (session.party) {
            session.party.modifyVariable(command.key, command.operation, command.value);
        }
        return null;
    }

    _handleOfferQuest(state, command, session) {
        return [{
            type: 'QUEST_OFFER',
            questId: command.questId,
            nextState: command.nextState,
            acceptState: command.acceptState,
            declineState: command.declineState
        }];
    }

    _handleCompleteQuest(state, command, session) {
        return [{
            type: 'QUEST_COMPLETE',
            questId: command.questId,
            nextState: command.nextState,
            completeState: command.completeState
        }];
    }
}
