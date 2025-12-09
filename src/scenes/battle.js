import { Scene_Base } from "./base.js";
import { Game_Battler, Game_Action } from "../objects/objects.js";
import { randInt, pickWeighted, probabilisticRound } from "../core/utils.js";
import { SoundManager, ConfigManager } from "../managers/index.js";
import { Window_Battle, Window_Victory, Window_Command } from "../windows/index.js";

export class Scene_Battle extends Scene_Base {
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

    this.battleWindow = new Window_Battle();
    this.windowLayer.addChild(this.battleWindow);

    this.formationWindow = sharedWindows.formation;
    this.inventoryWindow = sharedWindows.inventory;
    this.partySelectWindow = sharedWindows.partySelect;
    this.confirmEffectWindow = sharedWindows.confirmEffect;
    this.confirmWindow = sharedWindows.confirm;
    this.victoryWindow = new Window_Victory();
    this.windowLayer.addChild(this.victoryWindow);

    // CTB Windows
    this.commandWindow = new Window_Command();
    this.windowLayer.addChild(this.commandWindow);

    this.skillWindow = new Window_Command();
    this.windowLayer.addChild(this.skillWindow);

    this.targetWindow = new Window_Command();
    this.windowLayer.addChild(this.targetWindow);

    this.formationWindow.onUserClose = () => this.windowManager.close(this.formationWindow);
    this.inventoryWindow.onUserClose = () => this.windowManager.close(this.inventoryWindow);
    this.partySelectWindow.onUserClose = () => this.windowManager.close(this.partySelectWindow);
    this.confirmEffectWindow.onUserClose = () => this.windowManager.close(this.confirmEffectWindow);
    this.confirmWindow.onUserClose = () => this.windowManager.close(this.confirmWindow);

    this.commandWindow.onUserClose = () => {};
    this.skillWindow.onUserClose = () => {
        this.windowManager.close(this.skillWindow);
        this.windowManager.push(this.commandWindow);
    };
    this.targetWindow.onUserClose = () => {
        this.windowManager.close(this.targetWindow);
        this.windowManager.push(this.commandWindow);
    };

