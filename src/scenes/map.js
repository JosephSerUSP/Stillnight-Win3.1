import { Scene_Base } from "./base.js";
import { Scene_Battle } from "./battle.js";
import { Scene_Shop } from "./shop.js";
import { Game_Map, Game_Party, Game_Battler, Game_Action } from "../objects/objects.js";
import { Game_Interpreter } from "../managers/interpreter.js";
import { BattleManager, SoundManager, ConfigManager, ThemeManager } from "../managers/index.js";
import { InputController } from "../managers/input_controller.js";
import { HUDManager } from "../managers/hud_manager.js";
import { Window_Desktop } from "../windows/index.js";
import { ProgressionSystem } from "../managers/progression.js";
import { ExplorationEngine } from "../managers/exploration.js";

/**
 * @class Scene_Map
 * @description The main scene for exploration. Currently acts as a central hub
 * handling map logic, UI creation, and delegation to sub-scenes like Battle and Shop.
 * @extends Scene_Base
 */
export class Scene_Map extends Scene_Base {
  /**
   * Creates a new Scene_Map.
   * @param {import("../managers/index.js").DataManager} dataManager - The data manager.
   * @param {import("../managers/index.js").SceneManager} sceneManager - The scene manager.
   * @param {import("../windows/index.js").WindowManager} windowManager - The window manager.
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

    this.hudManager = new HUDManager(windowManager, gameContainer);
    this.inputController = new InputController(this);
    this.explorationEngine = new ExplorationEngine(this.map, this.party);

    // Callbacks mapping
    this.hudManager.eventWindow.onUserClose = this.interpreter.closeEvent.bind(this.interpreter);
    this.hudManager.recruitWindow.onUserClose = this.interpreter.closeRecruitEvent.bind(this.interpreter);
    this.hudManager.evolutionWindow.onUserClose = () => this.windowManager.close(this.hudManager.evolutionWindow);
    this.hudManager.formationWindow.onUserClose = this.closeFormation.bind(this);
    this.hudManager.confirmWindow.onUserClose = () => this.windowManager.close(this.hudManager.confirmWindow);
    this.hudManager.confirmEffectWindow.onUserClose = () => this.windowManager.close(this.hudManager.confirmEffectWindow);
    this.hudManager.partySelectWindow.onUserClose = () => this.windowManager.close(this.hudManager.partySelectWindow);
    this.hudManager.equipItemSelectWindow.onUserClose = () => this.windowManager.close(this.hudManager.equipItemSelectWindow);
    this.hudManager.optionsWindow.onUserClose = () => this.windowManager.close(this.hudManager.optionsWindow);
    this.hudManager.audioWindow.onUserClose = () => this.windowManager.close(this.hudManager.audioWindow);
    this.hudManager.audioPlayerWindow.onUserClose = () => this.windowManager.close(this.hudManager.audioPlayerWindow);
    this.hudManager.helpWindow.onUserClose = () => this.windowManager.close(this.hudManager.helpWindow);
    this.hudManager.inventoryWindow.onUserClose = this.closeInventory.bind(this);
  }

  get windowLayer() {
      return this.hudManager.windowLayer;
  }

  get eventWindow() {
      return this.hudManager.eventWindow;
  }

  /**
   * Transitions to the battle scene.
   * @method startBattle
   * @param {number} x - The x coordinate of the event.
   * @param {number} y - The y coordinate of the event.
   * @param {Object} [encounterData] - Specific encounter data.
   * @param {boolean} [isSneakAttack] - Whether it is a sneak attack.
   */
  startBattle(x, y, encounterData = null, isSneakAttack = false, isPlayerFirstStrike = false) {
      this.setStatus("Enemy encountered!");
      this.logMessage("[Battle] Shapes uncoil from the dark.");
      this.sceneManager.push(new Scene_Battle(this.dataManager, this.sceneManager, this.windowManager, this.party, this.battleManager, this.windowLayer, this.map, x, y, this.getSharedWindows(), encounterData, isSneakAttack, isPlayerFirstStrike));
  }

  getSharedWindows() {
      return this.hudManager.getSharedWindows();
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
    this.party.createInitialMembers(this.dataManager);
    this.map.initFloors(this.dataManager.maps, this.dataManager.events, this.dataManager.npcs, this.party);
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
    SoundManager.play('UI_SELECT');
    this.updateAll();
    this.checkMusic();
  }

