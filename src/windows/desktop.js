import { Window_Base } from "./base.js";
import { createPartySlot } from "./utils.js";
import { ProgressionSystem } from "../managers/progression.js";

/**
 * @class Window_StackNav
 */
export class Window_StackNav extends Window_Base {
    constructor() {
        super(0, 0, 210, '100%', { title: "Stillnight Stack", embedded: true });
        this.element.classList.add("stack-nav");

        // Content:
        // Group Run
        this.groupRun = document.createElement("div");
        this.groupRun.className = "group-box";
        this.groupRun.innerHTML = `
          <legend>Run</legend>
          <div class="stack-nav-buttons">
            <button class="win-btn" id="btn-new-run">New Run</button>
            <button class="win-btn" id="btn-reveal-all">Reveal</button>
            <button class="win-btn" id="btn-help" style="width: 24px; min-width: 24px; padding: 0;">?</button>
          </div>
          <div style="margin-top:2px;">
             <button class="win-btn" id="btn-settings" style="width:100%">Settings</button>
          </div>
          <div style="margin-top:4px;">
            <div>Card: <span id="card-index-label">1 / 1</span></div>
            <div>Floor depth: <span id="card-depth-label">1</span></div>
          </div>
        `;
        this.content.appendChild(this.groupRun);

        // Location Art
        this.artContainer = document.createElement("div");
        this.artContainer.className = "location-art-container";
        this.artContainer.innerHTML = `<img id="location-art" class="location-art-img" src="assets/eventArt/default.png">`;
        this.content.appendChild(this.artContainer);

        // Group Cards
        this.groupCards = document.createElement("div");
        this.groupCards.className = "group-box";
        this.groupCards.innerHTML = `<legend>Cards (Floors)</legend><div class="card-list" id="card-list"></div>`;
        this.content.appendChild(this.groupCards);

        // Cache buttons for Window_HUD to expose
        this.btnNewRun = this.groupRun.querySelector("#btn-new-run");
        this.btnRevealAll = this.groupRun.querySelector("#btn-reveal-all");
        this.btnSettings = this.groupRun.querySelector("#btn-settings");
        this.btnHelp = this.groupRun.querySelector("#btn-help");

        // Cache elements for updates
        this.cardIndexLabelEl = this.groupRun.querySelector("#card-index-label");
        this.cardDepthLabelEl = this.groupRun.querySelector("#card-depth-label");
        this.locationArtEl = this.artContainer.querySelector("#location-art");
        this.cardListEl = this.groupCards.querySelector("#card-list");
    }

    updateCardHeader(floor, index, total) {
        this.cardIndexLabelEl.textContent = `${index + 1} / ${total}`;
        this.cardDepthLabelEl.textContent = floor.depth;
        if (floor.image) {
             this.locationArtEl.src = `assets/eventArt/${floor.image}`;
        } else {
             this.locationArtEl.src = `assets/eventArt/default.png`;
        }
    }

    updateCardList(floors, currentIndex, maxReachedIndex, onSelect) {
        this.cardListEl.innerHTML = "";
        floors.forEach((f, idx) => {
            const item = document.createElement("div");
            let cls = "card-item";
            if (idx === currentIndex) cls += " selected";
            if (!f.discovered) cls += " disabled";
            item.className = cls;
            const title = f.discovered ? f.title : "Unknown Floor";
            item.textContent = `${idx + 1}. ${title}`;

            if (f.discovered && idx <= maxReachedIndex) {
                item.addEventListener("click", () => onSelect(idx));
            }
            this.cardListEl.appendChild(item);
        });
    }
}

/**
 * @class Window_Exploration
 */
export class Window_Exploration extends Window_Base {
    constructor() {
        super(0, 0, 'auto', 'auto', { title: "Floor 1", embedded: true });
        this.element.classList.add("card-main");

        // Header extra: "Mode: Exploration"
        this.modeLabelContainer = document.createElement("div");
        this.modeLabelContainer.innerHTML = `<span class="label">Mode:</span><span id="mode-label">Exploration</span>`;
        this.header.appendChild(this.modeLabelContainer);

        // Ensure title element has ID for Scene_Map compatibility
        this.titleEl.id = "card-title";

        // Content: Exploration Frame
        this.explorationFrame = document.createElement("div");
        this.explorationFrame.className = "exploration-frame panel";
        this.explorationGrid = document.createElement("div");
        this.explorationGrid.className = "exploration-grid";
        this.explorationGrid.id = "exploration-grid";
        this.explorationFrame.appendChild(this.explorationGrid);

        this.content.appendChild(this.explorationFrame);
    }

    updateTitle(title) {
        this.setTitle(title);
    }

    setMode(mode) {
        const el = this.header.querySelector("#mode-label");
        if (el) el.textContent = mode;
    }

