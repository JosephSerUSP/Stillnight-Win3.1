import { InterpreterSystem } from "../engine/systems/interpreter.js";
import { DirectorSystem } from "../engine/systems/director.js";
import { AudioAdapter } from "./audio_adapter.js";
import { createInteractiveLabel, renderCreatureInfo } from "../presentation/windows/index.js";
import { Game_Battler } from "../objects/battler.js";
import { QuestSystem } from "../engine/systems/quest.js";
import { randInt } from "../core/utils.js";

/**
 * @class InterpreterAdapter
 * @description Adapter that bridges Scene_Map and InterpreterSystem.
 * Replaces the old Logic-heavy Game_Interpreter.
 */
export class InterpreterAdapter {
    constructor(sceneContext) {
        this.scene = sceneContext;
        this.system = new InterpreterSystem();
        this._activeNpc = null;
        this._onRecruitCallback = null;
    }

    get dataManager() { return this.scene.dataManager; }
    get windowManager() { return this.scene.windowManager; }
    get sceneManager() { return this.scene.sceneManager; }
    get party() { return this.scene.party; }
    get map() { return this.scene.map; }
    get session() { return this.scene.session; }

    execute(action, event) {
        const session = {
            party: this.party,
            map: this.map,
            dataManager: this.dataManager
        };

        const events = this.system.executeAction(action, event, session);
        this.processSystemEvents(events, session); // pass session for callbacks
    }

    async executeSequence(sequence, eventContext) {
        const session = {
            party: this.party,
            map: this.map,
            dataManager: this.dataManager
        };

        // Lock input at start of sequence
        this.scene.inputLocked = true;

        try {
            const state = new (await import("../engine/session/interpreter_state.js")).InterpreterState();
            state.start(sequence, eventContext);

            while(state.stack.length > 0) {
                const events = this.system.runUntilPause(state, session);
                await this.processSystemEvents(events, session, state);

                if (state.waitMode === 'time') {
                    await new Promise(r => setTimeout(r, state.waitValue));
                    state.waitMode = null;
                } else if (state.waitMode === 'input') {
                    // Wait for UI callback to clear waitMode
                    // We need a promise that resolves when UI is done
                    await new Promise(resolve => {
                        this._inputResolver = resolve;
                    });
                    this._inputResolver = null;
                    state.waitMode = null;
                }

                // Allow frame
                await new Promise(r => setTimeout(r, 0));
            }
        } finally {
            // Ensure input is unlocked even if errors occur
            this.scene.inputLocked = false;
        }
    }

    resumeInput(index) {
        if (this._inputResolver) {
            this._inputResolver(index);
        }
    }

    async processSystemEvents(events, session, state) {
        for (const e of events) {
            switch (e.type) {
                case 'LOG':
                    this.scene.logMessage(e.text);
                    break;
                case 'SET_STATUS':
                    this.scene.setStatus(e.text);
                    break;
                case 'PLAY_SOUND':
                    AudioAdapter.play(e.name);
                    break;
                case 'UPDATE_UI':
                    this.scene.updateAll();
                    break;
                case 'GAIN_XP':
                    this.scene.gainXp(e.member, e.amount);
                    break;
                case 'GIVE_XP':
                    // Generic: Give XP to all active members
                    this.party.members.forEach(m => this.scene.gainXp(m, e.amount));
                    break;
                case 'APPLY_MOVE_PASSIVES':
                    this.scene.applyMovePassives();
                    break;
                case 'BATTLE_START':
                    // Pass full encounter data from event payload
                    this.scene.startBattle(e.x, e.y, e.encounterData, e.isSneakAttack, e.isPlayerFirstStrike);
                    break;
                case 'SHOP_START':
                    this.scene.startShop(e.shopId);
                    break;
                case 'RECRUIT_OPEN':
                    this._openRecruitEvent(e.options);
                    break;
                case 'NPC_DIALOGUE_OPEN':
                    this._openNpcEvent(e.id);
                    break;
                case 'DESCEND':
                    this._descendStairs();
                    break;
                case 'WALL_BROKEN':
                    this._resolveBrokenWall(e.x, e.y);
                    break;
                case 'SHOW_TEXT':
                    this._showText(e);
                    break;
                case 'SHOW_CHOICES':
                    this._showChoices(e, state);
                    break;
                case 'CHECK_PERMADEATH':
                    this.scene.checkPermadeath();
                    break;
                case 'QUEST_OFFER':
                    this._openQuestOffer(e.questId, e);
                    break;
                case 'QUEST_COMPLETE':
                    this._completeQuest(e.questId, e);
                    break;
                default:
                    console.warn(`InterpreterAdapter: Unhandled event type '${e.type}'`);
            }
        }
    }

