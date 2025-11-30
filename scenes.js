import { Game_Map, Game_Party, Game_Battler, Game_Event } from "./objects.js";
import { Game_Interpreter } from "./interpreter.js";
import { randInt, shuffleArray, getPrimaryElements, elementToAscii, elementToIconId, getIconStyle, pickWeighted, evaluateFormula, probabilisticRound } from "./core.js";
import { BattleManager, SoundManager, ThemeManager } from "./managers.js";
import { Window_Battle, Window_Shop } from "./windows.js";
import { InputController } from "./input.js";
import { MapUIManager } from "./map_ui.js";
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

    this.battleWindow = new Window_Battle_Refactored();
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
      const partyIndex = this.party.members.indexOf(battler);
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

    this.input = new InputController();
    this.ui = new MapUIManager(this);
  }

  // Getters for Interpreter compatibility
  get eventWindow() { return this.ui.eventWindow; }
  get recruitWindow() { return this.ui.recruitWindow; }
  get inventoryWindow() { return this.ui.inventoryWindow; }
  get windowLayer() { return this.ui.windowLayer; }

  // UI Delegation
  logMessage(msg) { this.ui.logMessage(msg); }
  setStatus(msg) { this.ui.setStatus(msg); }
  updateAll() { this.ui.updateAll(); }
  updateGrid() { this.ui.updateGrid(this.map); }
  updateParty() { this.ui.updateParty(); }
  openFormation() { this.ui.openFormation(); }
  openInventory() { this.ui.openInventory(); }
  openHelp() { this.ui.openHelp(); }
  openSettings() { this.ui.openSettings(); }
  openInspect(member, index) { this.ui.openInspect(member, index); }
  closeInspect() { this.ui.closeInspect(); }
  openEquipmentScreen() { this.ui.openEquipmentScreen(this.ui.inspectWindow.member); }
  openEvolution(member, evoData) { this.ui.openEvolution(member, evoData); }

  // Game Logic / Scene Transitions
  startBattle(x, y) {
      this.setStatus("Enemy encountered!");
      this.logMessage("[Battle] Shapes uncoil from the dark.");
      this.sceneManager.push(new Scene_Battle(this.dataManager, this.sceneManager, this.windowManager, this.party, this.battleManager, this.windowLayer, this.map, x, y));
  }

  startShop() {
      this.sceneManager.push(new Scene_Shop(this.dataManager, this.sceneManager, this.windowManager, this.party, this.windowLayer));
  }

  start() {
    this.startNewRun();
  }

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

    // Clear log via UI
    if (this.ui.logEl) this.ui.logEl.textContent = "";

    this.logMessage(this.dataManager.terms.log.new_run);
    this.logMessage(this.dataManager.terms.log.floor_intro + f.intro);
    this.setStatus(
      this.dataManager.terms.status.exploring_floor + (this.map.floorIndex + 1)
    );
    SoundManager.beep(500, 200);
    this.updateAll();
  }

  onKeyDown(e) {
    if (!this.runActive) return;
    if (this.windowManager.stack.length > 0) return;

    const action = this.input.getAction(e);
    let dx = 0, dy = 0;

    if (action === 'up') dy = -1;
    else if (action === 'down') dy = 1;
    else if (action === 'left') dx = -1;
    else if (action === 'right') dx = 1;

    if (dx !== 0 || dy !== 0) {
      e.preventDefault();
      this.movePlayer(dx, dy);
    }
  }

  movePlayer(dx, dy) {
    const newX = this.map.playerX + dx;
    const newY = this.map.playerY + dy;

    if (
      newX >= 0 &&
      newX < this.map.MAX_W &&
      newY >= 0 &&
      newY < this.map.MAX_H
    ) {
      const tileEl = this.ui.explorationGridEl.querySelector(
        `[data-x='${newX}'][data-y='${newY}']`
      );
      if (tileEl) {
        this.onTileClick({ currentTarget: tileEl });
      }
    }
  }

  delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
  }

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

  getContext() {
    return {
        inventory: this.party.inventory,
        floorDepth: this.map.floors[this.map.floorIndex] ? this.map.floors[this.map.floorIndex].depth : 1,
        gold: this.party.gold
    };
  }

  onTileClick(e) {
    if (!this.runActive) {
      this.setStatus("The run has ended. Start a new run.");
      return;
    }
    if (this.sceneManager.currentScene() !== this) return;

    const tileEl = e.currentTarget;
    const x = parseInt(tileEl.dataset.x, 10);
    const y = parseInt(tileEl.dataset.y, 10);
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

  executeEvent(event) {
      if (event.actions) {
          event.actions.forEach(action => this.interpreter.execute(action, event));
      }
  }

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

  navigateToFloor(idx) {
      this.map.floorIndex = idx;
      const floor = this.map.floors[this.map.floorIndex];
      this.map.playerX = floor.startX;
      this.map.playerY = floor.startY;
      this.map.revealAroundPlayer();
      this.logMessage(`[Navigate] You flip to card ${idx + 1} (${floor.title}).`);
      SoundManager.beep(550, 120);
      this.updateAll();
  }

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

  getFleeChance() {
    let baseChance = 0.5;
    this.party.members.forEach((member) => {
      baseChance += member.getPassiveValue("FLEE_CHANCE_BONUS");
    });
    return Math.max(0, Math.min(1, baseChance));
  }

  partyRow(index) {
    return index <= 1 ? "Front" : "Back";
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
          this.ui.inventoryWindow.updateList();
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
          this.ui.inventoryWindow.updateList();
          this.updateAll();
          this.logMessage(`[Inventory] Discarded ${item.name}.`);
          SoundManager.beep(300, 80);
      }
  }

  sacrificeMember(member, value) {
      console.log("Scene_Map.sacrificeMember called for", member.name);
      if (this.party.removeMember(member)) {
          this.party.gold += value;
          this.logMessage(`[Sacrifice] ${member.name} was sacrificed for ${value}G.`);
          SoundManager.beep(150, 400);
          this.ui.closeInspect();
          this.updateAll();
      } else {
          console.log("removeMember returned false");
      }
  }

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

          this.windowManager.close(this.ui.evolutionWindow);
          this.updateAll();
      }
  }

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
      // Update Inspect View (because it's underneath)
      const index = this.party.members.indexOf(member);
      this.ui.openInspect(member, index);

      // Re-open equipment screen to allow further changes (UX Pattern)
      this.ui.openEquipmentScreen(member);
      this.updateAll();
  }
}

