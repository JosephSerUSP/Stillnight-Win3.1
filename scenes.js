import { Game_Map, Game_Party, Game_Battler, Game_Event } from "./objects.js";
import { Game_Interpreter } from "./interpreter.js";
import { randInt, shuffleArray, getPrimaryElements, elementToAscii, elementToIconId, getIconStyle, pickWeighted, evaluateFormula, probabilisticRound } from "./core.js";
import { BattleManager, SoundManager, ThemeManager } from "./managers.js";
import {
  Window_Battle,
  Window_Shop,
  Window_Event,
  Window_Recruit,
  Window_Formation,
  Window_Inventory,
  Window_Inspect,
  Window_Confirm,
  Window_Evolution,
  Window_ConfirmEffect,
  Window_PartySelect,
  Window_EquipItemSelect,
  Window_Options,
  Window_Desktop,
  Window_Help,
  WindowLayer,
  createInteractiveLabel,
  createElementIcon,
  createBattlerNameLabel,
  renderCreatureInfo,
  renderElements
} from "./windows.js";
import { tooltip } from "./tooltip.js";

/**
 * @class Scene_Base
 * @description The abstract base class for all game scenes.
 * Manages the data and window managers, and defines the lifecycle methods.
 */
class Scene_Base {
  /**
   * Creates a new Scene_Base.
   * @param {import("./managers.js").DataManager} dataManager - The data manager instance.
   * @param {import("./windows.js").WindowManager} windowManager - The window manager instance.
   */
  constructor(dataManager, windowManager) {
    /**
     * The global data manager.
     * @type {import("./managers.js").DataManager}
     */
    this.dataManager = dataManager;

    /**
     * The global window manager.
     * @type {import("./windows.js").WindowManager}
     */
    this.windowManager = windowManager;
  }

  /**
   * Starts the scene. Called when the scene is pushed onto the stack.
   * @method start
   */
  start() {
    // To be implemented by subclasses
  }

  /**
   * Updates the scene. Called every frame by the scene manager.
   * @method update
   */
  update() {
    // To be implemented by subclasses
  }

  /**
   * Stops the scene. Called when the scene is popped from the stack.
   * @method stop
   */
  stop() {
    // To be implemented by subclasses
  }
}

/**
 * @class Scene_Boot
 * @description The initial scene that loads game data and transitions to the title or map scene.
 * @extends Scene_Base
 */
export class Scene_Boot extends Scene_Base {
    /**
     * Creates a new Scene_Boot.
     * @param {import("./managers.js").DataManager} dataManager - The data manager instance.
     * @param {import("./managers.js").SceneManager} sceneManager - The scene manager instance.
     * @param {import("./windows.js").WindowManager} windowManager - The window manager instance.
     */
    constructor(dataManager, sceneManager, windowManager) {
        super(dataManager, windowManager);
        this.sceneManager = sceneManager;
    }

    /**
     * Loads all necessary data and then pushes the initial game scene (Scene_Map).
     * @method start
     * @async
     */
    async start() {
        await this.dataManager.loadData();
        ThemeManager.init(this.dataManager.themes);
        this.sceneManager.push(new Scene_Map(this.dataManager, this.sceneManager, this.windowManager));
    }
}

/**
 * @class Scene_Battle
 * @description Handles the battle logic and UI.
 * Connects the BattleManager to the Window_Battle and manages user interaction during combat.
 * @extends Scene_Base
 */
export class Scene_Battle extends Scene_Base {
  /**
   * Creates a new Scene_Battle.
   * @param {import("./managers.js").DataManager} dataManager - The data manager.
   * @param {import("./managers.js").SceneManager} sceneManager - The scene manager.
   * @param {import("./windows.js").WindowManager} windowManager - The window manager.
   * @param {import("./objects.js").Game_Party} party - The player's party.
   * @param {import("./managers.js").BattleManager} battleManager - The battle manager.
   * @param {import("./windows.js").WindowLayer} windowLayer - The window layer to attach the battle window to.
   * @param {import("./objects.js").Game_Map} map - The game map.
   * @param {number} tileX - The X coordinate of the battle on the map.
   * @param {number} tileY - The Y coordinate of the battle on the map.
   */
  constructor(dataManager, sceneManager, windowManager, party, battleManager, windowLayer, map, tileX, tileY) {
    super(dataManager, windowManager);
    this.sceneManager = sceneManager;
    this.party = party;
    this.battleManager = battleManager;
    this.windowLayer = windowLayer;
    this.map = map;
    this.tileX = tileX;
    this.tileY = tileY;
    this.battleBusy = false;

    this.battleWindow = new Window_Battle();
    this.windowLayer.addChild(this.battleWindow);

    this.battleWindow.btnRound.addEventListener("click", this.resolveBattleRound.bind(this));
    this.battleWindow.btnFlee.addEventListener("click", this.attemptFlee.bind(this));
    this.battleWindow.btnVictory.addEventListener("click", this.onBattleVictoryClick.bind(this));
  }