    _showText(e) {
        this.scene.hudManager.eventWindow.show({
            title: e.title || "Event",
            description: e.text,
            image: e.image,
            style: e.style || 'terminal',
            choices: [{
                label: "Continue",
                onClick: () => {
                    this.windowManager.close(this.scene.hudManager.eventWindow);
                    this.resumeInput();
                }
            }]
        });
        if (!this.windowManager.stack.includes(this.scene.hudManager.eventWindow)) {
            this.windowManager.push(this.scene.hudManager.eventWindow);
        }
    }

    _showChoices(e, state) {
        // e.options = [{ label, script }]
        const choices = e.options.map((opt, idx) => ({
            label: opt.label,
            onClick: () => {
                if (opt.script && state) {
                    state.push(opt.script);
                }

                this.windowManager.close(this.scene.hudManager.eventWindow);
                this.resumeInput(idx);
            }
        }));

        this.scene.hudManager.eventWindow.updateChoices(choices);
        if (!this.windowManager.stack.includes(this.scene.hudManager.eventWindow)) {
             // Fallback if no text preceded
             this.scene.hudManager.eventWindow.show({
                 title: "Choice",
                 description: "Make a choice:",
                 style: 'terminal',
                 choices: choices
             });
             this.windowManager.push(this.scene.hudManager.eventWindow);
        }
    }

    _resolveBrokenWall(x, y) {
        this.map.removeEvent(this.map.floorIndex, x, y);
        const floor = this.map.floors[this.map.floorIndex];
        floor.tiles[y][x] = '.';
        floor.visited[y][x] = true;
        this.scene.updateGrid();
        this.scene.updateAll();
    }

    _descendStairs() {
        if (this.map.floorIndex + 1 >= this.map.floors.length) {
            this.scene.logMessage("[Floor] You find no further descent. The run ends here.");
            this.scene.runActive = false;
            this.scene.setStatus("No deeper floors. Run over (for now).");
            this.scene.updateAll();
            return;
        }
        this.map.floorIndex++;
        if (this.map.floorIndex > this.map.maxReachedFloorIndex) {
            this.map.maxReachedFloorIndex = this.map.floorIndex;
        }
        const f = this.map.floors[this.map.floorIndex];
        f.discovered = true;
        this.map.playerX = f.startX;
        this.map.playerY = f.startY;
        this.map.revealAroundPlayer();
        this.scene.logMessage(`[Floor] You descend to: ${f.title}`);
        this.scene.logMessage(`[Floor] ${f.intro}`);
        this.scene.setStatus("Descending.");
        this.scene.updateAll();
        this.scene.checkMusic();
    }

