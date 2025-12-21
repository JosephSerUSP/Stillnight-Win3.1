import { Window_Base } from "./base.js";
import { createPartySlot, createCommanderSlot } from "./utils.js";
import { UI } from "./builder.js";

/**
 * @class Window_StackNav
 */
export class Window_StackNav extends Window_Base {
    constructor() {
        super(0, 0, 210, '100%', { title: "Stillnight Stack", embedded: true, showTitleBar: false });
        this.element.classList.add("stack-nav");
        this.content.style.flexDirection = "column";

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
            const item = UI.build(this.cardListEl, {
                type: 'panel',
                props: {
                    className: `card-item${idx === currentIndex ? ' selected' : ''}${!f.discovered ? ' disabled' : ''}`,
                    text: `${idx + 1}. ${f.discovered ? f.title : "Unknown Floor"}`,
                    onClick: (f.discovered && idx <= maxReachedIndex) ? () => onSelect(idx) : undefined
                }
            });
            item.textContent = `${idx + 1}. ${f.discovered ? f.title : "Unknown Floor"}`;
        });
    }
}

/**
 * @class Window_Exploration
 */
export class Window_Exploration extends Window_Base {
    constructor() {
        super(0, 0, 'auto', 'auto', { title: "Floor 1", embedded: true, showTitleBar: false });
        this.element.classList.add("card-main");
        this.content.style.flexDirection = "column";

        const infoBar = UI.build(this.content, {
            type: 'panel',
            props: { className: 'window-section-header exploration-header' },
            children: [
                { type: 'label', props: { id: 'card-title', className: 'exploration-title', text: 'Floor 1' } },
                {
                    type: 'panel',
                    props: { className: 'mode-badge' },
                    children: [
                        { type: 'label', props: { text: 'Mode:' } },
                        { type: 'label', props: { id: 'mode-label', text: 'Exploration' } }
                    ]
                }
            ]
        });

        this.titleEl = infoBar.querySelector("#card-title");
        this.modeLabelEl = infoBar.querySelector("#mode-label");

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
        if (this.modeLabelEl) this.modeLabelEl.textContent = mode;
    }

    renderGrid(gridData, onTileClick) {
        const total = gridData.length;
        const children = this.explorationGrid.children;

        let needsRebuild = children.length !== total;
        if (!needsRebuild && total > 0) {
            const firstEl = children[0];
            const lastEl = children[total - 1];
            const firstCell = gridData[0];
            const lastCell = gridData[total - 1];

            if (firstEl.dataset.x != firstCell.x || firstEl.dataset.y != firstCell.y ||
                lastEl.dataset.x != lastCell.x || lastEl.dataset.y != lastCell.y) {
                needsRebuild = true;
            }
        }

        if (needsRebuild) {
            this.explorationGrid.innerHTML = "";
            gridData.forEach(cell => {
                 UI.build(this.explorationGrid, {
                     type: 'label',
                     props: {
                         tag: 'div',
                         className: `tile ${cell.cssClass || ''}`,
                         dataset: { x: cell.x, y: cell.y },
                         text: cell.symbol,
                         onClick: () => onTileClick(cell.x, cell.y)
                     }
                 });
            });
            return;
        }

        for (let i = 0; i < total; i++) {
            const cell = gridData[i];
            const el = children[i];
            const newClass = cell.cssClass ? `tile ${cell.cssClass}` : 'tile';

            if (el.className !== newClass) {
                el.className = newClass;
            }
            if (el.textContent !== cell.symbol) {
                el.textContent = cell.symbol;
            }
        }
    }
}

/**
 * @class Window_PartyPanel
 */