  resumeMusic() {
      this.checkMusic();
  }

  checkMusic() {
      const f = this.map.floors[this.map.floorIndex];
      if (f && f.music) {
          SoundManager.playMusic(f.music);
      }
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
      SoundManager.play('UI_CANCEL');
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
    this.inputController.onKeyDown(e);
  }

  /**
   * Attempts to move the player by the given delta.
   * @method movePlayer
   * @param {number} dx - X delta.
   * @param {number} dy - Y delta.
   */
  movePlayer(dx, dy) {
    const result = this.explorationEngine.tryMove(dx, dy);
    this.handleExplorationResult(result);
  }

  handleExplorationResult(result) {
      if (result.type === 'BLOCKED') {
          if (result.reason === 'wall') {
              this.setStatus(this.dataManager.terms.log.wall_blocks);
              SoundManager.play('UI_ERROR');
          }
          return;
      }

      if (result.type === 'INTERACT') {
           this.currentInteractionEvent = result.event;
           this.executeEvent(result.event);
           return;
      }

      if (result.type === 'SEQUENCE') {
           result.results.forEach(r => this.handleExplorationResult(r));
           // After sequence (movement), apply general updates
           this.updateGrid();
           if (result.results.some(r => r.type === 'MOVED')) {
               SoundManager.play('UI_SELECT');
               this.applyMovePassives();
           }
           this.updateAll();

           // Check entity updates
           const entityResults = this.explorationEngine.updateEntities();
           entityResults.forEach(r => this.handleExplorationResult(r));
           if (entityResults.length > 0) this.updateGrid();

           return;
      }

      if (result.type === 'MOVED') {
           this.logMessage("[Step] Your footsteps echo softly.");
           this.setStatus("You move.");
      }

      if (result.type === 'EXPLORED_ALL') {
           this.logMessage("Map fully explored! The entire floor is revealed.");
           SoundManager.play('ITEM_GET');
      }

      if (result.type === 'EVENT' || result.type === 'REVEALED') {
           if (result.type === 'REVEALED') this.updateGrid();
           if (result.event) {
               if (result.event.type === 'trap') this.updateGrid(); // Trap triggered
               this.currentInteractionEvent = result.event;
               this.executeEvent(result.event);
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
    this.hud.logMessage(msg);

    if (this.windowManager.stack.includes(this.hudManager.eventWindow)) {
        this.hudManager.eventWindow.appendLog(msg);
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

        let forceVisible = false;
        if (event && event.behavior === 'chase' && !event.isSneakAttack) {
             forceVisible = true;
             event.symbol = 'E'; // Enforce 'E' for moving enemies
        }

        if (!visited && !isPlayer && !forceVisible) {
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
                  if (maxSee <= event.trapValue && !event.isSneakAttack) {
                      // Sneak attacks are handled separately (always hidden until triggered)
                      // But if it's just a trap, we check perception
                      visible = false;
                  } else if (event.isSneakAttack) {
                      // Sneak attacks are invisible regardless of perception unless REAR_GUARD prevented them (which sets isSneakAttack=false)
                      visible = false;
                  }
              }

              if (forceVisible) {
                  visible = true;
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
                // Check for SEE_WALLS trait to highlight breakable walls
                if (event && event.actions && event.actions.some(a => a.type === 'BREAKABLE_WALL')) {
                     const seeWalls = this.party.members.some(m => m.getPassiveValue('SEE_WALLS') > 0);
                     if (seeWalls) {
                         cell.cssClass = (cell.cssClass ? cell.cssClass + " " : "") + "tile-breakable-wall";
                     }
                }
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
            SoundManager.play('STAIRS');
            this.updateAll();
            this.checkMusic();
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

    const dx = Math.abs(x - this.map.playerX);
    const dy = Math.abs(y - this.map.playerY);
    const isAdjacent = dx + dy === 1;
    const isSelf = x === this.map.playerX && y === this.map.playerY;

    if (!isAdjacent && !isSelf) {
      this.setStatus(this.dataManager.terms.status.only_adjacent_tiles);
      SoundManager.play('UI_ERROR');
      return;
    }

    const result = this.explorationEngine.handleTileInteraction(x, y);
    this.handleExplorationResult(result);
  }

  /**
   * Executes a map event.
   * @method executeEvent
   * @param {import("../objects/objects.js").Game_Event} event - The event to execute.
   */
  executeEvent(event) {
      if (event.type === 'BATTLE' || (event.type === 'enemy' || event.id === 'enemy')) {
          this.startBattle(event.x, event.y, event.encounterData, event.isSneakAttack, event.isPlayerFirstStrike);
      } else if (event.actions) {
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
    SoundManager.play('ITEM_GET');
  }

  /**
   * Adds XP to a member and handles level-up logging.
   * @method gainXp
   * @param {import("../objects/objects.js").Game_Battler} member - The member to give XP to.
   * @param {number} amount - The amount of XP.
   */
  gainXp(member, amount, silent = false) {
    const result = ProgressionSystem.gainXp(member, amount);
    if (result.leveledUp && !silent) {
      this.logMessage(
        `[Level] ${member.name} grows to Lv${result.newLevel}! HP +${result.hpGain}.`
      );
      SoundManager.play('LEVEL_UP');
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
    this.windowManager.push(this.hudManager.formationWindow);
    this.hudManager.formationWindow.refresh(this.party, () => {
        this.updateParty();
        this.logMessage("[Formation] Party order changed.");
    }, this.getContext());
  }

  /**
   * Closes the formation window.
   * @method closeFormation
   */
  closeFormation() {
    this.windowManager.close(this.hudManager.formationWindow);
  }

  /**
   * Opens the inventory window.
   * @method openInventory
   */
  openInventory() {
    if (this.sceneManager.currentScene() !== this) return;
    this.windowManager.push(this.hudManager.inventoryWindow);
    this.hudManager.inventoryWindow.setup(
        this.party,
        (item, action) => this.onInventoryAction(item, action),
        (item) => this.confirmDiscard(item)
    );
  }

  /**
   * Closes the inventory window.
   * @method closeInventory
   */
  closeInventory() {
    this.windowManager.close(this.hudManager.inventoryWindow);
  }

  openHelp() {
    if (this.sceneManager.currentScene() !== this) return;
    this.windowManager.push(this.hudManager.helpWindow);
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
                SoundManager.play('UI_SELECT');
            }
        },
        {
            label: "Audio Settings",
            type: "action",
            action: () => this.openAudioSettings()
        },
        {
            label: "Audio Player",
            type: "action",
            action: () => {
                this.windowManager.push(this.hudManager.audioPlayerWindow);
                SoundManager.play('UI_SELECT');
            }
        },
        {
            label: "Auto Battle",
            type: "toggle",
            value: ConfigManager.autoBattle,
            onChange: (val) => {
                ConfigManager.autoBattle = val;
                ConfigManager.save();
                SoundManager.play('UI_SELECT');
            }
        },
        {
            label: "Window Animations",
            type: "toggle",
            value: ConfigManager.windowAnimations,
            onChange: (val) => {
                ConfigManager.windowAnimations = val;
                ConfigManager.save();
                SoundManager.play('UI_SELECT');
            }
        }
    ];

    this.hudManager.optionsWindow.setup(options);
    this.windowManager.push(this.hudManager.optionsWindow);
  }

  openAudioSettings() {
      const options = [
          {
              label: "Master",
              type: "slider",
              value: ConfigManager.masterVolume,
              onChange: (val) => {
                  ConfigManager.masterVolume = val;
                  ConfigManager.save();
                  SoundManager.updateVolumes();
              }
          },
          {
              label: "Music",
              type: "slider",
              value: ConfigManager.musicVolume,
              onChange: (val) => {
                  ConfigManager.musicVolume = val;
                  ConfigManager.save();
                  SoundManager.updateVolumes();
              }
          },
          {
              label: "SFX",
              type: "slider",
              value: ConfigManager.sfxVolume,
              onChange: (val) => {
                  ConfigManager.sfxVolume = val;
                  ConfigManager.save();
                  SoundManager.updateVolumes();
              }
          }
      ];
      this.hudManager.audioWindow.setup(options);
      this.windowManager.push(this.hudManager.audioWindow);
  }

  onInventoryAction(item, action) {
      if (action === 'use') {
          if (item.type === 'equipment') return;

          if (item.effects && item.effects.recruit_egg) {
              const recruitId = item.effects.recruit_egg;
              this.windowManager.close(this.hudManager.inventoryWindow);
              this.interpreter.openRecruitEvent({
                  forcedId: recruitId,
                  cost: 0,
                  onRecruit: () => this.discardItem(item)
              });
              return;
          }

          this.hudManager.partySelectWindow.setup(this.party, `Use ${item.name} on:`, (target) => {
              this.windowManager.close(this.hudManager.partySelectWindow);
              this.hudManager.confirmEffectWindow.setupUse(target, item, () => {
                  this.windowManager.close(this.hudManager.confirmEffectWindow);
                  this.useItem(item, target);
              });
              this.windowManager.push(this.hudManager.confirmEffectWindow);
          }, this.getContext());
          this.windowManager.push(this.hudManager.partySelectWindow);
      } else if (action === 'equip') {
          this.hudManager.partySelectWindow.setup(this.party, `Equip ${item.name} on:`, (target) => {
              this.windowManager.close(this.hudManager.partySelectWindow);
              this.checkEquip(target, item);
          }, this.getContext());
          this.windowManager.push(this.hudManager.partySelectWindow);
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
      this.hudManager.confirmEffectWindow.setupEquip(target, item, oldItem, "Held Item", () => {
          this.windowManager.close(this.hudManager.confirmEffectWindow);
          this.windowManager.close(this.hudManager.inventoryWindow);
          this.equipItem(target, item);
      }, swapMsg);
      this.windowManager.push(this.hudManager.confirmEffectWindow);
  }

  useItem(item, target) {
      const action = new Game_Action(this.party);
      action.setItem(item.id, this.dataManager);

      const events = action.apply(target, this.dataManager);

      if (events.length > 0) {
          events.forEach(e => {
              if (e.msg) this.logMessage(e.msg);

              if (e.type === 'xp' && e.result && e.result.leveledUp) {
                 this.logMessage(`[Level] ${target.name} grows to Lv${e.result.newLevel}! HP +${e.result.hpGain}.`);
                 SoundManager.play('LEVEL_UP');
              }
          });

          this.updateParty();
          this.hudManager.inventoryWindow.updateList();
          this.updateAll();
      } else {
          this.logMessage("No effect.");
      }
  }

  confirmDiscard(item) {
      this.hudManager.confirmWindow.titleEl.textContent = "Discard Item";
      this.hudManager.confirmWindow.messageEl.textContent = `Are you sure you want to discard ${item.name}?`;
      this.windowManager.push(this.hudManager.confirmWindow);

      this.hudManager.confirmWindow.btnOk.onclick = () => {
          this.windowManager.close(this.hudManager.confirmWindow);
          this.discardItem(item);
      };
      this.hudManager.confirmWindow.btnCancel.onclick = () => {
          this.windowManager.close(this.hudManager.confirmWindow);
      };
  }

  discardItem(item) {
      const index = this.party.inventory.indexOf(item);
      if (index > -1) {
          this.party.inventory.splice(index, 1);
          this.hudManager.inventoryWindow.updateList();
          this.updateAll();
          this.logMessage(`[Inventory] Discarded ${item.name}.`);
          SoundManager.play('UI_CANCEL');
      }
  }

  /**
   * Opens the inspection window for a specific party member.
   * @method openInspect
   * @param {import("../objects/objects.js").Game_Battler} member - The member to inspect.
   * @param {number} index - The member's index.
   */
  openInspect(member, index) {
    this.hudManager.inspectWindow.setup(member, this.getContext(), this.dataManager, {
        onEquip: () => this.openEquipmentScreen(),
        onSacrifice: (val) => {
             this.hudManager.confirmWindow.titleEl.textContent = "Sacrifice Unit";
             this.hudManager.confirmWindow.messageEl.textContent = `Sacrifice ${member.name} for ${val} Gold? This cannot be undone.`;
             this.windowManager.push(this.hudManager.confirmWindow);
             this.hudManager.confirmWindow.btnOk.onclick = () => {
                 this.windowManager.close(this.hudManager.confirmWindow);
                 this.sacrificeMember(member, val);
             };
        },
        onEvolve: (evoData) => this.openEvolution(member, evoData)
    });

    this.windowManager.push(this.hudManager.inspectWindow);
    this.setStatus(`Inspecting ${member.name}`);
    this.logMessage(`[Inspect] ${member.name} – Lv${member.level}, ${this.partyRow(index)}, HP ${member.hp}/${member.maxHp}.`);

    this.hudManager.inspectWindow.onUserClose = () => this.closeInspect();
  }

  /**
   * Sacrifices a party member for gold.
   * @method sacrificeMember
   * @param {import("../objects/objects.js").Game_Battler} member - The member to sacrifice.
   * @param {number} value - The gold value.
   */
  sacrificeMember(member, value) {
      if (this.party.removeMember(member)) {
          this.party.gold += value;
          this.logMessage(`[Sacrifice] ${member.name} was sacrificed for ${value}G.`);
          SoundManager.play('GAME_OVER');
          this.closeInspect();
          this.updateAll();
      }
  }

  /**
   * Closes the inspect window.
   * @method closeInspect
   */
  closeInspect() {
    this.hudManager.inspectWindow.btnSacrifice.style.display = "none";
    this.windowManager.close(this.hudManager.inspectWindow);
    this.setStatus("Exploration");
  }

  /**
   * Opens the equipment selection screen within the inspect window.
   * @method openEquipmentScreen
   */
  openEquipmentScreen() {
    const member = this.hudManager.inspectWindow.member;
    const inventoryItems = this.party.inventory.filter(i => i.type === "equipment");
    const otherMemberItems = this.party.members
      .filter((m) => m !== member && m.equipmentItem)
      .map((m) => ({
        ...m.equipmentItem,
        equippedBy: m.name,
        equippedMember: m,
      }));
    const allItems = [...inventoryItems, ...otherMemberItems];

    this.hudManager.equipItemSelectWindow.setup(allItems, member.equipmentItem, "Equipment", (item) => {
        this.windowManager.close(this.hudManager.equipItemSelectWindow);
        this.checkEquip(member, item);
    });
    this.windowManager.push(this.hudManager.equipItemSelectWindow);
  }

  /**
   * Opens the evolution preview window.
   * @method openEvolution
   * @param {import("../objects/objects.js").Game_Battler} member - The member to evolve.
   * @param {Object} evolutionData - The evolution definition.
   */
  openEvolution(member, evolutionData) {
      this.closeInspect();
      const nextId = evolutionData.evolvesTo;
      const nextData = this.dataManager.actors.find(a => a.id === nextId);
      if (!nextData) return;

      const nextBattler = Game_Battler.create(nextData, member.level);
      // Copy equipment to ensure stat preview includes equipment bonuses
      nextBattler.equipmentItem = member.equipmentItem;

      this.hudManager.evolutionWindow.setup(member, nextBattler, this.dataManager);

      this.hudManager.evolutionWindow.btnConfirm.onclick = () => {
          this.confirmEvolution(member, nextBattler, evolutionData);
      };

      this.windowManager.push(this.hudManager.evolutionWindow);
  }

  /**
   * Prompts to confirm evolution (and resource consumption).
   * @method confirmEvolution
   * @param {import("../objects/objects.js").Game_Battler} member - The member to evolve.
   * @param {import("../objects/objects.js").Game_Battler} nextBattler - The evolved form.
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

      this.hudManager.confirmWindow.titleEl.textContent = "Confirm Evolution";
      this.hudManager.confirmWindow.messageEl.innerText = msg;

      this.windowManager.push(this.hudManager.confirmWindow);

      this.hudManager.confirmWindow.btnOk.onclick = () => {
          this.windowManager.close(this.hudManager.confirmWindow);
          this.executeEvolution(member, nextBattler, evolutionData);
      };
      this.hudManager.confirmWindow.btnCancel.onclick = () => {
          this.windowManager.close(this.hudManager.confirmWindow);
      };
  }

  /**
   * Executes the evolution, updating the party and consuming items.
   * @method executeEvolution
   * @param {import("../objects/objects.js").Game_Battler} member - The member to evolve.
   * @param {import("../objects/objects.js").Game_Battler} nextBattler - The evolved form.
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
          SoundManager.play('LEVEL_UP');

          this.windowManager.close(this.hudManager.evolutionWindow);
          this.updateAll();
      }
  }

  /**
   * Equips an item to a member, handling swaps if necessary.
   * @method equipItem
   * @param {import("../objects/objects.js").Game_Battler} member - The member.
   * @param {Object} item - The item to equip.
   */
  equipItem(member, item) {
      const result = this.party.equipItem(member, item);
      this.logMessage(`[Equip] ${result.msg}`);
      SoundManager.play('EQUIP');

      this.openInspect(member, this.party.members.indexOf(member));
      this.updateAll();
  }
}
