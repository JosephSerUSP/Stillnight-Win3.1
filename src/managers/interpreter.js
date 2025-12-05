import { Game_Battler } from "../objects/objects.js";
import { randInt, pickWeighted, evaluateFormula } from "../core/utils.js";
import { SoundManager } from "../managers/index.js";
import {
  createInteractiveLabel,
  createBattlerNameLabel,
  renderCreatureInfo,
  renderElements
} from "../windows/index.js";

/**
 * @class Game_Interpreter
 * @description Handles event execution logic decoupled from Scene_Map.
 */
export class Game_Interpreter {
    /**
     * Creates a new Game_Interpreter.
     * @param {Object} sceneContext - The scene context (Scene_Map interface).
     */
    constructor(sceneContext) {
        this.scene = sceneContext;
        this._onRecruitCallback = null;
        this.currentRecruit = null;
    }

    get dataManager() { return this.scene.dataManager; }
    get hudManager() { return this.scene.hudManager; }
    get windowManager() { return this.scene.windowManager; }
    get party() { return this.scene.party; }
    get map() { return this.scene.map; }

    /**
     * Executes a map event action.
     * @param {Object} action - The action object.
     * @param {import("../objects/objects.js").Game_Event} event - The source event.
     */
    execute(action, event) {
        switch(action.type) {
            case 'BATTLE':
                this.scene.startBattle(event.x, event.y);
                break;
            case 'SHOP':
                this.scene.startShop();
                break;
            case 'SHRINE':
                this.scene.logMessage("[Shrine] You encounter a shrine.");
                this.openShrineEvent();
                break;
            case 'RECRUIT':
                this.openRecruitEvent({ event });
                break;
            case 'NPC_DIALOGUE':
                this.openNpcEvent(action.id);
                this.scene.updateAll();
                break;
            case 'DESCEND':
                this.descendStairs();
                SoundManager.play('STAIRS');
                break;
            case 'HEAL_PARTY':
                this.healParty();
                break;
            case 'MESSAGE':
                if (action.text) this.scene.logMessage(action.text);
                this.scene.updateAll();
                break;
            case 'TREASURE':
                this.openTreasureEvent();
                break;
            case 'TRAP_TRIGGER':
                this.triggerTrap(action);
                break;
            case 'BREAKABLE_WALL':
                this.triggerBreakableWall(action, event);
                break;
        }
    }

    triggerBreakableWall(action, event) {
        // Initialize HP if not present (stored in the event instance, not the data def)
        if (event.hp === undefined) {
             event.hp = action.hp || 3;
        }

        event.hp--;

        if (event.hp > 0) {
            this.scene.logMessage(action.hitMessage || "The wall shudders under your touch.");
            this.scene.setStatus("It seems weak...");
            SoundManager.play('UI_SELECT'); // or a thud sound
            this.scene.updateAll();
        } else {
            this.scene.logMessage(action.breakMessage || "The wall crumbles away!");
            this.scene.setStatus("Path opened.");
            SoundManager.play('DAMAGE'); // Crumble sound

            // Remove the event
            this.map.removeEvent(this.map.floorIndex, event.x, event.y);

            // Change the tile to floor
            const floor = this.map.floors[this.map.floorIndex];
            floor.tiles[event.y][event.x] = '.';

            // Reveal if needed (auto-reveal check handles it on next move, but we can do it here)
            floor.visited[event.y][event.x] = true;

            // Update grid
            this.scene.updateGrid();
            this.scene.updateAll();
        }
    }

    /**
     * Fully heals the party.
     */
    healParty() {
        this.party.members.forEach((m) => (m.hp = m.maxHp));
        this.scene.logMessage("[Recover] A soft glow restores your party.");
        this.party.members.forEach((member) => {
            const xpBonus = member.getPassiveValue("RECOVERY_XP_BONUS");
            if (xpBonus > 0) {
            this.scene.gainXp(member, xpBonus);
            this.scene.logMessage(
                `[Passive] ${member.name} gains ${xpBonus} bonus XP.`
            );
            }
        });
        this.scene.setStatus("Recovered HP.");
        SoundManager.play('HEAL');
        this.scene.applyMovePassives();
        this.scene.updateAll();
    }

