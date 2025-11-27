import { Game_Map, Game_Party, Game_Battler } from "./objects.js";
import { randInt, shuffleArray, getPrimaryElements, elementToAscii, elementToIconId, getIconStyle } from "./core.js";
import { BattleManager, SoundManager } from "./managers.js";
import {
  Window_Battle,
  Window_Shop,
  Window_Event,
  Window_Recruit,
  Window_Formation,
  Window_Inventory,
  Window_Inspect,
  Window_Confirm,
  WindowLayer,
} from "./windows.js";
import { tooltip } from "./tooltip.js";

/**
 * @class Scene_Base
 * @description The base class for all scenes.
 */
class Scene_Base {
  /**
   * @param {import("./managers.js").DataManager} dataManager - The data manager instance.
   * @param {import("./windows.js").WindowManager} windowManager - The window manager instance.
   */
  constructor(dataManager, windowManager) {
    this.dataManager = dataManager;
    this.windowManager = windowManager;
  }

  /**
   * @method start
   * @description Starts the scene.
   */
  start() {
    // To be implemented by subclasses
  }

  /**
   * @method update
   * @description Updates the scene.
   */
  update() {
    // To be implemented by subclasses
  }

  stop() {
    // To be implemented by subclasses
  }
}

/**
 * @class Scene_Boot
 * @description The scene class for the boot sequence.
 * @extends Scene_Base
 */
export class Scene_Boot extends Scene_Base {
    /**
     * @param {import("./managers.js").DataManager} dataManager - The data manager instance.
     * @param {import("./managers.js").SceneManager} sceneManager - The scene manager instance.
     * @param {import("./windows.js").WindowManager} windowManager - The window manager instance.
     */
    constructor(dataManager, sceneManager, windowManager) {
        super(dataManager, windowManager);
        this.sceneManager = sceneManager;
    }

    /**
     * @method start
     * @description Starts the scene.
     */
    async start() {
        await this.dataManager.loadData();
        this.sceneManager.push(new Scene_Map(this.dataManager, this.sceneManager, this.windowManager));
    }
}

/**
 * @class Scene_Battle
 * @description The scene class for battles.
 * @extends Scene_Base
 */
export class Scene_Battle extends Scene_Base {
  /**
   * @param {import("./managers.js").DataManager} dataManager - The data manager instance.
   * @param {import("./managers.js").SceneManager} sceneManager - The scene manager instance.
   * @param {import("./windows.js").WindowManager} windowManager - The window manager instance.
   * @param {import("./objects.js").Game_Party} party - The player's party.
   * @param {import("./managers.js").BattleManager} battleManager - The battle manager instance.
   * @param {import("./windows.js").WindowLayer} windowLayer - The window layer instance.
   * @param {import("./objects.js").Game_Map} map - The game map instance.
   * @param {number} tileX - The x-coordinate of the tile the battle is on.
   * @param {number} tileY - The y-coordinate of the tile the battle is on.
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
   * @method start
   * @description Starts the scene.
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
      const maxEnemies = this.map.floorIndex === 0 ? 2 : 3;
      const enemyCount = randInt(1, maxEnemies);
      for (let i = 0; i < enemyCount; i++) {
        const tpl = actorTemplates[randInt(0, actorTemplates.length - 1)];
        enemies.push(new Game_Battler(tpl, depth, true));
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
   * @method stop
   * @description Stops the scene.
   */
  stop() {
    this.windowManager.close(this.battleWindow);
    document.getElementById("mode-label").textContent = "Exploration";
  }

  /**
   * @method renderBattleAscii
   * @description Renders the battle screen by creating and positioning DOM elements.
   */
  renderBattleAscii() {
    if (!this.battleManager) return;
    const enemies = this.battleManager.enemies;
    this.battleWindow.refresh(enemies, this.party.members.slice(0, 4));
  }

  /**
   * @method resolveBattleRound
   * @description Resolves a round of battle.
   * Refactored to use the granular BattleManager API (startRound -> getNextBattler -> startTurn -> executeAction).
   * This structure supports future player input by isolating the "Plan Action" step.
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
   * @method animateEvents
   * @description Helper to animate a list of battle events.
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
   * @method applyPostBattlePassives
   * @description This is an example of a passive skill being triggered.
   * It is called after a battle victory.
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
   * @method applyBattleStartPassives
   * @description Applies passive skills that trigger at the start of battle.
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
   * @method attemptFlee
   * @description Attempts to flee from battle.
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
   * @method onBattleVictoryClick
   * @description Handles the click of the victory button.
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
    this.sceneManager.previous().updateAll();

    this.applyPostBattlePassives();

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
   * @method clearEnemyTileAfterBattle
   * @description Clears the enemy tile after a battle.
   */
  clearEnemyTileAfterBattle() {
    if (!this.battleManager) return;
    const f = this.map.floors[this.map.floorIndex];
    const { tileX, tileY } = this.battleManager;
    if (f.tiles[tileY][tileX] === "E") {
      f.tiles[tileY][tileX] = ".";
    }
    this.map.revealAroundPlayer(f);
    this.sceneManager.previous().updateGrid();
  }

  /**
   * @method animateBattleHpGauge
   * @description Animates the battle HP gauge.
   * @param {Game_Battler} battler - The battler whose HP gauge to animate.
   * @param {number} oldHp - The old HP of the battler.
   * @returns {Promise} A promise that resolves when the animation is complete.
   */
  animateBattleHpGauge(battler, startHp, endHp) {
    return new Promise((resolve) => {
      const duration = 500;
      const interval = 30;
      let elapsed = 0;

      // Determine ID to target specific element for override
      const enemyIndex = this.battleManager.enemies.indexOf(battler);
      const partyIndex = this.party.members.indexOf(battler);
      let overrideId = null;
      if (enemyIndex !== -1) overrideId = `battler-enemy-${enemyIndex}`;
      else if (partyIndex !== -1) overrideId = `battler-party-${partyIndex}`;

      const interpolator = () => {
        elapsed += interval;
        const progress = Math.min(elapsed / duration, 1);
        const currentHp = Math.round(startHp + (endHp - startHp) * progress);

        // We only want to update the specific battler's display, not the whole window
        // But renderBattleAscii refreshes everything.
        // Let's modify renderBattleAscii to accept overrides?
        // Or just manipulate the DOM directly here since we have unique IDs now.

        if (overrideId) {
             const element = this.battleWindow.viewportEl.querySelector(`#${overrideId}`);
             if (element) {
                 // We need to find the HP gauge container next to or inside the battler container
                 // In Window_Battle.refresh:
                 // <div class="battler-container" ...>
                 //    <div class="battler-name">...<span id="battler-X">Name</span>...</div>
                 //    <div class="battler-hp">[#####     ]</div>
                 // </div>

                 const container = element.closest('.battler-container');
                 if (container) {
                     const hpEl = container.querySelector('.battler-hp');
                     if (hpEl) {
                         hpEl.textContent = this.battleWindow.createHpGauge(currentHp, battler.maxHp);
                     }
                     // Update text as well? "HP X/Y"
                     // The text is inside battler-name.
                     // <div class="battler-name">...(HP X/Y)</div>
                     // It's a bit hard to parse out without structured HTML.
                     // But visual gauge is most important.
                 }
             }
        }

        if (progress < 1) {
          setTimeout(interpolator, interval);
        } else {
          // Final sync
          this.renderBattleAscii();
          resolve();
        }
      };

      interpolator();
    });
  }

