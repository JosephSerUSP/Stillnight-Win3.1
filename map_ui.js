import {
  Window_HUD,
  Window_Inventory,
  Window_Event,
  Window_Recruit,
  Window_Formation,
  Window_Inspect,
  Window_Confirm,
  Window_Evolution,
  Window_ConfirmEffect,
  Window_PartySelect,
  Window_EquipItemSelect,
  Window_Options,
  Window_Help,
  Window_Inventory as Window_InventoryClass,
  WindowLayer,
  createInteractiveLabel,
  createBattlerNameLabel,
  renderCreatureInfo,
  renderElements
} from "./windows.js";
import { SoundManager, ThemeManager } from "./managers.js";
import { Game_Battler } from "./objects.js";
import { evaluateFormula } from "./core.js";

/**
 * @class MapUIManager
 * @description Manages the UI windows and DOM elements for Scene_Map.
 */
export class MapUIManager {
    /**
     * @param {import("./scenes.js").Scene_Map} scene - The parent scene.
     */
    constructor(scene) {
        this.scene = scene;
        this.windowManager = scene.windowManager;
        this.dataManager = scene.dataManager;

        this.hud = new Window_HUD();
        this.windowLayer = new WindowLayer();

        const gameContainer = document.getElementById("game-container");
        this.windowLayer.appendTo(gameContainer);

        this.createWindows();
        this.bindHudEvents();
        this.cacheDomElements();
    }

    createWindows() {
        this.inventoryWindow = new Window_Inventory();
        this.windowLayer.addChild(this.inventoryWindow);

        this.eventWindow = new Window_Event();
        this.windowLayer.addChild(this.eventWindow);

        this.recruitWindow = new Window_Recruit();
        this.windowLayer.addChild(this.recruitWindow);

        this.formationWindow = new Window_Formation();
        this.windowLayer.addChild(this.formationWindow);

        this.inspectWindow = new Window_Inspect();
        this.windowLayer.addChild(this.inspectWindow);

        this.evolutionWindow = new Window_Evolution();
        this.windowLayer.addChild(this.evolutionWindow);

        this.confirmWindow = new Window_Confirm();
        this.windowLayer.addChild(this.confirmWindow);

        this.confirmEffectWindow = new Window_ConfirmEffect();
        this.windowLayer.addChild(this.confirmEffectWindow);

        this.partySelectWindow = new Window_PartySelect();
        this.windowLayer.addChild(this.partySelectWindow);

        this.equipItemSelectWindow = new Window_EquipItemSelect();
        this.windowLayer.addChild(this.equipItemSelectWindow);

        this.optionsWindow = new Window_Options();
        this.windowLayer.addChild(this.optionsWindow);

        this.helpWindow = new Window_Help();
        this.windowLayer.addChild(this.helpWindow);

        // Bind default close handlers
        this.inventoryWindow.onUserClose = () => this.closeInventory();

        this.recruitWindow.onUserClose = () => {
             if (this.scene.interpreter) this.scene.interpreter.closeRecruitEvent();
        };

        this.evolutionWindow.onUserClose = () => this.windowManager.close(this.evolutionWindow);
        this.formationWindow.onUserClose = () => this.closeFormation();
        this.confirmWindow.onUserClose = () => this.windowManager.close(this.confirmWindow);
        this.confirmEffectWindow.onUserClose = () => this.windowManager.close(this.confirmEffectWindow);
        this.partySelectWindow.onUserClose = () => this.windowManager.close(this.partySelectWindow);
        this.equipItemSelectWindow.onUserClose = () => this.windowManager.close(this.equipItemSelectWindow);
        this.optionsWindow.onUserClose = () => this.windowManager.close(this.optionsWindow);
        this.helpWindow.onUserClose = () => this.windowManager.close(this.helpWindow);

        this.inspectWindow.onUserClose = () => this.closeInspect();
    }

    cacheDomElements() {
        this.explorationGridEl = document.getElementById("exploration-grid");
        this.logEl = document.getElementById("log-content");
        this.statusMessageEl = document.getElementById("status-message");
        this.statusGoldEl = document.getElementById("status-gold");
        this.statusItemsEl = document.getElementById("status-items");
        this.statusRunEl = document.getElementById("status-run");
        this.modeLabelEl = document.getElementById("mode-label");
    }