    renderGrid(gridData, onTileClick) {
        this.explorationGrid.innerHTML = "";
        gridData.forEach(cell => {
             const tileEl = document.createElement("div");
             tileEl.className = "tile";
             if (cell.cssClass) tileEl.className += " " + cell.cssClass;
             tileEl.dataset.x = cell.x;
             tileEl.dataset.y = cell.y;
             if (cell.symbol) tileEl.textContent = cell.symbol;

             tileEl.addEventListener("click", (e) => onTileClick(cell.x, cell.y));
             this.explorationGrid.appendChild(tileEl);
        });
    }
}

/**
 * @class Window_PartyPanel
 */
export class Window_PartyPanel extends Window_Base {
    constructor() {
        super(0, 0, '100%', 'auto', { title: "Party Status", embedded: true });
        this.element.classList.add("party-panel");

        this.prevHpMap = new WeakMap();

        const btnContainer = document.createElement("div");
        btnContainer.style.display = "flex";
        btnContainer.style.gap = "2px";

        this.btnFormation = document.createElement("button");
        this.btnFormation.className = "win-btn";
        this.btnFormation.style.fontSize = "10px";
        this.btnFormation.style.padding = "0 6px";
        this.btnFormation.id = "btn-formation";
        this.btnFormation.textContent = "Formation...";
        btnContainer.appendChild(this.btnFormation);

        this.btnInventory = document.createElement("button");
        this.btnInventory.className = "win-btn";
        this.btnInventory.style.fontSize = "10px";
        this.btnInventory.style.padding = "0 6px";
        this.btnInventory.id = "btn-inventory";
        this.btnInventory.dataset.testid = "btn-inventory"; // Added testid
        this.btnInventory.textContent = "Inventory...";
        btnContainer.appendChild(this.btnInventory);

        this.header.appendChild(btnContainer);

        // Content
        this.partyGridEl = document.createElement("div");
        this.partyGridEl.className = "party-grid";
        this.partyGridEl.id = "party-grid";
        this.content.appendChild(this.partyGridEl);
    }

    updateParty(party, onInspect, context = null) {
        this.partyGridEl.innerHTML = "";
        party.slots.slice(0, 4).forEach((member, index) => {
            let evolutionStatus = null;
            if (member && context) {
                const statusObj = ProgressionSystem.getEvolutionStatus(member, context.inventory, context.floorDepth, context.gold);
                if (statusObj.status !== 'NONE') {
                    evolutionStatus = statusObj.status;
                }
            }

            const slot = createPartySlot(member, index, {
                onClick: onInspect,
                testId: `party-slot-${index}`,
                evolutionStatus: evolutionStatus
            });
            if (member) {
                const gaugeFill = slot.querySelector('.hp-fill');
                if (gaugeFill) {
                    const startHp = this.prevHpMap.has(member) ? this.prevHpMap.get(member) : member.hp;
                    gaugeFill.style.width = `${Math.max(0, (startHp / member.maxHp) * 100)}%`;
                    this.animateGauge(
                        gaugeFill,
                        startHp,
                        member.hp,
                        member.maxHp,
                        500
                    );
                }
                this.prevHpMap.set(member, member.hp);
            }
            this.partyGridEl.appendChild(slot);
        });
    }

    animateGauge(element, startHp, endHp, maxHp, duration) {
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
}

/**
 * @class Window_LogPanel
 */
export class Window_LogPanel extends Window_Base {
    constructor() {
        super(0, 0, '100%', '230', { title: "Event Log", embedded: true });
        this.element.classList.add("log-panel");

        this.btnClear = document.createElement("button");
        this.btnClear.className = "win-btn";
        this.btnClear.style.fontSize = "10px";
        this.btnClear.style.padding = "0 6px";
        this.btnClear.id = "btn-clear-log";
        this.btnClear.textContent = "Clear";
        this.header.appendChild(this.btnClear);

        this.logEl = document.createElement("div");
        this.logEl.className = "log-content";
        this.logEl.id = "log-content";
        this.content.appendChild(this.logEl);
    }

    add(msg) {
        this.logEl.textContent += msg + "\n";
        this.logEl.scrollTop = this.logEl.scrollHeight;
    }