  /**
   * @method animateBattler
   * @description Applies a temporary animation to a battler's name element.
   * @param {Game_Battler} battler - The battler to animate.
   * @param {string} animationType - The type of animation ('flash', 'shake', etc.).
   */
  animateBattler(battler, animationType) {
    // Find unique ID
    const enemyIndex = this.battleManager.enemies.indexOf(battler);
    const partyIndex = this.party.members.indexOf(battler);
    let battlerId = null;

    if (enemyIndex !== -1) {
        battlerId = `battler-enemy-${enemyIndex}`;
    } else if (partyIndex !== -1) {
        battlerId = `battler-party-${partyIndex}`;
    }

    // Fallback (should not happen if consistent)
    if (!battlerId) {
        battlerId = `battler-${battler.name.replace(/\s/g, '-')}`;
    }

    const battlerElement = this.battleWindow.viewportEl.querySelector(`#${battlerId}`);

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
        // Add other animation cases here
        default:
          return; // No valid animation type provided
      }

      battlerElement.classList.add(animationClass);
      setTimeout(() => {
        battlerElement.classList.remove(animationClass);
      }, duration);
    }
  }

  /**
   * @method animateBattlerName
   * @description Animates the name of a battler.
   * @param {Game_Battler} battler - The battler whose name to animate.
   * @returns {Promise} A promise that resolves when the animation is complete.
   */
  animateBattlerName(battler) {
    return new Promise((resolve) => {
      const originalName = battler.name;
      let frame = 0;
      const maxFrames = 15;
      const interval = 50;

      // Find the element once
      const enemyIndex = this.battleManager.enemies.indexOf(battler);
      const partyIndex = this.party.members.indexOf(battler);
      let elementId = null;
      if (enemyIndex !== -1) elementId = `battler-enemy-${enemyIndex}`;
      else if (partyIndex !== -1) elementId = `battler-party-${partyIndex}`;

      const nameEl = elementId ? this.battleWindow.viewportEl.querySelector(`#${elementId}`) : null;

      const animator = () => {
        if (frame >= maxFrames) {
          battler.name = originalName;
          if (nameEl) nameEl.textContent = originalName;
          else this.renderBattleAscii(); // Fallback if element not found
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

        // Update DOM directly to avoid full re-render which would snap HP to current state
        if (nameEl) {
            nameEl.textContent = newName;
        } else {
            battler.name = newName; // Only update object if we rely on renderBattleAscii
            this.renderBattleAscii();
        }

        frame++;
        setTimeout(animator, interval);
      };

      animator();
    });
  }

  /**
   * @method playAnimation
   * @description Plays a data-driven animation on a target.
   * @param {Game_Battler} target - The target of the animation.
   * @param {string} animationId - The ID of the animation to play.
   */
  playAnimation(target, animationId) {
       return new Promise((resolve) => {
           if (!this.dataManager.animations || !this.dataManager.animations[animationId]) {
               resolve();
               return;
           }

           const anim = this.dataManager.animations[animationId];

           // Find target element
           const enemyIndex = this.battleManager.enemies.indexOf(target);
           const partyIndex = this.party.members.indexOf(target);
           let battlerId = null;
           if (enemyIndex !== -1) battlerId = `battler-enemy-${enemyIndex}`;
           else if (partyIndex !== -1) battlerId = `battler-party-${partyIndex}`;

           if (!battlerId) { resolve(); return; }

           const battlerElement = this.battleWindow.viewportEl.querySelector(`#${battlerId}`);
           if (!battlerElement) { resolve(); return; }

           // Find sub-element if specified
           let targetEl = battlerElement;
           let preserveBrackets = false;
           if (anim.targetPart === "hp_gauge") {
                const container = battlerElement.closest('.battler-container');
                if (container) {
                    const hpEl = container.querySelector('.battler-hp');
                    if (hpEl) {
                        targetEl = hpEl;
                        preserveBrackets = true;
                    }
                }
           }

           if (anim.type === "text_flow" || anim.type === "text_flow_liquid") {
               const originalText = targetEl.textContent;
               const duration = anim.duration || 1000;
               const interval = anim.interval || 50;
               const sequence = anim.sequence || "*";
               const color = anim.color || "";

               if (color) targetEl.style.color = color;

               // Setup for fixed width preservation
               let animationContainer = targetEl;
               let contentLen = originalText.length;

               if (preserveBrackets && originalText.startsWith("[") && originalText.endsWith("]")) {
                   contentLen = originalText.length - 2;
                   const innerContent = originalText.substring(1, originalText.length - 1);

                   // Measure width of inner content
                   const measureSpan = document.createElement("span");
                   measureSpan.style.visibility = "hidden";
                   measureSpan.style.position = "absolute";
                   measureSpan.style.whiteSpace = "pre";
                   measureSpan.textContent = innerContent;
                   targetEl.appendChild(measureSpan);
                   const width = measureSpan.getBoundingClientRect().width;
                   targetEl.removeChild(measureSpan);

                   // Create wrapper structure
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
                       // Liquid Flow: Characters move at different speeds (sine wave offset)
                       for (let i = 0; i < contentLen; i++) {
                           // Use sine wave to determine which char from sequence to pick
                           // Speed factor depends on time
                           const timeFactor = elapsed / 100;
                           // Spatial frequency
                           const wave = Math.sin(i * 0.5 + timeFactor);
                           // Map wave (-1 to 1) to sequence index
                           // We want a flowing effect, so index should increase with time
                           const index = Math.floor(i + timeFactor * 2 + wave * 2) % sequence.length;
                           // JS modulo of negative numbers behaves weirdly, ensure positive
                           const safeIndex = (index + sequence.length * 100) % sequence.length;
                           frameContent += sequence[safeIndex];
                       }
                   } else {
                       // Standard Text Flow
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
 * @description The scene class for shops.
 * @extends Scene_Base
 */
export class Scene_Shop extends Scene_Base {
    /**
     * @param {import("./managers.js").DataManager} dataManager - The data manager instance.
     * @param {import("./managers.js").SceneManager} sceneManager - The scene manager instance.
     * @param {import("./windows.js").WindowManager} windowManager - The window manager instance.
     * @param {import("./objects.js").Game_Party} party - The player's party.
     * @param {import("./windows.js").WindowLayer} windowLayer - The window layer instance.
     */
    constructor(dataManager, sceneManager, windowManager, party, windowLayer) {
        super(dataManager, windowManager);
        this.sceneManager = sceneManager;
        this.party = party;
        this.windowLayer = windowLayer;

        this.shopWindow = new Window_Shop();
        this.windowLayer.addChild(this.shopWindow);

        this.shopWindow.btnClose.addEventListener("click", this.closeShop.bind(this));
        this.shopWindow.btnLeave.addEventListener("click", this.closeShop.bind(this));
    }

    /**
     * @method start
     * @description Starts the scene.
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
     * @method stop
     * @description Stops the scene.
     */
    stop() {
        this.windowManager.close(this.shopWindow);
        document.getElementById("mode-label").textContent = "Exploration";
    }

    /**
     * @method closeShop
     * @description Closes the shop.
     */
    closeShop() {
        this.sceneManager.pop();
        if (this.sceneManager.currentScene() && this.sceneManager.currentScene().updateAll) {
            this.sceneManager.currentScene().updateAll();
        }
    }

    /**
     * @method buyItem
     * @description Buys an item from the shop.
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
 * @class Scene_Map
 * @description The main scene for map exploration. This class is currently a "God Class"
 * that handles exploration, battles, shops, and more. The long-term goal is to refactor
 * this class into a more specialized Scene_Map that only handles exploration, with other
 * systems (battle, shop, etc.) being moved into their own dedicated scenes and managers
 * as outlined in the design document.
 * @extends Scene_Base
 */
export class Scene_Map extends Scene_Base {
  /**
   * @param {import("./managers.js").DataManager} dataManager - The data manager instance.
   * @param {import("./managers.js").SceneManager} sceneManager - The scene manager instance.
   * @param {import("./windows.js").WindowManager} windowManager - The window manager instance.
   */
  constructor(dataManager, sceneManager, windowManager) {
    super(dataManager, windowManager);
    this.sceneManager = sceneManager;
    this.map = new Game_Map();
    this.party = new Game_Party();
    this.battleManager = new BattleManager(this.party, this.dataManager);
    this.runActive = true;
    this.draggedIndex = null;

    this.createUI();
    this.getDomElements();
    this.addEventListeners();

    this.windowLayer = new WindowLayer();
    const gameContainer = document.querySelector(".right-side");
    this.windowLayer.appendTo(gameContainer);

    this.inventoryWindow = new Window_Inventory();
    this.windowLayer.addChild(this.inventoryWindow);
    this.eventWindow = new Window_Event();
    this.windowLayer.addChild(this.eventWindow);
    this.recruitWindow = new Window_Recruit();
    this.windowLayer.addChild(this.recruitWindow)
    this.formationWindow = new Window_Formation();
    this.windowLayer.addChild(this.formationWindow)
    this.inspectWindow = new Window_Inspect();
    this.windowLayer.addChild(this.inspectWindow)
    this.confirmWindow = new Window_Confirm();
    this.windowLayer.addChild(this.confirmWindow);

    this.recruitWindow.btnClose.addEventListener(
      "click",
      this.closeRecruitEvent.bind(this)
    );

    this.formationWindow.btnClose.addEventListener(
      "click",
      this.closeFormation.bind(this)
    );

    this.confirmWindow.btnClose.addEventListener(
      "click",
      () => this.windowManager.close(this.confirmWindow)
    );
    this.formationWindow.btnOk.addEventListener(
      "click",
      this.closeFormation.bind(this)
    );
    this.formationWindow.btnCancel.addEventListener(
      "click",
      this.closeFormation.bind(this)
    );

    this.inventoryWindow.btnClose.addEventListener(
      "click",
      this.closeInventory.bind(this)
    );
    this.inventoryWindow.btnClose2.addEventListener(
      "click",
      this.closeInventory.bind(this)
    );
  }

  createUI() {
    const gameContainer = document.getElementById("game-container");
    gameContainer.innerHTML = `
      <div class="stack-nav panel">
        <h1>Stillnight Stack</h1>
        <div class="group-box">
          <legend>Run</legend>
          <div class="stack-nav-buttons">
            <button class="win-btn" id="btn-new-run">New Run</button>
            <button class="win-btn" id="btn-reveal-all">Reveal</button>
          </div>
          <div style="margin-top:4px;">
            <div>Card: <span id="card-index-label">1 / 1</span></div>
            <div>Floor depth: <span id="card-depth-label">1</span></div>
          </div>
        </div>
        <div class="group-box">
          <legend>Cards (Floors)</legend>
          <div class="card-list" id="card-list"></div>
        </div>
        <div class="group-box">
          <legend>Short Help</legend>
          <div class="info-box">
            • Each floor is a card.<br>
            • ☺ is your party (highlighted).<br>
            • Click adjacent tiles to move.<br>
            • E triggers a battle.<br>
            • R heals, S descends.<br>
            • ¥ opens a shop.<br>
            • Front row hits harder,<br>
            &nbsp;&nbsp;back row is safer.<br>
            • Floors are reachable only<br>
            &nbsp;&nbsp;if you've reached their<br>
            &nbsp;&nbsp;stairs at least once.<br>
            • Shrines may offer<br>
            &nbsp;&nbsp;mysterious events.<br>
            • Boss awaits at the deepest floor.
          </div>
        </div>
      </div>
      <div class="right-side">
        <div class="card-area">
          <div class="card-main panel">
            <div class="card-header">
              <div>
                <span class="card-header-title" id="card-title">Floor 1</span>
              </div>
              <div>
                <span class="label">Mode:</span>
                <span id="mode-label">Exploration</span>
              </div>
            </div>
            <div class="exploration-frame panel">
              <div class="exploration-grid" id="exploration-grid"></div>
              <div class="legend">
                <span>☺ = Party</span>
                <span>█ = Wall</span>
                <span>E = Enemy</span>
                <span>R = Recovery</span>
                <span>S = Stairs</span>
                <span>♱ = Shrine</span>
                <span>¥ = Shop</span>
                <span>? = Unseen</span>
                <span>U = Recruit</span>
              </div>
            </div>
          </div>
          <div class="card-side-panels">
            <div class="party-panel panel">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span>Party Status (click to inspect)</span>
                <button class="win-btn" style="font-size:10px; padding:0 6px;" id="btn-formation">
                  Formation...
                </button>
                <button class="win-btn" style="font-size:10px; padding:0 6px;" id="btn-inventory">
                  Inventory...
                </button>
              </div>
              <div class="party-grid" id="party-grid"></div>
            </div>
            <div class="log-panel panel">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span>Event Log</span>
                <button class="win-btn" style="font-size:10px; padding:0 6px;" id="btn-clear-log">
                  Clear
                </button>
              </div>
              <div class="log-content" id="log-content"></div>
            </div>
          </div>
        </div>
        <div class="status-bar">
          <div>
            <span id="status-message">Ready.</span>
          </div>
          <div>
            <span>Gold: <span id="status-gold">0</span></span>
            <span>| Floor: <span id="status-floor">1</span></span>
            <span>| Cards: <span id="status-cards">1</span></span>
            <span>| Run: <span id="status-run">Active</span></span>
            <span>| Items: <span id="status-items">0</span></span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * @method start
   * @description Starts the scene.
   */
  start() {
    this.startNewRun();
  }

  /**
   * @method startNewRun
   * @description Starts a new game run.
   */
  startNewRun() {
    if (this.sceneManager.currentScene() !== this) return;
    this.map.initFloors(this.dataManager.floors);
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
   * @method getDomElements
   * @description Gets all the DOM elements needed for the scene.
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
   * @method addEventListeners
   * @description Adds event listeners to the DOM elements.
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
    document.addEventListener("keydown", this.onKeyDown.bind(this));
  }

  /**
   * @method onKeyDown
   * @description Handles keydown events.
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
   * @method movePlayer
   * @description Moves the player on the map.
   * @param {number} dx - The change in the x-coordinate.
   * @param {number} dy - The change in the y-coordinate.
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
   * @method logMessage
   * @description Logs a message to the event log.
   * @param {string} msg - The message to log.
   */
  logMessage(msg) {
    this.logEl.textContent += msg + "\n";
    this.logEl.scrollTop = this.logEl.scrollHeight;
  }

  /**
   * @method setStatus
   * @description Sets the status message.
   * @param {string} msg - The status message.
   */
  setStatus(msg) {
    this.statusMessageEl.textContent = msg;
  }

  /**
   * @method updateAll
   * @description Updates all the UI elements.
   */
  updateAll() {
    this.updateGrid();
    this.updateCardHeader();
    this.updateCardList();
    this.updateParty();
    this.statusGoldEl.textContent = this.party.gold;
    this.statusItemsEl.textContent = this.party.inventory.length;
    this.statusRunEl.textContent = this.runActive ? "Active" : "Over";
    this.modeLabelEl.textContent = "Exploration";
  }

  /**
   * @method updateGrid
   * @description Updates the exploration grid.
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

        if (!visited && !isPlayer) {
          tileEl.classList.add("tile-fog");
          tileEl.textContent = "?";
        } else {
          let symbol = " ";
          switch (ch) {
            case "#":
              symbol = "█";
              break;
            case ".":
              symbol = " ";
              break;
            case "E":
              symbol = "E";
              tileEl.classList.add("tile-enemy");
              break;
            case "S":
              symbol = "S";
              tileEl.classList.add("tile-stairs");
              break;
            case "R":
              symbol = "R";
              tileEl.classList.add("tile-recovery");
              break;
            case "♱":
              symbol = "♱";
              tileEl.classList.add("tile-shrine");
              break;
            case "¥":
              symbol = "¥";
              tileEl.classList.add("tile-shop");
              break;
            case "U":
              symbol = "U";
              tileEl.classList.add("tile-recruit");
              break;
            default:
              symbol = " ";
              break;
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
   * @method updateCardHeader
   * @description Updates the card header.
   */
  updateCardHeader() {
    const floor = this.map.floors[this.map.floorIndex];
    this.cardTitleEl.textContent = floor.title;
    this.cardIndexLabelEl.textContent = `${this.map.floorIndex + 1} / ${
      this.map.floors.length
    }`;
    this.cardDepthLabelEl.textContent = floor.depth;
    this.statusFloorEl.textContent = floor.depth;
    this.statusCardsEl.textContent = this.map.floors.length;
  }

  /**
   * @method updateCardList
   * @description Updates the card list.
   */
  updateCardList() {
    this.cardListEl.innerHTML = "";
    this.map.floors.forEach((f, idx) => {
      const item = document.createElement("div");
      let cls = "card-item";
      if (idx === this.map.floorIndex) cls += " selected";
      if (!f.discovered) cls += " disabled";
      item.className = cls;
      const title = f.discovered ? f.title : "Unknown Floor";
      item.textContent = `${idx + 1}. ${title}`;

      if (f.discovered && idx <= this.map.maxReachedFloorIndex) {
        item.addEventListener("click", () => {
          this.map.floorIndex = idx;
          const floor = this.map.floors[this.map.floorIndex];
          this.map.playerX = floor.startX;
          this.map.playerY = floor.startY;
          this.map.revealAroundPlayer();
          this.logMessage(
            `[Navigate] You flip to card ${idx + 1} (${floor.title}).`
          );
          SoundManager.beep(550, 120);
          this.updateAll();
        });
      }

      this.cardListEl.appendChild(item);
    });
  }

  /**
   * @method updateParty
   * @description Updates the party display.
   */
  updateParty() {
    this.partyGridEl.innerHTML = "";
    this.party.members.slice(0, 4).forEach((member, index) => {
      const slot = document.createElement("div");
      slot.className = "party-slot";
      slot.dataset.index = index;
      slot.dataset.testid = `party-slot-${index}`;

      const portrait = document.createElement("div");
      portrait.className = "party-slot-portrait";
      portrait.style.backgroundImage = `url('assets/portraits/${
        member.spriteKey || "pixie"
      }.png')`;

      const info = document.createElement("div");
      info.className = "party-slot-info";

      const nameEl = document.createElement("div");
      nameEl.className = "party-slot-name";
      const elementIcon = this.createElementIcon(member.elements);
      nameEl.appendChild(elementIcon);
      const nameSpan = document.createElement('span');
      nameSpan.textContent = member.name;
      nameEl.appendChild(nameSpan);

      const hpLabel = document.createElement("div");
      const row = this.partyRow(index);
      hpLabel.textContent = `Lv${member.level} (${row})  HP ${member.hp}/${member.maxHp}`;

      const hpBar = document.createElement("div");
      hpBar.className = "hp-bar";
      const hpFill = document.createElement("div");
      hpFill.className = "hp-fill";
      hpFill.style.width = `${Math.max(
        0,
        ((member.prevHp || member.hp) / member.maxHp) * 100
      )}%`;
      this.animateHpGauge(
        hpFill,
        member.prevHp || member.hp,
        member.hp,
        member.maxHp,
        500
      );
      member.prevHp = member.hp;
      hpBar.appendChild(hpFill);

      info.appendChild(nameEl);
      info.appendChild(hpLabel);
      info.appendChild(hpBar);

      slot.appendChild(portrait);
      slot.appendChild(info);

      slot.addEventListener("click", () => this.openInspect(member, index));
      this.partyGridEl.appendChild(slot);
    });
  }

  /**
   * @method animateHpGauge
   * @description Animates the HP gauge.
   * @param {HTMLElement} element - The HP gauge element.
   * @param {number} startHp - The starting HP.
   * @param {number} endHp - The ending HP.
   * @param {number} maxHp - The maximum HP.
   * @param {number} duration - The duration of the animation.
   */
  animateHpGauge(element, startHp, endHp, maxHp, duration) {
    const startTime = performance.now();
    const startWidth = (startHp / maxHp) * 100;
    const endWidth = (endHp / maxHp) * 100;

    const frame = (currentTime) => {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      const currentWidth = startWidth + (endWidth - startWidth) * progress;
      element.style.width = `${currentWidth}%`;

      if (progress < 1) {
        requestAnimationFrame(frame);
      }
    };

    requestAnimationFrame(frame);
  }

  /**
   * @method animateBattleHpGauge
   * @description Animates the battle HP gauge.
   * @param {Game_Battler} battler - The battler whose HP gauge to animate.
   * @param {number} oldHp - The old HP of the battler.
   * @returns {Promise} A promise that resolves when the animation is complete.
   */
  /**
   * @method onTileClick
   * @description Handles tile clicks.
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

    if (ch === "#") {
      this.setStatus(this.dataManager.terms.log.wall_blocks);
      SoundManager.beep(180, 80);
      return;
    }

    this.map.playerX = x;
    this.map.playerY = y;
    this.map.revealAroundPlayer();
    this.updateGrid();

    if (ch === ".") {
      this.logMessage("[Step] Your footsteps echo softly.");
      this.setStatus("You move.");
    } else if (ch === "R") {
      this.party.members.forEach((m) => (m.hp = m.maxHp));
      this.logMessage("[Recover] A soft glow restores your party.");
      this.party.members.forEach((member) => {
        const xpBonus = member.getPassiveValue("RECOVERY_XP_BONUS");
        if (xpBonus > 0) {
          this.gainXp(member, xpBonus);
          this.logMessage(
            `[Passive] ${member.name} gains ${xpBonus} bonus XP.`
          );
        }
      });
      this.setStatus("Recovered HP.");
    } else if (ch === "S") {
      this.descendStairs();
      SoundManager.beep(800, 150);
      return;
    } else if (ch === "E") {
      this.setStatus("Enemy encountered!");
      this.logMessage("[Battle] Shapes uncoil from the dark.");
      this.sceneManager.push(new Scene_Battle(this.dataManager, this.sceneManager, this.windowManager, this.party, this.battleManager, this.windowLayer, this.map, x, y));
      return;
    } else if (ch === "¥") {
      this.sceneManager.push(new Scene_Shop(this.dataManager, this.sceneManager, this.windowManager, this.party, this.windowLayer));
      return;
    } else if (ch === "♱") {
      this.logMessage("[Shrine] You encounter a shrine.");
      this.openShrineEvent();
      return;
    } else if (ch === "U") {
      this.openRecruitEvent();
      return;
    }

    SoundManager.beep(600, 80);
    this.applyMovePassives();
    this.updateAll();
  }

  /**
   * @method descendStairs
   * @description Descends to the next floor.
   */
  descendStairs() {
    if (this.map.floorIndex + 1 >= this.map.floors.length) {
      this.logMessage(
        "[Floor] You find no further descent. The run ends here."
      );
      this.runActive = false;
      this.setStatus("No deeper floors. Run over (for now).");
      this.updateAll();
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
    this.logMessage(`[Floor] You descend to: ${f.title}`);
    this.logMessage(`[Floor] ${f.intro}`);
    this.setStatus("Descending.");
    SoundManager.beep(800, 150);
    this.updateAll();
  }

  /**
   * @method revealAllFloors
   * @description Reveals all floors.
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
   * @method openBattle
   * @description Opens the battle screen.
   * @param {number} tileX - The x-coordinate of the tile the battle is on.
   * @param {number} tileY - The y-coordinate of the tile the battle is on.
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
   * @method applyMovePassives
   * @description Applies passive skills that trigger on movement.
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
   * @method getFleeChance
   * @description Gets the chance to flee from battle.
   * @returns {number} The chance to flee from battle.
   */
  getFleeChance() {
    let baseChance = 0.5;
    this.party.members.forEach((member) => {
      baseChance += member.getPassiveValue("FLEE_CHANCE_BONUS");
    });
    return Math.max(0, Math.min(1, baseChance));
  }

  /**
   * @method openShrineEvent
   * @description Opens a shrine event.
   */
  openShrineEvent() {
    if (this.dataManager.events.length === 0) {
      this.logMessage(this.dataManager.terms.shrine.silent);
      return;
    }
    const ev =
      this.dataManager.events[randInt(0, this.dataManager.events.length - 1)];
    this.eventWindow.titleEl.textContent = ev.title;
    this.eventWindow.descriptionEl.textContent = ev.description;
    this.eventWindow.choicesEl.innerHTML = "";
    ev.choices.forEach((ch) => {
      const btn = document.createElement("button");
      btn.className = "win-btn";
      btn.textContent = ch.label;
      btn.addEventListener("click", () => {
        this.applyEventEffect(ch.effect);
        this.closeEvent();
      });
      this.eventWindow.choicesEl.appendChild(btn);
    });
    this.windowManager.push(this.eventWindow);
    this.setStatus("Shrine event.");
    SoundManager.beep(700, 150);
  }

  /**
   * @method applyEventEffect
   * @description Applies the effect of an event.
   * @param {Object} effect - The effect to apply.
   */
  applyEventEffect(effect) {
    switch (effect.type) {
      case "hp":
        this.party.members.forEach((m) => (m.hp += effect.value));
        this.logMessage(
          this.dataManager.terms.shrine.hp_change.replace("{0}", effect.value)
        );
        break;
      case "maxHp":
        this.party.members.forEach((m) => (m.maxHp += effect.value));
        this.logMessage(
          this.dataManager.terms.shrine.max_hp_change.replace(
            "{0}",
            effect.value
          )
        );
        break;
      case "xp":
        this.party.members.forEach((m) => this.gainXp(m, effect.value));
        this.logMessage(
          this.dataManager.terms.shrine.xp_gain.replace("{0}", effect.value)
        );
        break;
      case "gold":
        this.party.gold += effect.value;
        this.logMessage(
          this.dataManager.terms.shrine.gold_gain.replace("{0}", effect.value)
        );
        if (effect.onSuccess) {
          this.applyEventEffect(effect.onSuccess);
        }
        break;
      case "message":
        this.logMessage(effect.value);
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
          this.applyEventEffect(outcome.effect);
        }
        break;
      case "multi":
        effect.effects.forEach((e) => this.applyEventEffect(e));
        break;
    }
    this.updateAll();
  }

  /**
   * @method closeEvent
   * @description Closes the event window.
   */
  closeEvent() {
    this.windowManager.close(this.eventWindow);
    this.updateAll();
  }

  /**
   * @method openRecruitEvent
   * @description Opens a recruit event.
   */
  openRecruitEvent() {
    const availableCreatures = this.dataManager.actors.filter(creature => !creature.isEnemy);
    if (availableCreatures.length === 0) {
      this.logMessage(this.dataManager.terms.recruit.no_one_here);
      return;
    }
    const recruit = availableCreatures[randInt(0, availableCreatures.length - 1)];
    const cost = randInt(25, 75);
    this.recruitWindow.bodyEl.innerHTML = `
      <div class="inspect-layout">
        <div class="inspect-sprite" style="background-image: url('assets/portraits/${
          recruit.spriteKey || "pixie"
        }.png')"></div>
        <div class="inspect-fields">
          <div class="inspect-row">
            <span class="inspect-label">Name</span>
            <span id="recruit-name" class="inspect-value"></span>
          </div>
          <div class="inspect-row">
            <span class="inspect-label">Level</span>
            <span class="inspect-value">${recruit.level}</span>
          </div>
          <div class="inspect-row">
            <span class="inspect-label">Role</span>
            <span class="inspect-value">${recruit.role}</span>
          </div>
          <div class="inspect-row">
            <span class="inspect-label">HP</span>
            <span class="inspect-value">${recruit.maxHp} / ${
      recruit.maxHp
    }</span>
          </div>
          <div class="inspect-row">
            <span class="inspect-label">Element</span>
            <span id="recruit-element-icon" class="inspect-value"></span>
          </div>
          <div class="inspect-row">
            <span class="inspect-label">Equipment</span>
            <span class="inspect-value">${recruit.equipment || "—"}</span>
          </div>
          <div class="inspect-row">
            <span class="inspect-label">Passive</span>
            <span class="inspect-value">${(recruit.passives || []).map(p => p.description).join(', ') || "—"}</span>
          </div>
          <div class="inspect-row">
            <span class="inspect-label">Skills</span>
            <span class="inspect-value">${
              (recruit.skills && recruit.skills.length)
                ? recruit.skills
                    .map((s) => this.formatSkillName(s))
                    .join(", ")
                : "—"
            }</span>
          </div>
          <div class="inspect-row">
            <span class="inspect-label">Flavor</span>
            <span class="inspect-value">${recruit.flavor || "—"}</span>
          </div>
        </div>
      </div>
    `;
    this.recruitWindow.buttonsEl.innerHTML = "";
    const joinBtn = document.createElement("button");
    joinBtn.className = "win-btn";
    joinBtn.textContent = `Pay ${cost} Gold`;
    joinBtn.addEventListener("click", () => {
      if (this.party.gold >= cost) {
        this.party.gold -= cost;
        this.attemptRecruit(recruit);
      } else {
        this.logMessage(`[Recruit] You don't have enough gold.`);
        this.closeRecruitEvent();
      }
    });
    const declineBtn = document.createElement("button");
    declineBtn.className = "win-btn";
    declineBtn.textContent = "Decline";
    declineBtn.addEventListener("click", () => {
      this.logMessage(`[Recruit] You decline ${recruit.name}'s offer.`);
      this.closeRecruitEvent();
    });
    this.recruitWindow.buttonsEl.appendChild(joinBtn);
    this.recruitWindow.buttonsEl.appendChild(declineBtn);

    const nameContainer = this.recruitWindow.bodyEl.querySelector('#recruit-name');
    nameContainer.appendChild(this.createElementIcon(recruit.elements));
    const nameSpan = document.createElement('span');
    nameSpan.textContent = recruit.name;
    nameContainer.appendChild(nameSpan);

    const elementIconContainer = this.recruitWindow.bodyEl.querySelector('#recruit-element-icon');
    if (recruit.elements && recruit.elements.length > 0) {
        elementIconContainer.appendChild(this.renderElements(recruit.elements));
    } else {
        elementIconContainer.textContent = "—";
    }

    this.windowManager.push(this.recruitWindow);
    this.setStatus("Recruit encountered.");
    SoundManager.beep(400, 100);
  }

  /**
   * @method closeRecruitEvent
   * @description Closes the recruit event.
   */
  closeRecruitEvent() {
    this.windowManager.close(this.recruitWindow);
    this.setStatus("Exploration");
  }

  /**
   * @method clearEventTile
   * @description Clears the event tile.
   * @param {string} char - The character of the tile to clear.
   */
  clearEventTile(char) {
    const f = this.map.floors[this.map.floorIndex];
    const { playerX, playerY } = this.map;
    if (f.tiles[playerY][playerX] === char) {
      f.tiles[playerY][playerX] = ".";
    }
    this.updateGrid();
  }

  /**
   * @method attemptRecruit
   * @description Attempts to recruit a new party member.
   * @param {Object} recruit - The recruit to attempt to recruit.
   */
  attemptRecruit(recruit) {
    if (this.party.members.length < this.party.MAX_MEMBERS) {
      this.party.members.push(new Game_Battler(recruit));
      this.logMessage(`[Recruit] ${recruit.name} joins your party.`);
      this.setStatus(
        this.dataManager.terms.recruit.recruited.replace("{0}", recruit.name)
      );
      this.clearEventTile("U");
      this.closeRecruitEvent();
      this.updateParty();
      return;
    }
    this.recruitWindow.bodyEl.innerHTML =
      this.dataManager.terms.recruit.party_full;
    this.recruitWindow.buttonsEl.innerHTML = "";
    this.party.members.forEach((m, idx) => {
      const btn = document.createElement("button");
      btn.className = "win-btn";
      btn.textContent = m.name;
      btn.addEventListener("click", () => {
        this.replaceMemberWithRecruit(idx, recruit);
      });
      this.recruitWindow.buttonsEl.appendChild(btn);
    });
    const cancelBtn = document.createElement("button");
    cancelBtn.className = "win-btn";
    cancelBtn.textContent = "Cancel";
    cancelBtn.addEventListener("click", () => {
      this.logMessage(this.dataManager.terms.recruit.decide_not_to_replace);
      this.closeRecruitEvent();
    });
    this.recruitWindow.buttonsEl.appendChild(cancelBtn);
  }

  /**
   * @method replaceMemberWithRecruit
   * @description Replaces a party member with a new recruit.
   * @param {number} index - The index of the party member to replace.
   * @param {Object} recruit - The new recruit.
   */
  replaceMemberWithRecruit(index, recruit) {
    const replaced = this.party.members[index];
    this.logMessage(
      this.dataManager.terms.recruit.replace_member
        .replace("{0}", replaced.name)
        .replace("{1}", recruit.name)
    );
    this.party.members[index] = new Game_Battler(recruit);
    this.clearEventTile("U");
    this.updateParty();
    this.closeRecruitEvent();
  }

  /**
   * @method formatSkillName
   * @description Formats the name of a skill.
   * @param {string} skillId - The ID of the skill to format.
   * @returns {string} The formatted skill name.
   */
  formatSkillName(skillId) {
      const skill = this.dataManager.skills[skillId];
      if (!skill) return "";
      const elementIcon = this.createElementIcon([skill.element]);
      return `${elementIcon.innerHTML}${skill.name}`;
  }

/**
 * @method createElementIcon
 * @description Creates an element icon.
 * @param {string[]} elements - The elements to create an icon for.
 * @returns {HTMLElement} The element icon.
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
 * @method renderElements
 * @description Renders the elements.
 * @param {string[]} elements - The elements to render.
 * @returns {HTMLElement} The rendered elements.
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
   * @method partyRow
   * @description Gets the row of a party member.
   * @param {number} index - The index of the party member.
   * @returns {string} The row of the party member.
   */
  partyRow(index) {
    return index <= 1 ? "Front" : "Back";
  }

  /**
   * @method openFormation
   * @description Opens the formation window.
   */
  openFormation() {
    if (this.sceneManager.currentScene() !== this) return;
    this.windowManager.push(this.formationWindow);
    this.renderFormationGrid();
  }

  /**
   * @method closeFormation
   * @description Closes the formation window.
   */
  closeFormation() {
    this.windowManager.close(this.formationWindow);
  }

  /**
   * @method renderFormationGrid
   * @description Renders the formation grid.
   */
  renderFormationGrid() {
    const grid = this.formationWindow.gridEl;
    const reserveGrid = this.formationWindow.reserveGridEl;
    grid.innerHTML = "";
    reserveGrid.innerHTML = "";

    this.party.members.forEach((m, index) => {
      const slot = document.createElement("div");
      slot.className = "formation-slot";
      slot.dataset.index = index;
      slot.textContent = m ? `${m.name} (Lv${m.level})` : "(empty)";
      slot.draggable = true;

      slot.addEventListener("dragstart", this.onFormationDragStart.bind(this));
      slot.addEventListener("dragover", this.onFormationDragOver.bind(this));
      slot.addEventListener("drop", this.onFormationDrop.bind(this));
      slot.addEventListener("dragend", this.onFormationDragEnd.bind(this));

      if (index < 4) {
        grid.appendChild(slot);
      } else {
        reserveGrid.appendChild(slot);
      }
    });
  }

  /**
   * @method onFormationDragStart
   * @description Handles the drag start event for the formation grid.
   * @param {DragEvent} e - The drag event.
   */
  onFormationDragStart(e) {
    this.draggedIndex = parseInt(e.target.dataset.index, 10);
    e.target.classList.add("dragging");
  }

  /**
   * @method onFormationDragOver
   * @description Handles the drag over event for the formation grid.
   * @param {DragEvent} e - The drag event.
   */
  onFormationDragOver(e) {
    e.preventDefault();
    const target = e.target.closest(".formation-slot");
    if (target) {
      target.classList.add("drag-over");
    }
  }

  /**
   * @method onFormationDrop
   * @description Handles the drop event for the formation grid.
   * @param {DragEvent} e - The drag event.
   */
  onFormationDrop(e) {
    e.preventDefault();
    const targetIndex = parseInt(e.target.dataset.index, 10);
    if (this.draggedIndex === null || this.draggedIndex === targetIndex) return;

    const draggedMember = this.party.members[this.draggedIndex];
    this.party.members.splice(this.draggedIndex, 1);
    this.party.members.splice(targetIndex, 0, draggedMember);

    this.draggedIndex = null;
    this.renderFormationGrid();
    this.updateParty();
    this.logMessage("[Formation] Party order changed.");
    SoundManager.beep(500, 80);
  }

  /**
   * @method onFormationDragEnd
   * @description Handles the drag end event for the formation grid.
   * @param {DragEvent} e - The drag event.
   */
  onFormationDragEnd(e) {
    document
      .querySelectorAll(".formation-slot")
      .forEach((s) => s.classList.remove("dragging", "drag-over"));
  }

  /**
   * @method openInventory
   * @description Opens the inventory window.
   */
  openInventory() {
    if (this.sceneManager.currentScene() !== this) return;
    this.windowManager.push(this.inventoryWindow);
    this.refreshInventoryWindow();
  }

  /**
   * @method closeInventory
   * @description Closes the inventory window.
   */
  closeInventory() {
    this.windowManager.close(this.inventoryWindow);
  }

  /**
   * @method refreshInventoryWindow
   * @description Refreshes the inventory window.
   */
  refreshInventoryWindow() {
    this.inventoryWindow.refresh(
      this.party.inventory,
      this.useItem.bind(this),
      this.discardItem.bind(this)
    );
  }

  /**
   * @method useItem
   * @description Uses an item from the inventory.
   * @param {Object} item - The item to use.
   * @param {number} index - The index of the item in the inventory.
   */
  useItem(item, index) {
    this.inventoryWindow.showTargetSelection(this.party.members, (memberIndex) => {
      this.applyItemToMember(item, index, memberIndex);
    });
  }

  /**
   * @method applyItemToMember
   * @description Applies an item to a party member.
   * @param {Object} item - The item to apply.
   * @param {number} itemIndex - The index of the item in the inventory.
   * @param {number} memberIndex - The index of the party member.
   */
  applyItemToMember(item, itemIndex, memberIndex) {
    const member = this.party.members[memberIndex];
    if (item.effects.hp) {
      member.hp = Math.min(member.maxHp, member.hp + item.effects.hp);
    }
    if (item.effects.maxHp) {
      member.maxHp += item.effects.maxHp;
      member.hp += item.effects.maxHp;
    }
    if (item.effects.xp) {
      this.gainXp(member, item.effects.xp);
    }
    this.logMessage(`[Inventory] Used ${item.name} on ${member.name}.`);
    this.party.inventory.splice(itemIndex, 1);
    this.updateParty();
    this.refreshInventoryWindow();
    this.updateAll();
    SoundManager.beep(700, 100);
  }

  /**
   * @method discardItem
   * @description Discards an item from the inventory.
   * @param {Object} item - The item to discard.
   * @param {number} index - The index of the item in the inventory.
   */
  discardItem(item, index) {
    this.party.inventory.splice(index, 1);
    this.refreshInventoryWindow();
    this.updateAll();
    this.logMessage(`[Inventory] Discarded ${item.name}.`);
    SoundManager.beep(300, 80);
  }

  /**
   * @method openInspect
   * @description Opens the inspect window.
   * @param {Game_Battler} member - The party member to inspect.
   * @param {number} index - The index of the party member.
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
        member.passives.forEach((p, i) => {
            const span = document.createElement("span");
            span.textContent = p.name || `Passive ${i+1}`; // Fallback if name is missing
            span.className = "interactive-text";
            span.style.marginRight = "5px";
            span.style.textDecoration = "underline";
            span.style.cursor = "help";

            span.addEventListener("mouseenter", (e) => {
                tooltip.show(e.clientX, e.clientY, null, p.description);
            });
            span.addEventListener("mouseleave", () => tooltip.hide());
            span.addEventListener("mousemove", (e) => {
                 if (tooltip.visible) tooltip.show(e.clientX, e.clientY, null, p.description);
            });

            this.inspectWindow.passiveEl.appendChild(span);
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
            const span = document.createElement("span");
            span.innerHTML = this.formatSkillName(sId);
            span.className = "interactive-text";
            span.style.marginRight = "5px";
            span.style.cursor = "help";
            span.style.borderBottom = "1px dotted #000";

            if (skill) {
                let tooltipText = skill.description;
                if (skill.effects) {
                    const formulaEffect = skill.effects.find(eff => eff.type === 'hp_damage' || eff.type === 'hp_heal');
                    if (formulaEffect) {
                        try {
                            // Helper calculation
                            const a = { level: member.level }; // Context for formula
                            // Simple formula evaluator based on standard structure
                            // formulas are like '5 + 1.2 * a.level'
                            const val = Math.round(eval(formulaEffect.formula.replace(/a\.level/g, a.level)));
                            const label = formulaEffect.type === 'hp_damage' ? 'Damage' : 'Heal';
                            tooltipText += `<br/>Expected: ${val} ${label}`;
                        } catch (err) {
                            console.error("Error calculating tooltip formula", err);
                        }
                    }
                }

                span.addEventListener("mouseenter", (e) => {
                    tooltip.show(e.clientX, e.clientY, null, tooltipText);
                });
                span.addEventListener("mouseleave", () => tooltip.hide());
                span.addEventListener("mousemove", (e) => {
                    if (tooltip.visible) tooltip.show(e.clientX, e.clientY, null, tooltipText);
                });
            }

            this.inspectWindow.skillsEl.appendChild(span);
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

    this.inspectWindow.btnClose.onclick = () => this.closeInspect();
    this.inspectWindow.btnOk.onclick = () => this.closeInspect();
    this.inspectWindow.equipEl.onclick = () => this.openEquipmentScreen();
  }

  /**
   * @method closeInspect
   * @description Closes the inspect window.
   */
  closeInspect() {
    this.inspectWindow.equipmentListContainerEl.style.display = "none";
    this.inspectWindow.equipmentListEl.innerHTML = "";
    this.windowManager.close(this.inspectWindow);
    this.setStatus("Exploration");
  }

  /**
   * @method openEquipmentScreen
   * @description Opens the equipment screen.
   */
  openEquipmentScreen() {
    this.inspectWindow.equipmentListContainerEl.style.display = "block";
    this.renderEquipmentList("All");
  }

  /**
   * @method renderEquipmentList
   * @description Renders the equipment list.
   * @param {string} filter - The filter to apply to the equipment list.
   */
  renderEquipmentList(filter) {
    const listEl = this.inspectWindow.equipmentListEl;
    const filterEl = this.inspectWindow.equipmentFilterEl;
    listEl.innerHTML = "";
    filterEl.innerHTML = "";
    const member = this.inspectWindow.member;

    const itemTypes = ["All", "Weapon", "Armor", "Accessory"];
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
      (i) => i.type === "equipment" && (filter === "All" || i.equipType === filter)
    );
    const otherMemberItems = this.party.members
      .filter((m) => m !== member && m.equipmentItem && (filter === "All" || m.equipmentItem.equipType === filter))
      .map((m) => ({
        ...m.equipmentItem,
        equippedBy: m.name,
        equippedMember: m,
      }));

    const allEquipable = [...inventoryItems, ...otherMemberItems];

    if (allEquipable.length > 0) {
      allEquipable.forEach((item) => {
        const row = document.createElement("div");
        row.className = "shop-row";
        const label = document.createElement("span");
        let text = `${item.name} (+${item.damageBonus} DMG)`;
        if (item.equippedBy) {
          text += ` (on ${item.equippedBy})`;
        }
        label.textContent = text;

        // Tooltip for equipment list
        row.addEventListener("mouseenter", (e) => {
            tooltip.show(e.clientX, e.clientY, null, item.description);
        });
        row.addEventListener("mouseleave", () => tooltip.hide());
        row.addEventListener("mousemove", (e) => {
             if (tooltip.visible) tooltip.show(e.clientX, e.clientY, null, item.description);
        });

        const btn = document.createElement("button");
        btn.className = "win-btn";
        btn.textContent = item.equippedBy ? "Swap" : "Equip";
        btn.addEventListener("click", () => {
          this.equipItem(member, item);
        });
        row.appendChild(label);
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
   * @method equipItem
   * @description Equips an item to a party member.
   * @param {Game_Battler} member - The party member to equip the item to.
   * @param {Object} item - The item to equip.
   */
  equipItem(member, item) {
    const doEquip = () => {
      // Unequip current item if one exists
      if (member.equipmentItem) {
        this.party.inventory.push(member.equipmentItem);
        SoundManager.beep(600, 80); // Unequip sound
      }
      // Equip the new item
      member.equipmentItem = item;
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
        const currentItem = member.equipmentItem;
        otherMember.equipmentItem = currentItem;
        member.equipmentItem = item;
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