  /**
   * Initializes the battle, spawns enemies, and shows the battle window.
   * @method start
   */
  start() {
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
                    // Fallback to random
                    const randomTpl = actorTemplates[randInt(0, actorTemplates.length - 1)];
                    enemies.push(new Game_Battler(randomTpl, depth, true));
                }
            }
        }
      } else {
        // Legacy fallback
        const maxEnemies = this.map.floorIndex === 0 ? 2 : 3;
        const enemyCount = randInt(1, maxEnemies);
        for (let i = 0; i < enemyCount; i++) {
          const tpl = actorTemplates[randInt(0, actorTemplates.length - 1)];
          enemies.push(new Game_Battler(tpl, depth, true));
        }
      }
    }

    this.battleManager.setup(enemies, this.tileX, this.tileY);
    this.battleBusy = false;
    this.battleWindow.logEl.textContent = "";
    this.battleWindow.btnVictory.style.display = "none";
    this.battleWindow.btnRound.disabled = false;
    this.battleWindow.btnFlee.disabled = false;

    this.battleWindow.logEnemyEmergence(enemies, this.dataManager.terms.battle);

    this.applyBattleStartPassives();
    this.renderBattleAscii();
    this.windowManager.push(this.battleWindow);
    document.getElementById("mode-label").textContent = "Battle";
    SoundManager.beep(350, 200);
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
  async resolveBattleRound() {
    if (!this.battleManager || this.battleManager.isBattleFinished || this.battleBusy) return;

    this.battleBusy = true;
    this.battleWindow.btnRound.disabled = true;
    this.battleWindow.btnFlee.disabled = true;

    // Start a new round in the BattleManager
    this.battleManager.startRound();

    const delay = (ms) => new Promise((res) => setTimeout(res, ms));
    SoundManager.beep(300, 80);

    // Loop through turns until the round is complete
    while (true) {
        // 1. Get next battler
        const battlerContext = this.battleManager.getNextBattler();
        if (!battlerContext) break; // Round over

        // 2. Start Turn (Passives)
        const startEvents = this.battleManager.startTurn(battlerContext);
        await this.animateEvents(startEvents);
        if (this.battleManager.isBattleFinished) break;

        // 3. Plan Action (AI for now)
        // Future-Forward: To implement player control, check !battlerContext.isEnemy here.
        // If player, wait for UI input to generate the 'action' object.
        const action = this.battleManager.getAIAction(battlerContext);

        if (action) {
             // 4. Execute Action
             const actionEvents = this.battleManager.executeAction(action);
             await this.animateEvents(actionEvents);
        }

        // If battle finished during this turn, break the loop
        if (this.battleManager.isBattleFinished) break;

        await delay(100);
    }

    this.sceneManager.previous().updateParty();
    this.renderBattleAscii();

    if (this.battleManager.isVictoryPending) {
      this.battleWindow.btnVictory.style.display = "inline-block";
    }

    if (!this.battleManager.isBattleFinished) {
      this.battleWindow.btnRound.disabled = false;
      this.battleWindow.btnFlee.disabled = false;
      this.battleWindow.appendLog("Use Resolve Round or Flee.");
    }

    this.battleBusy = false;
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
                await this.animateBattlerName(event.battler);
            }

            if (event.msg) {
                this.battleWindow.appendLog(event.msg);
            }

            // Determine HP values for animation
            let targetOldHp = event.target ? event.target.hp : 0;
            let targetNewHp = event.target ? event.target.hp : 0;

            if (event.hpBefore !== undefined) {
                targetOldHp = event.hpBefore;
                targetNewHp = event.hpAfter;
            }
            // For passive drain, we have explicit target/source keys
            if (event.type === 'passive_drain') {
                 targetOldHp = event.hpBeforeTarget;
                 targetNewHp = event.hpAfterTarget;
            }

            if (event.type === 'damage' && event.target) {
                this.animateBattler(event.target, 'flash');
                await this.animateBattleHpGauge(event.target, targetOldHp, targetNewHp);

                if (targetNewHp <= 0) {
                     await this.playAnimation(event.target, 'death');
                }

            } else if (event.type === 'heal' && event.target) {
                if (event.animation) {
                     await this.playAnimation(event.target, event.animation);
                }
                await this.animateBattleHpGauge(event.target, targetOldHp, targetNewHp);

            } else if (event.type === 'passive_drain') {
                this.animateBattler(event.target, 'flash');
                await this.animateBattleHpGauge(event.target, targetOldHp, targetNewHp);
                if (event.source) {
                    await this.animateBattleHpGauge(event.source, event.hpBeforeSource, event.hpAfterSource);
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
      this.sceneManager.pop();
    } else {
      this.battleWindow.appendLog("You failed to flee!");
    }
  }

  /**
   * Handles the victory condition, awarding rewards and closing the battle.
   * @method onBattleVictoryClick
   */
  onBattleVictoryClick() {
    if (!this.battleManager || !this.battleManager.isVictoryPending) return;
    const enemies = this.battleManager.enemies;
    let totalGold = enemies.reduce((sum, e) => sum + (e.gold || 0), 0);
    const totalXp = enemies.reduce((sum, e) => sum + probabilisticRound(e.level * (e.expGrowth * 0.5) + 8), 0);

    const living = this.party.activeMembers.filter((p) => p.hp > 0);
    living.forEach((m) => {
      const goldBonus = m.getPassiveValue("GOLD_DIGGER");
      if (goldBonus > 0) {
        totalGold += goldBonus;
        this.sceneManager.previous().logMessage(`[Passive] ${m.name} finds an extra ${goldBonus}G!`);
      }
    });
    const share =
      living.length > 0 ? Math.max(1, totalXp / living.length) : 0;
    living.forEach((m) => this.sceneManager.previous().gainXp(m, share));

    const reserveShare = Math.max(1, totalXp / 20);
    this.party.reserveMembers.forEach((m) => {
        if (m.hp > 0) this.sceneManager.previous().gainXp(m, reserveShare, true);
    });

    this.party.gold += totalGold;
    this.sceneManager.previous().logMessage(
      `[Battle] Victory! Gained ${totalGold}G and ${totalXp} XP.`
    );

    // Process Drops
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

    if (droppedItems.length > 0) {
        droppedItems.forEach(item => this.party.inventory.push(item));
        const names = droppedItems.map(i => i.name).join(", ");
        this.sceneManager.previous().logMessage(`[Battle] Found: ${names}`);
    }

    this.sceneManager.previous().updateAll();

    this.applyPostBattlePassives();

    // Permadeath check
    this.sceneManager.previous().checkPermadeath();

    this.clearEnemyTileAfterBattle();

    this.battleManager.isVictoryPending = false;
    this.battleWindow.btnVictory.style.display = "none";
    this.sceneManager.pop();
    if (this.sceneManager.currentScene() && this.sceneManager.currentScene().setStatus) {
        this.sceneManager.currentScene().setStatus("Victory.");
    }
    SoundManager.beep(900, 200);
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

  _getBattlerContext(battler) {
      const enemyIndex = this.battleManager.enemies.indexOf(battler);
      if (enemyIndex !== -1) return { index: enemyIndex, isEnemy: true };
      const partyIndex = this.party.slots.indexOf(battler);
      if (partyIndex !== -1) return { index: partyIndex, isEnemy: false };
      return null;
  }

  /**
   * Animates the HP gauge of a battler.
   * @param {import("./objects.js").Game_Battler} battler - The battler.
   * @param {number} startHp - HP at start of animation.
   * @param {number} endHp - HP at end of animation.
   * @returns {Promise} Resolves when animation completes.
   */
  animateBattleHpGauge(battler, startHp, endHp) {
    return new Promise((resolve) => {
      const duration = 500;
      const interval = 30;
      let elapsed = 0;

      const ctx = this._getBattlerContext(battler);

      const interpolator = () => {
        elapsed += interval;
        const progress = Math.min(elapsed / duration, 1);
        const currentHp = Math.round(startHp + (endHp - startHp) * progress);

        if (ctx) {
             const hpEl = this.battleWindow.getHpElement(ctx.index, ctx.isEnemy);
             if (hpEl) {
                 hpEl.textContent = this.battleWindow.createHpGauge(currentHp, battler.maxHp);
             }
        }

        if (progress < 1) {
          setTimeout(interpolator, interval);
        } else {
          this.renderBattleAscii();
          resolve();
        }
      };

      interpolator();
    });
  }

  /**
   * Applies a visual animation class to a battler's DOM element.
   * @param {import("./objects.js").Game_Battler} battler - The battler.
   * @param {string} animationType - 'flash' or 'shake'.
   */
  animateBattler(battler, animationType) {
    const ctx = this._getBattlerContext(battler);
    if (!ctx) return;

    const battlerElement = this.battleWindow.getBattlerElement(ctx.index, ctx.isEnemy);

    if (battlerElement) {
      let animationClass = '';
      let duration = 0;

      switch (animationType) {
        case 'flash':
          animationClass = 'blink';
          duration = 200;
          break;
        case 'shake':
          animationClass = 'shake';
          duration = 500;
          break;
        default:
          return;
      }

      battlerElement.classList.add(animationClass);
      setTimeout(() => {
        battlerElement.classList.remove(animationClass);
      }, duration);
    }
  }

  /**
   * Animates the battler's name (e.g. text scramble effect).
   * @param {import("./objects.js").Game_Battler} battler - The battler.
   * @returns {Promise} Resolves when animation completes.
   */
  animateBattlerName(battler) {
    return new Promise((resolve) => {
      const originalName = battler.name;
      let frame = 0;
      const maxFrames = 15;
      const interval = 50;

      const ctx = this._getBattlerContext(battler);
      const nameEl = ctx ? this.battleWindow.getBattlerElement(ctx.index, ctx.isEnemy) : null;

      const animator = () => {
        if (frame >= maxFrames) {
          battler.name = originalName;
          if (nameEl) nameEl.textContent = originalName;
          else this.renderBattleAscii();
          resolve();
          return;
        }

        let newName = "";
        for (let i = 0; i < originalName.length; i++) {
          const char = originalName[i];
          if (i === frame % originalName.length) {
            newName += char === char.toUpperCase() ? char.toLowerCase() : char.toUpperCase();
          } else {
            newName += char;
          }
        }

        if (nameEl) {
            nameEl.textContent = newName;
        } else {
            battler.name = newName;
            this.renderBattleAscii();
        }

        frame++;
        setTimeout(animator, interval);
      };

      animator();
    });
  }

  /**
   * Plays a data-driven animation on a target.
   * @param {import("./objects.js").Game_Battler} target - The target battler.
   * @param {string} animationId - The animation ID from data/animations.js.
   * @returns {Promise} Resolves when animation completes.
   */
  playAnimation(target, animationId) {
       return new Promise((resolve) => {
           if (!this.dataManager.animations || !this.dataManager.animations[animationId]) {
               resolve();
               return;
           }

           const anim = this.dataManager.animations[animationId];
           const ctx = this._getBattlerContext(target);
           if (!ctx) { resolve(); return; }

           const battlerElement = this.battleWindow.getBattlerElement(ctx.index, ctx.isEnemy);
           if (!battlerElement) { resolve(); return; }

           let targetEl = battlerElement;
           let preserveBrackets = false;
           if (anim.targetPart === "hp_gauge") {
                targetEl = this.battleWindow.getHpElement(ctx.index, ctx.isEnemy);
                if (targetEl) preserveBrackets = true;
                else targetEl = battlerElement; // fallback
           }

           if (anim.type === "death_sequence") {
               const hpEl = this.battleWindow.getHpElement(ctx.index, ctx.isEnemy);
               const delay = (ms) => new Promise((res) => setTimeout(res, ms));

               const collapse = async () => {
                   if (hpEl) {
                       for (let i = 15; i >= 0; i--) {
                           hpEl.textContent = `[${" ".repeat(i)}]`;
                           await delay(30);
                       }
                   }
                   if (battlerElement) {
                       this.animateBattler(target, 'flash');
                       await delay(200);
                       target.hidden = true;
                       this.renderBattleAscii();
                   }
                   resolve();
               };
               collapse();
               return;
           }

           if (anim.type === "text_flow" || anim.type === "text_flow_liquid") {
               const originalText = targetEl.textContent;
               const duration = anim.duration || 1000;
               const interval = anim.interval || 50;
               const sequence = anim.sequence || "*";
               const color = anim.color || "";

               if (color) targetEl.style.color = color;

               let animationContainer = targetEl;
               let contentLen = originalText.length;

               if (preserveBrackets && originalText.startsWith("[") && originalText.endsWith("]")) {
                   contentLen = originalText.length - 2;
                   const innerContent = originalText.substring(1, originalText.length - 1);

                   const measureSpan = document.createElement("span");
                   measureSpan.style.visibility = "hidden";
                   measureSpan.style.position = "absolute";
                   measureSpan.style.whiteSpace = "pre";
                   measureSpan.textContent = innerContent;
                   targetEl.appendChild(measureSpan);
                   const width = measureSpan.getBoundingClientRect().width;
                   targetEl.removeChild(measureSpan);

                   targetEl.innerHTML = "";
                   targetEl.appendChild(document.createTextNode("["));
                   animationContainer = document.createElement("span");
                   animationContainer.style.display = "inline-block";
                   animationContainer.style.width = `${width}px`;
                   animationContainer.style.whiteSpace = "pre";
                   animationContainer.style.overflow = "hidden";
                   animationContainer.style.verticalAlign = "bottom";
                   animationContainer.style.textAlign = "center";
                   targetEl.appendChild(animationContainer);
                   targetEl.appendChild(document.createTextNode("]"));
               }

               let startTime = Date.now();

               const animator = () => {
                   const now = Date.now();
                   const elapsed = now - startTime;
                   if (elapsed >= duration) {
                       targetEl.textContent = originalText;
                       targetEl.style.color = "";
                       resolve();
                       return;
                   }

                   let frameContent = "";

                   if (anim.type === "text_flow_liquid") {
                       for (let i = 0; i < contentLen; i++) {
                           const timeFactor = elapsed / 100;
                           const wave = Math.sin(i * 0.5 + timeFactor);
                           const index = Math.floor(i + timeFactor * 2 + wave * 2) % sequence.length;
                           const safeIndex = (index + sequence.length * 100) % sequence.length;
                           frameContent += sequence[safeIndex];
                       }
                   } else {
                       const offset = Math.floor(elapsed / interval);
                       let s = "";
                       while (s.length < contentLen + sequence.length) s += sequence;
                       const startIdx = (sequence.length - (offset % sequence.length)) % sequence.length;
                       frameContent = s.substring(startIdx, startIdx + contentLen);
                   }

                   animationContainer.textContent = frameContent;

                   setTimeout(animator, interval);
               };
               animator();

           } else {
               resolve();
           }
       });
  }
}

