import { Game_Map, Game_Party, Game_Battler } from "./objects.js";
import { randInt, shuffleArray, getPrimaryElements } from "./core.js";
import { SoundManager } from "./managers.js";
import { Scene_Base } from "./sceneBase.js";
import { SceneManager } from "./sceneManager.js";
import { Scene_Battle } from "./sceneBattle.js";
import { Scene_Shop } from "./sceneShop.js";
import {
  Window_Event,
  Window_Recruit,
  Window_Formation,
  Window_Inventory,
  Window_Inspect,
  Window_Confirm,
} from "./windows.js";

export { Scene_Base }; // Re-export for compatibility if needed

/**
 * @class Scene_Map
 * @description The main scene for map exploration.
 * @extends Scene_Base
 */
export class Scene_Map extends Scene_Base {
  constructor(dataManager) {
    super(dataManager);
    this.map = new Game_Map();
    this.party = new Game_Party();
    this.runActive = true;
    this.draggedIndex = null;
  }

  create() {
    super.create(); // Creates WindowLayer
    this.getDomElements();
    this.addEventListeners();

    // Map-specific windows
    this.inventoryWindow = new Window_Inventory();
    this.windowLayer.addChild(this.inventoryWindow);

    this.eventWindow = new Window_Event();
    this.windowLayer.addChild(this.eventWindow);
    this.recruitWindow = new Window_Recruit();
    this.windowLayer.addChild(this.recruitWindow);
    this.formationWindow = new Window_Formation();
    this.windowLayer.addChild(this.formationWindow);
    this.inspectWindow = new Window_Inspect();
    this.windowLayer.addChild(this.inspectWindow);
    this.confirmWindow = new Window_Confirm();
    this.windowLayer.addChild(this.confirmWindow);

    // Bind Window Events
    this.formationWindow.btnClose.addEventListener("click", this.closeFormation.bind(this));
    this.formationWindow.btnOk.addEventListener("click", this.closeFormation.bind(this));
    this.formationWindow.btnCancel.addEventListener("click", this.closeFormation.bind(this));

    this.inventoryWindow.btnClose.addEventListener("click", this.closeInventory.bind(this));
    this.inventoryWindow.btnClose2.addEventListener("click", this.closeInventory.bind(this));
  }