    /**
     * Handles descending to the next floor.
     */
    descendStairs() {
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
        SoundManager.play('STAIRS');
        this.scene.updateAll();
        this.scene.checkMusic();
    }

    openShrineEvent() {
        const scenarios = this.dataManager.events.filter(e => e.type === 'shrine_scenario');
        if (scenarios.length === 0) {
            this.scene.logMessage(this.dataManager.terms.shrine.silent);
            return;
        }
        const ev = scenarios[randInt(0, scenarios.length - 1)];

        const choices = ev.choices.map(ch => ({
            label: ch.label,
            onClick: async () => {
                this.scene.hudManager.eventWindow.appendLog(`> ${ch.label}`);
                await this.applyEventEffect(ch.effect);
                this.scene.hudManager.eventWindow.updateChoices([{
                    label: "Exit Shrine",
                    onClick: () => this.closeEvent()
                }]);
            }
        }));

        this.scene.hudManager.eventWindow.show({
            title: ev.title,
            description: ev.description,
            image: ev.image || "shrine.png",
            style: 'terminal',
            choices: choices
        });
        this.windowManager.push(this.scene.hudManager.eventWindow);

        this.scene.setStatus("Shrine event.");
        SoundManager.play('UI_SELECT');
    }

    async applyEventEffect(effect) {
        const log = (msg) => this.scene.logMessage(msg);
        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        await delay(300);

        switch (effect.type) {
        case "hp":
            this.party.members.forEach((m) => {
                m.hp += effect.value;
                if (m.hp > m.maxHp) m.hp = m.maxHp;
                if (m.hp < 0) m.hp = 0;
            });
            log(this.dataManager.terms.shrine.hp_change.replace("{0}", effect.value));
            break;
        case "maxHp":
            this.party.members.forEach((m) => (m.maxHp += effect.value));
            log(this.dataManager.terms.shrine.max_hp_change.replace("{0}", effect.value));
            break;
        case "xp":
            this.party.members.forEach((m) => this.scene.gainXp(m, effect.value));
            log(this.dataManager.terms.shrine.xp_gain.replace("{0}", effect.value));
            break;
        case "gold":
            this.party.gold += effect.value;
            log(this.dataManager.terms.shrine.gold_gain.replace("{0}", effect.value));
            if (effect.onSuccess) {
            await this.applyEventEffect(effect.onSuccess);
            }
            break;
        case "message":
            log(effect.value);
            break;
        case "random":
            const roll = Math.random();
            let outcome;
            for (const o of effect.outcomes) {
            if (roll < o.chance) {
                outcome = o;
                break;
            }
            }
            if (outcome) {
            await this.applyEventEffect(outcome.effect);
            }
            break;
        case "multi":
            for (const e of effect.effects) {
                await this.applyEventEffect(e);
            }
            break;
        }
        this.scene.updateAll();
    }

    triggerTrap(action) {
        this.scene.hudManager.eventWindow.show({
            title: "Trap!",
            description: action.message || "You triggered a trap!",
            image: "trap.png",
            style: 'terminal',
            choices: [{
                label: "Ouch...",
                onClick: () => this.resolveTrap(action)
            }]
        });
        this.windowManager.push(this.scene.hudManager.eventWindow);
        SoundManager.play('DAMAGE');
    }

    async resolveTrap(action) {
        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        try {
            const dmg = action.damage || 5;
            this.scene.hudManager.eventWindow.appendLog(`> Ouch...`);
            await delay(500);

            this.party.members.forEach(m => {
                m.hp = Math.max(0, m.hp - dmg);
            });

            this.scene.logMessage(`The party takes ${dmg} damage.`);
            this.scene.checkPermadeath();
            SoundManager.play('DAMAGE');
            this.scene.updateAll();

            this.scene.hudManager.eventWindow.updateChoices([{
                label: "Close",
                onClick: () => this.scene.hudManager.eventWindow.onUserClose()
            }]);
        } catch (e) {
            console.error(e);
            this.scene.hudManager.eventWindow.appendLog("Error in resolveTrap: " + e);
        }
    }

