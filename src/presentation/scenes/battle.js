import { Scene_Base } from "./base.js";
import { probabilisticRound, random } from "../../core/utils.js";
import { AudioAdapter } from "../../adapters/audio_adapter.js";
import { SettingsAdapter } from "../../adapters/settings_adapter.js";
import { Window_Battle, Window_Victory, createInteractiveLabel } from "../windows/index.js";
import { BattleSystem } from "../../engine/systems/battle.js";
import { BattleAdapter } from "../../adapters/battle_adapter.js";
import { EncounterAdapter } from "../../adapters/encounter_adapter.js";
import { Registry } from "../../engine/data/registry.js";
import { selectBattleScreen } from "../selectors/battle.js";
import { selectInventory } from "../selectors/inventory.js";
import { selectPartyHUD } from "../selectors/party.js";

/**
 * @class Scene_Battle
 * @description Handles the battle logic and UI.
 * Connects the BattleManager to the Window_Battle and manages user interaction during combat.
 * @extends Scene_Base
 */
export class Scene_Battle extends Scene_Base {
  /**
   * Creates a new Scene_Battle.
   */
  constructor(dataManager, sceneManager, windowManager, party, battleManager, windowLayer, map, tileX, tileY, sharedWindows, encounterData = null, isSneakAttack = false, isPlayerFirstStrike = false) {
    super(dataManager, windowManager);
    this.sceneManager = sceneManager;
    this.party = party;

    // NEW: Bridge DataManager to Registry
    this.populateRegistry(dataManager);

    // NEW: Use BattleAdapter wrapping BattleSystem
    // We ignore the passed battleManager for the core logic but keep it for legacy signature if needed
    // Actually, we replace this.battleManager with our Adapter.
    this.battleSystem = new BattleSystem();
    this.battleManager = new BattleAdapter(party, this.battleSystem);

    this.windowLayer = windowLayer;
    this.map = map;
    this.tileX = tileX;
    this.tileY = tileY;
    this.encounterData = encounterData;
    this.isSneakAttack = isSneakAttack;
    this.isPlayerFirstStrike = isPlayerFirstStrike;
    this.battleBusy = false;
    this.actionTakenThisTurn = false;

    this.battleWindow = new Window_Battle();
    this.windowLayer.addChild(this.battleWindow);

    // Use shared windows from Scene_Map
    this.formationWindow = sharedWindows.formation;
    this.inventoryWindow = sharedWindows.inventory;
    this.partySelectWindow = sharedWindows.partySelect;
    this.confirmEffectWindow = sharedWindows.confirmEffect;
    this.confirmWindow = sharedWindows.confirm;
    this.equipItemSelectWindow = sharedWindows.equipItemSelect;
    this.victoryWindow = new Window_Victory();
    this.windowLayer.addChild(this.victoryWindow);

    this.formationWindow.onUserClose = () => this.windowManager.close(this.formationWindow);
    this.inventoryWindow.onUserClose = () => this.windowManager.close(this.inventoryWindow);
    this.partySelectWindow.onUserClose = () => this.windowManager.close(this.partySelectWindow);
    this.confirmEffectWindow.onUserClose = () => this.windowManager.close(this.confirmEffectWindow);
    this.confirmWindow.onUserClose = () => this.windowManager.close(this.confirmWindow);
    this.victoryWindow.onUserClose = () => {/* Prevent closing victory manually without claim? Or allow and re-open? For now, button handles it. */};

    // Use setHandlers for callback delegation
    this.battleWindow.setHandlers({
        onRound: () => this.resolveBattleRound(),
        onFlee: () => this.attemptFlee(),
        onFormation: () => this.onFormationClick(),
        onItem: () => this.onItemClick(),
        onAutoToggle: (val) => this.toggleAutoBattle(val)
    });
  }

  populateRegistry(dataManager) {
      if (dataManager.skills) Registry.set('skills', dataManager.skills);
      if (dataManager.items) Registry.set('items', dataManager.items);
      if (dataManager.elements) Registry.set('elements', dataManager.elements);
      if (dataManager.states) Registry.set('states', dataManager.states);
  }