/**
 * @class Scene_Shop
 * @description Handles the shop interaction logic.
 * @extends Scene_Base
 */
export class Scene_Shop extends Scene_Base {
    /**
     * Creates a new Scene_Shop.
     * @param {import("./managers.js").DataManager} dataManager - The data manager.
     * @param {import("./managers.js").SceneManager} sceneManager - The scene manager.
     * @param {import("./windows.js").WindowManager} windowManager - The window manager.
     * @param {import("./objects.js").Game_Party} party - The player's party.
     * @param {import("./windows.js").WindowLayer} windowLayer - The window layer to attach the shop window to.
     */
    constructor(dataManager, sceneManager, windowManager, party, windowLayer) {
        super(dataManager, windowManager);
        this.sceneManager = sceneManager;
        this.party = party;
        this.windowLayer = windowLayer;

        this.shopWindow = new Window_Shop();
        this.windowLayer.addChild(this.shopWindow);

        this.shopWindow.onUserClose = this.closeShop.bind(this);
        this.shopWindow.btnLeave.addEventListener("click", this.closeShop.bind(this));

        this.shopWindow.setHandler('mode_buy', () => this.startBuy());
        this.shopWindow.setHandler('mode_sell', () => this.startSell());
    }

    /**
     * Initializes the shop content and pushes the shop window.
     * @method start
     */
    start() {
        this.startBuy();
        this.windowManager.push(this.shopWindow);
        document.getElementById("mode-label").textContent = "Shop";
        SoundManager.beep(650, 150);
    }