class Window_Battle_Refactored extends Window_Battle {
    refresh(battlers, party) {
        this.viewportEl.innerHTML = "";

        const header = document.createElement("div");
        header.textContent = "== BATTLE ==";
        header.style.textAlign = "center";
        header.style.padding = "5px 0";
        this.viewportEl.appendChild(header);

        // Enemies (Reversed/Mirrored Grid)
        battlers.forEach((e, idx) => {
            if (!e) return;
            // Reversed: 0 is TR, 1 is TL.
            const col = (idx % 2 === 0) ? 1 : 0;
            const row = Math.floor(idx / 2);

            const left = 20 + col * 220;
            const top = 30 + row * 40;

            this._renderBattler(e, idx, top, left, true);
        });

        // Party (Standard Grid)
        party.forEach((p, idx) => {
            if (!p) return;
            // Standard: 0 TL, 1 TR.
            const col = idx % 2;
            const row = Math.floor(idx / 2);

            const left = 20 + col * 220;
            const top = 140 + row * 40;

            this._renderBattler(p, idx, top, left, false);
        });
    }

    _renderBattler(battler, idx, top, left, isEnemy) {
        const hp = battler.hp;
        const primaryElements = getPrimaryElements(battler.elements);
        const elementAscii = primaryElements.map(el => elementToAscii(el)).join('');
        const id = this.getBattlerId(idx, isEnemy);
        const nameStr = `<span id="${id}">${battler.name}</span>`;

        const el = document.createElement("div");
        el.className = 'battler-container';
        el.style.position = "absolute";
        el.style.top = `${top}px`;
        el.style.left = `${left}px`;
        el.style.whiteSpace = "pre";
        el.innerHTML = `<div class="battler-name">${elementAscii}${nameStr} (HP ${hp}/${battler.maxHp})</div><div class="battler-hp">${this.createHpGauge(hp, battler.maxHp)}</div>`;
        this.viewportEl.appendChild(el);
    }
}

if (window.location.search.includes("test=true")) {
    window.Scene_Battle = Scene_Battle;
    window.Scene_Shop = Scene_Shop;
    window.Scene_Map = Scene_Map;
    window.Scene_Boot = Scene_Boot;
}
