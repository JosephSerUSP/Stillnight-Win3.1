import { InterpreterState } from "../session/interpreter_state.js";

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
            'SHRINE': this._handleShrine,
            'RECRUIT': this._handleRecruit,
            'NPC_DIALOGUE': this._handleNpcDialogue,
            'DESCEND': this._handleDescend,
            'HEAL_PARTY': this._handleHealParty,
            'MESSAGE': this._handleMessage,
            'TREASURE': this._handleTreasure,
            'TRAP_TRIGGER': this._handleTrapTrigger,
            'BREAKABLE_WALL': this._handleBreakableWall,
            'WAIT': this._handleWait
        };
    }

    /**
     * Runs the interpreter until it pauses (wait/input) or finishes.
     * @param {InterpreterState} state
     * @param {Object} session - Game session (party, map, etc.)
     * @returns {Array} List of GameEvents (side effects)
     */
    runUntilPause(state, session) {
        const events = [];

        // Check wait conditions
        if (state.waitMode === 'time') {
            // In a real tick loop, we'd decrement waitValue.
            // Since we don't have a delta time here, we rely on the caller to clear the wait.
            // For now, if we are waiting, we return empty unless the wait is handled externally.
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
                    // If a command triggered a wait, stop execution
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
        // Create a temporary state for this single action
        const state = new InterpreterState();
        state.start([action], eventContext);
        return this.runUntilPause(state, session);
    }

    // --- Handlers ---

    _handleBattle(state, command, session) {
        return [{
            type: 'BATTLE_START',
            x: state.activeEvent ? state.activeEvent.x : 0,
            y: state.activeEvent ? state.activeEvent.y : 0
        }];
    }

    _handleShop(state, command, session) {
        return [{ type: 'SHOP_START', shopId: command.shopId }];
    }

    _handleShrine(state, command, session) {
        return [{
            type: 'LOG',
            text: "[Shrine] You encounter a shrine."
        }, {
            type: 'SHRINE_OPEN'
        }, {
            type: 'SET_STATUS',
            text: "Shrine event."
        }];
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

    _handleHealParty(state, command, session) {
        const events = [];
        if (session.party) {
            session.party.members.forEach(m => {
                m.hp = m.maxHp;
            });
            events.push({ type: 'LOG', text: "[Recover] A soft glow restores your party." });

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
        events.push({ type: 'APPLY_MOVE_PASSIVES' }); // Legacy behavior maintained
        events.push({ type: 'UPDATE_UI' });
        return events;
    }

    _handleMessage(state, command, session) {
        const events = [{ type: 'UPDATE_UI' }];
        if (command.text) {
            events.unshift({ type: 'LOG', text: command.text });
        }
        return events;
    }

    _handleTreasure(state, command, session) {
        return [{ type: 'TREASURE_OPEN' }];
    }

    _handleTrapTrigger(state, command, session) {
        return [{ type: 'TRAP_TRIGGER', action: command }];
    }

    _handleBreakableWall(state, command, session) {
        // Logic: Decrement HP of wall event.
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

            // Remove event and update tile
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
}