    startBuy() {
        this.shopWindow.setupBuy(
            this.party.gold,
            this.dataManager.terms.shop.vendor_message,
            this.dataManager.items,
            (itemId) => this.buyItem(itemId)
        );
    }

    startSell() {
        this.shopWindow.setupSell(
            this.party.gold,
            this.party.inventory,
            (item) => this.sellItem(item)
        );
    }

    sellItem(item) {
        const index = this.party.inventory.indexOf(item);
        if (index > -1) {
            this.party.inventory.splice(index, 1);
            const price = Math.floor(item.cost / 2);
            this.party.gold += price;

            this.startSell();

            this.sceneManager.previous().logMessage(`[Shop] Sold ${item.name} for ${price}G.`);
            SoundManager.beep(600, 80);
            this.sceneManager.previous().updateAll();
        }
    }

    /**
     * Closes the shop window.
     * @method stop
     */
    stop() {
        this.windowManager.close(this.shopWindow);
        document.getElementById("mode-label").textContent = "Exploration";
    }

    /**
     * Handles closing the shop and returning to the previous scene.
     * @method closeShop
     */
    closeShop() {
        this.sceneManager.pop();
        if (this.sceneManager.currentScene() && this.sceneManager.currentScene().updateAll) {
            this.sceneManager.currentScene().updateAll();
        }
    }

    /**
     * Logic for purchasing an item.
     * @method buyItem
     * @param {string} itemId - The ID of the item to buy.
     */
    buyItem(itemId) {
        const item = this.dataManager.items.find((i) => i.id === itemId);
        if (!item) return;

        if (this.party.gold < item.cost) {
            this.shopWindow.messageEl.textContent = this.dataManager.terms.shop.not_enough_gold;
            SoundManager.beep(180, 80);
            return;
        }

        this.party.gold -= item.cost;
        this.party.inventory.push(item);

        // Update window state to refresh button availability
        this.shopWindow.gold = this.party.gold;
        this.shopWindow.goldLabelEl.textContent = `${this.party.gold}G`;
        this.shopWindow.refresh();

        this.shopWindow.messageEl.textContent = this.dataManager.terms.shop.purchased + item.name + ".";
    this.sceneManager.previous().logMessage(
            `[Shop] ${this.dataManager.terms.shop.purchased}${item.name}.`
        );
    this.sceneManager.previous().updateAll();
        SoundManager.beep(600, 80);
    }
}


/**
 * @class Scene_Map
 * @description The main scene for exploration. Currently acts as a central hub
 * handling map logic, UI creation, and delegation to sub-scenes like Battle and Shop.
 * @extends Scene_Base
 */
export class Scene_Map extends Scene_Base {
  /**
   * Creates a new Scene_Map.
   * @param {import("./managers.js").DataManager} dataManager - The data manager.
   * @param {import("./managers.js").SceneManager} sceneManager - The scene manager.
   * @param {import("./windows.js").WindowManager} windowManager - The window manager.
   */
  constructor(dataManager, sceneManager, windowManager) {
    super(dataManager, windowManager);
    this.sceneManager = sceneManager;
    this.map = new Game_Map();
    this.party = new Game_Party();
    this.interpreter = new Game_Interpreter(this);
    this.battleManager = new BattleManager(this.party, this.dataManager);
    this.runActive = true;
    this.draggedIndex = null;
    this.currentInteractionEvent = null;

    this.hud = new Window_Desktop();
    const gameContainer = document.getElementById("game-container");
    gameContainer.innerHTML = "";
    gameContainer.appendChild(this.hud.element);

    this.addEventListeners();

    this.windowLayer = new WindowLayer();
    this.windowLayer.appendTo(gameContainer);

    this.inventoryWindow = new Window_Inventory();
    this.windowLayer.addChild(this.inventoryWindow);
    this.eventWindow = new Window_Event();
    this.eventWindow.onUserClose = this.interpreter.closeEvent.bind(this.interpreter);
    this.windowLayer.addChild(this.eventWindow);
    this.recruitWindow = new Window_Recruit();
    this.windowLayer.addChild(this.recruitWindow)
    this.formationWindow = new Window_Formation();
    this.windowLayer.addChild(this.formationWindow)
    this.inspectWindow = new Window_Inspect();
    this.windowLayer.addChild(this.inspectWindow)
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

    this.recruitWindow.onUserClose = this.interpreter.closeRecruitEvent.bind(this.interpreter);
    this.evolutionWindow.onUserClose = () => this.windowManager.close(this.evolutionWindow);
    this.formationWindow.onUserClose = this.closeFormation.bind(this);
    this.confirmWindow.onUserClose = () => this.windowManager.close(this.confirmWindow);
    this.confirmEffectWindow.onUserClose = () => this.windowManager.close(this.confirmEffectWindow);
    this.partySelectWindow.onUserClose = () => this.windowManager.close(this.partySelectWindow);
    this.equipItemSelectWindow.onUserClose = () => this.windowManager.close(this.equipItemSelectWindow);
    this.optionsWindow.onUserClose = () => this.windowManager.close(this.optionsWindow);
    this.helpWindow.onUserClose = () => this.windowManager.close(this.helpWindow);

    this.inventoryWindow.onUserClose = this.closeInventory.bind(this);
  }