export class Window_PartyPanel extends Window_Base {
    constructor() {
        super(0, 0, '100%', 'auto', { title: "Party Status", embedded: true, showTitleBar: false });
        this.element.classList.add("party-panel");
        this.content.style.flexDirection = "column";

        this.prevHpMap = new WeakMap();

        UI.build(this.content, {
            type: 'panel',
            props: { className: 'window-section-header' },
            children: [
                { type: 'label', props: { text: 'Party Status' } }
            ]
        });

        this.partyGridEl = UI.build(this.content, {
            type: 'panel',
            props: { className: 'party-grid', id: 'party-grid' }
        });

        UI.build(this.content, {
            type: 'panel',
            props: { id: 'summoner-slot', className: 'summoner-slot', style: { marginTop: '4px', borderTop: '1px solid var(--bezel-shadow)', paddingTop: '4px' } }
        });

        this.summonerSlotEl = this.content.querySelector("#summoner-slot");
    }

    // Accepts Party View Model containing { slots: [...] }
    updateParty(partyView, onInspect) {
        this.partyGridEl.innerHTML = "";

        // Render slots 0-3 (Active Party)
        partyView.slots.slice(0, 4).forEach((memberView, index) => {
            const slot = createPartySlot(memberView, index, {
                onClick: onInspect,
                testId: `party-slot-${index}`,
                evolutionStatus: memberView ? memberView.evolutionStatus : undefined
            });
            if (memberView) {
                const gaugeFill = slot.querySelector('.hp-fill');
                if (gaugeFill) {
                    const startHp = this.prevHpMap.has(memberView.source) ? this.prevHpMap.get(memberView.source) : memberView.hp;
                    gaugeFill.style.width = `${Math.max(0, (startHp / memberView.maxHp) * 100)}%`;
                    this.animateGauge(
                        gaugeFill,
                        startHp,
                        memberView.hp,
                        memberView.maxHp,
                        500
                    );
                }
                if (memberView.source) {
                    this.prevHpMap.set(memberView.source, memberView.hp);
                }
            }
            this.partyGridEl.appendChild(slot);
        });

        // Render Summoner (Slot 4)
        this.summonerSlotEl.innerHTML = "";
        const summonerView = partyView.slots[4];
        if (summonerView) {
             const slot = createCommanderSlot(summonerView, {
                 onClick: () => onInspect(summonerView.source, 'summoner')
             });
             this.summonerSlotEl.appendChild(slot);
        }
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
        super(0, 0, '100%', '230', { title: "Event Log", embedded: true, showTitleBar: false });
        this.element.classList.add("log-panel");
        this.content.style.flexDirection = "column";

        const header = UI.build(this.content, {
            type: 'panel',
            props: { className: 'window-section-header log-header' },
            children: [
                { type: 'label', props: { text: 'Event Log' } }
            ]
        });

        this.btnClear = UI.build(header, {
            type: 'button',
            props: { id: 'btn-clear-log', className: 'win-btn', label: 'Clear', style: { fontSize: '10px', padding: '0 6px' } }
        });

        this.logEl = UI.build(this.content, {
            type: 'panel',
            props: { className: 'log-content', id: 'log-content' }
        });
    }

    add(msg, priority = 'normal') {
        const line = UI.build(this.logEl, {
            type: 'label',
            props: {
                tag: 'div',
                text: msg,
                className: 'log-message',
                style: { opacity: priority === 'low' ? '0.5' : '1.0' }
            }
        });
        this.logEl.scrollTop = this.logEl.scrollHeight;
    }

    clear() {
        this.logEl.innerHTML = "";
    }
}

/**
 * @class Window_Desktop
 */
export class Window_Desktop extends Window_Base {
    constructor() {
        super(0, 0, 960, 560, { title: "Desktop", embedded: true, id: "desktop-window", showTitleBar: false });

        this.element.style.display = "flex";
        this.element.style.flexDirection = "row";
        this.element.style.position = "relative";
        this.element.style.border = "none";
        this.element.style.boxShadow = "none";
        this.element.style.backgroundColor = "transparent";

        this.footer.style.display = "none";

        this.menuItems = {};
        this.openMenu = null;

        this.content.style.padding = "0";
        this.content.style.flexDirection = "column";
        this.content.style.border = "none";
        this.content.style.gap = "4px";

        this.createUI();
    }