  /**
   * Initializes the battle, spawns enemies, and shows the battle window.
   * @method start
   */
  start() {
    this.battleWindow.updateAutoButton(SettingsAdapter.autoBattle);
    this.actionTakenThisTurn = false;

    const floor = this.map.floors[this.map.floorIndex];
    const depth = floor.depth;

    let enemies = [];

    // Check for Boss Floor
    if (this.map.floorIndex === this.map.floors.length - 1) {
        enemies.push(EncounterAdapter.createBoss(depth, this.dataManager));
    } else {
        enemies = EncounterAdapter.generateEnemies(floor, this.encounterData, depth, this.dataManager);
    }

    this.battleManager.setup(enemies, this.tileX, this.tileY, this.isSneakAttack);
    this.battleBusy = false;
    this.battleWindow.logEl.textContent = "";
    this.battleWindow.btnRound.disabled = false;
    this.battleWindow.btnFlee.disabled = false;

    this.battleWindow.logEnemyEmergence(enemies, this.dataManager.terms.battle);
    if (this.isSneakAttack) {
        this.battleWindow.appendLog("Sneak Attack! Enemies have the upper hand.");
        AudioAdapter.play('UI_ERROR');
    } else if (this.isPlayerFirstStrike) {
        this.battleWindow.appendLog("First Strike! You have the upper hand.");
        AudioAdapter.play('UI_SUCCESS');
    }

    // Plan the first round immediately so actions are visible
    this.battleManager.planRound(this.isPlayerFirstStrike);

    this.applyBattleStartPassives();
    this.renderBattleAscii();
    this.windowManager.push(this.battleWindow);
    if (this.sceneManager.previous().hud) {
        this.sceneManager.previous().hud.setMode("Battle");
    }
    AudioAdapter.play('BATTLE_START');
    AudioAdapter.playMusic('battle1');

    if (this.isPlayerFirstStrike) {
        this.resolveBattleRound(true);
    } else if (SettingsAdapter.autoBattle) {
        this.resolveBattleRound();
    }
  }

  toggleAutoBattle(e) {
      // Logic adjusted to handle both direct boolean and event
      const autoBattleEnabled = (typeof e === 'boolean')
          ? SettingsAdapter.setAutoBattle(e)
          : SettingsAdapter.toggleAutoBattle();

      this.battleWindow.updateAutoButton(autoBattleEnabled);
      AudioAdapter.play('UI_SELECT');
      if (autoBattleEnabled && !this.battleBusy && !this.battleManager.isBattleFinished) {
          this.resolveBattleRound();
      }
  }

  onFormationClick() {
      if (this.actionTakenThisTurn || this.battleBusy) return;

      this.formationChanged = false;
      this.windowManager.push(this.formationWindow);

      const partyView = selectPartyHUD(this.party, this.sceneManager.previous().getContext());
      this.formationWindow.refresh(partyView,
          () => {
             this.renderBattleAscii();
          },
          (idx1, idx2) => {
              this.confirmWindow.titleEl.textContent = "Confirm Swap?";
              this.confirmWindow.messageEl.textContent = "Swapping members counts as your turn action.";
              this.windowManager.push(this.confirmWindow);

              this.confirmWindow.btnOk.onclick = () => {
                  this.windowManager.close(this.confirmWindow);

                  if (this.party.reorderMembers(idx1, idx2)) {
                      this.windowManager.close(this.formationWindow);
                      this.actionTakenThisTurn = true;
                      this.disableActionButtons();
                      this.battleWindow.appendLog("Formation changed.");
                      this.renderBattleAscii();
                      AudioAdapter.play('UI_SELECT');
                  }
              };
              this.confirmWindow.btnCancel.onclick = () => {
                  this.windowManager.close(this.confirmWindow);
                  this.formationWindow.selectedSlotIndex = null;
                  this.formationWindow.renderFormationGrid();
              };
          }
      );
  }

  onItemClick() {
      if (this.actionTakenThisTurn || this.battleBusy) return;

      this.windowManager.push(this.inventoryWindow);
      const items = selectInventory(this.party);
      this.inventoryWindow.setup(
          items,
          (item, action) => this.onInventoryAction(item, action),
          (_item) => {}
      );
  }