  /**
   * Transitions to the battle scene.
   * @method startBattle
   * @param {number} x - The x coordinate of the event.
   * @param {number} y - The y coordinate of the event.
   */
  startBattle(x, y) {
      this.setStatus("Enemy encountered!");
      this.logMessage("[Battle] Shapes uncoil from the dark.");
      this.sceneManager.push(new Scene_Battle(this.dataManager, this.sceneManager, this.windowManager, this.party, this.battleManager, this.windowLayer, this.map, x, y));
  }

  /**
   * Transitions to the shop scene.
   * @method startShop
   */
  startShop() {
      this.sceneManager.push(new Scene_Shop(this.dataManager, this.sceneManager, this.windowManager, this.party, this.windowLayer));
  }

  /**
   * Starts the map scene by initiating a new run.
   * @method start
   */
  start() {
    this.startNewRun();
  }

  /**
   * Resets game state and starts a fresh dungeon run.
   * @method startNewRun
   */
  startNewRun() {
    if (this.sceneManager.currentScene() !== this) return;
    this.map.initFloors(this.dataManager.maps, this.dataManager.events, this.dataManager.npcs);
    this.party.createInitialMembers(this.dataManager);
    this.runActive = true;
    this.map.floorIndex = 0;
    const f = this.map.floors[this.map.floorIndex];
    this.map.playerX = f.startX;
    this.map.playerY = f.startY;
    this.map.revealAroundPlayer();

    this.hud.clearLog();
    this.logMessage(this.dataManager.terms.log.new_run);
    this.logMessage(this.dataManager.terms.log.floor_intro + f.intro);
    this.setStatus(
      this.dataManager.terms.status.exploring_floor + (this.map.floorIndex + 1)
    );
    SoundManager.beep(500, 200);
    this.updateAll();
  }

  /**
   * Sets up global event listeners for the map scene.
   * @method addEventListeners
   */
  addEventListeners() {
    this.hud.btnNewRun.addEventListener("click", this.startNewRun.bind(this));
    this.hud.btnRevealAll.addEventListener("click", this.revealAllFloors.bind(this));
    this.hud.btnSettings.addEventListener("click", this.openSettings.bind(this));
    this.hud.btnHelp.addEventListener("click", this.openHelp.bind(this));
    this.hud.btnClearLog.addEventListener("click", () => {
      this.hud.clearLog();
      this.setStatus("Log cleared.");
      SoundManager.beep(300, 80);
    });
    this.hud.btnFormation.addEventListener("click", this.openFormation.bind(this));
    this.hud.btnInventory.addEventListener("click", this.openInventory.bind(this));
  }

  /**
   * Handles keyboard input for player movement.
   * @method onKeyDown
   * @param {KeyboardEvent} e - The keyboard event.
   */
  onKeyDown(e) {
    if (!this.runActive) return;
    if (this.windowManager.stack.length > 0) return;

    let dx = 0;
    let dy = 0;

    switch (e.key) {
      case "ArrowUp":
      case "w":
        dy = -1;
        break;
      case "ArrowDown":
      case "s":
        dy = 1;
        break;
      case "ArrowLeft":
      case "a":
        dx = -1;
        break;
      case "ArrowRight":
      case "d":
        dx = 1;
        break;
      default:
        return;
    }

    if (dx !== 0 || dy !== 0) {
      e.preventDefault();
      this.movePlayer(dx, dy);
    }
  }

  /**
   * Attempts to move the player by the given delta.
   * @method movePlayer
   * @param {number} dx - X delta.
   * @param {number} dy - Y delta.
   */
  movePlayer(dx, dy) {
    const newX = this.map.playerX + dx;
    const newY = this.map.playerY + dy;

    if (
      newX >= 0 &&
      newX < this.map.MAX_W &&
      newY >= 0 &&
      newY < this.map.MAX_H
    ) {
      this.onTileClick(newX, newY);
    }
  }

  /**
   * Returns a promise that resolves after the given milliseconds.
   * @method delay
   * @param {number} ms
   * @returns {Promise}
   */
  delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Appends a message to the event log.
   * @method logMessage
   * @param {string} msg - The message to log.
   */
  logMessage(msg) {
    this.hud.logMessage(msg);

    if (this.windowManager.stack.includes(this.eventWindow)) {
        this.eventWindow.appendLog(msg);
    }
  }

  /**
   * Updates the status bar message.
   * @method setStatus
   * @param {string} msg - The status message.
   */
  setStatus(msg) {
    this.hud.setStatus(msg);
  }

  /**
   * Checks for party members with 0 HP and handles permadeath or rebirth traits.
   * @method checkPermadeath
   */
  checkPermadeath() {
    let deadFound = false;
    const members = [...this.party.members];
    for (const member of members) {
        if (member.hp <= 0) {
            deadFound = true;
            const permadeathTraits = member.traits.filter(t => t.code === 'ON_PERMADEATH');

            if (permadeathTraits.length > 0) {
                 this.logMessage(`[Passive] ${member.name}'s Rebirth activates!`);

                 const heal = Math.floor(member.maxHp * 0.2) || 1;
                 member.hp = heal;

                 const oldLevel = member.level;
                 const levelsLost = 2;
                 member.level = Math.max(1, member.level - levelsLost);

                 if (member.level < oldLevel) {
                     const lost = oldLevel - member.level;
                     member._baseMaxHp = Math.max(1, member._baseMaxHp - (lost * 3));
                     member.xp = 0;
                 }

                 if (member.hp > member.maxHp) member.hp = member.maxHp;

                 this.logMessage(`${member.name} returned at Lv${member.level}.`);
            } else {
                this.party.removeMember(member);
                this.logMessage(`[Death] ${member.name} has fallen and is lost forever.`);
            }
        }
    }

    if (deadFound) {
        this.updateAll();
    }
  }

  /**
   * Triggers a full update of all UI components.
   * @method updateAll
   */
  updateAll() {
    this.updateGrid();
    this.updateCardHeader();
    this.updateCardList();
    this.updateParty();
    this.hud.updateStatus({
        gold: this.party.gold,
        items: this.party.inventory.length,
        runActive: this.runActive
    });
    this.hud.setMode("Exploration");
  }