    openTreasureEvent() {
        const floor = this.map.floors[this.map.floorIndex];
        let possibleItems = floor.treasures || [];

        if (!possibleItems || possibleItems.length === 0) {
            possibleItems = this.dataManager.items.filter(i => i.type !== 'key').map(i => i.id);
        }

        let itemId;
        if (typeof possibleItems[0] === 'string') {
            itemId = possibleItems[randInt(0, possibleItems.length - 1)];
        } else {
            const picked = pickWeighted(possibleItems);
            itemId = picked ? picked.id : null;
        }

        if (!itemId && possibleItems.length > 0) {
            if (typeof possibleItems[0] === 'string') itemId = possibleItems[0];
            else itemId = possibleItems[0].id;
        }

        const item = this.dataManager.items.find(i => i.id === itemId) || this.dataManager.items[0];

        this.party.inventory.push(item);
        this.clearEventTile();

        const itemLabel = createInteractiveLabel(item, 'item');

        this.scene.hudManager.eventWindow.show({
            title: "Treasure Found!",
            description: [
                "You found:",
                itemLabel,
                "",
                item.description
            ],
            image: "treasure.png",
            style: 'terminal',
            choices: [{
                label: "Take",
                onClick: () => this.closeEvent()
            }]
        });
        this.windowManager.push(this.scene.hudManager.eventWindow);
        SoundManager.play('ITEM_GET');
        this.scene.updateAll();
    }

    closeEvent() {
        this.windowManager.close(this.scene.hudManager.eventWindow);
        this.scene.updateAll();
    }

    openRecruitEvent(options = {}) {
        const { forcedId, cost: forcedCost, onRecruit, event } = options;
        this._onRecruitCallback = onRecruit;

        // Task: Persistent Recruit
        let recruitData = null;
        if (event && event.recruitData) {
            recruitData = event.recruitData;
        } else {
             // Generate new recruit data
             let recruitDef = null;
             if (forcedId) {
                 recruitDef = this.dataManager.actors.find(a => a.id === forcedId);
             } else {
                const floor = this.map.floors[this.map.floorIndex];
                if (floor && floor.recruits && floor.recruits.length > 0) {
                    const recruitId = floor.recruits[randInt(0, floor.recruits.length - 1)];
                    recruitDef = this.dataManager.actors.find(a => a.id === recruitId);
                }
                if (!recruitDef) {
                    const availableCreatures = this.dataManager.actors.filter(creature => creature.isRecruitable);
                    if (availableCreatures.length === 0) {
                        this.scene.logMessage(this.dataManager.terms.recruit.no_one_here);
                        return;
                    }
                    recruitDef = availableCreatures[randInt(0, availableCreatures.length - 1)];
                }
             }

             if (!recruitDef) {
                 this.scene.logMessage("No one is here.");
                 this.closeRecruitEvent();
                 return;
             }

             const cost = forcedCost !== undefined ? forcedCost : randInt(recruitDef.gold || 25, (recruitDef.gold || 50) * 1.5);

             // Task: Random Initial Equipment (30% chance)
             let equipmentId = null;
             if (Math.random() < 0.3) {
                 const equipable = this.dataManager.items.filter(i => (i.type === 'weapon' || i.type === 'armor') && !i.unique);
                 if (equipable.length > 0) {
                     equipmentId = equipable[randInt(0, equipable.length - 1)].id;
                 }
             }

             recruitData = {
                 actorId: recruitDef.id,
                 cost: Math.floor(cost),
                 equipmentId: equipmentId
             };

             if (event) {
                 event.recruitData = recruitData;
             }
        }

        const recruitActor = this.dataManager.actors.find(a => a.id === recruitData.actorId);
        if (!recruitActor) {
             this.scene.logMessage("Error: Recruit data invalid.");
             this.closeRecruitEvent();
             return;
        }

        this.currentRecruit = recruitData;

        // Create preview battler to ensure stats and tooltips work correctly
        const previewBattler = Game_Battler.create(recruitActor);
        if (recruitData.equipmentId) {
             const item = this.dataManager.items.find(i => i.id === recruitData.equipmentId);
             if (item) {
                 previewBattler.equipmentItem = item;
             }
        }

        const win = this.scene.hudManager.recruitWindow;
        win.setTitle(`Recruit – ${recruitActor.name}`);

        win.bodyEl.innerHTML = "";

        renderCreatureInfo(win.bodyEl, previewBattler, {
            dataManager: this.dataManager
        });

        const costEl = document.createElement("div");
        costEl.style.marginTop = "10px";
        costEl.style.textAlign = "center";
        costEl.style.color = "var(--text-highlight)";
        costEl.textContent = `Cost: ${recruitData.cost} Gold`;
        win.bodyEl.appendChild(costEl);

        // Buttons
        win.footer.innerHTML = "";
        win.addButton("Accept", () => {
             this.attemptRecruit();
        });
        win.addButton("Decline", () => {
            this.scene.logMessage(`[Recruit] You decline ${recruitActor.name}'s offer.`);
            this.closeRecruitEvent();
        });

        this.windowManager.push(win);
        this.scene.setStatus("Recruit encountered.");
        SoundManager.play('UI_SELECT');
    }