    clear() {
        this.logEl.textContent = "";
    }
}

/**
 * @class Window_Desktop
 * @description Manages the main static game layout as the root window.
 * @extends Window_Base
 */
export class Window_Desktop extends Window_Base {
    constructor() {
        super(0, 0, 960, 560, { title: "Desktop", embedded: true, id: "desktop-window" });

        // Desktop specific styling
        this.element.style.display = "flex";
        this.element.style.flexDirection = "row";
        this.element.style.position = "relative";
        this.element.style.border = "none"; // Remove border for the root window
        this.element.style.boxShadow = "none"; // Remove shadow
        this.element.style.backgroundColor = "transparent"; // Let global background show through? Or specific bg.

        // Hide standard window chrome
        this.header.style.display = "none";
        this.footer.style.display = "none";

        // Setup content area
        this.content.style.padding = "0";
        this.content.style.flexDirection = "row";
        this.content.style.border = "none"; // Remove internal border/shadow of content if any

        this.createUI();
    }

    createUI() {
        const container = this.content;
        container.innerHTML = "";

        // Inject grid dimensions for CSS
        this.element.style.setProperty('--grid-cols', '19');
        this.element.style.setProperty('--grid-rows', '19');

        // 1. Stack Nav Window
        this.stackNav = new Window_StackNav();
        container.appendChild(this.stackNav.element);

        // --- Right Side Container ---
        const rightSide = document.createElement("div");
        rightSide.className = "right-side";
        container.appendChild(rightSide);

        // --- Card Area Container ---
        const cardArea = document.createElement("div");
        cardArea.className = "card-area";
        rightSide.appendChild(cardArea);

        // 2. Exploration Window (Main)
        this.explorationWindow = new Window_Exploration();
        cardArea.appendChild(this.explorationWindow.element);

        // --- Side Panels Container ---
        const sidePanels = document.createElement("div");
        sidePanels.className = "card-side-panels";
        cardArea.appendChild(sidePanels);

        // 3. Party Panel
        this.partyPanel = new Window_PartyPanel();
        sidePanels.appendChild(this.partyPanel.element);

        // 4. Log Panel
        this.logPanel = new Window_LogPanel();
        sidePanels.appendChild(this.logPanel.element);

        // Status Bar
        this.statusBar = document.createElement("div");
        this.statusBar.className = "status-bar";
        this.statusBar.innerHTML = `
          <div><span id="status-message">Ready.</span></div>
          <div>
            <span>Gold: <span id="status-gold">0</span></span>
            <span>| Floor: <span id="status-floor">1</span></span>
            <span>| Cards: <span id="status-cards">1</span></span>
            <span>| Run: <span id="status-run">Active</span></span>
            <span>| Items: <span id="status-items">0</span></span>
          </div>
        `;
        rightSide.appendChild(this.statusBar);

        // Cache status elements
        this.statusMessageEl = this.statusBar.querySelector("#status-message");
        this.statusGoldEl = this.statusBar.querySelector("#status-gold");
        this.statusFloorEl = this.statusBar.querySelector("#status-floor");
        this.statusCardsEl = this.statusBar.querySelector("#status-cards");
        this.statusRunEl = this.statusBar.querySelector("#status-run");
        this.statusItemsEl = this.statusBar.querySelector("#status-items");
    }

    get btnSettings() { return this.stackNav.btnSettings; }
    get btnHelp() { return this.stackNav.btnHelp; }
    get btnNewRun() { return this.stackNav.btnNewRun; }
    get btnRevealAll() { return this.stackNav.btnRevealAll; }
    get btnFormation() { return this.partyPanel.btnFormation; }
    get btnInventory() { return this.partyPanel.btnInventory; }
    get btnClearLog() { return this.logPanel.btnClear; }

    updateCardHeader(floor, index, total) {
        this.stackNav.updateCardHeader(floor, index, total);
        this.explorationWindow.updateTitle(floor.title);
        this.statusFloorEl.textContent = floor.depth;
        this.statusCardsEl.textContent = total;
    }

    updateCardList(floors, currentIndex, maxReachedIndex, onSelect) {
        this.stackNav.updateCardList(floors, currentIndex, maxReachedIndex, onSelect);
    }

    updateParty(party, onInspect, context = null) {
        this.partyPanel.updateParty(party, onInspect, context);
    }

    logMessage(msg) {
        this.logPanel.add(msg);
    }

    clearLog() {
        this.logPanel.clear();
    }

    setStatus(msg) {
        this.statusMessageEl.textContent = msg;
    }

    updateStatus(state) {
        if (state.gold !== undefined) this.statusGoldEl.textContent = state.gold;
        if (state.floor !== undefined) this.statusFloorEl.textContent = state.floor;
        if (state.cards !== undefined) this.statusCardsEl.textContent = state.cards;
        if (state.runActive !== undefined) this.statusRunEl.textContent = state.runActive ? "Active" : "Over";
        if (state.items !== undefined) this.statusItemsEl.textContent = state.items;
    }

    setMode(mode) {
        this.explorationWindow.setMode(mode);
    }

    renderGrid(gridData, onTileClick) {
        this.explorationWindow.renderGrid(gridData, onTileClick);
    }
}