  /**
   * Re-renders the map grid based on current state (fog, player pos, etc).
   * @method updateGrid
   */
  updateGrid() {
    const floor = this.map.floors[this.map.floorIndex];
    const gridData = [];

    for (let y = 0; y < this.map.MAX_H; y++) {
      for (let x = 0; x < this.map.MAX_W; x++) {
        const isPlayer = x === this.map.playerX && y === this.map.playerY;
        const visited = floor.visited[y][x];
        const ch = floor.tiles[y][x];
        const event = floor.events ? floor.events.find(e => e.x === x && e.y === y) : null;

        const cell = { x, y, symbol: " ", cssClass: "" };

        if (!visited && !isPlayer) {
          cell.cssClass = "tile-fog";
          cell.symbol = "?";
        } else {
          let symbol = " ";

          if (event) {
              let visible = true;
              if (event.hidden) {
                  let maxSee = 0;
                  this.party.members.forEach(m => {
                      const v = m.getPassiveValue("SEE_TRAPS");
                      if (v > maxSee) maxSee = v;
                  });
                  if (maxSee <= event.trapValue) {
                      visible = false;
                  }
              }

              if (visible) {
                  symbol = event.symbol;
                  if (event.cssClass) cell.cssClass = event.cssClass;
              }
          }

          if (symbol === " ") {
            switch (ch) {
              case "#":
                symbol = "█";
                break;
              case ".":
                symbol = " ";
                break;
              default:
                symbol = " ";
                break;
            }
          }

          if (isPlayer) {
            symbol = "☺";
            cell.cssClass = (cell.cssClass ? cell.cssClass + " " : "") + "tile-player";
          }
          cell.symbol = symbol;
        }
        gridData.push(cell);
      }
    }
    this.hud.renderGrid(gridData, (x, y) => this.onTileClick(x, y));
  }

  /**
   * Updates the floor title and depth labels.
   * @method updateCardHeader
   */
  updateCardHeader() {
    const floor = this.map.floors[this.map.floorIndex];
    this.hud.updateCardHeader(floor, this.map.floorIndex, this.map.floors.length);
  }

  /**
   * Updates the side list of floor cards.
   * @method updateCardList
   */
  updateCardList() {
    this.hud.updateCardList(
        this.map.floors,
        this.map.floorIndex,
        this.map.maxReachedFloorIndex,
        (idx) => {
            this.map.floorIndex = idx;
            const floor = this.map.floors[this.map.floorIndex];
            this.map.playerX = floor.startX;
            this.map.playerY = floor.startY;
            this.map.revealAroundPlayer();
            this.logMessage(`[Navigate] You flip to card ${idx + 1} (${floor.title}).`);
            SoundManager.beep(550, 120);
            this.updateAll();
        }
    );
  }

  /**
   * Gets the current game context for evolution checks.
   * @returns {Object} { inventory, floorDepth, gold }
   */
  getContext() {
    return {
        inventory: this.party.inventory,
        floorDepth: this.map.floors[this.map.floorIndex] ? this.map.floors[this.map.floorIndex].depth : 1,
        gold: this.party.gold
    };
  }

  /**
   * Updates the party status panel.
   * @method updateParty
   */
  updateParty() {
    this.hud.updateParty(this.party, (member, index) => this.openInspect(member, index), this.getContext());
  }

  /**
   * Handles interaction when clicking on a map tile.
   * Manages movement, collisions, and triggering events (battles, shops, etc).
   * @method onTileClick
   * @param {MouseEvent} e - The click event.
   */
  onTileClick(x, y) {
    if (!this.runActive) {
      this.setStatus("The run has ended. Start a new run.");
      return;
    }
    if (this.sceneManager.currentScene() !== this) return;

    const floor = this.map.floors[this.map.floorIndex];

    const dx = Math.abs(x - this.map.playerX);
    const dy = Math.abs(y - this.map.playerY);
    const isAdjacent = dx + dy === 1;

    if (!isAdjacent && !(x === this.map.playerX && y === this.map.playerY)) {
      this.setStatus(this.dataManager.terms.status.only_adjacent_tiles);
      SoundManager.beep(200, 80);
      return;
    }

    const ch = floor.tiles[y][x];
    const event = floor.events ? floor.events.find(e => e.x === x && e.y === y) : null;

    if (ch === "#") {
      this.setStatus(this.dataManager.terms.log.wall_blocks);
      SoundManager.beep(180, 80);
      return;
    }

    this.map.playerX = x;
    this.map.playerY = y;
    this.map.revealAroundPlayer();
    this.updateGrid();

    if (event) {
       let isHidden = false;
       if (event.hidden) {
           let maxSee = 0;
           this.party.members.forEach(m => {
              const v = m.getPassiveValue("SEE_TRAPS");
              if (v > maxSee) maxSee = v;
           });
           if (maxSee <= event.trapValue) {
               isHidden = true;
           }
       }

       if (isHidden) {
           this.map.playerX = x;
           this.map.playerY = y;
           this.map.revealAroundPlayer();
           this.updateGrid();

           event.hidden = false;
           this.currentInteractionEvent = event;
           this.executeEvent(event);
           return;
       } else {
           // If it's a trap, we still move onto it (triggering it)
           if (event.type === 'trap') {
               this.map.playerX = x;
               this.map.playerY = y;
               this.map.revealAroundPlayer();
               this.updateGrid();
           }

           this.currentInteractionEvent = event;
           this.executeEvent(event);
           return;
       }
    }

    if (ch === ".") {
      this.logMessage("[Step] Your footsteps echo softly.");
      this.setStatus("You move.");
    }

    SoundManager.beep(600, 80);
    this.applyMovePassives();
    this.updateAll();
  }

  /**
   * Executes a map event.
   * @method executeEvent
   * @param {import("./objects.js").Game_Event} event - The event to execute.
   */
  executeEvent(event) {
      if (event.actions) {
          event.actions.forEach(action => this.interpreter.execute(action, event));
      }
  }


  /**
   * Debug command to reveal the entire map.
   * @method revealAllFloors
   */
  revealAllFloors() {
    if (this.sceneManager.currentScene() !== this) return;
    this.map.floors.forEach((f) => {
      for (let y = 0; y < this.map.MAX_H; y++) {
        for (let x = 0; x < this.map.MAX_W; x++) {
          f.visited[y][x] = true;
        }
      }
    });
    this.updateGrid();
    this.setStatus("All tiles revealed.");
    this.logMessage("[Debug] You peek behind the fog.");
    SoundManager.beep(1000, 100);
  }

  /**
   * Adds XP to a member and handles level-up logging.
   * @method gainXp
   * @param {import("./objects.js").Game_Battler} member - The member to give XP to.
   * @param {number} amount - The amount of XP.
   */
  gainXp(member, amount, silent = false) {
    const result = member.gainXp(amount);
    if (result.leveledUp && !silent) {
      this.logMessage(
        `[Level] ${member.name} grows to Lv${result.newLevel}! HP +${result.hpGain}.`
      );
      SoundManager.beep(900, 150);
      this.updateParty();
    }
  }