    _openRecruitEvent(options = {}) {
         const { forcedId, cost: forcedCost, onRecruit } = options;
        this._onRecruitCallback = onRecruit;

        let recruit;
        if (forcedId) {
             recruit = this.dataManager.actors.find(a => a.id === forcedId);
        }

        if (!recruit) {
            const floor = this.map.floors[this.map.floorIndex];
            if (floor && floor.recruits && floor.recruits.length > 0) {
                const recruitId = floor.recruits[randInt(0, floor.recruits.length - 1)];
                recruit = this.dataManager.actors.find(a => a.id === recruitId);
            }
            if (!recruit) {
                const availableCreatures = this.dataManager.actors.filter(creature => creature.isRecruitable);
                if (availableCreatures.length === 0) {
                    this.scene.logMessage(this.dataManager.terms.recruit.no_one_here);
                    return;
                }
                recruit = availableCreatures[randInt(0, availableCreatures.length - 1)];
            }
        }

        const cost = forcedCost !== undefined ? forcedCost : randInt(25, 75);

        renderCreatureInfo(this.scene.hudManager.recruitWindow.bodyEl, recruit, {
            showElement: true,
            showEquipment: true,
            showPassives: true,
            showSkills: true,
            showFlavor: true,
            dataManager: this.dataManager
        });

        this.scene.hudManager.recruitWindow.buttonsEl.innerHTML = "";
        const joinBtn = document.createElement("button");
        joinBtn.className = "win-btn";
        joinBtn.textContent = `Pay ${cost} Gold`;
        joinBtn.addEventListener("click", () => {
            if (this.party.gold >= cost) {
                this.party.gold -= cost;
                this.attemptRecruit(recruit);
            } else {
                this.scene.logMessage(`[Recruit] You don't have enough gold.`);
                this.closeRecruitEvent();
            }
        });
        const declineBtn = document.createElement("button");
        declineBtn.className = "win-btn";
        declineBtn.textContent = "Decline";
        declineBtn.addEventListener("click", () => {
            this.scene.logMessage(`[Recruit] You decline ${recruit.name}'s offer.`);
            this.closeRecruitEvent();
        });
        this.scene.hudManager.recruitWindow.buttonsEl.appendChild(joinBtn);
        this.scene.hudManager.recruitWindow.buttonsEl.appendChild(declineBtn);

        this.windowManager.push(this.scene.hudManager.recruitWindow);
        this.scene.setStatus("Recruit encountered.");
        AudioAdapter.play('UI_SELECT');
    }

    closeRecruitEvent() {
        this._onRecruitCallback = null;
        this.windowManager.close(this.scene.hudManager.recruitWindow);
        this.scene.setStatus("Exploration");
    }

    attemptRecruit(recruit) {
        if (this.party.hasEmptySlot()) {
            this.party.addMember(Game_Battler.create(recruit));
            this.scene.logMessage(`[Recruit] ${recruit.name} joins your party.`);
            this.scene.setStatus(
                this.dataManager.terms.recruit.recruited.replace("{0}", recruit.name)
            );

            if (this._onRecruitCallback) {
                this._onRecruitCallback();
                this._onRecruitCallback = null;
            }

            this.clearEventTile();
            this.closeRecruitEvent();
            this.scene.updateParty();
            return;
        }
         this.scene.hudManager.recruitWindow.bodyEl.innerHTML =
            this.dataManager.terms.recruit.party_full;
        this.scene.hudManager.recruitWindow.buttonsEl.innerHTML = "";
        this.party.members.forEach((m, idx) => {
            const btn = document.createElement("button");
            btn.className = "win-btn";
            btn.textContent = m.name;
            btn.addEventListener("click", () => {
                this.replaceMemberWithRecruit(idx, recruit);
            });
            this.scene.hudManager.recruitWindow.buttonsEl.appendChild(btn);
        });
        const cancelBtn = document.createElement("button");
        cancelBtn.className = "win-btn";
        cancelBtn.textContent = "Cancel";
        cancelBtn.addEventListener("click", () => {
            this.scene.logMessage(this.dataManager.terms.recruit.decide_not_to_replace);
            this.closeRecruitEvent();
        });
        this.scene.hudManager.recruitWindow.buttonsEl.appendChild(cancelBtn);
    }