  async processItemAction(item, target) {
      // Use Summoner as subject if available, otherwise fallback to generic party context
      const subject = this.party.summoner || this.party;

      const action = {
          subject,
          itemId: item.id,
          target
      };

      const events = this.battleManager.executeAction(action);

      if (events.length > 0) {
           await this.animateEvents(events);
           this.renderBattleAscii();
           this.actionTakenThisTurn = true;
           this.disableActionButtons();
      } else {
           this.battleWindow.appendLog("No effect.");
      }
  }

  onInventoryAction(item, action) {
      if (action === 'use') {
          if (item.type === 'equipment') return;

          this.partySelectWindow.setup(this.party, `Use ${item.name} on:`, (target) => {
              this.windowManager.close(this.partySelectWindow);
              this.confirmEffectWindow.setupUse(target, item, () => {
                  this.windowManager.close(this.confirmEffectWindow);
                  this.windowManager.close(this.inventoryWindow);
                  this.processItemAction(item, target);
              });
              this.windowManager.push(this.confirmEffectWindow);
          }, this.sceneManager.previous().getContext());
          this.windowManager.push(this.partySelectWindow);

      } else if (action === 'equip') {
          this.partySelectWindow.setup(this.party, `Equip ${item.name} on:`, (target) => {
              this.windowManager.close(this.partySelectWindow);
              this.checkEquip(target, item);
          }, this.sceneManager.previous().getContext());
          this.windowManager.push(this.partySelectWindow);
      }
  }

  checkEquip(target, item) {
      const oldItem = target.equipmentItem;
      let swapMsg = null;
      if (item && item.equippedMember && item.equippedMember !== target) {
          swapMsg = `Swapping with ${item.equippedMember.name}.`;
      } else if (!item) {
          swapMsg = "Unequipping.";
      }
      this.confirmEffectWindow.setupEquip(target, item, oldItem, "Held Item", () => {
          this.windowManager.close(this.confirmEffectWindow);
          this.windowManager.close(this.inventoryWindow);
          this.equipItem(target, item);
      }, swapMsg);
      this.windowManager.push(this.confirmEffectWindow);
  }

  equipItem(member, item) {
      const result = this.party.equipItem(member, item);
      this.battleWindow.appendLog(result.msg);
      this.renderBattleAscii();
      this.actionTakenThisTurn = true;
      this.disableActionButtons();
      AudioAdapter.play('EQUIP');
  }

  disableActionButtons() {
      this.battleWindow.btnFormation.classList.add('disabled');
      this.battleWindow.btnItem.classList.add('disabled');
  }

  enableActionButtons() {
      this.battleWindow.btnFormation.classList.remove('disabled');
      this.battleWindow.btnItem.classList.remove('disabled');
  }

  /**
   * Closes the battle window and restores the previous mode label.
   * @method stop
   */
  stop() {
    this.windowManager.close(this.battleWindow);
    if (this.sceneManager.previous().hud) {
        this.sceneManager.previous().hud.setMode("Exploration");
    }
  }

  /**
   * Renders the battle interface using the BattleManager's state.
   * @method renderBattleAscii
   */
  renderBattleAscii() {
    if (!this.battleManager) return;
    const screenData = selectBattleScreen(this.party, this.battleManager.enemies, this.battleManager);
    this.battleWindow.refresh(screenData);
  }

