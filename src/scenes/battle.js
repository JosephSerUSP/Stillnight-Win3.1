import { Scene_Base } from "./base.js";
import { Game_Battler } from "../objects/objects.js";
import { randInt, pickWeighted, probabilisticRound } from "../core/utils.js";
import { SoundManager, ConfigManager } from "../managers/index.js";
import { Window_Battle, Window_Victory } from "../windows/index.js";

/**
 * @class Scene_Battle
 * @description Handles the battle logic and UI.
 * Connects the BattleManager to the Window_Battle and manages user interaction during combat.
 * @extends Scene_Base
 */
export class Scene_Battle extends Scene_Base {
  /**
   * Creates a new Scene_Battle.
   * @param {import("../managers/index.js").DataManager} dataManager - The data manager.
   * @param {import("../managers/index.js").SceneManager} sceneManager - The scene manager.
   * @param {import("../windows/index.js").WindowManager} windowManager - The window manager.
   * @param {import("../objects/objects.js").Game_Party} party - The player's party.
   * @param {import("../managers/index.js").BattleManager} battleManager - The battle manager.
   * @param {import("../windows/index.js").WindowLayer} windowLayer - The window layer to attach the battle window to.
   * @param {import("../objects/objects.js").Game_Map} map - The game map.
   * @param {number} tileX - The X coordinate of the battle on the map.
   * @param {number} tileY - The Y coordinate of the battle on the map.
   * @param {Object} [encounterData] - Specific encounter data for this battle.
   * @param {boolean} [isSneakAttack] - Whether this is a sneak attack.
   */
  constructor(dataManager, sceneManager, windowManager, party, battleManager, windowLayer, map, tileX, tileY, sharedWindows, encounterData = null, isSneakAttack = false, isPlayerFirstStrike = false) {
    super(dataManager, windowManager);
    this.sceneManager = sceneManager;
    this.party = party;
    this.battleManager = battleManager;
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

  /**
   * Initializes the battle, spawns enemies, and shows the battle window.
   * @method start
   */
  start() {
    this.battleWindow.updateAutoButton(ConfigManager.autoBattle);
    this.actionTakenThisTurn = false;

    const floor = this.map.floors[this.map.floorIndex];
    const depth = floor.depth;

    let enemies = [];
    const actorTemplates = this.dataManager.actors;

    if (this.map.floorIndex === this.map.floors.length - 1) {
      const bossHp = 40 + (depth - 3) * 5;
      enemies.push(new Game_Battler({
        name: "🌑 Eternal Warden",
        role: "Boss",
        maxHp: bossHp,
        elements: ["Black"],
        skills: ["shadowClaw", "infernalPact"],
        gold: 100,
        expGrowth: 10,
      }, depth, true));
    } else {
        // Use provided encounter data if available
        if (this.encounterData) {
            let encId = typeof this.encounterData === 'string' ? this.encounterData : this.encounterData.id;

            if (encId) {
                 const maxEnemies = this.map.floorIndex === 0 ? 2 : 3;
                 const enemyCount = randInt(1, maxEnemies);
                 for (let i = 0; i < enemyCount; i++) {
                     const tpl = actorTemplates.find(a => a.id === encId);
                     if (tpl) enemies.push(new Game_Battler(tpl, depth, true));
                 }
            } else if (Array.isArray(this.encounterData)) {
                this.encounterData.forEach(eConfig => {
                     const tpl = actorTemplates.find(a => a.id === eConfig.id);
                     if (tpl) enemies.push(new Game_Battler(tpl, depth, true));
                });
            }
        }

        if (enemies.length === 0) {
              // Use encounter table if available
              if (floor.encounters && floor.encounters.length > 0) {
                const maxEnemies = this.map.floorIndex === 0 ? 2 : 3;
                const enemyCount = randInt(1, maxEnemies);
                for (let i = 0; i < enemyCount; i++) {
                    const encounter = pickWeighted(floor.encounters);
                    if (encounter) {
                        const tpl = actorTemplates.find(a => a.id === encounter.id);
                        if (tpl) {
                            enemies.push(new Game_Battler(tpl, depth, true));
                        } else {
                            console.warn(`Encounter ID ${encounter.id} not found in actors.`);
                            const randomTpl = actorTemplates[randInt(0, actorTemplates.length - 1)];
                            enemies.push(new Game_Battler(randomTpl, depth, true));
                        }
                    }
                }
              } else {
                const maxEnemies = this.map.floorIndex === 0 ? 2 : 3;
                const enemyCount = randInt(1, maxEnemies);
                for (let i = 0; i < enemyCount; i++) {
                  const tpl = actorTemplates[randInt(0, actorTemplates.length - 1)];
                  enemies.push(new Game_Battler(tpl, depth, true));
                }
              }
        }
    }

    this.battleManager.setup(enemies, this.tileX, this.tileY, this.isSneakAttack);
    this.battleBusy = false;
    this.battleWindow.logEl.textContent = "";
    this.battleWindow.btnRound.disabled = false;
    this.battleWindow.btnFlee.disabled = false;

    this.battleWindow.logEnemyEmergence(enemies, this.dataManager.terms.battle);
    if (this.isSneakAttack) {
        this.battleWindow.appendLog("Sneak Attack! Enemies have the upper hand.");
        SoundManager.play('UI_ERROR');
    } else if (this.isPlayerFirstStrike) {
        this.battleWindow.appendLog("First Strike! You have the upper hand.");
        SoundManager.play('UI_SUCCESS');
    }

    this.applyBattleStartPassives();
    this.renderBattleAscii();
    this.windowManager.push(this.battleWindow);
    document.getElementById("mode-label").textContent = "Battle";
    SoundManager.play('BATTLE_START');
    SoundManager.playMusic('battle1');

    if (this.isPlayerFirstStrike) {
        this.resolveBattleRound(true);
    } else if (ConfigManager.autoBattle) {
        this.resolveBattleRound();
    }
  }

  toggleAutoBattle(e) {
      // Logic adjusted to handle both direct boolean and event
      if (typeof e === 'boolean') {
          ConfigManager.autoBattle = e;
      } else {
          // Fallback if event is passed directly (though handler wrapper handles this)
          ConfigManager.autoBattle = !ConfigManager.autoBattle;
      }
      ConfigManager.save();
      this.battleWindow.updateAutoButton(ConfigManager.autoBattle);
      SoundManager.play('UI_SELECT');
      if (ConfigManager.autoBattle && !this.battleBusy && !this.battleManager.isBattleFinished) {
          this.resolveBattleRound();
      }
  }

  onFormationClick() {
      if (this.actionTakenThisTurn || this.battleBusy) return;

      this.formationChanged = false;
      this.windowManager.push(this.formationWindow);

      this.formationWindow.refresh(this.party,
          () => {
             this.renderBattleAscii();
          },
          this.sceneManager.previous().getContext(),
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
                      SoundManager.play('UI_SELECT');
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
      this.inventoryWindow.setup(
          this.party,
          (item, action) => this.onInventoryAction(item, action),
          (item) => {}
      );
  }

  onInventoryAction(item, action) {
      if (action === 'use') {
          if (item.type === 'equipment') return;

          this.partySelectWindow.setup(this.party, `Use ${item.name} on:`, (target) => {
              this.windowManager.close(this.partySelectWindow);
              this.confirmEffectWindow.setupUse(target, item, () => {
                  this.windowManager.close(this.confirmEffectWindow);
                  this.windowManager.close(this.inventoryWindow);

                  const result = this.party.useItem(item, target, this.dataManager);
                  if (result.success) {
                      this.battleWindow.appendLog(`[Item] Used ${item.name} on ${target.name}.`);
                      this.renderBattleAscii();
                      this.actionTakenThisTurn = true;
                      this.disableActionButtons();
                      SoundManager.play('HEAL');
                  } else {
                       this.battleWindow.appendLog(result.msg);
                  }
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
      SoundManager.play('EQUIP');
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
    document.getElementById("mode-label").textContent = "Exploration";
  }

  /**
   * Renders the battle interface using the BattleManager's state.
   * @method renderBattleAscii
   */
  renderBattleAscii() {
    if (!this.battleManager) return;
    const enemies = this.battleManager.enemies;
    this.battleWindow.refresh(enemies, this.party.slots.slice(0, 4));
  }

  /**
   * Resolves a full round of battle (turns for all participants).
   * Orchestrates the turn flow: Next Battler -> Start Turn -> Action -> Execute -> Animate.
   * @method resolveBattleRound
   * @async
   */
  async resolveBattleRound(isFirstStrike = false) {
    if (!this.battleManager || this.battleManager.isBattleFinished || this.battleBusy) return;

    this.battleBusy = true;
    this.battleWindow.btnRound.disabled = true;
    this.battleWindow.btnFlee.disabled = true;
    this.disableActionButtons();

    this.battleManager.startRound(isFirstStrike);

    const delay = (ms) => new Promise((res) => setTimeout(res, ms));
    SoundManager.play('UI_SELECT');

    while (true) {
        const battlerContext = this.battleManager.getNextBattler();
        if (!battlerContext) break;

        const startEvents = this.battleManager.startTurn(battlerContext);
        await this.animateEvents(startEvents);
        if (this.battleManager.isBattleFinished) break;

        const action = battlerContext.action;

        if (action) {
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

      this.battleBusy = false;

      if (ConfigManager.autoBattle) {
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
                if (Math.random() < drop.chance) {
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
      SoundManager.playMusic('victory1');
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
          SoundManager.play('ITEM_GET');
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

      for (const event of events) {
            if (event.battler) {
                await this.battleWindow.animateBattlerName(event.battler, this.battleManager.enemies, this.party.slots.slice(0,4));
            }

            if (event.msg) {
                this.battleWindow.appendLog(event.msg);
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
                this.battleWindow.animateBattler(event.target, 'flash', this.battleManager.enemies, this.party.slots.slice(0,4));

                if (event.isCritical) {
                    this.battleWindow.logEl.classList.add('flash');
                    setTimeout(() => {
                        this.battleWindow.logEl.classList.remove('flash');
                    }, 200);
                    SoundManager.play('UI_ERROR');
                }

                await this.battleWindow.animateBattleHpGauge(event.target, targetOldHp, targetNewHp, this.battleManager.enemies, this.party.slots.slice(0,4));

                if (targetNewHp <= 0) {
                     await this.battleWindow.playAnimation(event.target, 'death', this.dataManager, this.battleManager.enemies, this.party.slots.slice(0,4));
                }

            } else if (event.type === 'heal' && event.target) {
                if (event.animation) {
                     await this.battleWindow.playAnimation(event.target, event.animation, this.dataManager, this.battleManager.enemies, this.party.slots.slice(0,4));
                }
                await this.battleWindow.animateBattleHpGauge(event.target, targetOldHp, targetNewHp, this.battleManager.enemies, this.party.slots.slice(0,4));

            } else if (event.type === 'passive_drain' || event.type === 'hp_drain') {
                this.battleWindow.animateBattler(event.target, 'flash', this.battleManager.enemies, this.party.slots.slice(0,4));
                await this.battleWindow.animateBattleHpGauge(event.target, targetOldHp, targetNewHp, this.battleManager.enemies, this.party.slots.slice(0,4));
                if (event.source) {
                    await this.battleWindow.animateBattleHpGauge(event.source, event.hpBeforeSource, event.hpAfterSource, this.battleManager.enemies, this.party.slots.slice(0,4));
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
    if (Math.random() < this.sceneManager.previous().getFleeChance()) {
      this.sceneManager.previous().logMessage("[Battle] You successfully fled!");
      SoundManager.play('ESCAPE');
      this.sceneManager.pop();
      if (this.sceneManager.currentScene().resumeMusic) {
          this.sceneManager.currentScene().resumeMusic();
      }
    } else {
      this.battleWindow.appendLog("You failed to flee!");
      SoundManager.play('UI_ERROR');
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
