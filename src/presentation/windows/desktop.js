import { Window_Base } from "./base.js";
import { createPartySlot, createCommanderSlot } from "./utils.js";
import { UI } from "./builder.js";

/**
 * @class Window_StackNav
 */
export class Window_StackNav extends Window_Base {
    constructor(options = {}) {
        const embedded = options.embedded !== undefined ? options.embedded : true;
        const width = options.width || (embedded ? 210 : 320);
        const height = options.height || (embedded ? '100%' : 420);
        const title = options.title || (embedded ? "Stillnight Stack" : "Cards (Floors)");
        const posX = embedded ? 0 : 'center';
        const posY = embedded ? 0 : 'center';
        super(posX, posY, width, height, { title, embedded, id: options.id });
        this.element.classList.add("stack-nav");
        this.embedded = embedded;

        if (embedded) {
            this.header.style.display = "none";
        }

        const children = [];

        children.push({
            type: 'panel',
            props: { className: 'location-art-container' },
            children: [
                { type: 'image', props: { id: 'location-art', className: 'location-art-img', src: 'assets/locationArt/default.png' } }
            ]
        });

        if (embedded) {
            children.push({
                type: 'panel',
                props: { className: 'group-box' },
                children: [
                    { type: 'label', props: { tag: 'legend', text: 'Map' } },
                    {
                        type: 'panel',
                        props: { className: 'map-info' },
                        children: [
                            {
                                type: 'panel',
                                props: { className: 'map-info-row' },
                                children: [
                                    { type: 'label', props: { text: 'Name:' } },
                                    { type: 'label', props: { id: 'map-title', className: 'map-info-value', text: title } }
                                ]
                            },
                            {
                                type: 'panel',
                                props: { className: 'map-info-row' },
                                children: [
                                    { type: 'label', props: { text: 'Mode:' } },
                                    { type: 'label', props: { id: 'map-mode', className: 'map-info-value', text: 'Exploration' } }
                                ]
                            }
                        ]
                    }
                ]
            });
        } else {
            children.push({
                type: 'panel',
                props: { className: 'group-box' },
                children: [
                    { type: 'label', props: { tag: 'legend', text: 'Run' } },
                    {
                        type: 'panel',
                        props: { className: 'stack-run-metrics' },
                        children: [
                            {
                                type: 'panel',
                                children: [
                                    { type: 'label', props: { text: 'Card:' } },
                                    { type: 'label', props: { id: 'card-index-label', text: '1 / 1' } }
                                ]
                            },
                            {
                                type: 'panel',
                                children: [
                                    { type: 'label', props: { text: 'Floor depth:' } },
                                    { type: 'label', props: { id: 'card-depth-label', text: '1' } }
                                ]
                            }
                        ]
                    }
                ]
            });

            children.push({
                type: 'panel',
                props: { className: 'group-box' },
                children: [
                    { type: 'label', props: { tag: 'legend', text: 'Cards (Floors)' } },
                    { type: 'panel', props: { id: 'card-list', className: 'card-list' } }
                ]
            });
        }

        const root = UI.build(this.content, {
            type: 'panel',
            props: { className: 'stack-nav-content' },
            children
        });

        this.cardIndexLabelEl = root.querySelector("#card-index-label");
        this.cardDepthLabelEl = root.querySelector("#card-depth-label");
        this.locationArtEl = root.querySelector("#location-art");
        this.cardListEl = root.querySelector("#card-list");
        this.mapTitleEl = root.querySelector("#map-title");
        this.mapModeEl = root.querySelector("#map-mode");
    }

    updateCardHeader(floor, index, total) {
        if (this.cardIndexLabelEl) this.cardIndexLabelEl.textContent = `${index + 1} / ${total}`;
        if (this.cardDepthLabelEl) this.cardDepthLabelEl.textContent = floor.depth;
        if (this.mapTitleEl) this.mapTitleEl.textContent = floor.title;
        if (this.locationArtEl) {
            if (floor.image) {
                 this.locationArtEl.src = `assets/locationArt/${floor.image}`;
            } else {
                 this.locationArtEl.src = `assets/locationArt/default.png`;
            }
        }
    }

    updateCardList(floors, currentIndex, maxReachedIndex, onSelect) {
        if (!this.cardListEl) return;
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

    setMode(mode) {
        if (this.mapModeEl) {
            this.mapModeEl.textContent = mode;
        }
    }
}

/**
 * @class Window_Exploration
 */
export class Window_Exploration extends Window_Base {
    constructor() {
        super(0, 0, 'auto', 'auto', { title: "Floor 1", embedded: true });
        this.element.classList.add("card-main");

        this.header.style.display = "none";

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

    setMode(_mode) {
        // Mode is displayed on the map info panel instead of the embedded header
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
        super(0, 0, '100%', 'auto', { title: "Party Status", embedded: true });
        this.element.classList.add("party-panel");

        this.prevHpMap = new WeakMap();

        this.header.style.display = "none";

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
        super(0, 0, '100%', 'auto', { title: "Event Log", embedded: true });
        this.element.classList.add("log-panel");

        this.header.style.display = "none";

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
                // Removed raw text prop since we handle content below
                className: 'log-message',
                style: { opacity: priority === 'low' ? '0.5' : '1.0' }
            }
        });

        if (msg instanceof HTMLElement || msg instanceof DocumentFragment) {
            line.appendChild(msg);
        } else {
            line.textContent = msg;
        }

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
        this.content.style.flexDirection = "column";
        this.content.style.gap = "6px";
        this.content.style.border = "none";
        this.content.style.overflow = "visible";