    bindHudEvents() {
        this.hud.btnNewRun.addEventListener("click", () => this.scene.startNewRun());
        this.hud.btnRevealAll.addEventListener("click", () => this.scene.revealAllFloors());
        this.hud.btnSettings.addEventListener("click", () => this.openSettings());
        this.hud.btnHelp.addEventListener("click", () => this.openHelp());
        this.hud.btnClearLog.addEventListener("click", () => {
            if (this.logEl) this.logEl.textContent = "";
            this.setStatus("Log cleared.");
            SoundManager.beep(300, 80);
        });
        this.hud.btnFormation.addEventListener("click", () => this.openFormation());
        this.hud.btnInventory.addEventListener("click", () => this.openInventory());
    }

    setStatus(msg) {
        if (this.statusMessageEl) this.statusMessageEl.textContent = msg;
    }

    logMessage(msg) {
        if (this.logEl) {
            this.logEl.textContent += msg + "\n";
            this.logEl.scrollTop = this.logEl.scrollHeight;
        }
        if (this.windowManager.stack.includes(this.eventWindow)) {
            this.eventWindow.appendLog(msg);
        }
    }

    updateAll() {
        this.updateGrid(this.scene.map);
        this.hud.updateCardHeader(this.scene.map.floors[this.scene.map.floorIndex], this.scene.map.floorIndex, this.scene.map.floors.length);
        this.hud.updateCardList(
            this.scene.map.floors,
            this.scene.map.floorIndex,
            this.scene.map.maxReachedFloorIndex,
            (idx) => this.scene.navigateToFloor(idx)
        );
        this.updateParty();
        this.statusGoldEl.textContent = this.scene.party.gold;
        this.statusItemsEl.textContent = this.scene.party.inventory.length;
        this.statusRunEl.textContent = this.scene.runActive ? "Active" : "Over";
        this.modeLabelEl.textContent = "Exploration";
    }

    updateGrid(map) {
        const floor = map.floors[map.floorIndex];
        this.explorationGridEl.innerHTML = "";
        for (let y = 0; y < map.MAX_H; y++) {
          for (let x = 0; x < map.MAX_W; x++) {
            const tileEl = document.createElement("div");
            tileEl.className = "tile";
            tileEl.dataset.x = x;
            tileEl.dataset.y = y;

            const isPlayer = x === map.playerX && y === map.playerY;
            const visited = floor.visited[y][x];
            const ch = floor.tiles[y][x];
            const event = floor.events ? floor.events.find(e => e.x === x && e.y === y) : null;

            if (!visited && !isPlayer) {
              tileEl.classList.add("tile-fog");
              tileEl.textContent = "?";
            } else {
              let symbol = " ";

              if (event) {
                  let visible = true;
                  if (event.hidden) {
                      let maxSee = 0;
                      this.scene.party.members.forEach(m => {
                          const v = m.getPassiveValue("SEE_TRAPS");
                          if (v > maxSee) maxSee = v;
                      });
                      if (maxSee <= event.trapValue) {
                          visible = false;
                      }
                  }

                  if (visible) {
                      symbol = event.symbol;
                      if (event.cssClass) tileEl.classList.add(event.cssClass);
                  }
              }

              if (symbol === " ") {
                switch (ch) {
                  case "#": symbol = "█"; break;
                  case ".": symbol = " "; break;
                  default: symbol = " "; break;
                }
              }

              if (isPlayer) {
                symbol = "☺";
                tileEl.classList.add("tile-player");
              }
              tileEl.textContent = symbol;
            }

            tileEl.addEventListener("click", (e) => this.scene.onTileClick(e));
            this.explorationGridEl.appendChild(tileEl);
          }
        }
    }

    updateParty() {
        this.hud.updateParty(this.scene.party, (member, index) => this.openInspect(member, index), this.scene.getContext());
    }

    openInventory() {
        if (this.scene.sceneManager.currentScene() !== this.scene) return;
        this.windowManager.push(this.inventoryWindow);
        this.inventoryWindow.setup(
            this.scene.party,
            (item, action) => this.onInventoryAction(item, action),
            (item) => this.discardItem(item)
        );
    }

    closeInventory() {
        this.windowManager.close(this.inventoryWindow);
    }