  /**
   * Resolves a full round of battle (turns for all participants).
   * Orchestrates the turn flow: Next Battler -> Start Turn -> Action -> Execute -> Animate.
   * @method resolveBattleRound
   * @async
   */
  async resolveBattleRound(_isFirstStrike = false) {
    if (!this.battleManager || this.battleManager.isBattleFinished || this.battleBusy) return;

    this.battleBusy = true;
    this.battleWindow.btnRound.disabled = true;
    this.battleWindow.btnFlee.disabled = true;
    this.disableActionButtons();

    // Note: Actions are already planned by planRound() call at start or end of previous round.

    const delay = (ms) => new Promise((res) => setTimeout(res, ms));
    AudioAdapter.play('UI_SELECT');

    while (true) {
        const battlerContext = this.battleManager.getNextBattler();
        if (!battlerContext) break;

        const startEvents = this.battleManager.startTurn(battlerContext);
        await this.animateEvents(startEvents);
        if (this.battleManager.isBattleFinished) break;

        const action = battlerContext.action;

        if (action) {
             // Animate action preview consumption before execution
             await this.battleWindow.animateActionConsumption(battlerContext.battler);

             const actionEvents = this.battleManager.executeAction(action);
             await this.animateEvents(actionEvents);
        }

        if (this.battleManager.isBattleFinished) break;

        await delay(100);
    }

    this.sceneManager.previous().updateParty();
    this.renderBattleAscii();

    this.actionTakenThisTurn = false;

    if (this.battleManager.isVictoryPending) {
         if (!this.victoryPopupShown) {
             this.showVictoryPopup();
             this.victoryPopupShown = true;
         }
    } else if (!this.battleManager.isBattleFinished) {
      this.battleWindow.btnRound.disabled = false;
      this.battleWindow.btnFlee.disabled = false;

      this.enableActionButtons();

      this.battleWindow.appendLog("Use Resolve Round or Flee.");

      // Plan next round so user can see intentions
      this.battleManager.planRound();
      this.renderBattleAscii();

      this.battleBusy = false;

      if (SettingsAdapter.autoBattle) {
          await delay(500);
          this.resolveBattleRound();
      }
    } else {
        this.battleBusy = false;
    }
  }

  showVictoryPopup() {
      const enemies = this.battleManager.enemies;
      let totalGold = enemies.reduce((sum, e) => sum + (e.gold || 0), 0);
      const totalXp = enemies.reduce((sum, e) => sum + probabilisticRound(e.level * (e.expGrowth * 0.5) + 8), 0);

      this.party.activeMembers.forEach((m) => {
        if (m.hp > 0) {
            const goldBonus = m.getPassiveValue("GOLD_DIGGER");
            if (goldBonus > 0) {
                totalGold += goldBonus;
            }
        }
      });

      const droppedItems = [];
      enemies.forEach(e => {
        if (e.actorData && e.actorData.drops) {
            e.actorData.drops.forEach(drop => {
                if (random() < drop.chance) {
                    const item = this.dataManager.items.find(i => i.id === drop.itemId);
                    if (item) droppedItems.push(item);
                }
            });
        }
      });

      let spoilText = `Gold: +${totalGold}G\nXP: +${totalXp}\n`;
      if (droppedItems.length > 0) {
          spoilText += "\nItems Found:\n";
          droppedItems.forEach(i => spoilText += `- ${i.name}\n`);
      }

      this.victoryData = { totalGold, totalXp, droppedItems };

      this.victoryWindow.setup(spoilText, () => this.claimVictoryRewards());
      this.windowManager.push(this.victoryWindow);
      AudioAdapter.playMusic('victory1');
  }

  claimVictoryRewards() {
      this.windowManager.close(this.victoryWindow);
      const { totalGold, totalXp, droppedItems } = this.victoryData;

      const living = this.party.activeMembers.filter((p) => p.hp > 0);
      const share = living.length > 0 ? Math.max(1, totalXp / living.length) : 0;
      living.forEach((m) => this.sceneManager.previous().gainXp(m, share));

      const reserveShare = Math.max(1, totalXp / 20);
      this.party.reserveMembers.forEach((m) => {
          if (m.hp > 0) this.sceneManager.previous().gainXp(m, reserveShare, true);
      });

      this.party.gold += totalGold;
      this.sceneManager.previous().logMessage(
        `[Battle] Victory! Gained ${totalGold}G and ${totalXp} XP.`
      );

      if (droppedItems.length > 0) {
          droppedItems.forEach(item => this.party.inventory.push(item));
          const names = droppedItems.map(i => i.name).join(", ");
          this.sceneManager.previous().logMessage(`[Battle] Found: ${names}`);
          AudioAdapter.play('ITEM_GET');
      }

      this.sceneManager.previous().updateAll();
      this.applyPostBattlePassives();
      this.sceneManager.previous().checkPermadeath();
      this.clearEnemyTileAfterBattle();

      this.battleManager.isVictoryPending = false;
      this.victoryPopupShown = false;
      this.sceneManager.pop();
      if (this.sceneManager.currentScene() && this.sceneManager.currentScene().setStatus) {
          this.sceneManager.currentScene().setStatus("Victory.");
          this.sceneManager.currentScene().resumeMusic();
      }
  }

