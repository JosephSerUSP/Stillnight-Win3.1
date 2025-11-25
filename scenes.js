import { Game_Map, Game_Party, Game_Enemy, Game_Actor } from "./objects.js";
import { beep, randInt, shuffleArray } from "./core.js";
import {
  Window_Battle,
  Window_Shop,
  Window_Event,
  Window_Recruit,
  Window_Formation,
  Window_Inventory,
  Window_Inspect,
} from "./windows.js";

/**
 * The main scene for the map exploration.
 * @class
 */
export class Scene_Map {
  /**
   * @param {import("./managers.js").DataManager} dataManager - The data manager instance.
   */
  constructor(dataManager) {
    this.dataManager = dataManager;
    this.map = new Game_Map();
    this.party = new Game_Party();
    this.runActive = true;
    this.battleState = null;
    this.battleBusy = false;
    this.draggedIndex = null;

    this.getDomElements();
    this.addEventListeners();

    this.battleWindow = new Window_Battle();
    this.shopWindow = new Window_Shop();
    this.eventWindow = new Window_Event();
    this.recruitWindow = new Window_Recruit();
    this.formationWindow = new Window_Formation();
    this.inventoryWindow = new Window_Inventory();
    this.inspectWindow = new Window_Inspect();

    this.battleWindow.btnRound.addEventListener(
      "click",
      this.resolveBattleRound.bind(this)
    );
    this.battleWindow.btnFlee.addEventListener(
      "click",
      this.closeBattle.bind(this)
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
  }

  /**
   * Starts the scene.
   */
  start() {
    this.startNewRun();
  }

  /**
   * Starts a new game run.
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
   * Gets all the DOM elements needed for the scene.
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
   * Adds event listeners to the DOM elements.
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
  }

  /**
   * Logs a message to the event log.
   * @param {string} msg - The message to log.
   */
  logMessage(msg) {
    this.logEl.textContent += msg + "\n";
    this.logEl.scrollTop = this.logEl.scrollHeight;
  }

  /**
   * Sets the status message.
   * @param {string} msg - The status message.
   */
  setStatus(msg) {
    this.statusMessageEl.textContent = msg;
  }

  /**
   * Updates all the UI elements.
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
   * Updates the exploration grid.
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
   * Updates the card header.
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
   * Updates the card list.
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
   * Updates the party display.
   */
  updateParty() {
    this.partyGridEl.innerHTML = "";
    this.party.members.forEach((member, index) => {
      const slot = document.createElement("div");
      slot.className = "party-slot";
      slot.dataset.index = index;

      const nameEl = document.createElement("div");
      nameEl.className = "party-slot-name";
      nameEl.textContent = member.name;

      const hpLabel = document.createElement("div");
      const row = this.partyRow(index);
      hpLabel.textContent = `Lv${member.level} (${row})  HP ${member.hp}/${member.maxHp}`;

      const hpBar = document.createElement("div");
      hpBar.className = "hp-bar";
      const hpFill = document.createElement("div");
      hpFill.className = "hp-fill";
      hpFill.style.width = `${Math.max(0, (member.hp / member.maxHp) * 100)}%`;
      hpBar.appendChild(hpFill);

      slot.appendChild(nameEl);
      slot.appendChild(hpLabel);
      slot.appendChild(hpBar);

      slot.addEventListener("click", () => this.openInspect(member, index));
      this.partyGridEl.appendChild(slot);
    });
  }

  /**
   * Handles tile clicks.
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

    if (ch === ".") {
      this.logMessage("[Step] Your footsteps echo softly.");
      this.setStatus("You move.");
    } else if (ch === "R") {
      this.party.members.forEach((m) => (m.hp = m.maxHp));
      this.logMessage("[Recover] A soft glow restores your party.");
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
    this.updateAll();
  }

  /**
   * Descends to the next floor.
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
   * Reveals all floors.
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
   * Opens the battle screen.
   * @param {number} tileX - The x-coordinate of the tile the battle is on.
   * @param {number} tileY - The y-coordinate of the tile the battle is on.
   */
  openBattle(tileX, tileY) {
    const floor = this.map.floors[this.map.floorIndex];
    const depth = floor.depth;

    let enemies = [];
    if (this.map.floorIndex === this.map.floors.length - 1) {
      // Boss
      const bossHp = 40 + (depth - 3) * 5;
      enemies.push({
        name: "🌑 Eternal Warden",
        tag: "Boss",
        maxHp: bossHp,
        hp: bossHp,
        minDmg: 4 + depth,
        maxDmg: 7 + depth,
        xpReward: 40 + depth * 10,
        goldReward: 30 + depth * 5,
        element: "Dark",
      });
    } else {
      const enemyCount = randInt(1, 3);
      for (let i = 0; i < enemyCount; i++) {
        const tpl =
          this.dataManager.enemies[
            randInt(0, this.dataManager.enemies.length - 1)
          ];
        enemies.push(new Game_Enemy(tpl, depth));
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
      this.appendBattleLog(` - ${e.name} (${e.tag}, ${e.element})`);
    });

    this.renderBattleAscii();
    this.battleWindow.open();
    this.modeLabelEl.textContent = "Battle";
    beep(350, 200);
  }

  /**
   * Closes the battle screen.
   */
  closeBattle() {
    this.battleWindow.close();
    this.modeLabelEl.textContent = "Exploration";
    this.updateAll();
  }

  /**
   * Appends a message to the battle log.
   * @param {string} msg - The message to append.
   */
  appendBattleLog(msg) {
    this.battleWindow.logEl.textContent += msg + "\n";
    this.battleWindow.logEl.scrollTop = this.battleWindow.logEl.scrollHeight;
  }

  /**
   * Renders the battle screen.
   */
  renderBattleAscii() {
    if (!this.battleState) return;
    const { enemies, round } = this.battleState;

    let ascii = "";
    ascii += "== STILLNIGHT BATTLE ==\n";
    ascii += "Round: " + round + "\n";
    ascii += "------------------------\n";
    ascii += "ENEMIES\n";
    enemies.forEach((e, idx) => {
      ascii += ` ${idx + 1}) ${e.name} (${e.tag}, ${e.element})\n`;
      ascii += `     HP [${"#".repeat(
        Math.round((e.hp / e.maxHp) * 16)
      )}${"-".repeat(
        16 - Math.round((e.hp / e.maxHp) * 16)
      )}] ${e.hp}/${e.maxHp}\n`;
    });
    ascii += "\nPARTY\n";
    this.party.members.slice(0, 4).forEach((p, i) => {
      ascii += `   ${p.name} (Lv${p.level}, ${
        p.element
      }, ${this.partyRow(i)})\n`;
      ascii += `   HP [${"#".repeat(
        Math.round((p.hp / p.maxHp) * 16)
      )}${"-".repeat(
        16 - Math.round((p.hp / p.maxHp) * 16)
      )}] ${p.hp}/${p.maxHp}\n`;
    });
    ascii += "------------------------\n";
    if (this.battleState.victoryPending) {
      ascii += "VICTORY! Click the button to return.\n";
    } else if (!this.runActive) {
      ascii += "Your run has ended.\n";
    } else {
      ascii += "Use Resolve Round or Flee.\n";
    }

    this.battleWindow.asciiEl.textContent = ascii;
  }

  /**
   * Resolves a round of battle.
   */
  resolveBattleRound() {
    if (!this.battleState || this.battleState.finished || this.battleBusy)
      return;
    this.battleBusy = true;
    this.battleWindow.btnRound.disabled = true;
    this.battleWindow.btnFlee.disabled = true;

    this.battleState.round++;

    const enemies = this.battleState.enemies;
    const events = [];

    this.party.members.slice(0, 4).forEach((p, index) => {
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

      const mult = this.elementMultiplier(p.element, target.element);
      let dmg = Math.round(base * mult);
      if (p.name.includes("Demon")) dmg += 1; // Blood Price
      if (dmg < 1) dmg = 1;

      const usedSkill =
        p.skills && p.skills.length
          ? " using " + p.skills[randInt(0, p.skills.length - 1)]
          : "";

      events.push({
        msg: `${p.name}${usedSkill} hits ${target.name} for ${dmg}.`,
        apply: () => (target.hp = Math.max(0, target.hp - dmg)),
      });
    });

    enemies.forEach((e) => {
      if (e.hp <= 0) return;
      const possibleTargets = this.party.members
        .slice(0, 4)
        .filter((p) => p.hp > 0);
      if (possibleTargets.length === 0) return;
      const target = possibleTargets[randInt(0, possibleTargets.length - 1)];
      const idx = this.party.members.indexOf(target);

      let dmgBase = randInt(e.minDmg, e.maxDmg);
      const mult = this.elementMultiplier(e.element, target.element);
      let dmg = Math.round(dmgBase * mult);

      const row = this.partyRow(idx);
      if (row === "Front") dmg += 1;
      else dmg -= 1;

      if (target.name.includes("Demon")) dmg += 1;
      if (target.name.includes("Skeleton")) dmg = Math.max(1, dmg - 1);
      if (dmg < 1) dmg = 1;

      events.push({
        msg: `${e.name} lashes out at ${target.name} for ${dmg}.`,
        apply: () => (target.hp = Math.max(0, target.hp - dmg)),
      });
    });

    const delay = 450;
    let i = 0;

    const playNext = () => {
      if (i < events.length) {
        const ev = events[i];
        ev.apply();
        this.appendBattleLog(ev.msg);
        this.renderBattleAscii();
        i++;
        setTimeout(playNext, delay);
      } else {
        finalizeRound();
      }
    };

    const finalizeRound = () => {
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
      this.battleBusy = false;
      this.updateAll();
    };

    playNext();
    beep(300, 80);
  }

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
   * This is an example of a passive skill being triggered.
   * It is called after a battle victory.
   * It finds any living "Pixie" in the party and heals all living party members for a small amount.
   * This is a hardcoded passive effect. A more robust system would involve a passive skill manager
   * that would iterate through all party members and check for passive skills that should be triggered
   * by the "onBattleVictory" event.
   */
  pixieVictoryHeal() {
    const pixie = this.party.members.find(
      (p) => p.name.includes("Pixie") && p.hp > 0
    );
    if (!pixie) return;
    const heal = randInt(1, 2);
    this.party.members.forEach((m) => {
      if (m.hp > 0) {
        m.hp = Math.min(m.maxHp, m.hp + heal);
      }
    });
    this.logMessage(
      `[Passive] Pixie scatters motes; party recovers ${heal} HP.`
    );
    this.updateParty();
  }

  onBattleVictoryClick() {
    if (!this.battleState || !this.battleState.victoryPending) return;
    const enemies = this.battleState.enemies;
    const totalXp = enemies.reduce((sum, e) => sum + (e.xpReward || 0), 0);
    const totalGold = enemies.reduce((sum, e) => sum + (e.goldReward || 0), 0);

    const living = this.party.members.slice(0, 4).filter((p) => p.hp > 0);
    const share =
      living.length > 0 ? Math.max(1, Math.floor(totalXp / living.length)) : 0;
    living.forEach((m) => this.gainXp(m, share));

    this.party.gold += totalGold;
    this.logMessage(
      `[Battle] Victory! Gained ${totalGold}G and ${totalXp} XP (split).`
    );
    this.statusGoldEl.textContent = this.party.gold;

    this.pixieVictoryHeal();

    this.clearEnemyTileAfterBattle();

    this.battleState.victoryPending = false;
    this.battleWindow.btnVictory.style.display = "none";
    this.closeBattle();
    this.setStatus("Victory.");
    beep(900, 200);
  }

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

  // Shop methods
  openShop() {
    this.shopWindow.goldLabelEl.textContent = this.party.gold;
    this.shopWindow.messageEl.textContent =
      this.dataManager.terms.shop.vendor_message;
    this.renderShopItems();
    this.shopWindow.open();
    this.modeLabelEl.textContent = "Shop";
    beep(650, 150);
  }

  renderShopItems() {
    const listContainer = document.getElementById("shop-item-list");
    if (!listContainer) return;
    listContainer.innerHTML = "";
    this.dataManager.items.forEach((tpl) => {
      const row = document.createElement("div");
      row.className = "shop-row";
      const label = document.createElement("span");
      label.textContent = `${tpl.name} (${tpl.cost}G): ${tpl.description}`;
      const btn = document.createElement("button");
      btn.className = "win-btn";
      btn.textContent = "Buy";
      btn.addEventListener("click", () => {
        this.buyItem(tpl.id);
      });
      row.appendChild(label);
      row.appendChild(btn);
      listContainer.appendChild(row);
    });
  }

  closeShop() {
    this.shopWindow.close();
    this.modeLabelEl.textContent = "Exploration";
    this.updateAll();
  }

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

  // Shrine methods
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

  closeEvent() {
    this.eventWindow.close();
    this.updateAll();
  }

  // Recruit methods
  openRecruitEvent() {
    if (this.dataManager.actors.recruits.length === 0) {
      this.logMessage(this.dataManager.terms.recruit.no_one_here);
      return;
    }
    const recruit =
      this.dataManager.actors.recruits[
        randInt(0, this.dataManager.actors.recruits.length - 1)
      ];
    this.recruitWindow.bodyEl.innerHTML = `
      <div class="inspect-layout">
        <div class="inspect-sprite" style="background-image: url('sprites/${
          recruit.spriteKey || "default"
        }.png')"></div>
        <div class="inspect-fields">
          <div class="inspect-row">
            <span class="inspect-label">Name</span>
            <span class="inspect-value">${recruit.name}</span>
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
            <span class="inspect-value">${recruit.element}</span>
          </div>
          <div class="inspect-row">
            <span class="inspect-label">Equipment</span>
            <span class="inspect-value">${recruit.equipment || "—"}</span>
          </div>
          <div class="inspect-row">
            <span class="inspect-label">Passive</span>
            <span class="inspect-value">${recruit.passive || "—"}</span>
          </div>
          <div class="inspect-row">
            <span class="inspect-label">Skills</span>
            <span class="inspect-value">${
              recruit.skills.join(", ") || "—"
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
    joinBtn.textContent = "Join";
    joinBtn.addEventListener("click", () => {
      this.attemptRecruit(recruit);
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
    this.recruitWindow.open();
    this.setStatus("Recruit encountered.");
    beep(400, 100);
  }

  closeRecruitEvent() {
    this.recruitWindow.close();
    this.setStatus("Exploration");
  }

  attemptRecruit(recruit) {
    if (this.party.members.length < this.party.MAX_MEMBERS) {
      this.party.members.push(new Game_Actor(recruit));
      this.logMessage(`[Recruit] ${recruit.name} joins your party.`);
      this.setStatus(
        this.dataManager.terms.recruit.recruited.replace("{0}", recruit.name)
      );
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

  replaceMemberWithRecruit(index, recruit) {
    const replaced = this.party.members[index];
    this.logMessage(
      this.dataManager.terms.recruit.replace_member
        .replace("{0}", replaced.name)
        .replace("{1}", recruit.name)
    );
    this.party.members[index] = new Game_Actor(recruit);
    this.updateParty();
    this.closeRecruitEvent();
  }

  elementMultiplier(attackerEl, defenderEl) {
    const row = this.dataManager.elements[attackerEl];
    if (!row) return 1;
    if (row.strong && row.strong.includes(defenderEl)) return 1.5;
    if (row.weak && row.weak.includes(defenderEl)) return 0.75;
    return 1;
  }

  partyRow(index) {
    return index <= 1 ? "Front" : "Back";
  }

  // Formation methods
  openFormation() {
    this.formationWindow.open();
    this.renderFormationGrid();
  }

  closeFormation() {
    this.formationWindow.close();
  }

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

  onFormationDragStart(e) {
    this.draggedIndex = parseInt(e.target.dataset.index, 10);
    e.target.classList.add("dragging");
  }

  onFormationDragOver(e) {
    e.preventDefault();
    const target = e.target.closest(".formation-slot");
    if (target) {
      target.classList.add("drag-over");
    }
  }

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

  onFormationDragEnd(e) {
    document
      .querySelectorAll(".formation-slot")
      .forEach((s) => s.classList.remove("dragging", "drag-over"));
  }

  // Inventory methods
  openInventory() {
    this.inventoryWindow.open();
    this.renderInventory();
  }

  closeInventory() {
    this.inventoryWindow.close();
  }

  renderInventory() {
    this.inventoryWindow.listEl.innerHTML = "";
    if (this.party.inventory.length === 0) {
      this.inventoryWindow.emptyMsgEl.style.display = "block";
    } else {
      this.inventoryWindow.emptyMsgEl.style.display = "none";
      this.party.inventory.forEach((item, idx) => {
        const row = document.createElement("div");
        row.className = "shop-row";
        const desc = document.createElement("span");
        desc.textContent = `${item.name}: ${item.description}`;
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

  discardItem(item, index) {
    this.party.inventory.splice(index, 1);
    this.renderInventory();
    this.updateAll();
    this.logMessage(`[Inventory] Discarded ${item.name}.`);
    beep(300, 80);
  }

  // Inspect methods
  openInspect(member, index) {
    this.inspectWindow.member = member;
    this.inspectWindow.memberIndex = index;

    const need = member.xpNeeded(member.level);
    this.inspectWindow.spriteEl.style.backgroundImage = `url('sprites/${
      member.spriteKey || "default"
    }.png')`;
    this.inspectWindow.nameEl.textContent = member.name;
    this.inspectWindow.levelEl.textContent = member.level;
    this.inspectWindow.rowPosEl.textContent = this.partyRow(index);
    this.inspectWindow.hpEl.textContent = `${member.hp} / ${member.maxHp}`;
    this.inspectWindow.xpEl.textContent = `${member.xp || 0} / ${need}`;
    this.inspectWindow.elementEl.textContent = member.element || "—";
    if (member.equipmentItem) {
      this.inspectWindow.equipEl.textContent = member.equipmentItem.name;
    } else if (member.baseEquipment) {
      this.inspectWindow.equipEl.textContent = member.baseEquipment;
    } else {
      this.inspectWindow.equipEl.textContent = "—";
    }
    this.inspectWindow.passiveEl.textContent = member.passive || "—";
    this.inspectWindow.skillsEl.textContent =
      (member.skills && member.skills.length) ? member.skills.join(", ") : "—";
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
    this.inspectWindow.btnEquip.onclick = () => this.openEquipmentScreen();
  }

  closeInspect() {
    this.inspectWindow.close();
    this.setStatus("Exploration");
  }

  openEquipmentScreen() {
    this.inspectWindow.bodyEl.innerHTML = "<p>Select an item to equip:</p>";
    const list = document.createElement("div");
    list.className = "shop-item-list";
    const equipable = this.party.inventory.filter((i) => i.type === "equipment");

    if (equipable.length > 0) {
      equipable.forEach((item, invIndex) => {
        const row = document.createElement("div");
        row.className = "shop-row";
        const label = document.createElement("span");
        label.textContent = `${item.name} (+${item.damageBonus} DMG)`;
        const btn = document.createElement("button");
        btn.className = "win-btn";
        btn.textContent = "Equip";
        btn.addEventListener("click", () => {
          this.equipItem(item, invIndex);
        });
        row.appendChild(label);
        row.appendChild(btn);
        list.appendChild(row);
      });
    } else {
      list.innerHTML = "<p>No equipable items in inventory.</p>";
    }
    this.inspectWindow.bodyEl.appendChild(list);
  }

  equipItem(item, invIndex) {
    const member = this.inspectWindow.member;
    if (member.equipmentItem) {
      this.party.inventory.push(member.equipmentItem);
    }
    member.equipmentItem = item;
    this.party.inventory.splice(
      this.party.inventory.findIndex((i) => i.id === item.id),
      1
    );
    this.logMessage(`[Equip] ${member.name} equipped ${item.name}.`);
    this.closeInspect();
    this.updateAll();
    beep(800, 100);
  }
}