    replaceMemberWithRecruit(index, recruit) {
        const replaced = this.party.members[index];
        this.scene.logMessage(
            this.dataManager.terms.recruit.replace_member
                .replace("{0}", replaced.name)
                .replace("{1}", recruit.name)
        );
        this.party.replaceMember(index, Game_Battler.create(recruit));

        if (this._onRecruitCallback) {
            this._onRecruitCallback();
            this._onRecruitCallback = null;
        }

        this.clearEventTile();
        this.scene.updateParty();
        this.closeRecruitEvent();
    }

    clearEventTile() {
        if (this.scene.currentInteractionEvent) {
            this.map.removeEvent(this.map.floorIndex, this.scene.currentInteractionEvent.x, this.scene.currentInteractionEvent.y);
            this.scene.currentInteractionEvent = null;
        }
        this.scene.updateGrid();
    }

    _openNpcEvent(npcId) {
         if (this.dataManager.graphs && this.dataManager.graphs[npcId]) {
            this._startGraphDialogue(npcId, this.dataManager.graphs[npcId]);
            return;
        }
        console.warn(`NPC '${npcId}' not found (Graph missing).`);
        this.closeEvent();
    }

    _startGraphDialogue(graphId, graphData) {
         if (!this.director) {
            this.director = new DirectorSystem();
        }
        this._activeNpc = { id: graphId, data: graphData };
        const observer = {
            onNode: (node) => this._renderGraphNode(node),
            onAction: (node) => this._executeGraphAction(node),
            onEnd: () => this.closeEvent()
        };
        const session = {
            party: this.party,
            quests: this.session.quests
        };
        this.director.start(graphId, graphData, session, observer);
        this.scene.setStatus(`Talking to ${graphData.name || 'someone'}.`);
        AudioAdapter.play('UI_SELECT');
    }

     _renderGraphNode(node) {
        const graphData = this._activeNpc.data;
        const choices = [];

        if (node.type === 'CHOICE') {
            node.options.forEach((opt, index) => {
                choices.push({
                    label: opt.label,
                    onClick: () => this.director.handleInput({ type: 'OPTION_SELECTED', index })
                });
            });
        } else if (node.type === 'TEXT') {
            choices.push({
                label: "Continue",
                onClick: () => this.director.handleInput({ type: 'CONTINUE' })
            });
        }

        let speakers = node.speakers;
        if (!speakers && graphData.layout === 'visual_novel' && graphData.portrait) {
             speakers = [{ id: graphData.portrait, active: true, emotion: 'neutral' }];
        }

        this.scene.hudManager.eventWindow.show({
            title: graphData.name || "Event",
            description: node.content || "",
            layout: graphData.layout || 'visual_novel',
            portrait: graphData.portrait,
            speakers: speakers,
            style: 'terminal',
            choices: choices
        });

        if (!this.windowManager.stack.includes(this.scene.hudManager.eventWindow)) {
            this.windowManager.push(this.scene.hudManager.eventWindow);
        }
    }

    _executeGraphAction(node) {
        if (node.action === 'OPEN_SHOP') {
            this.scene.startShop(node.shopId);
            this.director.advance();
        } else if (node.action === 'TELEPORT') {
            this.director.end();
            this.closeEvent();
            this._descendStairs();
        } else if (node.action === 'OFFER_QUEST') {
            // Bridge Graph to System Command which then emits UI event?
            // Actually, Graph Action is executing here directly from Director.
            // We should use the same UI flow as the command.
            this._openQuestOffer(node.questId, {
                nextState: node.next,
                acceptState: node.acceptNode,
                declineState: node.declineNode
            });
        } else if (node.action === 'COMPLETE_QUEST') {
            this._completeQuest(node.questId, {
                nextState: node.next,
                completeState: node.completeNode
            });
        } else if (node.action === 'close') {
            this.director.end();
        } else {
             this.director.advance();
        }
    }

    closeEvent() {
        this.windowManager.close(this.scene.hudManager.eventWindow);
        if (this.scene.hudManager.questWindow) {
            this.windowManager.close(this.scene.hudManager.questWindow);
        }
        this._activeNpc = null;
        this.scene.updateAll();
    }