    openFormation() {
        if (this.scene.sceneManager.currentScene() !== this.scene) return;
        this.windowManager.push(this.formationWindow);
        this.formationWindow.refresh(this.scene.party, () => {
            this.updateParty();
            this.logMessage("[Formation] Party order changed.");
        }, this.scene.getContext());
    }

    closeFormation() {
        this.windowManager.close(this.formationWindow);
    }

    openHelp() {
        if (this.scene.sceneManager.currentScene() !== this.scene) return;
        this.windowManager.push(this.helpWindow);
    }

    openSettings() {
        if (this.scene.sceneManager.currentScene() !== this.scene) return;

        const themes = ThemeManager.getThemes().map(t => ({
            label: t.name,
            value: t.id
        }));

        const options = [
            {
                label: "Theme",
                type: "select",
                value: ThemeManager.getCurrentThemeId(),
                options: themes,
                onChange: (val) => {
                    ThemeManager.applyTheme(val);
                    SoundManager.beep(400, 50);
                }
            }
        ];

        this.optionsWindow.setup(options);
        this.windowManager.push(this.optionsWindow);
    }

    openInspect(member, index) {
        this.inspectWindow.member = member;
        const need = member.xpNeeded(member.level);
        const spriteKey = member.spriteKey || 'pixie';
        this.inspectWindow.spriteEl.style.backgroundImage = `url('assets/portraits/${spriteKey}.png')`;

        const floor = this.scene.map.floors[this.scene.map.floorIndex];
        const evoStatus = member.getEvolutionStatus(this.scene.party.inventory, floor ? floor.depth : 1, this.scene.party.gold);

        this.inspectWindow.nameEl.innerHTML = "";
        this.inspectWindow.nameEl.appendChild(createBattlerNameLabel(member, {
            evolutionStatus: evoStatus.status
        }));

        if (evoStatus.status === 'AVAILABLE') {
             this.inspectWindow.btnEvolve.style.display = "inline-block";
             this.inspectWindow.btnEvolve.onclick = () => {
                 this.openEvolution(member, evoStatus.evolution);
             };
        } else {
             this.inspectWindow.btnEvolve.style.display = "none";
        }

        this.inspectWindow.levelEl.textContent = member.level;
        this.inspectWindow.rowPosEl.textContent = this.scene.partyRow(index);
        this.inspectWindow.hpEl.textContent = `${member.hp} / ${member.maxHp}`;
        this.inspectWindow.xpEl.textContent = `${member.xp || 0} / ${need}`;

        this.inspectWindow.elementEl.innerHTML = "";
        if (member.elements && member.elements.length > 0) {
            this.inspectWindow.elementEl.appendChild(renderElements(member.elements));
        } else {
            this.inspectWindow.elementEl.textContent = "—";
        }

        if (member.equipmentItem) {
          this.inspectWindow.equipEl.textContent = member.equipmentItem.name;
        } else if (member.baseEquipment) {
          this.inspectWindow.equipEl.textContent = member.baseEquipment;
        } else {
          this.inspectWindow.equipEl.textContent = "—";
        }

        this.inspectWindow.passiveEl.innerHTML = "";
        if (member.passives && member.passives.length > 0) {
            member.passives.forEach((pData, i) => {
                const code = pData.code || pData.id;
                let def = null;
                if (this.dataManager.passives) {
                    def = Object.values(this.dataManager.passives).find(p => p.id === code || p.code === code);
                }
                if (!def) def = pData;

                const el = createInteractiveLabel(def, 'passive');
                this.inspectWindow.passiveEl.appendChild(el);

                if (i < member.passives.length - 1) {
                    this.inspectWindow.passiveEl.appendChild(document.createTextNode(", "));
                }
            });
        } else {
            this.inspectWindow.passiveEl.textContent = "—";
        }

        this.inspectWindow.skillsEl.innerHTML = "";
        if (member.skills && member.skills.length > 0) {
            member.skills.forEach((sId, i) => {
                const skill = this.dataManager.skills[sId];
                if (skill) {
                    let effectsText = "";
                    if (skill.effects && skill.effects.length > 0) {
                        const descriptions = [];
                        skill.effects.forEach(eff => {
                             if (eff.type === 'hp_damage') {
                                 const val = Math.round(evaluateFormula(eff.formula, member));
                                 descriptions.push(`Deals ~${val} Damage`);
                             } else if (eff.type === 'hp_heal') {
                                 const val = Math.round(evaluateFormula(eff.formula, member));
                                 descriptions.push(`Heals ~${val} HP`);
                             } else if (eff.type === 'add_status') {
                                 const chance = Math.round((eff.chance || 1) * 100);
                                 descriptions.push(`${chance}% chance to add ${eff.status}`);
                             }
                        });
                        if (descriptions.length > 0) {
                            effectsText = descriptions.join(", ");
                        }
                    }

                    let tooltipText = skill.description;
                    if (effectsText) {
                        tooltipText += `<br/><span style="color:#478174; font-size: 0.9em;">${effectsText}</span>`;
                    }

                    const el = createInteractiveLabel(skill, 'skill', { tooltipText });
                    this.inspectWindow.skillsEl.appendChild(el);
                } else {
                    this.inspectWindow.skillsEl.appendChild(document.createTextNode(sId));
                }

                if (i < member.skills.length - 1) {
                    this.inspectWindow.skillsEl.appendChild(document.createTextNode(", "));
                }
            });
        } else {
            this.inspectWindow.skillsEl.textContent = "—";
        }

        this.inspectWindow.flavorEl.textContent = member.flavor || "—";
        this.inspectWindow.notesEl.textContent = "Row is determined by the 2×2 formation grid.";

        this.windowManager.push(this.inspectWindow);
        this.setStatus(`Inspecting ${member.name}`);
        this.logMessage(`[Inspect] ${member.name} – Lv${member.level}, ${this.scene.partyRow(index)}, HP ${member.hp}/${member.maxHp}.`);

        const sacrificeValue = member.level * (member.hp + member.maxHp);
        this.inspectWindow.btnSacrifice.textContent = `Sacrifice (${sacrificeValue}G)`;
        this.inspectWindow.btnSacrifice.style.display = "block";
        this.inspectWindow.btnSacrifice.onclick = () => {
            this.confirmWindow.titleEl.textContent = "Sacrifice Unit";
            this.confirmWindow.messageEl.textContent = `Sacrifice ${member.name} for ${sacrificeValue} Gold? This cannot be undone.`;
            this.windowManager.push(this.confirmWindow);
            this.confirmWindow.btnOk.onclick = () => {
                this.windowManager.close(this.confirmWindow);
                this.scene.sacrificeMember(member, sacrificeValue);
            };
        };

        this.inspectWindow.equipEl.onclick = () => this.openEquipmentScreen(member);
        this.inspectWindow.btnOk.onclick = () => this.closeInspect();
    }