  createUI() {
    const gameContainer = document.getElementById("game-container");
    // Inject HTML for the map layout
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
            &nbsp;&nbsp;back row is safer.
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

  start() {
    this.startNewRun();
  }

  onResume() {
    // When returning from Battle or Shop, refresh UI
    this.updateAll();
    this.modeLabelEl.textContent = "Exploration";
    document.addEventListener("keydown", this.onKeyDownBound);
  }

  onPause() {
    document.removeEventListener("keydown", this.onKeyDownBound);
  }

  startNewRun() {
    this.map.initFloors(this.dataManager.floors);
    this.party.createInitialMembers(this.dataManager);
    this.runActive = true;
    this.map.floorIndex = 0;
    const f = this.map.floors[this.map.floorIndex];
    this.map.playerX = f.startX;
    this.map.playerY = f.startY;
    this.map.revealAroundPlayer();

    if (this.logEl) {
      this.logEl.textContent = "";
      this.logMessage(this.dataManager.terms.log.new_run);
      this.logMessage(this.dataManager.terms.log.floor_intro + f.intro);
    }
    this.setStatus(this.dataManager.terms.status.exploring_floor + (this.map.floorIndex + 1));
    SoundManager.beep(500, 200);
    this.updateAll();
  }

  getDomElements() {
    // Helper to verify existence
    const get = (id) => document.getElementById(id);
    this.explorationGridEl = get("exploration-grid");
    this.cardTitleEl = get("card-title");
    this.cardIndexLabelEl = get("card-index-label");
    this.cardDepthLabelEl = get("card-depth-label");
    this.cardListEl = get("card-list");
    this.partyGridEl = get("party-grid");
    this.logEl = get("log-content");
    this.statusMessageEl = get("status-message");
    this.statusGoldEl = get("status-gold");
    this.statusFloorEl = get("status-floor");
    this.statusCardsEl = get("status-cards");
    this.statusRunEl = get("status-run");
    this.statusItemsEl = get("status-items");
    this.modeLabelEl = get("mode-label");

    // Buttons
    document.getElementById("btn-new-run").addEventListener("click", this.startNewRun.bind(this));
    document.getElementById("btn-reveal-all").addEventListener("click", this.revealAllFloors.bind(this));
    document.getElementById("btn-clear-log").addEventListener("click", () => {
      this.logEl.textContent = "";
      this.setStatus("Log cleared.");
    });
    document.getElementById("btn-formation").addEventListener("click", this.openFormation.bind(this));
    document.getElementById("btn-inventory").addEventListener("click", this.openInventory.bind(this));
  }

  addEventListeners() {
    this.onKeyDownBound = this.onKeyDown.bind(this);
    document.addEventListener("keydown", this.onKeyDownBound);
  }

  onKeyDown(e) {
    if (!this.runActive) return;
    let dx = 0; let dy = 0;
    switch (e.key) {
      case "ArrowUp": case "w": dy = -1; break;
      case "ArrowDown": case "s": dy = 1; break;
      case "ArrowLeft": case "a": dx = -1; break;
      case "ArrowRight": case "d": dx = 1; break;
      default: return;
    }
    if (dx !== 0 || dy !== 0) {
      e.preventDefault();
      this.movePlayer(dx, dy);
    }
  }

  movePlayer(dx, dy) {
    const newX = this.map.playerX + dx;
    const newY = this.map.playerY + dy;
    if (newX >= 0 && newX < this.map.MAX_W && newY >= 0 && newY < this.map.MAX_H) {
      const tileEl = this.explorationGridEl.querySelector(`[data-x='${newX}'][data-y='${newY}']`);
      if (tileEl) this.onTileClick({ currentTarget: tileEl });
    }
  }

  onTileClick(e) {
    if (!this.runActive) return;
    const tileEl = e.currentTarget;
    const x = parseInt(tileEl.dataset.x, 10);
    const y = parseInt(tileEl.dataset.y, 10);
    const floor = this.map.floors[this.map.floorIndex];

    const dx = Math.abs(x - this.map.playerX);
    const dy = Math.abs(y - this.map.playerY);
    const isAdjacent = dx + dy === 1;

    if (!isAdjacent && !(x === this.map.playerX && y === this.map.playerY)) {
      this.setStatus(this.dataManager.terms.status.only_adjacent_tiles);
      return;
    }

    const ch = floor.tiles[y][x];
    if (ch === "#") {
      this.setStatus(this.dataManager.terms.log.wall_blocks);
      return;
    }

    this.map.playerX = x;
    this.map.playerY = y;
    this.map.revealAroundPlayer();

    // Process tile types
    if (ch === "E") {
      this.openBattle(x, y);
      return;
    } else if (ch === "¥") {
      this.openShop();
      return;
    } else if (ch === "S") {
      this.descendStairs();
    } else if (ch === "R") {
      this.party.members.forEach((m) => (m.hp = m.maxHp));
      this.logMessage("[Recover] A soft glow restores your party.");
    } else if (ch === "♱") {
      this.openShrineEvent();
    } else if (ch === "U") {
      this.openRecruitEvent();
    } else {
      this.logMessage("[Step] You move.");
    }

    this.applyMovePassives();
    this.updateAll();
  }

  openBattle(tileX, tileY) {
    const floor = this.map.floors[this.map.floorIndex];
    const depth = floor.depth;
    let enemies = [];
    const actorTemplates = this.dataManager.actors;

    if (this.map.floorIndex === this.map.floors.length - 1) {
      // Boss logic
      const bossHp = 40 + (depth - 3) * 5;
      enemies.push(new Game_Battler({
        name: "🌑 Eternal Warden", role: "Boss", maxHp: bossHp,
        elements: ["Black"], skills: ["shadowClaw", "infernalPact"],
        gold: 100, expGrowth: 10,
      }, depth, true));
    } else {
      const maxEnemies = this.map.floorIndex === 0 ? 2 : 3;
      const enemyCount = randInt(1, maxEnemies);
      for (let i = 0; i < enemyCount; i++) {
        const tpl = actorTemplates[randInt(0, actorTemplates.length - 1)];
        enemies.push(new Game_Battler(tpl, depth, true));
      }
    }

    this.modeLabelEl.textContent = "Battle";
    SceneManager.push(new Scene_Battle(this.party, enemies, this.dataManager, (result) => {
      this.logMessage(`[Battle] Victory! Gained ${result.gold}G.`);
      this.applyPostBattlePassives();
      this.clearEnemyTile(tileX, tileY);
      this.updateAll();
    }));
  }

  openShop() {
    this.modeLabelEl.textContent = "Shop";
    SceneManager.push(new Scene_Shop(this.party, this.dataManager.items, this.dataManager));
  }

  clearEnemyTile(x, y) {
    const f = this.map.floors[this.map.floorIndex];
    if (f.tiles[y][x] === "E") {
      f.tiles[y][x] = ".";
    }
  }

  // --- Helper Methods (retained) ---
  logMessage(msg) {
    if (this.logEl) {
      this.logEl.textContent += msg + "\n";
      this.logEl.scrollTop = this.logEl.scrollHeight;
    }
  }

  setStatus(msg) {
    if (this.statusMessageEl) this.statusMessageEl.textContent = msg;
  }

  updateAll() {
    if (!this.explorationGridEl) return;
    this.updateGrid();
    this.updateCardHeader();
    this.updateCardList();
    this.updateParty();
    this.statusGoldEl.textContent = this.party.gold;
    this.statusItemsEl.textContent = this.party.inventory.length;
    this.statusRunEl.textContent = this.runActive ? "Active" : "Over";
  }

  // ... (Other update methods: updateGrid, updateCardHeader, updateParty, etc. need to be kept from original, mostly identical)

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
            case "#": symbol = "█"; break;
            case ".": symbol = " "; break;
            case "E": symbol = "E"; tileEl.classList.add("tile-enemy"); break;
            case "S": symbol = "S"; tileEl.classList.add("tile-stairs"); break;
            case "R": symbol = "R"; tileEl.classList.add("tile-recovery"); break;
            case "♱": symbol = "♱"; tileEl.classList.add("tile-shrine"); break;
            case "¥": symbol = "¥"; tileEl.classList.add("tile-shop"); break;
            case "U": symbol = "U"; tileEl.classList.add("tile-recruit"); break;
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

  updateCardHeader() {
      const floor = this.map.floors[this.map.floorIndex];
      this.cardTitleEl.textContent = floor.title;
      this.cardIndexLabelEl.textContent = `${this.map.floorIndex + 1} / ${this.map.floors.length}`;
      this.cardDepthLabelEl.textContent = floor.depth;
      this.statusFloorEl.textContent = floor.depth;
      this.statusCardsEl.textContent = this.map.floors.length;
  }

  updateCardList() {
      this.cardListEl.innerHTML = "";
      this.map.floors.forEach((f, idx) => {
          const item = document.createElement("div");
          let cls = "card-item";
          if (idx === this.map.floorIndex) cls += " selected";
          if (!f.discovered) cls += " disabled";
          item.className = cls;
          item.textContent = `${idx + 1}. ${f.discovered ? f.title : "Unknown Floor"}`;
          if (f.discovered && idx <= this.map.maxReachedFloorIndex) {
              item.addEventListener("click", () => {
                  this.map.floorIndex = idx;
                  const floor = this.map.floors[this.map.floorIndex];
                  this.map.playerX = floor.startX;
                  this.map.playerY = floor.startY;
                  this.map.revealAroundPlayer();
                  this.updateAll();
              });
          }
          this.cardListEl.appendChild(item);
      });
  }

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
      hpLabel.textContent = `Lv${member.level} HP ${member.hp}/${member.maxHp}`;

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

  // --- Map-based Logic (Passives, Stairs, etc) ---
  applyMovePassives() {
      this.party.members.forEach((member) => {
          if (member.hp > 0 && member.getPassiveValue("MOVE_HEAL") > 0) {
              member.hp = Math.min(member.maxHp, member.hp + member.getPassiveValue("MOVE_HEAL"));
          }
      });
  }

  applyPostBattlePassives() {
      this.party.members.forEach((member) => {
          if (member.hp > 0 && member.getPassiveValue("POST_BATTLE_HEAL") > 0) {
               this.party.members.forEach(m => m.hp = Math.min(m.maxHp, m.hp + 1));
          }
      });
  }

  descendStairs() {
      if (this.map.floorIndex + 1 < this.map.floors.length) {
          this.map.floorIndex++;
          this.map.maxReachedFloorIndex = Math.max(this.map.maxReachedFloorIndex, this.map.floorIndex);
          const f = this.map.floors[this.map.floorIndex];
          f.discovered = true;
          this.map.playerX = f.startX;
          this.map.playerY = f.startY;
          this.map.revealAroundPlayer();
          this.logMessage(`[Floor] Descended to ${f.title}`);
          this.updateAll();
      }
  }
  
  revealAllFloors() {
      this.map.floors.forEach(f => f.visited.forEach(row => row.fill(true)));
      this.updateAll();
  }

  // --- Menus (Inventory, Inspect, Formation) ---
  openInventory() { this.inventoryWindow.open(); this.inventoryWindow.refresh(this.party.inventory, this.useItem.bind(this), this.discardItem.bind(this)); }
  closeInventory() { this.inventoryWindow.close(); }
  useItem(item, idx) {
      this.inventoryWindow.showTargetSelection(this.party.members, (targetIdx) => {
          const m = this.party.members[targetIdx];
          if (item.effects.hp) m.hp = Math.min(m.maxHp, m.hp + item.effects.hp);
          this.party.inventory.splice(idx, 1);
          this.closeInventory();
          this.updateAll();
      });
  }
  discardItem(item, idx) { this.party.inventory.splice(idx, 1); this.inventoryWindow.refresh(this.party.inventory, this.useItem.bind(this), this.discardItem.bind(this)); }

  openFormation() { this.formationWindow.open(); this.renderFormationGrid(); }
  closeFormation() { this.formationWindow.close(); }
  renderFormationGrid() {
      // (Keep existing drag/drop logic, simplified here for brevity)
      const grid = this.formationWindow.gridEl;
      grid.innerHTML = "";
      this.party.members.forEach((m, i) => {
          const slot = document.createElement("div");
          slot.className = "formation-slot";
          slot.textContent = m.name;
          slot.draggable = true;
          // Add drag listeners here...
          grid.appendChild(slot);
      });
  }

  openInspect(member, index) {
      this.inspectWindow.member = member;
      this.inspectWindow.open();
      this.inspectWindow.refresh(member, this);
      this.inspectWindow.btnClose.onclick = () => this.inspectWindow.close();
      this.inspectWindow.btnOk.onclick = () => this.inspectWindow.close();
      this.inspectWindow.equipEl.onclick = () => {
        this.openEquipmentScreen();
      };
  }

  openEquipmentScreen() {
    this.inspectWindow.equipmentListContainerEl.style.display = "block";
    this.renderEquipmentList("All");
  }

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
      this.inspectWindow.close();
      this.updateAll();
      SoundManager.beep(800, 100); // Equip sound
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
        this.inspectWindow.close();
        this.updateAll();
        SoundManager.beep(700, 150); // Swap sound
      };
      this.confirmWindow.btnCancel.onclick = () => {
        this.confirmWindow.close();
      };
    } else {
      doEquip();
    }
  }

  openShrineEvent() {
      if (this.dataManager.events.length) {
          const ev = this.dataManager.events[0]; // Simplified
          this.eventWindow.titleEl.textContent = ev.title;
          this.eventWindow.open();
      }
  }

  openRecruitEvent() {
      this.recruitWindow.open();
  }

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
}