  /**
   * Applies passive effects triggered by movement (e.g., regeneration).
   * @method applyMovePassives
   */
  applyMovePassives() {
    this.party.members.forEach((member) => {
      if (member.hp > 0) {
        const heal = member.getPassiveValue("MOVE_HEAL");
        if (heal > 0) {
          member.hp = Math.min(member.maxHp, member.hp + heal);
          this.logMessage(
            `[Passive] ${member.name} regenerates ${heal} HP.`
          );
        }
      }
    });
    this.updateParty();
  }

  /**
   * Calculates the party's chance to flee from battle.
   * @method getFleeChance
   * @returns {number} The chance (0-1).
   */
  getFleeChance() {
    let baseChance = 0.5;
    this.party.members.forEach((member) => {
      baseChance += member.getPassiveValue("FLEE_CHANCE_BONUS");
    });
    return Math.max(0, Math.min(1, baseChance));
  }


  /**
   * Determines if a party member is in the "Front" or "Back" row.
   * @method partyRow
   * @param {number} index - Member index.
   * @returns {string} "Front" or "Back".
   */
  partyRow(index) {
    return index <= 1 ? "Front" : "Back";
  }

  /**
   * Opens the formation management window.
   * @method openFormation
   */
  openFormation() {
    if (this.sceneManager.currentScene() !== this) return;
    this.windowManager.push(this.formationWindow);
    this.formationWindow.refresh(this.party, () => {
        this.updateParty();
        this.logMessage("[Formation] Party order changed.");
    }, this.getContext());
  }

  /**
   * Closes the formation window.
   * @method closeFormation
   */
  closeFormation() {
    this.windowManager.close(this.formationWindow);
  }

  /**
   * Opens the inventory window.
   * @method openInventory
   */
  openInventory() {
    if (this.sceneManager.currentScene() !== this) return;
    this.windowManager.push(this.inventoryWindow);
    this.inventoryWindow.setup(
        this.party,
        (item, action) => this.onInventoryAction(item, action),
        (item) => this.discardItem(item)
    );
  }

  /**
   * Closes the inventory window.
   * @method closeInventory
   */
  closeInventory() {
    this.windowManager.close(this.inventoryWindow);
  }

  openHelp() {
    if (this.sceneManager.currentScene() !== this) return;
    this.windowManager.push(this.helpWindow);
  }

  openSettings() {
    if (this.sceneManager.currentScene() !== this) return;

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

  onInventoryAction(item, action) {
      if (action === 'use') {
          if (item.type === 'equipment') return;

          if (item.effects && item.effects.recruit_egg) {
              const recruitId = item.effects.recruit_egg;
              this.windowManager.close(this.inventoryWindow);
              this.interpreter.openRecruitEvent({
                  forcedId: recruitId,
                  cost: 0,
                  onRecruit: () => this.discardItem(item)
              });
              return;
          }

          this.partySelectWindow.setup(this.party, `Use ${item.name} on:`, (target) => {
              this.windowManager.close(this.partySelectWindow);
              this.confirmEffectWindow.setupUse(target, item, () => {
                  this.windowManager.close(this.confirmEffectWindow);
                  this.useItem(item, target);
              });
              this.windowManager.push(this.confirmEffectWindow);
          }, this.getContext());
          this.windowManager.push(this.partySelectWindow);
      } else if (action === 'equip') {
          this.partySelectWindow.setup(this.party, `Equip ${item.name} on:`, (target) => {
              this.windowManager.close(this.partySelectWindow);
              this.checkEquip(target, item);
          }, this.getContext());
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
          this.equipItem(target, item);
      }, swapMsg);
      this.windowManager.push(this.confirmEffectWindow);
  }

  useItem(item, target) {
      const result = this.party.useItem(item, target);
      if (result.success) {
          this.logMessage(`[Inventory] Used ${item.name} on ${target.name}.`);
          result.outcomes.forEach(o => {
             if (o.type === 'xp' && o.result.leveledUp) {
                 this.logMessage(`[Level] ${target.name} grows to Lv${o.result.newLevel}! HP +${o.result.hpGain}.`);
                 SoundManager.beep(900, 150);
             }
          });
          this.updateParty();
          this.inventoryWindow.updateList();
          this.updateAll();
          SoundManager.beep(700, 100);
      } else {
          this.logMessage(result.msg);
      }
  }

  discardItem(item) {
      const index = this.party.inventory.indexOf(item);
      if (index > -1) {
          this.party.inventory.splice(index, 1);
          this.inventoryWindow.updateList();
          this.updateAll();
          this.logMessage(`[Inventory] Discarded ${item.name}.`);
          SoundManager.beep(300, 80);
      }
  }