    closeInspect() {
        this.inspectWindow.btnSacrifice.style.display = "none";
        this.windowManager.close(this.inspectWindow);
        this.setStatus("Exploration");
    }

    openEvolution(member, evolutionData) {
        this.closeInspect();
        const nextId = evolutionData.evolvesTo;
        const nextData = this.dataManager.actors.find(a => a.id === nextId);
        if (!nextData) return;

        const nextBattler = new Game_Battler({ ...nextData, level: member.level });
        this.evolutionWindow.setup(member, nextBattler);

        this.evolutionWindow.btnConfirm.onclick = () => {
            this.scene.confirmEvolution(member, nextBattler, evolutionData);
        };

        this.windowManager.push(this.evolutionWindow);
    }

    openEquipmentScreen(member) {
        const inventoryItems = this.scene.party.inventory.filter(i => i.type === "equipment");
        const otherMemberItems = this.scene.party.members
          .filter((m) => m !== member && m.equipmentItem)
          .map((m) => ({
            ...m.equipmentItem,
            equippedBy: m.name,
            equippedMember: m,
          }));
        const allItems = [...inventoryItems, ...otherMemberItems];

        this.equipItemSelectWindow.setup(allItems, member.equipmentItem, "Change Equipment", (item) => {
            this.windowManager.close(this.equipItemSelectWindow);
            this.checkEquip(member, item);
        });
        this.windowManager.push(this.equipItemSelectWindow);
    }

