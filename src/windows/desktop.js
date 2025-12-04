import { Window_Base } from "./base.js";
import { createPartySlot } from "./utils.js";
import { ProgressionSystem } from "../managers/progression.js";
import { UI } from "./builder.js";

/**
 * @class Window_StackNav
 */
export class Window_StackNav extends Window_Base {
    constructor() {
        super(0, 0, 210, '100%', { title: "Stillnight Stack", embedded: true });
        this.element.classList.add("stack-nav");

        const structure = {
            type: 'panel',
            props: { className: 'stack-nav-content' },
            children: [
                // Group Run
                {
                    type: 'panel',
                    props: { className: 'group-box' },
                    children: [
                        { type: 'label', props: { tag: 'legend', text: 'Run' } },
                        {
                            type: 'panel',
                            props: { className: 'stack-nav-buttons' },
                            children: [
                                { type: 'button', props: { id: 'btn-new-run', className: 'win-btn', label: 'New Run' } },
                                { type: 'button', props: { id: 'btn-reveal-all', className: 'win-btn', label: 'Reveal' } },
                                { type: 'button', props: { id: 'btn-help', className: 'win-btn', label: '?', style: { width: '24px', minWidth: '24px', padding: '0' } } }
                            ]
                        },
                        {
                            type: 'panel',
                            props: { style: { marginTop: '2px' } },
                            children: [
                                { type: 'button', props: { id: 'btn-settings', className: 'win-btn', label: 'Settings', style: { width: '100%' } } }
                            ]
                        },
                        {
                            type: 'panel',
                            props: { style: { marginTop: '4px' } },
                            children: [
                                {
                                    type: 'panel',
                                    children: [
                                        { type: 'label', props: { text: 'Card: ' } },
                                        { type: 'label', props: { id: 'card-index-label', text: '1 / 1' } }
                                    ]
                                },
                                {
                                    type: 'panel',
                                    children: [
                                        { type: 'label', props: { text: 'Floor depth: ' } },
                                        { type: 'label', props: { id: 'card-depth-label', text: '1' } }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                // Location Art
                {
                    type: 'panel',
                    props: { className: 'location-art-container' },
                    children: [
                        { type: 'image', props: { id: 'location-art', className: 'location-art-img', src: 'assets/eventArt/default.png' } }
                    ]
                },
                // Group Cards
                {
                    type: 'panel',
                    props: { className: 'group-box' },
                    children: [
                        { type: 'label', props: { tag: 'legend', text: 'Cards (Floors)' } },
                        { type: 'panel', props: { id: 'card-list', className: 'card-list' } }
                    ]
                }
            ]
        };

        const root = UI.build(this.content, structure);

        this.btnNewRun = root.querySelector("#btn-new-run");
        this.btnRevealAll = root.querySelector("#btn-reveal-all");
        this.btnSettings = root.querySelector("#btn-settings");
        this.btnHelp = root.querySelector("#btn-help");
        this.cardIndexLabelEl = root.querySelector("#card-index-label");
        this.cardDepthLabelEl = root.querySelector("#card-depth-label");
        this.locationArtEl = root.querySelector("#location-art");
        this.cardListEl = root.querySelector("#card-list");
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
            // Using UI.build for list items
            const item = UI.build(this.cardListEl, {
                type: 'panel',
                props: {
                    className: `card-item${idx === currentIndex ? ' selected' : ''}${!f.discovered ? ' disabled' : ''}`,
                    text: `${idx + 1}. ${f.discovered ? f.title : "Unknown Floor"}`,
                    onClick: (f.discovered && idx <= maxReachedIndex) ? () => onSelect(idx) : undefined
                }
            });
            // Component_Panel defaults to div. Using text prop I assume I implemented support or use innerText if supported?
            // Component_Panel implementation: applyBaseProps(el, props). applyBaseProps doesn't set text.
            // I need to use Component_Label or set textContent manually.
            // Let's use Component_Label with div tag.
            item.textContent = `${idx + 1}. ${f.discovered ? f.title : "Unknown Floor"}`;
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
        UI.build(this.header, {
            type: 'panel', // Wrapper
            children: [
                 { type: 'label', props: { text: 'Mode:', className: 'label' } },
                 { type: 'label', props: { text: 'Exploration', id: 'mode-label' } }
            ]
        });

        this.titleEl.id = "card-title";

        // Content
        const root = UI.build(this.content, {
            type: 'panel',
            props: { className: 'exploration-frame panel' },
            children: [
                { type: 'panel', props: { className: 'exploration-grid', id: 'exploration-grid' } }
            ]
        });
        this.explorationGrid = root.querySelector("#exploration-grid");
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
             UI.build(this.explorationGrid, {
                 type: 'label', // Use label to support text
                 props: {
                     tag: 'div',
                     className: `tile ${cell.cssClass || ''}`,
                     dataset: { x: cell.x, y: cell.y },
                     text: cell.symbol,
                     onClick: () => onTileClick(cell.x, cell.y)
                 }
             });
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

        UI.build(this.header, {
            type: 'flex',
            props: { gap: '2px' },
            children: [
                { type: 'button', props: { id: 'btn-formation', className: 'win-btn', label: 'Formation...', style: { fontSize: '10px', padding: '0 6px' } } },
                { type: 'button', props: { id: 'btn-inventory', className: 'win-btn', label: 'Inventory...', testId: 'btn-inventory', style: { fontSize: '10px', padding: '0 6px' } } }
            ]
        });

        this.btnFormation = this.header.querySelector("#btn-formation");
        this.btnInventory = this.header.querySelector("#btn-inventory");

        this.partyGridEl = UI.build(this.content, {
            type: 'panel',
            props: { className: 'party-grid', id: 'party-grid' }
        });
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

            // createPartySlot is still imperative but permitted for now as utility
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

        this.btnClear = UI.build(this.header, {
            type: 'button',
            props: { id: 'btn-clear-log', className: 'win-btn', label: 'Clear', style: { fontSize: '10px', padding: '0 6px' } }
        });

        this.logEl = UI.build(this.content, {
            type: 'panel',
            props: { className: 'log-content', id: 'log-content' }
        });
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

        this.element.style.display = "flex";
        this.element.style.flexDirection = "row";
        this.element.style.position = "relative";
        this.element.style.border = "none";
        this.element.style.boxShadow = "none";
        this.element.style.backgroundColor = "transparent";

        this.header.style.display = "none";
        this.footer.style.display = "none";

        this.content.style.padding = "0";
        this.content.style.flexDirection = "row";
        this.content.style.border = "none";

        this.createUI();
    }

    createUI() {
        const container = this.content;
        container.innerHTML = "";

        this.element.style.setProperty('--grid-cols', '19');
        this.element.style.setProperty('--grid-rows', '19');

        this.stackNav = new Window_StackNav();
        this.explorationWindow = new Window_Exploration();
        this.partyPanel = new Window_PartyPanel();
        this.logPanel = new Window_LogPanel();

        const layout = UI.build(container, {
            type: 'panel',
            props: { style: { display: 'flex', flexDirection: 'row', width: '100%', height: '100%' } },
            children: [
                 { type: 'panel', props: { id: 'left-col' } },
                 {
                     type: 'panel',
                     props: { className: 'right-side' },
                     children: [
                         {
                             type: 'panel',
                             props: { className: 'card-area' },
                             children: [
                                 { type: 'panel', props: { id: 'exploration-slot' } },
                                 {
                                     type: 'panel',
                                     props: { className: 'card-side-panels' },
                                     children: [
                                         { type: 'panel', props: { id: 'party-slot' } },
                                         { type: 'panel', props: { id: 'log-slot' } }
                                     ]
                                 }
                             ]
                         },
                         {
                             type: 'panel',
                             props: { className: 'status-bar' },
                             children: [
                                 { type: 'panel', children: [{ type: 'label', props: { id: 'status-message', text: 'Ready.' } }] },
                                 {
                                     type: 'panel',
                                     children: [
                                         { type: 'label', props: { text: 'Gold: ' } }, { type: 'label', props: { id: 'status-gold', text: '0' } },
                                         { type: 'label', props: { text: ' | Floor: ' } }, { type: 'label', props: { id: 'status-floor', text: '1' } },
                                         { type: 'label', props: { text: ' | Cards: ' } }, { type: 'label', props: { id: 'status-cards', text: '1' } },
                                         { type: 'label', props: { text: ' | Run: ' } }, { type: 'label', props: { id: 'status-run', text: 'Active' } },
                                         { type: 'label', props: { text: ' | Items: ' } }, { type: 'label', props: { id: 'status-items', text: '0' } },
                                     ]
                                 }
                             ]
                         }
                     ]
                 }
            ]
        });

        layout.querySelector("#left-col").replaceWith(this.stackNav.element);
        layout.querySelector("#exploration-slot").replaceWith(this.explorationWindow.element);
        layout.querySelector("#party-slot").replaceWith(this.partyPanel.element);
        layout.querySelector("#log-slot").replaceWith(this.logPanel.element);

        this.statusMessageEl = layout.querySelector("#status-message");
        this.statusGoldEl = layout.querySelector("#status-gold");
        this.statusFloorEl = layout.querySelector("#status-floor");
        this.statusCardsEl = layout.querySelector("#status-cards");
        this.statusRunEl = layout.querySelector("#status-run");
        this.statusItemsEl = layout.querySelector("#status-items");
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