  /**
   * Animates a sequence of battle events (damage, healing, messages).
   * @method animateEvents
   * @async
   * @param {Array} events - The list of events to animate.
   */
  async animateEvents(events) {
      const delay = (ms) => new Promise((res) => setTimeout(res, ms));
      let appendNextResult = false;

      for (let i = 0; i < events.length; i++) {
            const event = events[i];

            if (event.battler && event.battler.name) {
                await this.battleWindow.animateBattlerName(event.battler);
            }

            // --- Custom Rich Log Logic ---
            let logged = false;
            if (event.type === 'use_skill' || event.type === 'use_item') {
                if (event.item) {
                     const frag = document.createDocumentFragment();
                     frag.appendChild(document.createTextNode(`${event.battler.name} uses `));

                     // Use 'skill' or 'item' based on type
                     const itemType = event.type === 'use_skill' ? 'skill' : 'item';
                     const label = createInteractiveLabel(event.item, itemType);
                     // Slightly customize label style for inline flow
                     label.style.display = "inline-flex";
                     label.style.verticalAlign = "middle";
                     label.style.margin = "0 4px";

                     frag.appendChild(label);

                     if (event.type === 'use_item' && event.msg.includes(' on ')) {
                          // Try to parse target name from msg if target obj not in event (event has battler but target implied)
                          // Actually event usually has NO target property for 'use_skill' in battle system (checked code).
                          // Wait, executeSkill/Item does not attach 'target' to the 'use_skill' event object explicitly!
                          // But msg says "... on Target".
                          // Let's rely on extracting target name from msg or modifying system again (too risky/churny).
                          // Or just append the rest of the message.
                          // "X uses Y!" -> We just replaced "X uses Y".
                          // "X uses Y on Z." -> We replace "X uses Y".
                          // Let's verify msg format.
                          // Skill: `${battler.name} uses ${skillName}!`
                          // Item: `${subject.name} uses ${item.name} on ${target.name}.`

                          if (event.type === 'use_item') {
                              const suffix = event.msg.substring(event.msg.indexOf(` on `));
                              frag.appendChild(document.createTextNode(suffix));
                          } else {
                              frag.appendChild(document.createTextNode("!"));
                          }
                     } else {
                          frag.appendChild(document.createTextNode("!"));
                     }

                     this.battleWindow.appendLog(frag);
                     logged = true;
                }

                // Look ahead logic (unchanged)
                let resultCount = 0;
                for (let j = i + 1; j < events.length; j++) {
                    const nextEvent = events[j];
                    if (nextEvent.type === 'use_skill' || nextEvent.type === 'use_item') break;
                    if (nextEvent.msg && nextEvent.msg.startsWith('  ')) {
                        resultCount++;
                    }
                }
                appendNextResult = (resultCount === 1);
            }
            // -----------------------------

            if (event.msg && !logged) {
                const isDependentResult = event.msg.startsWith('  ');
                const priority = isDependentResult ? 'low' : undefined;
                const trimmedMsg = event.msg.trim();

                if (isDependentResult && appendNextResult) {
                     this.battleWindow.appendToLastLog(trimmedMsg, { priority });
                     appendNextResult = false; // Only append the first one
                } else {
                     this.battleWindow.appendLog(isDependentResult && priority === 'low' ? trimmedMsg : event.msg, { priority });
                }
            }

            let targetOldHp = event.target ? event.target.hp : 0;
            let targetNewHp = event.target ? event.target.hp : 0;

            if (event.hpBefore !== undefined) {
                targetOldHp = event.hpBefore;
                targetNewHp = event.hpAfter;
            }
            if (event.type === 'passive_drain' || event.type === 'hp_drain') {
                 targetOldHp = event.hpBeforeTarget;
                 targetNewHp = event.hpAfterTarget;
            }

            if (event.type === 'damage' && event.target) {
                this.battleWindow.animateBattler(event.target, 'flash');

                if (event.isCritical) {
                    this.battleWindow.logEl.classList.add('flash');
                    setTimeout(() => {
                        this.battleWindow.logEl.classList.remove('flash');
                    }, 200);
                    AudioAdapter.play('UI_ERROR');
                }

                await this.battleWindow.animateBattleHpGauge(event.target, targetOldHp, targetNewHp);

                if (targetNewHp <= 0) {
                     await this.battleWindow.playAnimation(event.target, 'death', this.dataManager);
                     this.renderBattleAscii();
                }

            } else if (event.type === 'heal' && event.target) {
                if (event.animation) {
                     await this.battleWindow.playAnimation(event.target, event.animation, this.dataManager);
                }
                await this.battleWindow.animateBattleHpGauge(event.target, targetOldHp, targetNewHp);

            } else if (event.type === 'passive_drain' || event.type === 'hp_drain') {
                this.battleWindow.animateBattler(event.target, 'flash');
                await this.battleWindow.animateBattleHpGauge(event.target, targetOldHp, targetNewHp);
                if (event.source) {
                    await this.battleWindow.animateBattleHpGauge(event.source, event.hpBeforeSource, event.hpAfterSource);
                }

            } else if (event.type === 'end') {
                if (event.result === 'defeat') {
                    if (this.sceneManager.previous().logMessage) {
                         this.sceneManager.previous().logMessage(this.dataManager.terms.log.party_falls);
                    }
                    if (this.sceneManager.previous().runActive !== undefined) {
                         this.sceneManager.previous().runActive = false;
                    }
                }
            }

            await delay(300);
      }
  }