    onInventoryAction(item, action) {
        if (action === 'use') {
            if (item.type === 'equipment') return;

            if (item.effects && item.effects.recruit_egg) {
                const recruitId = item.effects.recruit_egg;
                this.windowManager.close(this.inventoryWindow);
                this.scene.interpreter.openRecruitEvent({
                    forcedId: recruitId,
                    cost: 0,
                    onRecruit: () => this.discardItem(item)
                });
                return;
            }

            this.partySelectWindow.setup(this.scene.party, `Use ${item.name} on:`, (target) => {
                this.windowManager.close(this.partySelectWindow);
                this.confirmEffectWindow.setupUse(target, item, () => {
                    this.windowManager.close(this.confirmEffectWindow);
                    this.useItem(item, target);
                });
                this.windowManager.push(this.confirmEffectWindow);
            }, this.scene.getContext());
            this.windowManager.push(this.partySelectWindow);
        } else if (action === 'equip') {
            this.partySelectWindow.setup(this.scene.party, `Equip ${item.name} on:`, (target) => {
                this.windowManager.close(this.partySelectWindow);
                this.checkEquip(target, item);
            }, this.scene.getContext());
            this.windowManager.push(this.partySelectWindow);
        }
    }

    checkEquip(member, item) {
        const oldItem = member.equipmentItem;
        let swapMsg = null;
        if (item && item.equippedMember && item.equippedMember !== member) {
            swapMsg = `Swapping with ${item.equippedMember.name}.`;
        } else if (!item) {
            swapMsg = "Unequipping.";
        }
        this.confirmEffectWindow.setupEquip(member, item, oldItem, "Held Item", () => {
            this.windowManager.close(this.confirmEffectWindow);
            this.scene.equipItem(member, item);
        }, swapMsg);
        this.windowManager.push(this.confirmEffectWindow);
    }

    useItem(item, target) {
        this.scene.useItem(item, target);
    }

    discardItem(item) {
        this.scene.discardItem(item);
    }

    sacrificeMember(member, value) {
        if (this.scene.party.removeMember(member)) {
            this.scene.party.gold += value;
            this.logMessage(`[Sacrifice] ${member.name} was sacrificed for ${value}G.`);
            SoundManager.beep(150, 400);
            this.closeInspect();
            this.updateAll();
        }
    }

    confirmEvolution(member, nextBattler, evolutionData) {
        let msg = `Evolve ${member.name} into ${nextBattler.name}?`;
        if (evolutionData.item) {
            const item = this.dataManager.items.find(i => i.id === evolutionData.item);
            if (item) {
                msg += `\nConsumes ${item.name}.`;
            }
        }
        if (evolutionData.gold) {
            msg += `\nCosts ${evolutionData.gold} Gold.`;
        }

        this.confirmWindow.titleEl.textContent = "Confirm Evolution";
        this.confirmWindow.messageEl.innerText = msg;

        this.windowManager.push(this.confirmWindow);

        this.confirmWindow.btnOk.onclick = () => {
            this.windowManager.close(this.confirmWindow);
            this.scene.executeEvolution(member, nextBattler, evolutionData);
        };
        this.confirmWindow.btnCancel.onclick = () => {
            this.windowManager.close(this.confirmWindow);
        };
    }

    executeEvolution(member, nextBattler, evolutionData) {
        this.scene.executeEvolution(member, nextBattler, evolutionData);
    }

    equipItem(member, item) {
        this.ui.equipItem(member, item);
    }

    // equipItem is defined in Scene_Map, but ui calls scene.equipItem.
    // Wait, in MapUIManager, I have `equipItem` method at the bottom?
    // And it calls `this.ui.equipItem`?
    // `this.ui` doesn't exist in MapUIManager!

    // I see a bug in my previous write:
    // equipItem(member, item) {
    //    this.ui.equipItem(member, item);
    // }

    // This looks like garbage copy-paste from Scene_Map delegation.
    // MapUIManager should NOT have `equipItem` method that delegates to itself!
    // Or if it's the UI update method...

    // In Scene_Map.equipItem, it calls `this.ui.openEquipmentScreen(member)`.

    // MapUIManager DOES NOT need an `equipItem` method unless Scene_Map calls it.
    // Does Scene_Map call `this.ui.equipItem`?
    // I checked `scenes.js`:
    // `equipItem(member, item) { ... this.ui.openEquipmentScreen(member); ... }`
    // So Scene_Map calls `openEquipmentScreen`.

    // So `equipItem` method in MapUIManager is likely garbage or should be removed.
    // I'll remove it.
}