        this.createUI();
    }

    createUI() {
        const container = this.content;
        container.innerHTML = "";
        container.style.display = "flex";
        container.style.flex = "1";

        this.menuEntries = {};
        this.menuBar = this.buildMenuBar(container);

        this.element.style.setProperty('--grid-cols', '19');
        this.element.style.setProperty('--grid-rows', '19');

        this.stackNav = new Window_StackNav();
        this.explorationWindow = new Window_Exploration();
        this.partyPanel = new Window_PartyPanel();
        this.logPanel = new Window_LogPanel();

        const layout = UI.build(container, {
            type: 'panel',
            props: { className: 'desktop-main', style: { display: 'flex', flexDirection: 'row', width: '100%', flex: '1', gap: '6px' } },
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

    buildMenuBar(parent) {
        const bar = UI.build(parent, { type: 'panel', props: { className: 'menu-bar' } });
        const menus = [
            {
                id: 'game',
                label: 'Game',
                items: [
                    { id: 'menu-item-new-game', label: 'New Game', testId: 'menu-new-game' },
                    { id: 'menu-item-save-game', label: 'Save Game', testId: 'menu-save-game' },
                    { id: 'menu-item-load-game', label: 'Load Game', testId: 'menu-load-game' },
                    { id: 'menu-item-save-file', label: 'Save Game File', testId: 'menu-save-file' },
                    { id: 'menu-item-load-file', label: 'Load Game File', testId: 'menu-load-file' },
                    { id: 'menu-item-game-info', label: 'Info', testId: 'menu-game-info' },
                    { id: 'menu-item-about', label: 'About', testId: 'menu-about' }
                ]
            },
            {
                id: 'run',
                label: 'Run',
                items: [
                    { id: 'menu-item-new-run', label: 'New Run', testId: 'menu-new-run' },
                    { id: 'menu-item-reveal-all', label: 'Reveal All', testId: 'menu-reveal-all' },
                    { id: 'menu-item-teleport', label: 'Teleport', testId: 'menu-teleport' },
                    { id: 'menu-item-run-info', label: 'Info', testId: 'menu-run-info' }
                ]
            },
            {
                id: 'party',
                label: 'Party',
                items: [
                    { id: 'menu-item-inventory', label: 'Inventory (I)', testId: 'menu-inventory' },
                    { id: 'menu-item-formation', label: 'Formation (F)', testId: 'menu-formation' },
                    { id: 'menu-item-quests', label: 'Quests (Q)', testId: 'menu-quests' }
                ]
            },
            {
                id: 'settings',
                label: 'Settings',
                items: [
                    { id: 'menu-item-settings-general', label: 'General', testId: 'menu-settings-general' },
                    { id: 'menu-item-settings-audio', label: 'Audio', testId: 'menu-settings-audio' }
                ]
            },
            {
                id: 'help',
                label: 'Help',
                items: [
                    { id: 'menu-item-help-general', label: 'General', testId: 'menu-help-general' }
                ]
            }
        ];

        this.menuGroups = [];

        menus.forEach(menu => {
            const group = UI.build(bar, { type: 'panel', props: { className: 'menu-group', dataset: { menu: menu.id } } });
            const toggle = UI.build(group, { type: 'button', props: { className: 'menu-toggle', label: menu.label } });
            const dropdown = UI.build(group, { type: 'panel', props: { className: 'menu-dropdown' } });

            menu.items.forEach(item => {
                const itemEl = UI.build(dropdown, { type: 'button', props: { id: item.id, className: 'menu-item', label: item.label, testId: item.testId } });
                itemEl.addEventListener('click', () => this.closeMenus());
                this.menuEntries[item.id] = itemEl;
            });

            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleMenu(group);
            });

            group.addEventListener('mouseleave', () => this.closeMenus());
            this.menuGroups.push(group);
        });

        document.addEventListener('click', (e) => {
            if (!bar.contains(e.target)) {
                this.closeMenus();
            }
        });

        return bar;
    }

    toggleMenu(group) {
        if (!group) return;
        const isOpen = group.classList.contains('open');
        this.closeMenus();
        if (!isOpen) {
            group.classList.add('open');
        }
    }

    closeMenus() {
        if (!this.menuGroups) return;
        this.menuGroups.forEach(g => g.classList.remove('open'));
    }

    get menuNewGame() { return this.menuEntries?.['menu-item-new-game']; }
    get menuSaveGame() { return this.menuEntries?.['menu-item-save-game']; }
    get menuLoadGame() { return this.menuEntries?.['menu-item-load-game']; }
    get menuSaveFile() { return this.menuEntries?.['menu-item-save-file']; }
    get menuLoadFile() { return this.menuEntries?.['menu-item-load-file']; }
    get menuGameInfo() { return this.menuEntries?.['menu-item-game-info']; }
    get menuAbout() { return this.menuEntries?.['menu-item-about']; }
    get menuNewRun() { return this.menuEntries?.['menu-item-new-run']; }
    get menuRevealAll() { return this.menuEntries?.['menu-item-reveal-all']; }
    get menuTeleport() { return this.menuEntries?.['menu-item-teleport']; }
    get menuRunInfo() { return this.menuEntries?.['menu-item-run-info']; }
    get menuInventory() { return this.menuEntries?.['menu-item-inventory']; }
    get menuFormation() { return this.menuEntries?.['menu-item-formation']; }
    get menuQuests() { return this.menuEntries?.['menu-item-quests']; }
    get menuSettingsGeneral() { return this.menuEntries?.['menu-item-settings-general']; }
    get menuSettingsAudio() { return this.menuEntries?.['menu-item-settings-audio']; }
    get menuHelpGeneral() { return this.menuEntries?.['menu-item-help-general']; }

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
        this.stackNav.setMode(mode);
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
