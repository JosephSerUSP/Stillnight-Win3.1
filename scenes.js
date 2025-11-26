
import { Game_Map, Game_Party, Game_Battler } from "./objects.js";
import { beep, randInt, shuffleArray, getPrimaryElements } from "./core.js";
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

/**
 * @class Scene_Base
 * @description The base class for all scenes.
 */
class Scene_Base {
  /**
   * @param {import("./managers.js").DataManager} dataManager - The data manager instance.
   */
  constructor(dataManager) {
    this.dataManager = dataManager;
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
}

/**
 * @class Scene_Map
 * @description The main scene for the map exploration.
 * @extends Scene_Base
 */
export class Scene_Map extends Scene_Base {
  /**
   * @param {import("./managers.js").DataManager} dataManager - The data manager instance.
   */
  constructor(dataManager) {
    super(dataManager);
    this.map = new Game_Map();
    this.party = new Game_Party();
    this.runActive = true;
    this.battleState = null;
    this.battleBusy = false;
    this.draggedIndex = null;

    this.getDomElements();
    this.addEventListeners();

    this.windowLayer = new WindowLayer();
    this.windowLayer.appendToBody();

    this.battleWindow = new Window_Battle();
    this.windowLayer.addChild(this.battleWindow);

    this.shopWindow = new Window_Shop();
    this.eventWindow = new Window_Event();
    this.recruitWindow = new Window_Recruit();
    this.formationWindow = new Window_Formation();
    this.inventoryWindow = new Window_Inventory();
    this.inspectWindow = new Window_Inspect();
    this.confirmWindow = new Window_Confirm();

    this.battleWindow.btnRound.addEventListener(
      "click",
      this.resolveBattleRound.bind(this)
    );
    this.battleWindow.btnFlee.addEventListener(
      "click",
      this.attemptFlee.bind(this)
    );
    this.battleWindow.btnVictory.addEventListener(
      "click",
      this.onBattleVictoryClick.bind(this)
    );

    this.formationWindow.btnClose.addEventListener(
      "click",
      this.closeFormation.bind(this)
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
    this.shopWindow.btnClose.addEventListener(
      "click",
      this.closeShop.bind(this)
    );
    this.shopWindow.btnLeave.addEventListener(
      "click",
      this.closeShop.bind(this)
    );
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
    this.map.initFloors(this.dataManager.floors);
    this.party.createInitialMembers(this.dataManager.actors);
    this.party.gold = 0;
    this.party.inventory = [];
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
    beep(500, 200);
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
      beep(300, 80);
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
          beep(550, 120);
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
        member.spriteKey || "default"
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
  animateBattleHpGauge(battler, oldHp) {
    return new Promise((resolve) => {
      const duration = 500;
      const interval = 30;
      let elapsed = 0;

      const interpolator = () => {
        elapsed += interval;
        const progress = Math.min(elapsed / duration, 1);
        const currentHp = Math.round(oldHp + (battler.hp - oldHp) * progress);

        this.renderBattleAscii(battler.name, currentHp);

        if (progress < 1) {
          setTimeout(interpolator, interval);
        } else {
          this.renderBattleAscii(); // Final render with correct HP
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
    const battlerId = `battler-${battler.name.replace(/\s/g, '-')}`;
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

      const animator = () => {
        if (frame >= maxFrames) {
          battler.name = originalName;
          this.renderBattleAscii();
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
        battler.name = newName;
        this.renderBattleAscii();

        frame++;
        setTimeout(animator, interval);
      };

      animator();
    });
  }

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

    const tileEl = e.currentTarget;
    const x = parseInt(tileEl.dataset.x, 10);
    const y = parseInt(tileEl.dataset.y, 10);
    const floor = this.map.floors[this.map.floorIndex];

    const dx = Math.abs(x - this.map.playerX);
    const dy = Math.abs(y - this.map.playerY);
    const isAdjacent = dx + dy === 1;

    if (!isAdjacent && !(x === this.map.playerX && y === this.map.playerY)) {
      this.setStatus(this.dataManager.terms.status.only_adjacent_tiles);
      beep(200, 80);
      return;
    }

    const ch = floor.tiles[y][x];

    if (ch === "#") {
      this.setStatus(this.dataManager.terms.log.wall_blocks);
      beep(180, 80);
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
      beep(800, 150);
      return;
    } else if (ch === "E") {
      this.setStatus("Enemy encountered!");
      this.logMessage("[Battle] Shapes uncoil from the dark.");
      this.openBattle(x, y);
      return;
    } else if (ch === "¥") {
      this.openShop();
      return;
    } else if (ch === "♱") {
      this.logMessage("[Shrine] You encounter a shrine.");
      this.openShrineEvent();
      return;
    } else if (ch === "U") {
      this.openRecruitEvent();
      return;
    }

    beep(600, 80);
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
    beep(800, 150);
    this.updateAll();
  }

  /**
   * @method revealAllFloors
   * @description Reveals all floors.
   */
  revealAllFloors() {
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
    beep(1000, 100);
  }

  /**
   * @typedef {object} BattleState
   * @property {number} floorIndex - The index of the floor the battle is on.
   * @property {number} tileX - The x-coordinate of the tile the battle is on.
   * @property {number} tileY - The y-coordinate of the tile the battle is on.
   * @property {Game_Enemy[]} enemies - The enemies in the battle.
   * @property {number} round - The current round of the battle.
   * @property {boolean} finished - Whether the battle is finished.
   * @property {boolean} victoryPending - Whether the victory screen is pending.
   */

  /**
   * @method openBattle
   * @description Opens the battle screen.
   * @param {number} tileX - The x-coordinate of the tile the battle is on.
   * @param {number} tileY - The y-coordinate of the tile the battle is on.
   */
  openBattle(tileX, tileY) {
    const floor = this.map.floors[this.map.floorIndex];
    const depth = floor.depth;

    let enemies = [];
    const actorTemplates = this.dataManager.actors;

    if (this.map.floorIndex === this.map.floors.length - 1) {
      // Boss
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

    this.battleState = {
      floorIndex: this.map.floorIndex,
      tileX,
      tileY,
      enemies,
      round: 0,
      finished: false,
      victoryPending: false,
    };

    this.battleBusy = false;
    this.battleWindow.logEl.textContent = "";
    this.battleWindow.btnVictory.style.display = "none";
    this.battleWindow.btnRound.disabled = false;
    this.battleWindow.btnFlee.disabled = false;

    this.appendBattleLog(this.dataManager.terms.battle.enemies_emerge);
    enemies.forEach((e) => {
        const primaryElements = getPrimaryElements(e.elements);
        const elementAscii = primaryElements.map(e => this.elementToAscii(e)).join('');
        this.appendBattleLog(` - ${e.name} (${e.role}, ${elementAscii})`);
    });

    this.applyBattleStartPassives();
    this.renderBattleAscii();
    this.battleWindow.open();
    this.modeLabelEl.textContent = "Battle";
    beep(350, 200);
  }

  /**
   * @method closeBattle
   * @description Closes the battle screen.
   */
  closeBattle() {
    this.battleWindow.close();
    this.modeLabelEl.textContent = "Exploration";
    this.updateAll();
  }

  /**
   * @method appendBattleLog
   * @description Appends a message to the battle log.
   * @param {string} msg - The message to append.
   */
  appendBattleLog(msg) {
    const div = document.createElement("div");
    div.textContent = msg;
    this.battleWindow.logEl.appendChild(div);
    this.battleWindow.logEl.scrollTop = this.battleWindow.logEl.scrollHeight;
  }

  /**
   * @method renderBattleAscii
   * @description Renders the battle screen by creating and positioning DOM elements.
   * @param {string} animatingBattlerName - The name of the battler being animated.
   * @param {number} animatingHp - The current HP of the animating battler.
   */
  renderBattleAscii(animatingBattlerName = null, animatingHp = null) {
    if (!this.battleState) return;
    const { enemies } = this.battleState;
    const battlerData = [];

    // --- Enemies ---
    enemies.forEach((e, idx) => {
        const top = 30 + (idx % 2) * 40;
        const left = 20 + Math.floor(idx / 2) * 220;
        const hp = e.name === animatingBattlerName ? animatingHp : e.hp;

        const primaryElements = getPrimaryElements(e.elements);
        const elementAscii = primaryElements.map(el => this.elementToAscii(el)).join('');
        const nameStr = `<span id="battler-${e.name.replace(/\s/g, '-')}">${e.name}</span>`;
        
        battlerData.push({
            top: top,
            left: left,
            html: `${elementAscii}${nameStr} (HP ${hp}/${e.maxHp})\n${this.createHpGauge(hp, e.maxHp)}`
        });
    });

    // --- Party ---
    this.party.members.slice(0, 4).forEach((p, idx) => {
        const top = 140 + (idx % 2) * 40;
        const left = 20 + Math.floor(idx / 2) * 220;
        const hp = p.name === animatingBattlerName ? animatingHp : p.hp;

        const primaryElements = getPrimaryElements(p.elements);
        const elementAscii = primaryElements.map(el => this.elementToAscii(el)).join('');
        const nameStr = `<span id="battler-${p.name.replace(/\s/g, '-')}">${p.name}</span>`;
        
        battlerData.push({
            top: top,
            left: left,
            html: `${elementAscii}${nameStr} (HP ${hp}/${p.maxHp})\n${this.createHpGauge(hp, p.maxHp)}`
        });
    });

    this.battleWindow.refresh(battlerData);
  }

  /**
   * @method resolveBattleRound
   * @description Resolves a round of battle using async/await for cleaner animation sequencing.
   */
  async resolveBattleRound() {
    if (!this.battleState || this.battleState.finished || this.battleBusy)
      return;
    this.battleBusy = true;
    this.battleWindow.btnRound.disabled = true;
    this.battleWindow.btnFlee.disabled = true;

    this.battleState.round++;
    const enemies = this.battleState.enemies;
    const events = [];
    const delay = (ms) => new Promise((res) => setTimeout(res, ms));

    // --- 1. Build Event Queue ---
    // (This part remains the same, generating the list of actions for the round)
    this.party.members.slice(0, 4).forEach((p, index) => {
      if (p.hp > 0) {
        const parasiteDrain = p.getPassiveValue("PARASITE");
        if (parasiteDrain > 0) {
          const targetIndex = index % 2 === 0 ? index + 1 : index - 1;
          if (targetIndex >= 0 && targetIndex < 4) {
            const target = this.party.members[targetIndex];
            if (target && target.hp > 0) {
              events.push({
                msg: `[Passive] ${p.name} drains ${parasiteDrain} HP from ${target.name}.`,
                apply: () => {
                  const oldHp = target.hp;
                  target.hp = Math.max(0, target.hp - parasiteDrain);
                  p.hp = Math.min(p.maxHp, p.hp + parasiteDrain);
                  return { battler: target, oldHp };
                },
              });
            }
          }
        }
      }
      if (p.hp <= 0) return;
      const target = enemies.find((e) => e.hp > 0);
      if (!target) return;
      let base = randInt(2, 4) + Math.floor(p.level / 2);
      if (p.equipmentItem && p.equipmentItem.damageBonus) {
        base += p.equipmentItem.damageBonus;
      }
      const row = this.partyRow(index);
      if (row === "Front") base += 1;
      else base -= 1;
      const mult = this.elementMultiplier(p.elements, target.elements);
      let dmg = Math.round(base * mult);
      dmg += p.getPassiveValue("DEAL_DAMAGE_MOD");
      if (dmg < 1) dmg = 1;
      const skillId =
        p.skills && p.skills.length
          ? p.skills[randInt(0, p.skills.length - 1)]
          : null;
      const skill = skillId ? this.dataManager.skills[skillId] : null;

      if (skill) {
        let boost = 1;
        if (skill.element) {
          const matches = p.elements.filter(
            (e) => e === skill.element
          ).length;
          boost += matches * 0.25;
        }
        const skillName = `${this.elementToAscii(skill.element)}${skill.name}`;
        events.push({
          msg: `${p.name} uses ${skillName}!`,
          battler: p,
          apply: () => {},
        });
        skill.effects.forEach((effect) => {
          if (effect.type === "hp_damage") {
            const formula = effect.formula.replace("a.level", p.level);
            let skillDmg = Math.round(eval(formula) * boost);
            if (skillDmg < 1) skillDmg = 1;
            events.push({
              msg: `  ${target.name} takes ${skillDmg} damage.`,
              battler: p,
              apply: () => {
                if(target.hp <= 0) return;
                const oldHp = target.hp;
                target.hp = Math.max(0, target.hp - skillDmg);
                return { battler: target, oldHp };
              },
            });
          }
          if (effect.type === "add_status") {
            const chance = (effect.chance || 1) * boost;
            if (Math.random() < chance) {
              events.push({
                msg: `  ${target.name} is afflicted with ${effect.status}.`,
                apply: () => {},
              });
            }
          }
        });
      } else {
        events.push({
          msg: `${p.name} attacks ${target.name} for ${dmg}.`,
          battler: p,
          apply: () => {
            if(target.hp <= 0) return;
            const oldHp = target.hp;
            target.hp = Math.max(0, target.hp - dmg);
            return { battler: target, oldHp };
          },
        });
      }
    });
    enemies.forEach((e) => {
      if (e.hp <= 0) return;
      const possibleTargets = this.party.members
        .slice(0, 4)
        .filter((p) => p.hp > 0);
      if (possibleTargets.length === 0) return;
      const target = possibleTargets[randInt(0, possibleTargets.length - 1)];
      const skillId =
        e.skills && e.skills.length
          ? e.skills[randInt(0, e.skills.length - 1)]
          : null;
      const skill = skillId ? this.dataManager.skills[skillId] : null;

      if (skill) {
        let boost = 1;
        if (skill.element) {
          const matches = e.elements.filter(
            (el) => el === skill.element
          ).length;
          boost += matches * 0.25;
        }
        const skillName = `${this.elementToAscii(skill.element)}${skill.name}`;
        events.push({
          msg: `${e.name} uses ${skillName}!`,
          battler: e,
          apply: () => {},
        });
        skill.effects.forEach((effect) => {
          if (effect.type === "hp_damage") {
            const formula = effect.formula.replace("a.level", e.level);
            let skillDmg = Math.round(eval(formula) * boost);
            if (skillDmg < 1) skillDmg = 1;
            events.push({
              msg: `  ${target.name} takes ${skillDmg} damage.`,
              battler: e,
              apply: () => {
                if(target.hp <= 0) return;
                const oldHp = target.hp;
                target.hp = Math.max(0, target.hp - skillDmg);
                return { battler: target, oldHp };
              },
            });
          }
          if (effect.type === "add_status") {
            const chance = (effect.chance || 1) * boost;
            if (Math.random() < chance) {
              events.push({
                msg: `  ${target.name} is afflicted with ${effect.status}.`,
                apply: () => {},
              });
            }
          }
        });
      } else {
        const dmg = Math.max(1, e.level + randInt(-1, 2));
        events.push({
          msg: `${e.name} attacks ${target.name} for ${dmg}.`,
          battler: e,
          apply: () => {
            if(target.hp <= 0) return;
            const oldHp = target.hp;
            target.hp = Math.max(0, target.hp - dmg);
            return { battler: target, oldHp };
          },
        });
      }
    });
    beep(300, 80);

    // --- 2. Process Events Sequentially ---
    for (const ev of events) {
      if (ev.battler && ev.battler.hp <= 0) {
        continue;
      }
      if (ev.battler) {
        await this.animateBattlerName(ev.battler);
        await delay(300);
      }

      this.appendBattleLog(ev.msg);
      const animInfo = ev.apply();

      if (animInfo && animInfo.battler) {
        this.animateBattler(animInfo.battler, 'flash');
        await this.animateBattleHpGauge(animInfo.battler, animInfo.oldHp);
      } else {
        this.renderBattleAscii();
      }
      await delay(600);
    }

    // --- 3. Finalize Round ---
    const anyEnemyAlive = enemies.some((e) => e.hp > 0);
    const anyPartyAlive = this.party.members
      .slice(0, 4)
      .some((p) => p.hp > 0);

    if (!anyPartyAlive) {
      this.appendBattleLog(this.dataManager.terms.battle.your_party_collapses);
      this.logMessage(this.dataManager.terms.log.party_falls);
      this.runActive = false;
      this.battleState.finished = true;
    } else if (!anyEnemyAlive) {
      this.appendBattleLog(this.dataManager.terms.battle.victory);
      this.battleState.finished = true;
      this.battleState.victoryPending = true;
    }

    this.updateParty();
    this.renderBattleAscii();

    if (this.battleState && this.battleState.victoryPending) {
      this.battleWindow.btnVictory.style.display = "inline-block";
    }
    if (
      !this.battleState ||
      (!this.battleState.finished || !this.battleState.victoryPending)
    ) {
      this.battleWindow.btnRound.disabled = false;
      this.battleWindow.btnFlee.disabled = false;
    }
    if (!this.battleState.finished) {
      this.appendBattleLog("Use Resolve Round or Flee.");
    }
    this.battleBusy = false;
    this.updateAll();
  }

  /**
   * @method gainXp
   * @description Gains experience for a party member.
   * @param {Game_Battler} member - The party member to gain experience.
   * @param {number} amount - The amount of experience to gain.
   */
  gainXp(member, amount) {
    if (!member || amount <= 0) return;
    member.xp = (member.xp || 0) + amount;
    let leveled = false;
    while (member.xp >= member.xpNeeded(member.level)) {
      member.xp -= member.xpNeeded(member.level);
      member.level++;
      const hpGain = randInt(2, 4);
      member.maxHp += hpGain;
      member.hp = member.maxHp;
      this.logMessage(
        `[Level] ${member.name} grows to Lv${member.level}! HP +${hpGain}.`
      );
      leveled = true;
    }
    if (leveled) {
      beep(900, 150);
      this.updateParty();
    }
  }

  /**
   * @method applyPostBattlePassives
   * @description This is an example of a passive skill being triggered.
   * It is called after a battle victory.
   * It finds any living "Pixie" in the party and heals all living party members for a small amount.
   * This is a hardcoded passive effect. A more robust system would involve a passive skill manager
   * that would iterate through all party members and check for passive skills that should be triggered
   * by the "onBattleVictory" event.
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
          this.logMessage(
            `[Passive] ${member.name} heals the party for ${heal} HP.`
          );
        }
      }
    });
    this.updateParty();
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
          const target = this.battleState.enemies.find((e) => e.hp > 0);
          if (target) {
            target.hp = Math.max(0, target.hp - damage);
            this.appendBattleLog(
              `[Passive] ${member.name} hits ${target.name} for ${damage}.`
            );
          }
        }
      }
    });
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
   * @method attemptFlee
   * @description Attempts to flee from battle.
   */
  attemptFlee() {
    if (Math.random() < this.getFleeChance()) {
      this.logMessage("[Battle] You successfully fled!");
      this.closeBattle();
    } else {
      this.appendBattleLog("You failed to flee!");
    }
  }

  /**
   * @method onBattleVictoryClick
   * @description Handles the click of the victory button.
   */
  onBattleVictoryClick() {
    if (!this.battleState || !this.battleState.victoryPending) return;
    const enemies = this.battleState.enemies;
    let totalGold = enemies.reduce((sum, e) => sum + (e.gold || 0), 0);
    const totalXp = enemies.reduce((sum, e) => sum + Math.floor(e.level * (e.expGrowth * 0.5) + 8), 0);

    const living = this.party.members.slice(0, 4).filter((p) => p.hp > 0);
    living.forEach((m) => {
      const goldBonus = m.getPassiveValue("GOLD_DIGGER");
      if (goldBonus > 0) {
        totalGold += goldBonus;
        this.logMessage(`[Passive] ${m.name} finds an extra ${goldBonus}G!`);
      }
    });
    const share =
      living.length > 0 ? Math.max(1, Math.floor(totalXp / living.length)) : 0;
    living.forEach((m) => this.gainXp(m, share));

    this.party.gold += totalGold;
    this.logMessage(
      `[Battle] Victory! Gained ${totalGold}G and ${totalXp} XP (split).`
    );
    this.statusGoldEl.textContent = this.party.gold;

    this.applyPostBattlePassives();

    this.clearEnemyTileAfterBattle();

    this.battleState.victoryPending = false;
    this.battleWindow.btnVictory.style.display = "none";
    this.closeBattle();
    this.setStatus("Victory.");
    beep(900, 200);
  }

  /**
   * @method clearEnemyTileAfterBattle
   * @description Clears the enemy tile after a battle.
   */
  clearEnemyTileAfterBattle() {
    if (!this.battleState) return;
    const f = this.map.floors[this.battleState.floorIndex];
    const { tileX, tileY } = this.battleState;
    if (f.tiles[tileY][tileX] === "E") {
      f.tiles[tileY][tileX] = ".";
    }
    this.map.revealAroundPlayer(f);
    this.updateGrid();
  }

  /**
   * @method openShop
   * @description Opens the shop.
   */
  openShop() {
    this.shopWindow.open(
      this.party.gold,
      this.dataManager.terms.shop.vendor_message,
      this.dataManager.items,
      (itemId) => this.buyItem(itemId)
    );
    this.modeLabelEl.textContent = "Shop";
    beep(650, 150);
  }

  /**
   * @method closeShop
   * @description Closes the shop.
   */
  closeShop() {
    this.shopWindow.close();
    this.modeLabelEl.textContent = "Exploration";
    this.updateAll();
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
      this.shopWindow.messageEl.textContent =
        this.dataManager.terms.shop.not_enough_gold;
      beep(180, 80);
      return;
    }

    this.party.gold -= item.cost;
    this.party.inventory.push(item);
    this.shopWindow.goldLabelEl.textContent = this.party.gold;
    this.shopWindow.messageEl.textContent =
      this.dataManager.terms.shop.purchased + item.name + ".";
    this.logMessage(
      `[Shop] ${this.dataManager.terms.shop.purchased}${item.name}.`
    );
    this.updateAll();
    beep(600, 80);
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
    this.eventWindow.open();
    this.setStatus("Shrine event.");
    beep(700, 150);
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
    this.eventWindow.close();
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
          recruit.spriteKey || "default"
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
            <span class="inspect-value">${recruit.passives.map(p => p.description).join(', ') || "—"}</span>
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

    this.recruitWindow.open();
    this.setStatus("Recruit encountered.");
    beep(400, 100);
  }

  /**
   * @method closeRecruitEvent
   * @description Closes the recruit event.
   */
  closeRecruitEvent() {
    this.recruitWindow.close();
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
      this.party.members.push(new Game_Actor(recruit));
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
    this.party.members[index] = new Game_Actor(recruit);
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
   * @method elementToAscii
   * @description Converts an element to its ASCII representation.
   * @param {string} element - The element to convert.
   * @returns {string} The ASCII representation of the element.
   */
  elementToAscii(element) {
    switch (element) {
        case "Red": return "(R)";
        case "Green": return "(G)";
        case "Blue": return "(B)";
        case "White": return "(W)";
        case "Black": return "(K)";
        default: return "";
    }
  }

  /**
   * @method elementToIcon
   * @description Converts an element to its icon ID.
   * @param {string} element - The element to convert.
   * @returns {number} The icon ID of the element.
   */
  elementToIcon(element) {
    switch (element) {
        case "Red": return 1;
        case "Green": return 2;
        case "Blue": return 3;
        case "White": return 4;
        case "Black": return 5;
        case "l_Red": return 11;
        case "l_Green": return 12;
        case "l_Blue": return 13;
        case "l_White": return 14;
        case "l_Black": return 15;
        default: return 0;
    }
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
            const iconId = this.elementToIcon(primaryElements[0]);
            if (iconId > 0) {
                const iconIndex = iconId - 1;
                icon.style.backgroundPosition = `-${(iconIndex % 10) * 12}px -${Math.floor(iconIndex / 10) * 12}px`;
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
                const iconId = this.elementToIcon('l_' + element);
                if (iconId > 0) {
                    const iconIndex = iconId - 1;
                    icon.style.backgroundPosition = `-${(iconIndex % 10) * 12}px -${Math.floor(iconIndex / 10) * 12}px`;
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
        const iconId = this.elementToIcon(element);
        if (iconId > 0) {
            const iconIndex = iconId - 1;
            icon.style.backgroundPosition = `-${(iconIndex % 10) * 12}px -${Math.floor(iconIndex / 10) * 12}px`;
        }
        container.appendChild(icon);
    });
    return container;
}

  /**
   * @method createHpGauge
   * @description Creates an HP gauge.
   * @param {number} hp - The current HP.
   * @param {number} maxHp - The maximum HP.
   * @returns {string} The HP gauge.
   */
  createHpGauge(hp, maxHp) {
    const totalLength = 15;
    let filledCount = Math.round((hp / maxHp) * totalLength);
    if (hp > 0 && filledCount === 0) {
      filledCount = 1;
    }
    if (filledCount < 0) {
      filledCount = 0;
    }
    const emptyCount = totalLength - filledCount;
    return `[${"#".repeat(filledCount)}${" ".repeat(emptyCount)}]`;
  }

  /**
   * @method elementMultiplier
   * @description Calculates the element multiplier.
   * @param {string[]} attackerElements - The elements of the attacker.
   * @param {string[]} defenderElements - The elements of the defender.
   * @returns {number} The element multiplier.
   */
  elementMultiplier(attackerElements, defenderElements) {
    let multiplier = 1;
    let advantageFound = false;
    let disadvantageFound = false;

    for (const attackerEl of attackerElements) {
      if (advantageFound || disadvantageFound) break;
      for (const defenderEl of defenderElements) {
        const row = this.dataManager.elements[attackerEl];
        if (row) {
          if (row.strong && row.strong.includes(defenderEl)) {
            advantageFound = true;
            break;
          }
          if (row.weak && row.weak.includes(defenderEl)) {
            disadvantageFound = true;
            break;
          }
        }
      }
    }

    if (advantageFound) {
      multiplier = 1.5;
    } else if (disadvantageFound) {
      multiplier = 0.75;
    }

    return multiplier;
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
    this.formationWindow.open();
    this.renderFormationGrid();
  }

  /**
   * @method closeFormation
   * @description Closes the formation window.
   */
  closeFormation() {
    this.formationWindow.close();
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
    beep(500, 80);
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
    this.inventoryWindow.open();
    this.renderInventory();
  }

  /**
   * @method closeInventory
   * @description Closes the inventory window.
   */
  closeInventory() {
    this.inventoryWindow.close();
  }

  /**
   * @method renderInventory
   * @description Renders the inventory.
   */
  renderInventory() {
    this.inventoryWindow.listEl.innerHTML = "";
    if (this.party.inventory.length === 0) {
      this.inventoryWindow.emptyMsgEl.style.display = "block";
    } else {
      this.inventoryWindow.emptyMsgEl.style.display = "none";
      this.party.inventory.forEach((item, idx) => {
        const row = document.createElement("div");
        row.className = "shop-row";

        const icon = document.createElement('div');
        icon.className = "icon";
        const iconId = item.icon || 6; // Use icon 6 as a placeholder
        if (iconId > 0) {
            const iconIndex = iconId - 1;
            icon.style.backgroundPosition = `-${(iconIndex % 10) * 12}px -${Math.floor(iconIndex / 10) * 12}px`;
        }
        row.appendChild(icon);

        const desc = document.createElement("span");
        desc.textContent = `${item.name}: ${item.description}`;
        desc.style.flexGrow = "1";
        row.appendChild(desc);

        const btns = document.createElement("div");
        const useBtn = document.createElement("button");
        useBtn.className = "win-btn";
        useBtn.textContent = "Use";
        useBtn.addEventListener("click", () => this.useItem(item, idx));
        const discardBtn = document.createElement("button");
        discardBtn.className = "win-btn";
        discardBtn.textContent = "Discard";
        discardBtn.addEventListener("click", () => this.discardItem(item, idx));
        btns.appendChild(useBtn);
        btns.appendChild(discardBtn);

        row.appendChild(btns);
        this.inventoryWindow.listEl.appendChild(row);
      });
    }
  }

  /**
   * @method useItem
   * @description Uses an item from the inventory.
   * @param {Object} item - The item to use.
   * @param {number} index - The index of the item in the inventory.
   */
  useItem(item, index) {
    this.inventoryWindow.listEl.innerHTML =
      "Select a party member to use this on:";
    this.party.members.forEach((m, idx) => {
      const btn = document.createElement("button");
      btn.className = "win-btn";
      btn.textContent = `${m.name} (HP ${m.hp}/${m.maxHp})`;
      btn.addEventListener("click", () => {
        this.applyItemToMember(item, index, idx);
      });
      this.inventoryWindow.listEl.appendChild(btn);
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
    this.renderInventory();
    this.updateAll();
    beep(700, 100);
  }

  /**
   * @method discardItem
   * @description Discards an item from the inventory.
   * @param {Object} item - The item to discard.
   * @param {number} index - The index of the item in the inventory.
   */
  discardItem(item, index) {
    this.party.inventory.splice(index, 1);
    this.renderInventory();
    this.updateAll();
    this.logMessage(`[Inventory] Discarded ${item.name}.`);
    beep(300, 80);
  }

  /**
   * @method openInspect
   * @description Opens the inspect window.
   * @param {Game_Battler} member - The party member to inspect.
   * @param {number} index - The index of the party member.
   */
  openInspect(member, index) {
    this.inspectWindow.member = member;
    this.inspectWindow.memberIndex = index;

    const need = member.xpNeeded(member.level);
    this.inspectWindow.spriteEl.style.backgroundImage = `url('assets/portraits/${
      member.spriteKey || "default"
    }.png')`;
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
    this.inspectWindow.passiveEl.textContent =
      member.passives.map((p) => p.description).join(", ") || "—";
    this.inspectWindow.skillsEl.innerHTML =
      (member.skills && member.skills.length)
        ? member.skills
            .map((s) => this.formatSkillName(s))
            .join(", ")
        : "—";
    this.inspectWindow.flavorEl.textContent = member.flavor || "—";
    this.inspectWindow.notesEl.textContent =
      "Row is determined by the 2×2 formation grid.";

    this.inspectWindow.open();
    this.setStatus(`Inspecting ${member.name}`);
    this.logMessage(
      `[Inspect] ${member.name} – Lv${member.level}, ${this.partyRow(
        index
      )}, HP ${member.hp}/${member.maxHp}.`
    );

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
    this.inspectWindow.close();
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
        beep(600, 80); // Unequip sound
      }
      // Equip the new item
      member.equipmentItem = item;
      // Remove the new item from inventory
      const invIndex = this.party.inventory.findIndex((i) => i.id === item.id);
      if (invIndex > -1) {
        this.party.inventory.splice(invIndex, 1);
      }
      this.logMessage(`[Equip] ${member.name} equipped ${item.name}.`);
      this.closeInspect();
      this.updateAll();
      beep(800, 100); // Equip sound
    };

    // If the item is equipped by another member, show confirmation
    if (item.equippedMember) {
      const otherMember = item.equippedMember;
      this.confirmWindow.titleEl.textContent = "Confirm Swap";
      this.confirmWindow.messageEl.textContent = `Swap ${item.name} from ${otherMember.name} to ${member.name}?`;
      this.confirmWindow.open();
      this.confirmWindow.btnOk.onclick = () => {
        const currentItem = member.equipmentItem;
        otherMember.equipmentItem = currentItem;
        member.equipmentItem = item;
        this.logMessage(
          `[Equip] ${member.name} swapped ${item.name} with ${otherMember.name}.`
        );
        this.confirmWindow.close();
        this.closeInspect();
        this.updateAll();
        beep(700, 150); // Swap sound
      };
      this.confirmWindow.btnCancel.onclick = () => {
        this.confirmWindow.close();
      };
    } else {
      doEquip();
    }
  }
}
