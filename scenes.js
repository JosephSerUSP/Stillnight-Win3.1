import { Game_Map, Game_Party, Game_Battler, Game_Event } from "./objects.js";
import { randInt, shuffleArray, getPrimaryElements, elementToAscii, elementToIconId, getIconStyle, pickWeighted, evaluateFormula } from "./core.js";
import { BattleManager, FusionManager, SoundManager } from "./managers.js";
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
  Window_Fusion,
  Window_HUD,
  WindowLayer,
  createInteractiveLabel,
  createElementIcon
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
    this.battleWindow.refresh(enemies, this.party.members.slice(0, 4));
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
    const totalXp = enemies.reduce((sum, e) => sum + Math.floor(e.level * (e.expGrowth * 0.5) + 8), 0);

    const living = this.party.members.slice(0, 4).filter((p) => p.hp > 0);
    living.forEach((m) => {
      const goldBonus = m.getPassiveValue("GOLD_DIGGER");
      if (goldBonus > 0) {
        totalGold += goldBonus;
        this.sceneManager.previous().logMessage(`[Passive] ${m.name} finds an extra ${goldBonus}G!`);
      }
    });
    const share =
      living.length > 0 ? Math.max(1, Math.floor(totalXp / living.length)) : 0;
    living.forEach((m) => this.sceneManager.previous().gainXp(m, share));

    this.party.gold += totalGold;
    this.sceneManager.previous().logMessage(
      `[Battle] Victory! Gained ${totalGold}G and ${totalXp} XP (split).`
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
 * @class Scene_Fusion
 * @description Handles demon fusion (Jakyou Manor).
 * @extends Scene_Base
 */
export class Scene_Fusion extends Scene_Base {
    /**
     * @param {import("./managers.js").DataManager} dataManager
     * @param {import("./managers.js").SceneManager} sceneManager
     * @param {import("./windows.js").WindowManager} windowManager
     * @param {import("./objects.js").Game_Party} party
     * @param {import("./windows.js").WindowLayer} windowLayer
     */
    constructor(dataManager, sceneManager, windowManager, party, windowLayer) {
        super(dataManager, windowManager);
        this.sceneManager = sceneManager;
        this.party = party;
        this.windowLayer = windowLayer;
        this.fusionManager = new FusionManager(dataManager);

        this.fusionWindow = new Window_Fusion();
        this.windowLayer.addChild(this.fusionWindow);

        this.fusionWindow.onUserClose = this.closeFusion.bind(this);
        this.fusionWindow.btnFuse.addEventListener("click", this.performFusion.bind(this));
    }

    start() {
        this.refresh();
        this.windowManager.push(this.fusionWindow);
        document.getElementById("mode-label").textContent = "Fusion";
        SoundManager.beep(650, 150);
    }

    stop() {
        this.windowManager.close(this.fusionWindow);
        document.getElementById("mode-label").textContent = "Exploration";
    }

    closeFusion() {
        this.sceneManager.pop();
        if (this.sceneManager.currentScene() && this.sceneManager.currentScene().updateAll) {
            this.sceneManager.currentScene().updateAll();
        }
    }

    refresh() {
        this.fusionWindow.refresh(this.party, (selection) => this.onSelect(selection));
    }

    onSelect(selection) {
        if (selection.length !== 2) {
            this.fusionWindow.showResult(null);
            this.pendingResult = null;
            return;
        }

        const resultTemplate = this.fusionManager.predictFusion(selection[0], selection[1]);
        if (resultTemplate) {
            // Preview uses template, but we can wrap it in Battler for display consistency if needed
            // Window_Fusion expects { name, role, level, maxHp, spriteKey }
            this.pendingResult = resultTemplate;
            this.fusionWindow.showResult(resultTemplate);
        } else {
            this.pendingResult = null;
            this.fusionWindow.showResult(null);
        }
    }

    performFusion() {
        const selection = this.fusionWindow.getSelection();
        if (selection.length !== 2 || !this.pendingResult) return;

        const [d1, d2] = selection;

        // Remove ingredients
        const idx1 = this.party.members.indexOf(d1);
        if (idx1 > -1) this.party.members.splice(idx1, 1);

        const idx2 = this.party.members.indexOf(d2);
        if (idx2 > -1) this.party.members.splice(idx2, 1);

        // Add result
        const newDemon = new Game_Battler(this.pendingResult);
        this.party.members.push(newDemon);

        this.sceneManager.previous().logMessage(`[Fusion] Fused ${d1.name} and ${d2.name} into ${newDemon.name}!`);
        SoundManager.beep(900, 300);

        this.pendingResult = null;
        this.fusionWindow.showResult(null);
        this.refresh();
        this.sceneManager.previous().updateAll();
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
    }

    /**
     * Initializes the shop content and pushes the shop window.
     * @method start
     */
    start() {
        this.shopWindow.setup(
            this.party.gold,
            this.dataManager.terms.shop.vendor_message,
            this.dataManager.items,
            (itemId) => this.buyItem(itemId)
        );
        this.windowManager.push(this.shopWindow);
        document.getElementById("mode-label").textContent = "Shop";
        SoundManager.beep(650, 150);
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
        this.shopWindow.goldLabelEl.textContent = this.party.gold;
        this.shopWindow.messageEl.textContent = this.dataManager.terms.shop.purchased + item.name + ".";
    this.sceneManager.previous().logMessage(
            `[Shop] ${this.dataManager.terms.shop.purchased}${item.name}.`
        );
    this.sceneManager.previous().updateAll();
        SoundManager.beep(600, 80);
    }
}

/**
 * @class Game_Interpreter
 * @description Handles event execution logic decoupled from Scene_Map.
 */
class Game_Interpreter {
    /**
     * @param {Scene_Map} scene - The scene instance.
     */
    constructor(scene) {
        this.scene = scene;
    }

    get dataManager() { return this.scene.dataManager; }
    get windowManager() { return this.scene.windowManager; }
    get sceneManager() { return this.scene.sceneManager; }
    get party() { return this.scene.party; }
    get map() { return this.scene.map; }

    /**
     * Executes a game action triggered by an event.
     * @param {Object} action - The action object (e.g. { type: 'BATTLE' }).
     * @param {import("./objects.js").Game_Event} event - The source event.
     */
    execute(action, event) {
        switch(action.type) {
            case 'BATTLE':
                this.scene.setStatus("Enemy encountered!");
                this.scene.logMessage("[Battle] Shapes uncoil from the dark.");
                this.sceneManager.push(new Scene_Battle(this.dataManager, this.sceneManager, this.windowManager, this.party, this.scene.battleManager, this.scene.windowLayer, this.map, event.x, event.y));
                break;
            case 'SHOP':
                this.sceneManager.push(new Scene_Shop(this.dataManager, this.sceneManager, this.windowManager, this.party, this.scene.windowLayer));
                break;
            case 'JAKYOU':
                this.sceneManager.push(new Scene_Fusion(this.dataManager, this.sceneManager, this.windowManager, this.party, this.scene.windowLayer));
                break;
            case 'SHRINE':
                this.scene.logMessage("[Shrine] You encounter a shrine.");
                this.openShrineEvent();
                break;
            case 'RECRUIT':
                this.openRecruitEvent();
                break;
            case 'NPC_DIALOGUE':
                this.openNpcEvent(action.id);
                this.scene.updateAll();
                break;
            case 'DESCEND':
                this.descendStairs();
                SoundManager.beep(800, 150);
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
        }
    }

    /**
     * Heals the entire party and logs the event.
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
        SoundManager.beep(600, 80);
        this.scene.applyMovePassives();
        this.scene.updateAll();
    }

    /**
     * Descends to the next dungeon floor if available.
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
        SoundManager.beep(800, 150);
        this.scene.updateAll();
    }

    /**
     * Opens the Shrine interaction window.
     */
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
                this.scene.eventWindow.appendLog(`> ${ch.label}`);
                await this.applyEventEffect(ch.effect);
                this.scene.eventWindow.updateChoices([{
                    label: "Exit Shrine",
                    onClick: () => this.closeEvent()
                }]);
            }
        }));

        this.scene.eventWindow.show({
            title: ev.title,
            description: ev.description,
            image: ev.image || "shrine.png",
            style: 'terminal',
            choices: choices
        });
        this.windowManager.push(this.scene.eventWindow);

        this.scene.setStatus("Shrine event.");
        SoundManager.beep(700, 150);
    }

    /**
     * Applies the effect of a Shrine choice.
     * @param {Object} effect - The effect object.
     * @async
     */
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

    /**
     * Displays a trap event window.
     * @param {Object} action - The trap action data.
     */
    triggerTrap(action) {
        this.scene.eventWindow.show({
            title: "Trap!",
            description: action.message || "You triggered a trap!",
            image: "trap.png",
            style: 'terminal',
            choices: [{
                label: "Ouch...",
                onClick: () => this.resolveTrap(action)
            }]
        });
        this.windowManager.push(this.scene.eventWindow);
        SoundManager.beep(150, 300);
    }

    /**
     * Resolves the trap damage and updates state.
     * @param {Object} action - The trap action data.
     * @async
     */
    async resolveTrap(action) {
        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        try {
            const dmg = action.damage || 5;
            this.scene.eventWindow.appendLog(`> Ouch...`);
            await delay(500);

            this.party.members.forEach(m => {
                m.hp = Math.max(0, m.hp - dmg);
            });

            this.scene.logMessage(`The party takes ${dmg} damage.`);
            this.scene.checkPermadeath();
            SoundManager.beep(150, 300);
            this.scene.updateAll();

            this.scene.eventWindow.updateChoices([{
                label: "Close",
                onClick: () => this.scene.eventWindow.onUserClose()
            }]);
        } catch (e) {
            console.error(e);
            this.scene.eventWindow.appendLog("Error in resolveTrap: " + e);
        }
    }

    /**
     * Opens a treasure chest event.
     */
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

        this.scene.eventWindow.show({
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
        this.windowManager.push(this.scene.eventWindow);
        SoundManager.beep(800, 100);
        this.scene.updateAll();
    }

    /**
     * Closes the active event window.
     */
    closeEvent() {
        this.windowManager.close(this.scene.eventWindow);
        this.scene.updateAll();
    }

    /**
     * Opens the recruit interaction window.
     */
    openRecruitEvent() {
        const availableCreatures = this.dataManager.actors.filter(creature => !creature.isEnemy);
        if (availableCreatures.length === 0) {
            this.scene.logMessage(this.dataManager.terms.recruit.no_one_here);
            return;
        }
        const recruit = availableCreatures[randInt(0, availableCreatures.length - 1)];
        const cost = randInt(25, 75);

        this.scene.recruitWindow.bodyEl.innerHTML = "";

        const layout = document.createElement('div');
        layout.className = 'inspect-layout';
        this.scene.recruitWindow.bodyEl.appendChild(layout);

        const sprite = document.createElement('div');
        sprite.className = 'inspect-sprite';
        sprite.style.backgroundImage = `url('assets/portraits/${recruit.spriteKey || "pixie"}.png')`;
        layout.appendChild(sprite);

        const fields = document.createElement('div');
        fields.className = 'inspect-fields';
        layout.appendChild(fields);

        const createRow = (label, valueEl) => {
            const row = document.createElement('div');
            row.className = 'inspect-row';
            const lbl = document.createElement('span');
            lbl.className = 'inspect-label';
            lbl.textContent = label;
            row.appendChild(lbl);
            valueEl.classList.add('inspect-value');
            row.appendChild(valueEl);
            fields.appendChild(row);
        };

        // Name
        const nameVal = document.createElement('span');
        nameVal.appendChild(createElementIcon(recruit.elements));
        nameVal.appendChild(document.createTextNode(recruit.name));
        createRow('Name', nameVal);

        // Level
        const levelVal = document.createElement('span');
        levelVal.textContent = recruit.level;
        createRow('Level', levelVal);

        // Role
        const roleVal = document.createElement('span');
        roleVal.textContent = recruit.role;
        createRow('Role', roleVal);

        // HP
        const hpVal = document.createElement('span');
        hpVal.textContent = `${recruit.maxHp} / ${recruit.maxHp}`;
        createRow('HP', hpVal);

        // Element
        const elementVal = document.createElement('span');
        if (recruit.elements && recruit.elements.length > 0) {
            elementVal.appendChild(this.scene.renderElements(recruit.elements));
        } else {
            elementVal.textContent = "—";
        }
        createRow('Element', elementVal);

        // Equipment
        const equipVal = document.createElement('span');
        equipVal.textContent = recruit.equipment || "—";
        createRow('Equipment', equipVal);

        // Passive
        const passiveVal = document.createElement('span');
        if (recruit.passives && recruit.passives.length > 0) {
            recruit.passives.forEach((pData, i) => {
                const code = pData.code || pData.id;
                let def = null;
                if (this.dataManager.passives) {
                    def = Object.values(this.dataManager.passives).find(p => p.id === code || p.code === code);
                }
                if (!def) def = pData;

                const el = createInteractiveLabel(def, 'passive');
                passiveVal.appendChild(el);

                if (i < recruit.passives.length - 1) {
                    passiveVal.appendChild(document.createTextNode(", "));
                }
            });
        } else {
            passiveVal.textContent = "—";
        }
        createRow('Passive', passiveVal);

        // Skills
        const skillVal = document.createElement('span');
        if (recruit.skills && recruit.skills.length > 0) {
            recruit.skills.forEach((sId, i) => {
                const skill = this.dataManager.skills[sId];
                if (skill) {
                    const el = createInteractiveLabel(skill, 'skill');
                    skillVal.appendChild(el);
                } else {
                    skillVal.appendChild(document.createTextNode(sId));
                }
                if (i < recruit.skills.length - 1) {
                    skillVal.appendChild(document.createTextNode(", "));
                }
            });
        } else {
            skillVal.textContent = "—";
        }
        createRow('Skills', skillVal);

        // Flavor
        const flavorVal = document.createElement('span');
        flavorVal.textContent = recruit.flavor || "—";
        createRow('Flavor', flavorVal);

        this.scene.recruitWindow.buttonsEl.innerHTML = "";
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
        this.scene.recruitWindow.buttonsEl.appendChild(joinBtn);
        this.scene.recruitWindow.buttonsEl.appendChild(declineBtn);

        this.windowManager.push(this.scene.recruitWindow);
        this.scene.setStatus("Recruit encountered.");
        SoundManager.beep(400, 100);
    }

    /**
     * Closes the recruit window.
     */
    closeRecruitEvent() {
        this.windowManager.close(this.scene.recruitWindow);
        this.scene.setStatus("Exploration");
    }

    /**
     * Opens a dialogue window with an NPC.
     * @param {string} npcId - The ID of the NPC.
     */
    openNpcEvent(npcId) {
        const npc = this.dataManager.npcs.find(n => n.id === npcId);
        if (!npc) return;

        let text = "";
        if (typeof npc.dialogue === 'string') {
            text = npc.dialogue;
        }

        this.scene.eventWindow.show({
            title: npc.name,
            description: `"${text}"`,
            style: 'terminal',
            choices: [{
                label: "Leave",
                onClick: () => this.closeEvent()
            }]
        });
        this.windowManager.push(this.scene.eventWindow);

        this.scene.setStatus(`Talking to ${npc.name}.`);
        SoundManager.beep(400, 100);
    }

    /**
     * Clears the event currently being interacted with from the map.
     */
    clearEventTile() {
        if (this.scene.currentInteractionEvent) {
            this.map.removeEvent(this.map.floorIndex, this.scene.currentInteractionEvent.x, this.scene.currentInteractionEvent.y);
            this.scene.currentInteractionEvent = null;
        }
        this.scene.updateGrid();
    }

    /**
     * Attempts to recruit a creature to the party.
     * @param {Object} recruit - The recruit data.
     */
    attemptRecruit(recruit) {
        if (this.party.members.length < this.party.MAX_MEMBERS) {
            this.party.members.push(new Game_Battler(recruit));
            this.scene.logMessage(`[Recruit] ${recruit.name} joins your party.`);
            this.scene.setStatus(
                this.dataManager.terms.recruit.recruited.replace("{0}", recruit.name)
            );
            this.clearEventTile();
            this.closeRecruitEvent();
            this.scene.updateParty();
            return;
        }
        this.scene.recruitWindow.bodyEl.innerHTML =
            this.dataManager.terms.recruit.party_full;
        this.scene.recruitWindow.buttonsEl.innerHTML = "";
        this.party.members.forEach((m, idx) => {
            const btn = document.createElement("button");
            btn.className = "win-btn";
            btn.textContent = m.name;
            btn.addEventListener("click", () => {
                this.replaceMemberWithRecruit(idx, recruit);
            });
            this.scene.recruitWindow.buttonsEl.appendChild(btn);
        });
        const cancelBtn = document.createElement("button");
        cancelBtn.className = "win-btn";
        cancelBtn.textContent = "Cancel";
        cancelBtn.addEventListener("click", () => {
            this.scene.logMessage(this.dataManager.terms.recruit.decide_not_to_replace);
            this.closeRecruitEvent();
        });
        this.scene.recruitWindow.buttonsEl.appendChild(cancelBtn);
    }

  /**
   * Replaces an existing party member with the recruit.
   * @param {number} index - The index of the member to replace.
   * @param {Object} recruit - The recruit data.
   */
    replaceMemberWithRecruit(index, recruit) {
        const replaced = this.party.members[index];
    this.scene.logMessage(
            this.dataManager.terms.recruit.replace_member
                .replace("{0}", replaced.name)
                .replace("{1}", recruit.name)
        );
        this.party.members[index] = new Game_Battler(recruit);
        this.clearEventTile();
        this.scene.updateParty();
        this.closeRecruitEvent();
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

    this.hud = new Window_HUD();
    this.getDomElements();
    this.addEventListeners();

    this.windowLayer = new WindowLayer();
    const gameContainer = document.querySelector(".right-side");
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

    this.recruitWindow.onUserClose = this.interpreter.closeRecruitEvent.bind(this.interpreter);
    this.evolutionWindow.onUserClose = () => this.windowManager.close(this.evolutionWindow);
    this.formationWindow.onUserClose = this.closeFormation.bind(this);
    this.confirmWindow.onUserClose = () => this.windowManager.close(this.confirmWindow);

    this.inventoryWindow.onUserClose = this.closeInventory.bind(this);
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

    this.logEl.textContent = "";
    this.logMessage(this.dataManager.terms.log.new_run);
    this.logMessage(this.dataManager.terms.log.floor_intro + f.intro);
    this.setStatus(
      this.dataManager.terms.status.exploring_floor + (this.map.floorIndex + 1)
    );
    SoundManager.beep(500, 200);
    this.updateAll();
  }

  /**
   * Caches references to DOM elements created in createUI.
   * @method getDomElements
   */
  getDomElements() {
    this.explorationGridEl = document.getElementById("exploration-grid");
    this.cardTitleEl = document.getElementById("card-title");
    this.cardIndexLabelEl = document.getElementById("card-index-label");
    this.cardDepthLabelEl = document.getElementById("card-depth-label");
    this.cardListEl = document.getElementById("card-list");
    this.partyGridEl = document.getElementById("party-grid");
    this.logEl = document.getElementById("log-content");
    this.statusMessageEl = document.getElementById("status-message");
    this.statusGoldEl = document.getElementById("status-gold");
    this.statusFloorEl = document.getElementById("status-floor");
    this.statusCardsEl = document.getElementById("status-cards");
    this.statusRunEl = document.getElementById("status-run");
    this.statusItemsEl = document.getElementById("status-items");
    this.modeLabelEl = document.getElementById("mode-label");
    this.btnNewRun = document.getElementById("btn-new-run");
    this.btnRevealAll = document.getElementById("btn-reveal-all");
    this.btnClearLog = document.getElementById("btn-clear-log");
    this.btnFormation = document.getElementById("btn-formation");
    this.btnInventory = document.getElementById("btn-inventory");
  }

  /**
   * Sets up global event listeners for the map scene.
   * @method addEventListeners
   */
  addEventListeners() {
    this.btnNewRun.addEventListener("click", this.startNewRun.bind(this));
    this.btnRevealAll.addEventListener("click", this.revealAllFloors.bind(this));
    this.btnClearLog.addEventListener("click", () => {
      this.logEl.textContent = "";
      this.setStatus("Log cleared.");
      SoundManager.beep(300, 80);
    });
    this.btnFormation.addEventListener("click", this.openFormation.bind(this));
    this.btnInventory.addEventListener("click", this.openInventory.bind(this));
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
      const tileEl = this.explorationGridEl.querySelector(
        `[data-x='${newX}'][data-y='${newY}']`
      );
      if (tileEl) {
        this.onTileClick({ currentTarget: tileEl });
      }
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
    this.logEl.textContent += msg + "\n";
    this.logEl.scrollTop = this.logEl.scrollHeight;

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
    this.statusMessageEl.textContent = msg;
  }

  /**
   * Checks for party members with 0 HP and handles permadeath or rebirth traits.
   * @method checkPermadeath
   */
  checkPermadeath() {
    let deadFound = false;
    // Iterate backwards to safely splice
    for (let i = this.party.members.length - 1; i >= 0; i--) {
        const member = this.party.members[i];
        if (member.hp <= 0) {
            deadFound = true;
            // Check for ON_PERMADEATH traits
            const permadeathTraits = member.traits.filter(t => t.code === 'ON_PERMADEATH');

            if (permadeathTraits.length > 0) {
                 this.logMessage(`[Passive] ${member.name}'s Rebirth activates!`);

                 // Restore 20% HP based on current max (before level loss)
                 const heal = Math.floor(member.maxHp * 0.2) || 1;
                 member.hp = heal;

                 // Lose 2 levels
                 const oldLevel = member.level;
                 const levelsLost = 2;
                 member.level = Math.max(1, member.level - levelsLost);

                 // Reduce max HP roughly if level dropped
                 if (member.level < oldLevel) {
                     const lost = oldLevel - member.level;
                     // Approximate HP loss (3 per level)
                     member._baseMaxHp = Math.max(1, member._baseMaxHp - (lost * 3));
                     // Reset XP for new level
                     member.xp = 0;
                 }

                 // Ensure HP is valid against new MaxHP
                 if (member.hp > member.maxHp) member.hp = member.maxHp;

                 this.logMessage(`${member.name} returned at Lv${member.level}.`);
            } else {
                this.party.members.splice(i, 1);
                this.logMessage(`[Death] ${member.name} has fallen and is lost forever.`);
            }
        }
    }

    if (deadFound) {
        this.updateAll();
    }
  }

  getMoonPhaseName(phase) {
      const phases = ["New", "1/8", "2/8", "3/8", "Full", "5/8", "6/8", "7/8"];
      return phases[phase] || "New";
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
    this.statusGoldEl.textContent = this.party.gold;
    this.hud.statusMagEl.textContent = this.party.mag;
    this.hud.statusMoonEl.textContent = this.getMoonPhaseName(this.map.moonPhase);
    this.statusItemsEl.textContent = this.party.inventory.length;
    this.statusRunEl.textContent = this.runActive ? "Active" : "Over";
    this.modeLabelEl.textContent = "Exploration";
  }

  /**
   * Re-renders the map grid based on current state (fog, player pos, etc).
   * @method updateGrid
   */
  updateGrid() {
    const floor = this.map.floors[this.map.floorIndex];
    this.explorationGridEl.innerHTML = "";
    for (let y = 0; y < this.map.MAX_H; y++) {
      for (let x = 0; x < this.map.MAX_W; x++) {
        const tileEl = document.createElement("div");
        tileEl.className = "tile";
        tileEl.dataset.x = x;
        tileEl.dataset.y = y;

        const isPlayer = x === this.map.playerX && y === this.map.playerY;
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
                  if (event.cssClass) tileEl.classList.add(event.cssClass);
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
            tileEl.classList.add("tile-player");
          }
          tileEl.textContent = symbol;
        }

        tileEl.addEventListener("click", this.onTileClick.bind(this));
        this.explorationGridEl.appendChild(tileEl);
      }
    }
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
   * Updates the party status panel.
   * @method updateParty
   */
  updateParty() {
    this.hud.updateParty(this.party, (member, index) => this.openInspect(member, index));
  }

  /**
   * Handles interaction when clicking on a map tile.
   * Manages movement, collisions, and triggering events (battles, shops, etc).
   * @method onTileClick
   * @param {MouseEvent} e - The click event.
   */
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

    // Process Time and Resources
    this.map.steps++;
    if (this.map.steps % 8 === 0) { // Cycle every 8 steps
        this.map.moonPhase = (this.map.moonPhase + 1) % 8;
        if (this.map.moonPhase === 0) this.logMessage("[Moon] It is now New Moon.");
        if (this.map.moonPhase === 4) this.logMessage("[Moon] It is now Full Moon.");
    }

    // MAG Consumption
    if (!floor.title.toLowerCase().includes("overworld")) {
        const magCost = this.party.members.reduce((sum, m) => sum + (m.cp || 0), 0);
        if (magCost > 0) {
            if (this.party.mag >= magCost) {
                this.party.mag -= magCost;
            } else {
                this.party.mag = 0;
                // Damage party if out of MAG? Walkthrough says "MAG depletion". Usually invokes damage or unsummon.
                // For now, just log warning.
                if (this.map.steps % 5 === 0) this.logMessage("WARNING: Out of Magnetite!");
                this.party.members.forEach(m => {
                    if (m.cp > 0) m.hp = Math.max(1, m.hp - 1); // Slight damage
                });
            }
        }
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
  gainXp(member, amount) {
    const result = member.gainXp(amount);
    if (result.leveledUp) {
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
   * Formats a skill name with its elemental icon.
   * @method formatSkillName
   * @param {string} skillId - The skill ID.
   * @returns {string} The formatted HTML string.
   */
  formatSkillName(skillId) {
      const skill = this.dataManager.skills[skillId];
      if (!skill) return "";
      const elementIcon = this.createElementIcon([skill.element]);
      return `${elementIcon.innerHTML}${skill.name}`;
  }

/**
 * Creates a DOM element representing an icon for a set of elements.
 * @method createElementIcon
 * @param {string[]} elements - The elements.
 * @returns {HTMLElement} The icon container element.
 */
createElementIcon(elements) {
    const primaryElements = getPrimaryElements(elements);
    const container = document.createElement('div');

    if (primaryElements.length <= 1) {
        container.className = 'element-icon-container-name';
        const icon = document.createElement('div');
        icon.className = 'icon';
        if (primaryElements.length === 1) {
            const iconId = elementToIconId(primaryElements[0]);
            if (iconId > 0) {
                icon.style.backgroundPosition = getIconStyle(iconId);
            }
        }
        container.appendChild(icon);
    } else {
        container.className = 'element-icon-container';
        const positions = [
            { top: '0px', left: '0px' },
            { top: '6px', left: '6px' },
            { top: '0px', left: '6px' },
            { top: '6px', left: '0px' },
        ];
        primaryElements.forEach((element, index) => {
            if (index < 4) {
                const icon = document.createElement('div');
                icon.className = 'element-icon';
                const iconId = elementToIconId('l_' + element);
                if (iconId > 0) {
                    icon.style.backgroundPosition = getIconStyle(iconId);
                    icon.style.top = positions[index].top;
                    icon.style.left = positions[index].left;
                    container.appendChild(icon);
                }
            }
        });
    }
    return container;
}

/**
 * Renders a row of element icons.
 * @method renderElements
 * @param {string[]} elements - The elements.
 * @returns {HTMLElement} The container element.
 */
renderElements(elements) {
    const container = document.createElement('div');
    container.className = 'element-container';
    elements.forEach(element => {
        const icon = document.createElement('div');
        icon.className = 'icon';
        const iconId = elementToIconId(element);
        if (iconId > 0) {
            icon.style.backgroundPosition = getIconStyle(iconId);
        }
        container.appendChild(icon);
    });
    return container;
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
    });
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
    this.refreshInventoryWindow();
  }

  /**
   * Closes the inventory window.
   * @method closeInventory
   */
  closeInventory() {
    this.windowManager.close(this.inventoryWindow);
  }

  /**
   * Refreshes the content of the inventory window.
   * @method refreshInventoryWindow
   */
  refreshInventoryWindow() {
    this.inventoryWindow.refresh(
      this.party,
      (item, target) => {
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
              this.refreshInventoryWindow();
              this.updateAll();
              SoundManager.beep(700, 100);
          } else {
              this.logMessage(result.msg);
          }
      },
      (item) => {
          const index = this.party.inventory.indexOf(item);
          if (index > -1) {
              this.party.inventory.splice(index, 1);
              this.refreshInventoryWindow();
              this.updateAll();
              this.logMessage(`[Inventory] Discarded ${item.name}.`);
              SoundManager.beep(300, 80);
          }
      }
    );
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

    this.inspectWindow.nameEl.innerHTML = "";
    this.inspectWindow.nameEl.appendChild(this.createElementIcon(member.elements));
    const nameSpan = document.createElement('span');
    nameSpan.textContent = member.name;
    this.inspectWindow.nameEl.appendChild(nameSpan);

    // Evolution Check
    const floor = this.map.floors[this.map.floorIndex];
    const evolutionData = member.checkEvolution(this.party.inventory, floor ? floor.depth : 1);

    if (evolutionData) {
         const evoIcon = document.createElement("span");
         evoIcon.className = "icon";
         evoIcon.style.backgroundPosition = getIconStyle(6);
         evoIcon.style.display = "inline-block";
         evoIcon.style.marginLeft = "4px";
         evoIcon.title = "Evolution Available";
         this.inspectWindow.nameEl.appendChild(evoIcon);

         this.inspectWindow.btnEvolve.style.display = "inline-block";
         this.inspectWindow.btnEvolve.onclick = () => {
             this.openEvolution(member, evolutionData);
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
        this.inspectWindow.elementEl.appendChild(this.renderElements(member.elements));
    } else {
        this.inspectWindow.elementEl.textContent = "—";
    }

    const eqCount = Object.values(member.equipment).filter(e => e).length;
    if (eqCount > 0) {
      this.inspectWindow.equipEl.textContent = `${eqCount} Equipped (View)`;
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
                    tooltipText += `<br/><span class="text-functional">${effectsText}</span>`;
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
      const index = this.party.members.indexOf(member);
      if (index > -1) {
          this.party.members.splice(index, 1);
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
    this.inspectWindow.equipmentListContainerEl.style.display = "none";
    this.inspectWindow.equipmentListEl.innerHTML = "";
    this.windowManager.close(this.inspectWindow);
    this.setStatus("Exploration");
  }

  /**
   * Opens the equipment selection screen within the inspect window.
   * @method openEquipmentScreen
   */
  openEquipmentScreen() {
    this.inspectWindow.equipmentListContainerEl.style.display = "block";
    this.renderEquipmentList("All");
  }

  getSlotForType(type) {
      const map = {
          'Weapon': 'weapon', 'Melee': 'weapon',
          'Gun': 'gun',
          'Armor': 'armor', 'Suit': 'armor',
          'Head': 'head', 'Helmet': 'head',
          'Arms': 'arms', 'Gloves': 'arms',
          'Legs': 'legs', 'Boots': 'legs',
          'Accessory': 'accessory', 'Mask': 'accessory', 'Mantle': 'accessory'
      };
      return map[type] || null;
  }

  /**
   * Renders the list of available equipment.
   * @method renderEquipmentList
   * @param {string} filter - Filter by type ("All", "Weapon", etc).
   */
  renderEquipmentList(filter) {
    const listEl = this.inspectWindow.equipmentListEl;
    const filterEl = this.inspectWindow.equipmentFilterEl;
    listEl.innerHTML = "";
    filterEl.innerHTML = "";
    const member = this.inspectWindow.member;

    const itemTypes = ["All", "Weapon", "Gun", "Armor", "Head", "Arms", "Legs", "Accessory"];
    itemTypes.forEach(type => {
      const btn = document.createElement("button");
      btn.className = "win-btn";
      btn.textContent = type;
      if (filter === type) {
        btn.disabled = true;
      }
      btn.onclick = () => this.renderEquipmentList(type);
      filterEl.appendChild(btn);
    });

    const inventoryItems = this.party.inventory.filter(
      (i) => i.type === "equipment" && (filter === "All" || (i.equipType && (i.equipType === filter || this.getSlotForType(i.equipType) === this.getSlotForType(filter))))
    );

    const otherMemberItems = [];
    this.party.members.forEach(m => {
        if (m === member) return;
        Object.values(m.equipment).forEach(eq => {
            if (eq && (filter === "All" || (eq.equipType && (eq.equipType === filter || this.getSlotForType(eq.equipType) === this.getSlotForType(filter))))) {
                otherMemberItems.push({
                    ...eq,
                    equippedBy: m.name,
                    equippedMember: m
                });
            }
        });
    });

    const allEquipable = [...inventoryItems, ...otherMemberItems];

    if (allEquipable.length > 0) {
      allEquipable.forEach((item) => {
        const row = document.createElement("div");
        row.className = "shop-row";

        let tooltipText = item.description;
        let effectsText = "";
        const effects = [];
        if (item.traits) {
             item.traits.forEach(t => {
                 if (t.code === 'PARAM_PLUS') {
                     if (t.dataId === 'atk') effects.push(`Damage +${t.value}`);
                     if (t.dataId === 'maxHp') effects.push(`Max HP +${t.value}`);
                 }
             });
        }
        if (item.damageBonus) effects.push(`Damage +${item.damageBonus}`);
        if (effects.length > 0) effectsText = effects.join(", ");
        if (effectsText) tooltipText += `<br/><span class="text-functional">${effectsText}</span>`;

        const label = createInteractiveLabel(item, 'item', { tooltipText });
        row.appendChild(label);

        const extraSpan = document.createElement("span");
        let text = "";
        if (item.traits) {
             const dmg = item.traits.find(t => t.code === 'PARAM_PLUS' && t.dataId === 'atk');
             if (dmg) text += ` (+${dmg.value} DMG)`;
        }
        if (item.equippedBy) {
          text += ` (on ${item.equippedBy})`;
        }
        extraSpan.textContent = text;
        extraSpan.style.flexGrow = "1";
        row.appendChild(extraSpan);

        const btn = document.createElement("button");
        btn.className = "win-btn";
        btn.textContent = item.equippedBy ? "Swap" : "Equip";
        btn.addEventListener("click", () => {
          this.equipItem(member, item);
        });
        row.appendChild(btn);
        listEl.appendChild(row);
      });
    } else {
      listEl.innerHTML = "<p>No equipable items of this type.</p>";
    }

    const closeBtn = document.createElement("button");
    closeBtn.className = "win-btn";
    closeBtn.textContent = "Close";
    closeBtn.onclick = () => {
      this.inspectWindow.equipmentListContainerEl.style.display = "none";
      this.inspectWindow.equipmentListEl.innerHTML = "";
      this.inspectWindow.equipmentFilterEl.innerHTML = "";
    };
    listEl.appendChild(closeBtn);
  }

  /**
   * Equips an item to a member, handling swaps if necessary.
   * @method equipItem
   * @param {import("./objects.js").Game_Battler} member - The member.
   * @param {Object} item - The item to equip.
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

  confirmEvolution(member, nextBattler, evolutionData) {
      let msg = `Evolve ${member.name} into ${nextBattler.name}?`;
      if (evolutionData.item) {
          const item = this.dataManager.items.find(i => i.id === evolutionData.item);
          if (item) {
              msg += `\nConsumes ${item.name}.`;
          }
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

  executeEvolution(member, nextBattler, evolutionData) {
      if (evolutionData.item) {
          const idx = this.party.inventory.findIndex(i => i.id === evolutionData.item);
          if (idx !== -1) {
              this.party.inventory.splice(idx, 1);
          }
      }

      const index = this.party.members.indexOf(member);
      if (index !== -1) {
          nextBattler.xp = member.xp;
          nextBattler.equipment = { ...member.equipment };

          this.party.members[index] = nextBattler;

          this.logMessage(`[Evolution] ${member.name} evolved into ${nextBattler.name}!`);
          SoundManager.beep(800, 300);

          this.windowManager.close(this.evolutionWindow);
          this.updateAll();
      }
  }

  equipItem(member, item) {
    const slot = this.getSlotForType(item.equipType);
    if (!slot) {
        this.logMessage("Cannot equip: Unknown slot type.");
        return;
    }

    const doEquip = () => {
      // Unequip current item if one exists
      const current = member.equipment[slot];
      if (current) {
        this.party.inventory.push(current);
        SoundManager.beep(600, 80); // Unequip sound
      }
      // Equip the new item
      member.equipment[slot] = item;
      // Remove the new item from inventory
      const invIndex = this.party.inventory.findIndex((i) => i.id === item.id);
      if (invIndex > -1) {
        this.party.inventory.splice(invIndex, 1);
      }
      this.logMessage(`[Equip] ${member.name} equipped ${item.name}.`);
      this.openInspect(member, this.party.members.indexOf(member)); // Refresh inspect window
      this.openEquipmentScreen(); // Re-open equipment list
      this.updateAll();
      SoundManager.beep(800, 100); // Equip sound
    };

    // If the item is equipped by another member, show confirmation
    if (item.equippedMember) {
      const otherMember = item.equippedMember;
      this.confirmWindow.titleEl.textContent = "Confirm Swap";
      this.confirmWindow.messageEl.textContent = `Swap ${item.name} from ${otherMember.name} to ${member.name}?`;
      this.windowManager.push(this.confirmWindow);
      this.confirmWindow.btnOk.onclick = () => {
        const currentItem = member.equipment[slot];
        otherMember.equipment[slot] = currentItem;
        member.equipment[slot] = item;
        this.logMessage(
          `[Equip] ${member.name} swapped ${item.name} with ${otherMember.name}.`
        );
        this.windowManager.close(this.confirmWindow);
        this.openInspect(member, this.party.members.indexOf(member)); // Refresh inspect window
        this.openEquipmentScreen(); // Re-open equipment list
        this.updateAll();
        SoundManager.beep(700, 150); // Swap sound
      };
      this.confirmWindow.btnCancel.onclick = () => {
        this.windowManager.close(this.confirmWindow);
      };
    } else {
      doEquip();
    }
  }
}

if (window.location.search.includes("test=true")) {
    window.Scene_Battle = Scene_Battle;
    window.Scene_Shop = Scene_Shop;
    window.Scene_Map = Scene_Map;
    window.Scene_Boot = Scene_Boot;
}