    closeRecruitEvent() {
        this._onRecruitCallback = null;
        this.windowManager.close(this.scene.hudManager.recruitWindow);
        this.scene.setStatus("Exploration");
    }

    openNpcEvent(npcId) {
        const npc = this.dataManager.npcs.find(n => n.id === npcId);
        if (!npc) return;

        let text = "";
        if (typeof npc.dialogue === 'string') {
            text = npc.dialogue;
        }

        this.scene.hudManager.eventWindow.show({
            title: npc.name,
            description: `"${text}"`,
            style: 'terminal',
            choices: [{
                label: "Leave",
                onClick: () => this.closeEvent()
            }]
        });
        this.windowManager.push(this.scene.hudManager.eventWindow);

        this.scene.setStatus(`Talking to ${npc.name}.`);
        SoundManager.play('UI_SELECT');
    }

    clearEventTile() {
        if (this.scene.currentInteractionEvent) {
            this.map.removeEvent(this.map.floorIndex, this.scene.currentInteractionEvent.x, this.scene.currentInteractionEvent.y);
            this.scene.currentInteractionEvent = null;
        }
        this.scene.updateGrid();
    }

    attemptRecruit() {
        const recruitData = this.currentRecruit;
        const recruitDef = this.dataManager.actors.find(a => a.id === recruitData.actorId);

        if (this.party.gold < recruitData.cost) {
             this.scene.logMessage(`[Recruit] You don't have enough gold.`);
             this.closeRecruitEvent();
             return;
        }

        if (this.party.hasEmptySlot()) {
            this.party.gold -= recruitData.cost;

            const newMember = Game_Battler.create(recruitDef);
            if (recruitData.equipmentId) {
                const item = this.dataManager.items.find(i => i.id === recruitData.equipmentId);
                if (item) newMember.equipmentItem = item;
            }

            this.party.addMember(newMember);
            this.scene.logMessage(`[Recruit] ${recruitDef.name} joins your party.`);
            this.scene.setStatus(
                this.dataManager.terms.recruit.recruited.replace("{0}", recruitDef.name)
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

        // Party full logic
        this.scene.hudManager.recruitWindow.bodyEl.innerHTML =
            this.dataManager.terms.recruit.party_full;
        this.scene.hudManager.recruitWindow.buttonsEl.innerHTML = "";
        this.party.members.forEach((m, idx) => {
            const btn = document.createElement("button");
            btn.className = "win-btn";
            btn.textContent = m.name;
            btn.addEventListener("click", () => {
                this.replaceMemberWithRecruit(idx);
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

    replaceMemberWithRecruit(index) {
        const recruitData = this.currentRecruit;
        const recruitDef = this.dataManager.actors.find(a => a.id === recruitData.actorId);
        const replaced = this.party.members[index];

        this.party.gold -= recruitData.cost;

        this.scene.logMessage(
            this.dataManager.terms.recruit.replace_member
                .replace("{0}", replaced.name)
                .replace("{1}", recruitDef.name)
        );

        const newMember = Game_Battler.create(recruitDef);
        if (recruitData.equipmentId) {
            const item = this.dataManager.items.find(i => i.id === recruitData.equipmentId);
            if (item) newMember.equipmentItem = item;
        }

        this.party.replaceMember(index, newMember);

        if (this._onRecruitCallback) {
            this._onRecruitCallback();
            this._onRecruitCallback = null;
        }

        this.clearEventTile();
        this.scene.updateParty();
        this.closeRecruitEvent();
    }
}