    _getQuestDefinition(questId) {
        if (!questId || !this.dataManager.quests) return null;
        const quests = this.dataManager.quests;
        const quest = quests[questId] || (Array.isArray(quests) ? quests.find(q => q.id === questId) : null);
        if (!quest) return null;
        return { id: questId, ...quest };
    }

    _enrichQuestRewards(questDef) {
        if (!questDef.rewards || !Array.isArray(questDef.rewards.items)) return questDef;

        const items = (this.dataManager.items || []);
        const enriched = questDef.rewards.items.map(r => {
            const itemDef = items.find(i => i.id === r.id);
            return {
                ...r,
                name: r.name || itemDef?.name,
                icon: r.icon || itemDef?.icon,
            };
        });

        return {
            ...questDef,
            rewards: {
                ...questDef.rewards,
                items: enriched
            }
        };
    }

    _openQuestOffer(questId, choice = {}) {
        const quest = this._getQuestDefinition(questId);
        if (!quest) {
            console.warn(`Quest '${questId}' not found.`);
            return;
        }

        const status = QuestSystem.getStatus(this.session.quests, questId);
        const questData = this._enrichQuestRewards(quest);

        const onAccept = () => {
            const result = QuestSystem.acceptQuest(this.session.quests, questId);
            if (result.ok) {
                this.scene.logMessage(`[Quest] Accepted: ${quest.name}.`);
                this.scene.setStatus(`Quest accepted: ${quest.name}`);
                AudioAdapter.play('UI_SELECT');
                this.windowManager.close(this.scene.hudManager.questWindow);

                const nextState = choice.acceptState || choice.nextState;
                if (this.director && nextState) {
                    this.director.walker.moveTo(nextState);
                    this.director.processCurrentNode();
                } else if (this.director) { // Fallback if in graph but no state
                    this.director.advance();
                } else {
                    this.closeEvent();
                }
            } else {
                this.scene.logMessage(`[Quest] ${quest.name} is already ${result.reason}.`);
            }
        };

        const onDecline = () => {
            this.windowManager.close(this.scene.hudManager.questWindow);
            const nextState = choice.declineState;
            if (this.director && nextState) {
                this.director.walker.moveTo(nextState);
                this.director.processCurrentNode();
            } else if (this.director) {
                this.director.advance();
            } else {
                this.closeEvent();
            }
        };

        this.scene.hudManager.questWindow.show({
            quest: questData,
            npcName: this._activeNpc?.data?.name,
            status,
            onAccept,
            onDecline,
        });
        if (!this.windowManager.stack.includes(this.scene.hudManager.questWindow)) {
            this.windowManager.push(this.scene.hudManager.questWindow);
        }
    }

    _completeQuest(questId, choice = {}) {
        const quest = this._getQuestDefinition(questId);
        if (!quest) {
            console.warn(`Quest '${questId}' not found.`);
            return;
        }

        const result = QuestSystem.completeQuest(this.session.quests, quest, this.party, this.dataManager);
        if (result.ok) {
            this.scene.logMessage(`[Quest] Completed: ${quest.name}.`);
            this.scene.setStatus(`${quest.name} completed.`);
            AudioAdapter.play('ITEM_GET');

            const nextState = choice.completeState || choice.nextState;
            if (this.director && nextState) {
                this.director.walker.moveTo(nextState);
                this.director.processCurrentNode();
            } else if (this.director) {
                this.director.advance();
            } else {
                this.closeEvent();
            }
            this.scene.updateAll();
            return;
        }

        if (result.reason === 'requirements') {
            this.scene.logMessage(`[Quest] You still need to bring the requested item.`);
        } else if (result.reason === 'completed') {
            this.scene.logMessage(`[Quest] ${quest.name} is already complete.`);
        } else {
            this.scene.logMessage(`[Quest] ${quest.name} is not active.`);
        }
    }
}