    this.battleWindow.setHandlers({
        onRound: () => {},
        onFlee: () => {},
        onFormation: () => {},
        onItem: () => {},
        onAutoToggle: (val) => this.toggleAutoBattle(val)
    });
  }

  start() {
    this.battleWindow.updateAutoButton(ConfigManager.autoBattle);

    const floor = this.map.floors[this.map.floorIndex];
    const depth = floor.depth;
    const actorTemplates = this.dataManager.actors;
    let enemies = [];

    // Encounter Setup
    if (this.map.floorIndex === this.map.floors.length - 1) {
       const bossId = this.map.floorIndex === 0 ? "klikk" : "seymour";
       const bossTpl = actorTemplates.find(a => a.id === bossId);
       if (bossTpl) enemies.push(new Game_Battler(bossTpl, depth, true));
       else {
           const bossHp = 40 + (depth - 3) * 5;
           enemies.push(new Game_Battler({
                name: "Eternal Warden", role: "Boss", maxHp: bossHp, elements: ["Black"], skills: ["attack"], gold: 100
           }, depth, true));
       }
    } else {
        if (this.encounterData) {
            let encId = typeof this.encounterData === 'string' ? this.encounterData : this.encounterData.id;
            if (encId) {
                 const tpl = actorTemplates.find(a => a.id === encId);
                 if (tpl) enemies.push(new Game_Battler(tpl, depth, true));
            } else if (Array.isArray(this.encounterData)) {
                this.encounterData.forEach(eConfig => {
                     const tpl = actorTemplates.find(a => a.id === eConfig.id);
                     if (tpl) enemies.push(new Game_Battler(tpl, depth, true));
                });
            }
        }
        if (enemies.length === 0) {
              if (floor.encounters && floor.encounters.length > 0) {
                const maxEnemies = this.map.floorIndex === 0 ? 2 : 3;
                const enemyCount = randInt(1, maxEnemies);
                for (let i = 0; i < enemyCount; i++) {
                    const encounter = pickWeighted(floor.encounters);
                    if (encounter) {
                        const tpl = actorTemplates.find(a => a.id === encounter.id);
                        if (tpl) enemies.push(new Game_Battler(tpl, depth, true));
                    }
                }
              }
        }
    }
    if (enemies.length === 0) {
        const tpl = actorTemplates.find(a => a.id === 'sinscale');
        enemies.push(new Game_Battler(tpl || { name: 'Sinscale', maxHp: 50 }, depth, true));
    }

    this.battleManager.setup(enemies, this.tileX, this.tileY, this.isSneakAttack);
    this.battleWindow.logEl.textContent = "";
    this.battleWindow.logEnemyEmergence(enemies, this.dataManager.terms.battle);
    this.renderBattleAscii();
    this.windowManager.push(this.battleWindow);
    document.getElementById("mode-label").textContent = "Battle";
    SoundManager.play('BATTLE_START');
    SoundManager.playMusic('battle1');

    this.updateBattle();
  }

  toggleAutoBattle(e) {
      if (typeof e === 'boolean') ConfigManager.autoBattle = e;
      else ConfigManager.autoBattle = !ConfigManager.autoBattle;
      ConfigManager.save();
      this.battleWindow.updateAutoButton(ConfigManager.autoBattle);

      if (ConfigManager.autoBattle && !this.battleBusy && !this.battleManager.isBattleFinished) {
          // If enabled while waiting for input, resume battle flow
          // Close any open command windows
          if (this.windowManager.stack.includes(this.commandWindow)) this.windowManager.close(this.commandWindow);
          if (this.windowManager.stack.includes(this.skillWindow)) this.windowManager.close(this.skillWindow);
          if (this.windowManager.stack.includes(this.targetWindow)) this.windowManager.close(this.targetWindow);
          if (this.windowManager.stack.includes(this.inventoryWindow)) this.windowManager.close(this.inventoryWindow);

          this.updateBattle();
      }
  }

  stop() {
    this.windowManager.close(this.battleWindow);
    document.getElementById("mode-label").textContent = "Exploration";
  }

  renderBattleAscii() {
    if (!this.battleManager) return;
    const enemies = this.battleManager.enemies;
    this.battleWindow.refresh(enemies, this.party.slots.slice(0, 4), this.party);
  }

  async updateBattle() {
      if (this.battleManager.isBattleFinished) {
          if (this.battleManager.isVictoryPending && !this.victoryPopupShown) {
               this.showVictoryPopup();
               this.victoryPopupShown = true;
          }
          return;
      }

      const battlerContext = this.battleManager.getNextBattler();
      if (!battlerContext) {
          setTimeout(() => this.updateBattle(), 100);
          return;
      }

      // Turn Order UI
      if (this.battleWindow.updateTurnOrder) {
          this.battleWindow.updateTurnOrder(this.battleManager.getTurnOrderPreview());
      }

      const events = this.battleManager.startTurn(battlerContext);
      await this.animateEvents(events);

      if (this.battleManager.isBattleFinished) {
           this.updateBattle();
           return;
      }

      const { battler, isEnemy } = battlerContext;

      if (!isEnemy) {
          // Player Turn
          if (ConfigManager.autoBattle) {
              const action = this.battleManager.getAIAction(battlerContext);
              await this.executeAction(action);
              // Small delay to make auto-battle watchable
              setTimeout(() => this.updateBattle(), 300);
          } else {
              this.currentActor = battler;
              this.showCommandWindow();
          }
      } else {
          // Enemy Turn
          await this.wait(300);
          const action = this.battleManager.getAIAction(battlerContext);
          await this.executeAction(action);
          setTimeout(() => this.updateBattle(), 100);
      }
  }

  showCommandWindow() {
      this.battleBusy = false; // Allow input
      const commands = [
          { name: 'Attack', key: 'attack' },
          { name: 'Skill', key: 'skill' },
          { name: 'Item', key: 'item' },
          { name: 'Flee', key: 'flee' }
      ];
      if (this.currentActor.overdrive >= 100) {
          commands.unshift({ name: 'Overdrive', key: 'overdrive' });
      }

      this.commandWindow.setup(commands, (key) => this.onCommand(key));
      this.windowManager.push(this.commandWindow);
      this.battleWindow.appendLog(`> ${this.currentActor.name}'s turn.`);
  }

  onCommand(key) {
      if (key === 'attack') {
          this.showEnemySelection((target) => {
              const action = new Game_Action(this.currentActor);
              action.setAttack();
              action.target = target;
              this.windowManager.close(this.targetWindow);
              this.windowManager.close(this.commandWindow);
              this.executePlayerAction(action);
          }, () => {
              this.windowManager.close(this.targetWindow);
              this.windowManager.push(this.commandWindow);
          });
      } else if (key === 'skill') {
          this.showSkillSelection();
      } else if (key === 'item') {
          this.showItemSelection();
      } else if (key === 'flee') {
          this.windowManager.close(this.commandWindow);
          this.attemptFlee();
      }
  }

  showEnemySelection(onSelect, onCancel) {
      const targets = this.battleManager.enemies.filter(e => e.hp > 0);
      const commands = targets.map((e, i) => ({ name: `${e.name} (${e.hp})`, key: i, data: e }));

      this.targetWindow.setup(commands, (key) => {
          onSelect(commands[key].data);
      });
      this.targetWindow.onUserClose = () => {
          if (onCancel) onCancel();
      };

      this.windowManager.close(this.commandWindow);
      this.windowManager.push(this.targetWindow);
  }

  showSkillSelection() {
      const skills = this.currentActor.skills.map(id => this.dataManager.skills[id]).filter(s => s);
      const commands = skills.map(s => ({ name: `${s.name} (${s.mpCost || 0} MP)`, key: s.id }));
      commands.push({ name: 'Back', key: 'cancel' });

      this.skillWindow.setup(commands, (key) => {
          if (key === 'cancel') {
              this.windowManager.close(this.skillWindow);
              this.windowManager.push(this.commandWindow);
              return;
          }
          const skill = this.dataManager.skills[key];
          if (skill.target.includes('ally')) {
              this.showAllySelection(skill, (target) => {
                   const action = new Game_Action(this.currentActor);
                   action.setSkill(key, this.dataManager);
                   action.target = target;
                   this.windowManager.close(this.partySelectWindow);
                   this.windowManager.close(this.skillWindow);
                   this.windowManager.close(this.commandWindow);
                   this.executePlayerAction(action);
              });
          } else {
              this.showEnemySelection((target) => {
                   const action = new Game_Action(this.currentActor);
                   action.setSkill(key, this.dataManager);
                   action.target = target;
                   this.windowManager.close(this.targetWindow);
                   this.windowManager.close(this.skillWindow);
                   this.windowManager.close(this.commandWindow);
                   this.executePlayerAction(action);
              }, () => {
                  this.windowManager.close(this.targetWindow);
                  this.windowManager.push(this.skillWindow);
              });
          }
      });

      this.windowManager.close(this.commandWindow);
      this.windowManager.push(this.skillWindow);
  }

  showAllySelection(skill, onSelect) {
      this.partySelectWindow.setup(this.party, `Cast ${skill.name} on:`, (target) => {
          onSelect(target);
      }, this.sceneManager.previous().getContext());
      this.windowManager.push(this.partySelectWindow);
  }

  showItemSelection() {
      this.windowManager.push(this.inventoryWindow);
      this.inventoryWindow.setup(
          this.party,
          (item, action) => {
              if (action === 'use') {
                   this.partySelectWindow.setup(this.party, `Use ${item.name} on:`, (target) => {
                       const act = new Game_Action(this.currentActor);
                       act.setItem(item.id, this.dataManager);
                       act.target = target;
                       this.windowManager.close(this.partySelectWindow);
                       this.windowManager.close(this.inventoryWindow);
                       this.windowManager.close(this.commandWindow);
                       this.executePlayerAction(act);
                   });
                   this.windowManager.push(this.partySelectWindow);
              }
          },
          () => {}
      );
      this.windowManager.close(this.commandWindow);
  }

  async executePlayerAction(action) {
      await this.executeAction(action);
      setTimeout(() => this.updateBattle(), 100);
  }

  async executeAction(action) {
      const events = this.battleManager.executeAction(action);
      await this.animateEvents(events);
      this.renderBattleAscii();
  }

  animateEvents(events) {
      const delay = (ms) => new Promise((res) => setTimeout(res, ms));
      return new Promise(async (resolve) => {
        for (let i = 0; i < events.length; i++) {
            const event = events[i];
            if (event.battler && event.battler.name) {
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
            if (event.type === 'damage' && event.target) {
                this.battleWindow.animateBattler(event.target, 'flash', this.battleManager.enemies, this.party.slots.slice(0,4));
                await this.battleWindow.animateBattleHpGauge(event.target, targetOldHp, targetNewHp, this.battleManager.enemies, this.party.slots.slice(0,4));
                if (targetNewHp <= 0) {
                     await this.battleWindow.playAnimation(event.target, 'death', this.dataManager, this.battleManager.enemies, this.party.slots.slice(0,4));
                }
            } else if (event.type === 'heal' && event.target) {
                await this.battleWindow.animateBattleHpGauge(event.target, targetOldHp, targetNewHp, this.battleManager.enemies, this.party.slots.slice(0,4));
            }
            await delay(300);
        }
        this.renderBattleAscii();
        resolve();
      });
  }

  attemptFlee() {
      if (Math.random() < 0.8) {
          this.battleWindow.appendLog("Escaped!");
          SoundManager.play('ESCAPE');
          setTimeout(() => {
              this.sceneManager.pop();
              if (this.sceneManager.currentScene().resumeMusic) this.sceneManager.currentScene().resumeMusic();
          }, 500);
      } else {
          this.battleWindow.appendLog("Couldn't escape!");
          this.battleManager._applyTurnDelay(this.currentActor, new Game_Action(this.currentActor)); // Pass dummy action for default delay
          setTimeout(() => this.updateBattle(), 500);
      }
  }

  showVictoryPopup() {
       const enemies = this.battleManager.enemies;
      let totalGold = enemies.reduce((sum, e) => sum + (e.gold || 0), 0);
      const totalXp = enemies.reduce((sum, e) => sum + probabilisticRound(e.level * (e.expGrowth * 0.5) + 8), 0);

      const living = this.party.activeMembers.filter((p) => p.hp > 0);
      const share = living.length > 0 ? Math.max(1, totalXp / living.length) : 0;
      living.forEach((m) => this.sceneManager.previous().gainXp(m, share));
      this.party.gold += totalGold;

      let spoilText = `Victory!\nGold: +${totalGold}G\nXP: +${totalXp}`;
      this.victoryWindow.setup(spoilText, () => {
          this.windowManager.close(this.victoryWindow);
          this.sceneManager.pop();
          this.battleManager.isVictoryPending = false;
          if (this.sceneManager.currentScene().resumeMusic) this.sceneManager.currentScene().resumeMusic();
      });
      this.windowManager.push(this.victoryWindow);
      SoundManager.playMusic('victory1');
  }

  wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
}