    createUI() {
        const container = this.content;
        container.innerHTML = "";

        this.element.style.setProperty('--grid-cols', '19');
        this.element.style.setProperty('--grid-rows', '19');

        const menuBar = this.createMenuBar();
        this.stackNav = new Window_StackNav();
        this.explorationWindow = new Window_Exploration();
        this.partyPanel = new Window_PartyPanel();
        this.logPanel = new Window_LogPanel();

        const layout = UI.build(null, {
            type: 'panel',
            props: { style: { display: 'flex', flexDirection: 'row', width: '100%', height: '100%', flex: '1 1 auto', minHeight: 0, minWidth: 0 } },
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

        container.appendChild(menuBar);
        container.appendChild(layout);
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

    get btnClearLog() { return this.logPanel.btnClear; }

    setMenuHandler(action, handler) {
        const btn = this.menuItems[action];
        if (!btn) return;

        btn.addEventListener("click", (e) => {
            e.preventDefault();
            this.closeMenus();
            handler();
        });
    }

    closeMenus() {
        if (this.openMenu) {
            this.openMenu.classList.remove("open");
            this.openMenu = null;
        }
    }

    createMenuBar() {
        const menuBar = UI.build(null, {
            type: 'panel',
            props: { className: 'menu-bar' }
        });

        const menus = [
            {
                label: 'Game',
                items: [
                    { label: 'New Game', action: 'game.new' },
                    { label: 'Save Game', action: 'game.save' },
                    { label: 'Load Game', action: 'game.load' },
                    { label: 'About', action: 'game.about' }
                ]
            },
            {
                label: 'Run',
                items: [
                    { label: 'New Run', action: 'run.new' },
                    { label: 'Reveal All', action: 'run.reveal' },
                    { label: 'Teleport', action: 'run.teleport' }
                ]
            },
            {
                label: 'Party',
                items: [
                    { label: 'Inventory (I)', action: 'party.inventory' },
                    { label: 'Formation (F)', action: 'party.formation' },
                    { label: 'Quests (Q)', action: 'party.quests' }
                ]
            },
            {
                label: 'Settings',
                items: [
                    { label: 'General', action: 'settings.general' },
                    { label: 'Audio', action: 'settings.audio' }
                ]
            },
            {
                label: 'Help',
                items: [
                    { label: 'General', action: 'help.general' }
                ]
            }
        ];

        const closeMenus = () => this.closeMenus();
        document.addEventListener('click', closeMenus);

        menus.forEach(menu => {
            const menuEl = UI.build(menuBar, {
                type: 'panel',
                props: { className: 'menu' }
            });

            const btn = UI.build(menuEl, {
                type: 'button',
                props: { className: 'menu-btn', label: menu.label }
            });

            const list = UI.build(menuEl, {
                type: 'panel',
                props: { className: 'menu-list' }
            });

            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isOpen = this.openMenu === menuEl;
                this.closeMenus();
                if (!isOpen) {
                    menuEl.classList.add('open');
                    this.openMenu = menuEl;
                }
            });

            menu.items.forEach((item) => {
                if (item.separator) {
                    UI.build(list, { type: 'panel', props: { className: 'menu-separator' } });
                    return;
                }

                const itemBtn = UI.build(list, {
                    type: 'button',
                    props: { className: 'menu-item', label: item.label }
                });

                this.menuItems[item.action] = itemBtn;
            });
        });

        return menuBar;
    }

    updateCardHeader(floor, index, total) {
        this.stackNav.updateCardHeader(floor, index, total);
        this.explorationWindow.updateTitle(floor.title);
        this.statusFloorEl.textContent = floor.depth;
        this.statusCardsEl.textContent = total;
    }

    updateCardList(floors, currentIndex, maxReachedIndex, onSelect) {
        this.stackNav.updateCardList(floors, currentIndex, maxReachedIndex, onSelect);
    }

    updateParty(partyView, onInspect) {
        this.partyPanel.updateParty(partyView, onInspect);
    }

    logMessage(msg, priority = 'normal') {
        this.logPanel.add(msg, priority);
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

    mount(parent) {
        if (!parent) return;
        parent.innerHTML = "";
        parent.appendChild(this.element);
    }
}