  /**
   * Applies passive effects that trigger after a battle ends (e.g., healing).
   * @method applyPostBattlePassives
   */
  applyPostBattlePassives() {
    this.party.members.forEach((member) => {
      if (member.hp > 0) {
        const heal = member.getPassiveValue("POST_BATTLE_HEAL");
        if (heal > 0) {
          this.party.members.forEach((m) => {
            if (m.hp > 0) {
              m.hp = Math.min(m.maxHp, m.hp + heal);
            }
          });
          this.sceneManager.previous().logMessage(
            `[Passive] ${member.name} heals the party for ${heal} HP.`
          );
        }
      }
    });
    this.sceneManager.previous().updateParty();
  }

  /**
   * Applies passive effects that trigger at the start of a battle.
   * @method applyBattleStartPassives
   */
  applyBattleStartPassives() {
    this.party.members.forEach((member) => {
      if (member.hp > 0) {
        const damage = member.getPassiveValue("BATTLE_START_DAMAGE");
        if (damage > 0) {
          const target = this.battleManager.enemies.find((e) => e.hp > 0);
          if (target) {
            target.hp = Math.max(0, target.hp - damage);
            this.battleWindow.appendLog(
              `[Passive] ${member.name} hits ${target.name} for ${damage}.`
            );
          }
        }
      }
    });
  }

  /**
   * Attempts to flee from the battle based on party stats.
   * @method attemptFlee
   */
  attemptFlee() {
    if (random() < this.sceneManager.previous().getFleeChance()) {
      this.sceneManager.previous().logMessage("[Battle] You successfully fled!");
      AudioAdapter.play('ESCAPE');
      this.sceneManager.pop();
      if (this.sceneManager.currentScene().resumeMusic) {
          this.sceneManager.currentScene().resumeMusic();
      }
    } else {
      this.battleWindow.appendLog("You failed to flee!");
      AudioAdapter.play('UI_ERROR');
    }
  }

  /**
   * Removes the enemy marker from the map after a victory.
   * @method clearEnemyTileAfterBattle
   */
  clearEnemyTileAfterBattle() {
    if (!this.battleManager) return;
    const { tileX, tileY } = this.battleManager;
    this.map.removeEvent(this.map.floorIndex, tileX, tileY);
    this.map.revealAroundPlayer();
    this.sceneManager.previous().updateGrid();
  }
}