  /**
   * Opens the inspection window for a specific party member.
   * @method openInspect
   * @param {import("./objects.js").Game_Battler} member - The member to inspect.
   * @param {number} index - The member's index.
   */
  openInspect(member, index) {
    this.inspectWindow.member = member;
    const need = member.xpNeeded(member.level);
    const spriteKey = member.spriteKey || 'pixie';
    this.inspectWindow.spriteEl.style.backgroundImage = `url('assets/portraits/${spriteKey}.png')`;

    // Evolution Check & Name Rendering
    const floor = this.map.floors[this.map.floorIndex];
    const evoStatus = member.getEvolutionStatus(this.party.inventory, floor ? floor.depth : 1, this.party.gold);

    this.inspectWindow.nameEl.innerHTML = "";
    // Use the centralized helper
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
    this.inspectWindow.rowPosEl.textContent = this.partyRow(index);
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

    // Passives
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

    // Skills
    this.inspectWindow.skillsEl.innerHTML = "";
    if (member.skills && member.skills.length > 0) {
        member.skills.forEach((sId, i) => {
            const skill = this.dataManager.skills[sId];
            if (skill) {
                // Calculate dynamic effects
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
    this.logMessage(`[Inspect] ${member.name} – Lv${member.level}, ${this.partyRow(index)}, HP ${member.hp}/${member.maxHp}.`);

    // Sacrifice Setup
    const sacrificeValue = member.level * (member.hp + member.maxHp);
    this.inspectWindow.btnSacrifice.textContent = `Sacrifice (${sacrificeValue}G)`;
    this.inspectWindow.btnSacrifice.style.display = "block";
    this.inspectWindow.btnSacrifice.onclick = () => {
        this.confirmWindow.titleEl.textContent = "Sacrifice Unit";
        this.confirmWindow.messageEl.textContent = `Sacrifice ${member.name} for ${sacrificeValue} Gold? This cannot be undone.`;
        this.windowManager.push(this.confirmWindow);
        this.confirmWindow.btnOk.onclick = () => {
            this.windowManager.close(this.confirmWindow);
            this.sacrificeMember(member, sacrificeValue);
        };
    };

    this.inspectWindow.onUserClose = () => this.closeInspect();
    this.inspectWindow.btnOk.onclick = () => this.closeInspect();
    this.inspectWindow.equipEl.onclick = () => this.openEquipmentScreen();
  }

  /**
   * Sacrifices a party member for gold.
   * @method sacrificeMember
   * @param {import("./objects.js").Game_Battler} member - The member to sacrifice.
   * @param {number} value - The gold value.
   */
  sacrificeMember(member, value) {
      if (this.party.removeMember(member)) {
          this.party.gold += value;
          this.logMessage(`[Sacrifice] ${member.name} was sacrificed for ${value}G.`);
          SoundManager.beep(150, 400);
          this.closeInspect();
          this.updateAll();
      }
  }

  /**
   * Closes the inspect window.
   * @method closeInspect
   */
  closeInspect() {
    this.inspectWindow.btnSacrifice.style.display = "none";
    this.windowManager.close(this.inspectWindow);
    this.setStatus("Exploration");
  }

  /**
   * Opens the equipment selection screen within the inspect window.
   * @method openEquipmentScreen
   */
  openEquipmentScreen() {
    const member = this.inspectWindow.member;
    const inventoryItems = this.party.inventory.filter(i => i.type === "equipment");
    const otherMemberItems = this.party.members
      .filter((m) => m !== member && m.equipmentItem)
      .map((m) => ({
        ...m.equipmentItem,
        equippedBy: m.name,
        equippedMember: m,
      }));
    const allItems = [...inventoryItems, ...otherMemberItems];

    this.equipItemSelectWindow.setup(allItems, member.equipmentItem, "Equipment", (item) => {
        this.windowManager.close(this.equipItemSelectWindow);
        this.checkEquip(member, item);
    });
    this.windowManager.push(this.equipItemSelectWindow);
  }

  /**
   * Opens the evolution preview window.
   * @method openEvolution
   * @param {import("./objects.js").Game_Battler} member - The member to evolve.
   * @param {Object} evolutionData - The evolution definition.
   */
  openEvolution(member, evolutionData) {
      this.closeInspect();
      const nextId = evolutionData.evolvesTo;
      const nextData = this.dataManager.actors.find(a => a.id === nextId);
      if (!nextData) return;

      const nextBattler = new Game_Battler({ ...nextData, level: member.level });
      this.evolutionWindow.setup(member, nextBattler);

      this.evolutionWindow.btnConfirm.onclick = () => {
          this.confirmEvolution(member, nextBattler, evolutionData);
      };

      this.windowManager.push(this.evolutionWindow);
  }

  /**
   * Prompts to confirm evolution (and resource consumption).
   * @method confirmEvolution
   * @param {import("./objects.js").Game_Battler} member - The member to evolve.
   * @param {import("./objects.js").Game_Battler} nextBattler - The evolved form.
   * @param {Object} evolutionData - The evolution definition.
   */
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
          this.executeEvolution(member, nextBattler, evolutionData);
      };
      this.confirmWindow.btnCancel.onclick = () => {
          this.windowManager.close(this.confirmWindow);
      };
  }

  /**
   * Executes the evolution, updating the party and consuming items.
   * @method executeEvolution
   * @param {import("./objects.js").Game_Battler} member - The member to evolve.
   * @param {import("./objects.js").Game_Battler} nextBattler - The evolved form.
   * @param {Object} evolutionData - The evolution definition.
   */
  executeEvolution(member, nextBattler, evolutionData) {
      if (evolutionData.item) {
          const idx = this.party.inventory.findIndex(i => i.id === evolutionData.item);
          if (idx !== -1) {
              this.party.inventory.splice(idx, 1);
          }
      }
      if (evolutionData.gold) {
          this.party.gold -= evolutionData.gold;
      }

      const slotIndex = this.party.slots.indexOf(member);
      if (slotIndex !== -1) {
          const currentSpeciesBase = member.actorData.maxHp;
          const nextSpeciesBase = nextBattler.actorData.maxHp;
          const newBaseMaxHp = member._baseMaxHp - currentSpeciesBase + nextSpeciesBase;

          nextBattler._baseMaxHp = Math.max(1, newBaseMaxHp);
          nextBattler.xp = member.xp;
          nextBattler.equipmentItem = member.equipmentItem;
          nextBattler.hp = nextBattler.maxHp;

          this.party.replaceMember(slotIndex, nextBattler);

          this.logMessage(`[Evolution] ${member.name} evolved into ${nextBattler.name}!`);
          SoundManager.beep(800, 300);

          this.windowManager.close(this.evolutionWindow);
          this.updateAll();
      }
  }

  /**
   * Equips an item to a member, handling swaps if necessary.
   * @method equipItem
   * @param {import("./objects.js").Game_Battler} member - The member.
   * @param {Object} item - The item to equip.
   */
  equipItem(member, item) {
      if (!item) {
          if (member.equipmentItem) {
              this.party.inventory.push(member.equipmentItem);
              SoundManager.beep(600, 80);
          }
          member.equipmentItem = null;
          this.logMessage(`[Equip] ${member.name} unequipped item.`);
          SoundManager.beep(800, 100);
      } else if (item.equippedMember) {
          const otherMember = item.equippedMember;
          const currentItem = member.equipmentItem;
          otherMember.equipmentItem = currentItem;
          member.equipmentItem = item;
          this.logMessage(`[Equip] ${member.name} swapped ${item.name} with ${otherMember.name}.`);
          SoundManager.beep(700, 150);
      } else {
          // Unequip current item if one exists
          if (member.equipmentItem) {
              this.party.inventory.push(member.equipmentItem);
              SoundManager.beep(600, 80);
          }
          member.equipmentItem = item;
          const invIndex = this.party.inventory.findIndex((i) => i.id === item.id);
          if (invIndex > -1) {
              this.party.inventory.splice(invIndex, 1);
          }
          this.logMessage(`[Equip] ${member.name} equipped ${item.name}.`);
          SoundManager.beep(800, 100);
      }
      this.openInspect(member, this.party.members.indexOf(member));
      this.updateAll();
  }
}

if (window.location.search.includes("test=true")) {
    window.Scene_Battle = Scene_Battle;
    window.Scene_Shop = Scene_Shop;
    window.Scene_Map = Scene_Map;
    window.Scene_Boot = Scene_Boot;
}
