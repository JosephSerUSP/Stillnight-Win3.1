import { Game_Battler } from "../objects/objects.js";
import { randInt, pickWeighted } from "../core/utils.js";
import { EventBus, Events } from "../core/events.js";

/**
 * @class Game_Interpreter
 * @description Handles event execution logic decoupled from Scene_Map.
 */
export class Game_Interpreter {
    /**
     * Creates a new Game_Interpreter.
     * @param {Object} context - The context object { party, map, dataManager }.
     */
    constructor(context) {
        this.context = context;
        this._onRecruitCallback = null;
        this.currentEvent = null;
    }

    get dataManager() { return this.context.dataManager; }
    get party() { return this.context.party; }
    get map() { return this.context.map; }

    /**
     * Executes a map event action.
     * @param {Object} action - The action object.
     * @param {import("../objects/objects.js").Game_Event} event - The source event.
     */
    execute(action, event) {
        this.currentEvent = event;
        switch(action.type) {
            case 'BATTLE':
                EventBus.emit(Events.START_BATTLE, { x: event.x, y: event.y });
                break;
            case 'SHOP':
                EventBus.emit(Events.START_SHOP);
                break;
            case 'SHRINE':
                EventBus.emit(Events.LOG_MESSAGE, "[Shrine] You encounter a shrine.");
                this.openShrineEvent();
                break;
            case 'RECRUIT':
                this.openRecruitEvent();
                break;
            case 'NPC_DIALOGUE':
                this.openNpcEvent(action.id);
                EventBus.emit(Events.UPDATE_HUD);
                break;
            case 'DESCEND':
                this.descendStairs();
                EventBus.emit(Events.PLAY_SOUND, 'STAIRS');
                break;
            case 'HEAL_PARTY':
                this.healParty();
                break;
            case 'MESSAGE':
                if (action.text) EventBus.emit(Events.LOG_MESSAGE, action.text);
                EventBus.emit(Events.UPDATE_HUD);
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
        if (event.hp === undefined) {
             event.hp = action.hp || 3;
        }

        event.hp--;

        if (event.hp > 0) {
            EventBus.emit(Events.LOG_MESSAGE, action.hitMessage || "The wall shudders under your touch.");
            EventBus.emit(Events.STATUS_CHANGE, "It seems weak...");
            EventBus.emit(Events.PLAY_SOUND, 'UI_SELECT');
            EventBus.emit(Events.UPDATE_HUD);
        } else {
            EventBus.emit(Events.LOG_MESSAGE, action.breakMessage || "The wall crumbles away!");
            EventBus.emit(Events.STATUS_CHANGE, "Path opened.");
            EventBus.emit(Events.PLAY_SOUND, 'DAMAGE');

            this.map.removeEvent(this.map.floorIndex, event.x, event.y);

            const floor = this.map.floors[this.map.floorIndex];
            floor.tiles[event.y][event.x] = '.';
            floor.visited[event.y][event.x] = true;

            EventBus.emit(Events.UPDATE_HUD);
        }
    }

    healParty() {
        this.party.members.forEach((m) => (m.hp = m.maxHp));
        EventBus.emit(Events.LOG_MESSAGE, "[Recover] A soft glow restores your party.");
        this.party.members.forEach((member) => {
            const xpBonus = member.getPassiveValue("RECOVERY_XP_BONUS");
            if (xpBonus > 0) {
                EventBus.emit(Events.GAIN_XP, { member, amount: xpBonus });
                EventBus.emit(Events.LOG_MESSAGE, `[Passive] ${member.name} gains ${xpBonus} bonus XP.`);
            }
        });
        EventBus.emit(Events.STATUS_CHANGE, "Recovered HP.");
        EventBus.emit(Events.PLAY_SOUND, 'HEAL');
        EventBus.emit(Events.APPLY_PASSIVES);
        EventBus.emit(Events.UPDATE_HUD);
    }

    descendStairs() {
        if (this.map.floorIndex + 1 >= this.map.floors.length) {
            EventBus.emit(Events.LOG_MESSAGE, "[Floor] You find no further descent. The run ends here.");
            EventBus.emit(Events.STATUS_CHANGE, "No deeper floors. Run over (for now).");
            EventBus.emit(Events.UPDATE_HUD);
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
        EventBus.emit(Events.LOG_MESSAGE, `[Floor] You descend to: ${f.title}`);
        EventBus.emit(Events.LOG_MESSAGE, `[Floor] ${f.intro}`);
        EventBus.emit(Events.STATUS_CHANGE, "Descending.");
        EventBus.emit(Events.PLAY_SOUND, 'STAIRS');
        EventBus.emit(Events.UPDATE_HUD);
        EventBus.emit(Events.MUSIC_CHANGE);
    }

    openShrineEvent() {
        const scenarios = this.dataManager.events.filter(e => e.type === 'shrine_scenario');
        if (scenarios.length === 0) {
            EventBus.emit(Events.LOG_MESSAGE, this.dataManager.terms.shrine.silent);
            return;
        }
        const ev = scenarios[randInt(0, scenarios.length - 1)];

        const choices = ev.choices.map(ch => ({
            label: ch.label,
            onClick: async () => {
                EventBus.emit(Events.DIALOG_LOG, `> ${ch.label}`);
                await this.applyEventEffect(ch.effect);
                EventBus.emit(Events.UPDATE_DIALOG_CHOICES, [{
                    label: "Exit Shrine",
                    onClick: () => this.closeEvent()
                }]);
            }
        }));

        EventBus.emit(Events.SHOW_DIALOG, {
            title: ev.title,
            description: ev.description,
            image: ev.image || "shrine.png",
            style: 'terminal',
            choices: choices
        });

        EventBus.emit(Events.STATUS_CHANGE, "Shrine event.");
        EventBus.emit(Events.PLAY_SOUND, 'UI_SELECT');
    }

    async applyEventEffect(effect) {
        const log = (msg) => EventBus.emit(Events.LOG_MESSAGE, msg);
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
            this.party.members.forEach((m) => EventBus.emit(Events.GAIN_XP, { member: m, amount: effect.value }));
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
        EventBus.emit(Events.UPDATE_HUD);
    }

    triggerTrap(action) {
        EventBus.emit(Events.SHOW_DIALOG, {
            title: "Trap!",
            description: action.message || "You triggered a trap!",
            image: "trap.png",
            style: 'terminal',
            choices: [{
                label: "Ouch...",
                onClick: () => this.resolveTrap(action)
            }]
        });
        EventBus.emit(Events.PLAY_SOUND, 'DAMAGE');
    }

    async resolveTrap(action) {
        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        try {
            const dmg = action.damage || 5;
            EventBus.emit(Events.DIALOG_LOG, `> Ouch...`);
            await delay(500);

            this.party.members.forEach(m => {
                m.hp = Math.max(0, m.hp - dmg);
            });

            EventBus.emit(Events.LOG_MESSAGE, `The party takes ${dmg} damage.`);
            EventBus.emit(Events.PLAY_SOUND, 'DAMAGE');
            EventBus.emit(Events.CHECK_PERMADEATH);
            EventBus.emit(Events.UPDATE_HUD);

            EventBus.emit(Events.UPDATE_DIALOG_CHOICES, [{
                label: "Close",
                onClick: () => EventBus.emit(Events.CLOSE_DIALOG)
            }]);
        } catch (e) {
            console.error(e);
            EventBus.emit(Events.DIALOG_LOG, "Error in resolveTrap: " + e);
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

        EventBus.emit(Events.SHOW_DIALOG, {
            title: "Treasure Found!",
            description: [
                "You found:",
                { type: 'item', value: item },
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
        EventBus.emit(Events.PLAY_SOUND, 'ITEM_GET');
        EventBus.emit(Events.UPDATE_HUD);
    }

    closeEvent() {
        EventBus.emit(Events.CLOSE_DIALOG);
        EventBus.emit(Events.UPDATE_HUD);
    }

    openRecruitEvent(options = {}) {
        const { forcedId, cost: forcedCost, onRecruit } = options;
        this._onRecruitCallback = onRecruit;

        // Reset currentEvent if forcedId is present (implies not map event)
        if (forcedId) {
             this.currentEvent = null;
        }

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
                    EventBus.emit(Events.LOG_MESSAGE, this.dataManager.terms.recruit.no_one_here);
                    return;
                }
                recruit = availableCreatures[randInt(0, availableCreatures.length - 1)];
            }
        }

        const cost = forcedCost !== undefined ? forcedCost : randInt(25, 75);

        EventBus.emit(Events.SHOW_RECRUIT, {
            recruit,
            cost,
            onRecruit: () => {
                 if (this.party.gold >= cost) {
                    this.party.gold -= cost;
                    this.attemptRecruit(recruit);
                } else {
                    EventBus.emit(Events.LOG_MESSAGE, `[Recruit] You don't have enough gold.`);
                    this.closeRecruitEvent();
                }
            },
            onDecline: () => {
                EventBus.emit(Events.LOG_MESSAGE, `[Recruit] You decline ${recruit.name}'s offer.`);
                this.closeRecruitEvent();
            }
        });

        EventBus.emit(Events.STATUS_CHANGE, "Recruit encountered.");
        EventBus.emit(Events.PLAY_SOUND, 'UI_SELECT');
    }

    closeRecruitEvent() {
        this._onRecruitCallback = null;
        EventBus.emit(Events.CLOSE_RECRUIT);
        EventBus.emit(Events.STATUS_CHANGE, "Exploration");
    }

    openNpcEvent(npcId) {
        const npc = this.dataManager.npcs.find(n => n.id === npcId);
        if (!npc) return;

        let text = "";
        if (typeof npc.dialogue === 'string') {
            text = npc.dialogue;
        }

        EventBus.emit(Events.SHOW_DIALOG, {
            title: npc.name,
            description: `"${text}"`,
            style: 'terminal',
            choices: [{
                label: "Leave",
                onClick: () => this.closeEvent()
            }]
        });

        EventBus.emit(Events.STATUS_CHANGE, `Talking to ${npc.name}.`);
        EventBus.emit(Events.PLAY_SOUND, 'UI_SELECT');
    }

    clearEventTile() {
        if (this.currentEvent) {
            this.map.removeEvent(this.map.floorIndex, this.currentEvent.x, this.currentEvent.y);
            this.currentEvent = null;
        }
        EventBus.emit(Events.UPDATE_HUD);
    }

    attemptRecruit(recruit) {
        if (this.party.hasEmptySlot()) {
            this.party.addMember(Game_Battler.create(recruit));
            EventBus.emit(Events.LOG_MESSAGE, `[Recruit] ${recruit.name} joins your party.`);
            EventBus.emit(Events.STATUS_CHANGE, this.dataManager.terms.recruit.recruited.replace("{0}", recruit.name));

            if (this._onRecruitCallback) {
                this._onRecruitCallback();
                this._onRecruitCallback = null;
            }

            this.clearEventTile();
            this.closeRecruitEvent();
            EventBus.emit(Events.UPDATE_HUD);
            return;
        }

        EventBus.emit(Events.SHOW_RECRUIT, {
            mode: 'replace',
            recruit,
            candidates: this.party.members,
            onReplace: (index) => this.replaceMemberWithRecruit(index, recruit),
            onCancel: () => {
                EventBus.emit(Events.LOG_MESSAGE, this.dataManager.terms.recruit.decide_not_to_replace);
                this.closeRecruitEvent();
            }
        });
    }

    replaceMemberWithRecruit(index, recruit) {
        const replaced = this.party.members[index];
        EventBus.emit(Events.LOG_MESSAGE,
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
        EventBus.emit(Events.UPDATE_HUD);
        this.closeRecruitEvent();
    }
}
