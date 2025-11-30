import { getPrimaryElements, Graphics, elementToAscii, getIconStyle, elementToIconId, evaluateFormula } from "./core.js";
import { tooltip } from "./tooltip.js";
import { SoundManager } from "./managers.js";

/**
 * Creates a standardized label for a battler's name, including elemental icons and status indicators.
 * @param {import("./objects.js").Game_Battler} battler - The battler.
 * @param {Object} [options] - Configuration options.
 * @param {string} [options.evolutionStatus] - 'AVAILABLE', 'LOCKED', or 'NONE'.
 * @returns {HTMLElement} The container element.
 */
export function createBattlerNameLabel(battler, options = {}) {
    const container = document.createElement("div");
    container.className = "battler-name-label";
    container.style.display = "flex";
    container.style.alignItems = "center";
    container.style.whiteSpace = "nowrap";

    if (battler.elements) {
        container.appendChild(createElementIcon(battler.elements));
    }

    const nameSpan = document.createElement("span");
    nameSpan.textContent = battler.name;
    container.appendChild(nameSpan);

    if (options.evolutionStatus && options.evolutionStatus !== 'NONE') {
        const evoIcon = document.createElement("span");
        evoIcon.className = "icon";
        const iconId = options.evolutionStatus === 'AVAILABLE' ? 102 : 101;
        evoIcon.style.backgroundPosition = getIconStyle(iconId);
        evoIcon.style.marginLeft = "4px";
        evoIcon.title = options.evolutionStatus === 'AVAILABLE' ? "Evolution Available" : "Evolution Locked";
        container.appendChild(evoIcon);
    }

    return container;
}

/**
 * Creates a DOM element representing an icon for a set of elements.
 * @param {string[]} elements - The elements.
 * @returns {HTMLElement} The icon container element.
 */
export function createElementIcon(elements) {
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
 * Creates a generic gauge element.
 * @param {Object} options - Configuration options.
 */
export function createGauge(options = {}) {
    const container = document.createElement("div");
    container.className = "gauge";
    if (options.className) container.classList.add(options.className);

    if (options.width) container.style.width = `${options.width}px`;
    container.style.height = options.height || "6px";
    if (options.bgColor) container.style.backgroundColor = options.bgColor;

    const fill = document.createElement("div");
    fill.className = "gauge-fill";
    if (options.color) {
        fill.style.backgroundColor = options.color;
    }

    container.appendChild(fill);
    return { container, fill };
}

/**
 * Creates an interactive label for a game object (Skill, Passive, Item).
 */
export function createInteractiveLabel(data, type, options = {}) {
    const el = document.createElement("span");
    el.className = "interactive-label";
    el.style.display = "inline-flex";
    el.style.alignItems = "center";
    el.style.marginRight = "5px";

    if (options.className) {
        el.classList.add(options.className);
    }

    // Icon / Elements
    let iconId = data.icon;
    if (!iconId && type === 'item') {
        iconId = 6; // Default placeholder for items
    }

    if (type === 'skill' || (data.element || data.elements)) {
        let elements = data.elements || (data.element ? [data.element] : []);
        if (options.elements) elements = options.elements;

        if (elements.length > 0) {
            const iconEl = createElementIcon(elements);
            el.appendChild(iconEl);
        } else if (iconId) {
             const icon = document.createElement("span");
             icon.className = "icon";
             if (iconId > 0) {
                 icon.style.backgroundPosition = getIconStyle(iconId);
             }
             icon.style.marginRight = "4px";
             el.appendChild(icon);
        }
    } else if (iconId) {
        const icon = document.createElement("span");
        icon.className = "icon";
        if (iconId > 0) {
            icon.style.backgroundPosition = getIconStyle(iconId);
        }
        icon.style.marginRight = "4px";
        el.appendChild(icon);
    }

    const nameSpan = document.createElement("span");
    nameSpan.textContent = data.name;
    if (type === 'skill' || type === 'passive') {
         nameSpan.style.textDecoration = "underline";
         nameSpan.style.textDecorationStyle = "dotted";
    }
    el.appendChild(nameSpan);

    // Tooltip
    if (options.showTooltip !== false) {
        let text = options.tooltipText || data.description || "";
        if (!options.tooltipText) {
             let extra = "";
             if (type === 'passive' && data.effect) {
                 extra = data.effect;
             }
             if (extra) {
                 text += `<br/><span class="text-functional" style="font-size: 0.9em;">${extra}</span>`;
             }
        }

        if (text) {
             el.style.cursor = "help";
             el.addEventListener("mouseenter", (e) => {
                tooltip.show(e.clientX, e.clientY, null, text);
            });
            el.addEventListener("mouseleave", () => {
                tooltip.hide();
            });
            el.addEventListener("mousemove", (e) => {
                if (tooltip.visible) {
                    tooltip.show(e.clientX, e.clientY, null, text);
                }
            });
        }
    }

    return el;
}

/**
 * Creates a standard party member slot.
 */
export function createPartySlot(battler, index, options = {}) {
    const slot = document.createElement("div");
    slot.className = "party-slot";
    slot.style.width = "124px";
    slot.style.height = "116px";
    slot.style.display = "flex";
    slot.style.flexDirection = "column";
    slot.style.boxSizing = "border-box";

    if (options.className) slot.classList.add(options.className);
    slot.dataset.index = index;
    if (options.testId) slot.dataset.testid = options.testId;

    if (options.draggable) {
        slot.draggable = true;
        if (options.onDragStart) slot.addEventListener("dragstart", (e) => options.onDragStart(e, index));
        if (options.onDragOver) slot.addEventListener("dragover", options.onDragOver);
        if (options.onDrop) slot.addEventListener("drop", (e) => options.onDrop(e, index));
        if (options.onDragEnd) slot.addEventListener("dragend", options.onDragEnd);
    }

    if (options.onClick) {
        slot.addEventListener("click", (e) => options.onClick(battler, index, e));
    }

    if (!battler) {
        const emptyLabel = document.createElement("div");
        emptyLabel.textContent = "(Empty)";
        emptyLabel.style.textAlign = "center";
        emptyLabel.style.marginTop = "auto";
        emptyLabel.style.marginBottom = "auto";
        slot.appendChild(emptyLabel);
        return slot;
    }

    const header = document.createElement("div");
    header.className = "party-slot-header";
    header.style.display = "flex";
    header.style.justifyContent = "space-between";
    header.style.alignItems = "center";
    header.style.marginBottom = "2px";

    const nameEl = document.createElement("div");
    nameEl.className = "party-slot-name";
    nameEl.style.display = "flex";
    nameEl.style.alignItems = "center";
    nameEl.style.justifyContent = "flex-start";
    nameEl.style.flexGrow = "1";
    nameEl.style.overflow = "hidden";

    const label = createBattlerNameLabel(battler, { evolutionStatus: options.evolutionStatus });
    label.style.overflow = "hidden";
    nameEl.appendChild(label);

    const rowIndicator = document.createElement("div");
    let rowText = "";
    if (index <= 1) rowText = "Fr";
    else if (index <= 3) rowText = "Bk";
    rowIndicator.textContent = rowText;

    header.appendChild(nameEl);
    if (rowText) header.appendChild(rowIndicator);
    slot.appendChild(header);

    const body = document.createElement("div");
    body.className = "party-slot-body";
    body.style.display = "flex";
    body.style.flexGrow = "1";
    body.style.marginBottom = "2px";

    const portrait = document.createElement("div");
    portrait.className = "party-slot-portrait";
    portrait.style.backgroundImage = `url('assets/portraits/${battler.spriteKey || "pixie"}.png')`;
    portrait.style.width = "48px";
    portrait.style.height = "48px";
    portrait.style.flexShrink = "0";
    body.appendChild(portrait);

    const stats = document.createElement("div");
    stats.className = "party-slot-stats";
    stats.style.display = "flex";
    stats.style.flexDirection = "column";
    stats.style.flexGrow = "1";
    stats.style.marginLeft = "4px";
    stats.style.justifyContent = "flex-start";

    const hpText = document.createElement("div");
    hpText.textContent = `HP ${battler.hp}/${battler.maxHp}`;
    hpText.style.marginBottom = "1px";
    stats.appendChild(hpText);

    const { container: hpGauge, fill: hpFill } = createGauge({ height: "6px", color: "var(--gauge-hp)" });
    hpGauge.style.marginBottom = "1px";
    hpFill.style.width = `${Math.max(0, (battler.hp / battler.maxHp) * 100)}%`;
    hpFill.classList.add('hp-fill');
    stats.appendChild(hpGauge);

    const xpNeeded = battler.xpNeeded(battler.level);
    const xpPercent = Math.min(100, Math.max(0, ((battler.xp || 0) / xpNeeded) * 100));
    const { container: xpGauge, fill: xpFill } = createGauge({
        height: "4px",
        color: "#60a0ff",
        bgColor: "#333"
    });
    xpFill.style.width = `${xpPercent}%`;
    stats.appendChild(xpGauge);

    body.appendChild(stats);
    slot.appendChild(body);

    const footer = document.createElement("div");
    footer.className = "party-slot-footer";
    footer.style.fontSize = "10px";
    footer.style.display = "flex";
    footer.style.alignItems = "center";

    if (battler.equipmentItem) {
        const itemLabel = createInteractiveLabel(battler.equipmentItem, 'item');
        footer.appendChild(itemLabel);
    } else {
        const none = document.createElement("span");
        none.textContent = "-";
        footer.appendChild(none);
    }
    slot.appendChild(footer);

    return slot;
}

/**
 * @class WindowLayer
 */
export class WindowLayer {
  constructor() {
    this.element = document.createElement("div");
    this.element.id = "window-layer";
  }
  addChild(window) {
    this.element.appendChild(window.overlay);
  }
  appendTo(parent) {
    parent.appendChild(this.element);
  }
}

/**
 * @class WindowManager
 */
export class WindowManager {
  constructor() {
    this.stack = [];
  }
  push(window) {
    const index = this.stack.indexOf(window);
    if (index > -1) {
      this.stack.splice(index, 1);
    }
    this.stack.push(window);
    window.open();
    this.updateState();
  }
  pop() {
    if (this.stack.length === 0) return null;
    const window = this.stack.pop();
    window.close();
    this.updateState();
    return window;
  }
  close(window) {
    const index = this.stack.indexOf(window);
    if (index === -1) return;
    if (index === this.stack.length - 1) {
      this.pop();
    } else {
      this.stack.splice(index, 1);
      window.close();
      this.updateState();
    }
  }
  handleInput(e) {
      if (this.stack.length === 0) return false;
      const topWindow = this.stack[this.stack.length - 1];
      if (e.key === "Escape") {
          topWindow.onEscape();
          return true;
      }
      return false;
  }
  updateState() {
    this.stack.forEach((win, index) => {
      const isTop = index === this.stack.length - 1;
      win.element.style.zIndex = 10 + index * 10;
      win.overlay.style.zIndex = 10 + index * 10;
      if (isTop) {
        win.overlay.classList.remove("window--dimmed");
      } else {
        win.overlay.classList.add("window--dimmed");
      }
    });
  }
}

/**
 * @class Window_Base
 * @description The base class for all UI windows. Defines the standard structure
 * (Frame, Header, Content, Footer) and handles drag/drop and lifecycle.
 */
export class Window_Base {
    /**
     * @param {number|string} x
     * @param {number|string} y
     * @param {number} width
     * @param {number|string} height
     * @param {Object} options
     * @param {string} [options.title]
     * @param {boolean} [options.closeButton=true]
     */
    constructor(x, y, width, height, options = {}) {
        this.embedded = options.embedded || false;

        if (this.embedded) {
            this.element = document.createElement("div");
            this.element.className = "window-frame";
            if (options.id) this.element.id = options.id;
            this.element.style.position = "relative";
            if (width !== 'auto') this.element.style.width = `${width}px`;
            if (height !== 'auto') this.element.style.height = `${height}px`;
        } else {
            this.overlay = document.createElement("div");
            this.overlay.className = "modal-overlay";

            this.element = document.createElement("div");
            this.element.className = "window-frame";
            if (options.id) this.element.id = options.id;
            this.element.style.position = "absolute";

            const finalX = x === 'center' ? (Graphics.width - width) / 2 : x;
            const finalY = y === 'center' ? (Graphics.height - height) / 2 : y;

            this.element.style.left = `${finalX}px`;
            this.element.style.top = `${finalY}px`;
            this.element.style.width = `${width}px`;

            if (height === 'auto') {
                this.element.style.height = 'auto';
                this.element.style.maxHeight = '90vh';
            } else {
                this.element.style.height = `${height}px`;
            }
            this.element.style.zIndex = "10";

            this.overlay.appendChild(this.element);
        }

        // 1. Header
        this.header = document.createElement("div");
        this.header.className = "window-header";
        this.element.appendChild(this.header);

        this.titleEl = document.createElement("span");
        this.titleEl.textContent = options.title || "";
        this.header.appendChild(this.titleEl);

        if (!this.embedded) {
            this.makeDraggable(this.header);
        }

        if (options.closeButton !== false && !this.embedded) {
            this.btnClose = document.createElement("button");
            this.btnClose.className = "win-btn";
            this.btnClose.textContent = "X";
            this.btnClose.onclick = () => this.onUserClose();
            this.header.appendChild(this.btnClose);
        }

        // 2. Content
        this.content = document.createElement("div");
        this.content.className = "window-content";
        this.element.appendChild(this.content);

        // 3. Footer
        this.footer = document.createElement("div");
        this.footer.className = "window-footer";
        // Check if footer needs to be visible? CSS handles padding.
        this.element.appendChild(this.footer);

        this._dragStart = null;
        this._onDragHandler = this._onDrag.bind(this);
        this._onDragEndHandler = this._onDragEnd.bind(this);
    }

    makeDraggable(titleBar) {
        titleBar.addEventListener("mousedown", (e) => {
            this._dragStart = {
                x: e.clientX - this.element.offsetLeft,
                y: e.clientY - this.element.offsetTop,
            };
            document.addEventListener("mousemove", this._onDragHandler);
            document.addEventListener("mouseup", this._onDragEndHandler);
        });
    }

    _onDrag(e) {
        if (this._dragStart) {
            this.element.style.left = `${e.clientX - this._dragStart.x}px`;
            this.element.style.top = `${e.clientY - this._dragStart.y}px`;
        }
    }

    _onDragEnd() {
        this._dragStart = null;
        document.removeEventListener("mousemove", this._onDragHandler);
        document.removeEventListener("mouseup", this._onDragEndHandler);
    }

    open() { if (this.overlay) this.overlay.classList.add("active"); }
    close() { if (this.overlay) this.overlay.classList.remove("active"); }
    onEscape() { this.onUserClose(); }
    onUserClose() { this.close(); }
    refresh() {}

    /**
     * Updates the window title.
     * @param {string} text
     */
    setTitle(text) {
        this.titleEl.textContent = text;
    }

    /**
     * Adds a button to the footer.
     * @param {string} label
     * @param {Function} onClick
     * @returns {HTMLButtonElement}
     */
    addButton(label, onClick) {
        const btn = document.createElement("button");
        btn.className = "win-btn";
        btn.textContent = label;
        btn.onclick = onClick;
        this.footer.appendChild(btn);
        return btn;
    }

    /**
     * Creates a standard panel inside the content.
     * @returns {HTMLElement}
     */
    createPanel() {
        const panel = document.createElement("div");
        panel.className = "window-panel";
        this.content.appendChild(panel);
        return panel;
    }
}

/**
 * @class Window_Selectable
 * @extends Window_Base
 * @description A window that displays a list of selectable items.
 * Handles event delegation for clicks and manages selection state.
 */
export class Window_Selectable extends Window_Base {
    constructor(x, y, width, height, options = {}) {
        super(x, y, width, height, options);
        this._index = -1;
        this._data = [];
        this._handlers = {};

        // Event Delegation
        this.content.addEventListener("click", this.onClick.bind(this));
    }

    /**
     * Sets a handler for a specific action.
     * @param {string} symbol
     * @param {Function} method
     */
    setHandler(symbol, method) {
        this._handlers[symbol] = method;
    }

    /**
     * Calls a handler for the given symbol.
     * @param {string} symbol
     * @param {...any} args
     */
    callHandler(symbol, ...args) {
        if (this._handlers[symbol]) {
            this._handlers[symbol](...args);
        }
    }

    /**
     * Selects an item by index.
     * @param {number} index
     */
    select(index) {
        if (this._index === index) return;

        if (this._index >= 0) {
            const prev = this.content.querySelector(`[data-index="${this._index}"]`);
            if (prev) prev.classList.remove("selected");
        }

        this._index = index;

        if (this._index >= 0) {
            const curr = this.content.querySelector(`[data-index="${this._index}"]`);
            if (curr) curr.classList.add("selected");
            this.callHandler('select', this.item());
        }
    }

    deselect() {
        this.select(-1);
    }

    item() {
        return this._data && this._index >= 0 ? this._data[this._index] : null;
    }

    onClick(e) {
        const itemEl = e.target.closest('[data-index]');
        if (!itemEl) return;

        const index = parseInt(itemEl.dataset.index, 10);
        this.select(index);

        const actionEl = e.target.closest('[data-action]');
        if (actionEl && itemEl.contains(actionEl)) {
            const action = actionEl.dataset.action;
            this.callHandler(action, this._data[index], index);
        } else {
            this.callHandler('click', this._data[index], index);
        }
    }

    setData(data) {
        this._data = data;
        this.refresh();
    }

    refresh() {
        // To be implemented by subclasses
    }
}

/**
 * @class Window_Help
 */
export class Window_Help extends Window_Base {
  constructor() {
    super('center', 'center', 400, 350, { title: "Help – Stillnight", id: "help-window" });

    // Use a panel for the help content
    const body = this.createPanel();
    body.className = "window-panel help-body"; // keep help-body for specific styling if needed
    body.style.flexGrow = "1";
    body.style.overflowY = "auto";

    body.innerHTML = `
      <div class="help-section">
        <h2>Controls</h2>
        <div>• Click adjacent tiles (up/down/left/right) or use Arrow/WASD keys to move.</div>
        <div>• Click 'Formation' to change party order.</div>
        <div>• Click 'Inventory' to use items.</div>
      </div>
      <div class="help-section">
        <h2>Map Legend</h2>
        <div class="help-legend-grid">
           <div class="help-legend-item"><div class="help-legend-icon tile-player">☺</div> Party</div>
           <div class="help-legend-item"><div class="help-legend-icon">█</div> Wall</div>
           <div class="help-legend-item"><div class="help-legend-icon tile-enemy">E</div> Enemy</div>
           <div class="help-legend-item"><div class="help-legend-icon tile-recovery">R</div> Recovery</div>
           <div class="help-legend-item"><div class="help-legend-icon tile-stairs">S</div> Stairs</div>
           <div class="help-legend-item"><div class="help-legend-icon tile-shrine">♱</div> Shrine</div>
           <div class="help-legend-item"><div class="help-legend-icon tile-shop">¥</div> Shop</div>
           <div class="help-legend-item"><div class="help-legend-icon tile-recruit">U</div> Recruit</div>
           <div class="help-legend-item"><div class="help-legend-icon tile-fog">?</div> Unseen</div>
        </div>
      </div>
      <div class="help-section">
        <h2>Tips</h2>
        <div>• Front row deals more damage but takes more.</div>
        <div>• Back row is safer but deals less melee damage.</div>
        <div>• You must reach the stairs to unlock the next floor permanently.</div>
      </div>
    `;

    this.btnOk = this.addButton("Close", () => this.onUserClose());
  }
}

/**
 * @class Window_Battle
 */
export class Window_Battle extends Window_Base {
  constructor() {
    super('center', 'center', 528, 360, { title: "Battle – Stillnight" });

    const terminal = document.createElement("div");
    terminal.className = "terminal";
    this.content.appendChild(terminal);

    this.viewportEl = document.createElement("div");
    this.viewportEl.className = "terminal-viewport";
    terminal.appendChild(this.viewportEl);

    this.logEl = document.createElement("div");
    this.logEl.className = "terminal-log";
    terminal.appendChild(this.logEl);

    this.btnRound = this.addButton("Resolve Round", () => {});
    this.btnFlee = this.addButton("Flee", () => {});
    this.btnVictory = this.addButton("Claim Spoils", () => {});
    this.btnVictory.style.display = "none";
  }

  onUserClose() {
      this.element.classList.add("shake");
      setTimeout(() => this.element.classList.remove("shake"), 500);
  }

  appendLog(msg) {
    const div = document.createElement("div");
    div.textContent = msg;
    this.logEl.appendChild(div);
    this.logEl.scrollTop = this.logEl.scrollHeight;
  }

  logEnemyEmergence(enemies, terms) {
    this.logEl.textContent = "";
    this.appendLog(terms.enemies_emerge);
    enemies.forEach((e) => {
        const primaryElements = getPrimaryElements(e.elements);
        const elementAscii = primaryElements.map(el => elementToAscii(el)).join('');
        this.appendLog(` - ${e.name} (${e.role}, ${elementAscii})`);
    });
  }

  refresh(battlers, party) {
    this.viewportEl.innerHTML = "";

    const header = document.createElement("div");
    header.textContent = "== BATTLE ==";
    header.style.textAlign = "center";
    header.style.padding = "5px 0";
    this.viewportEl.appendChild(header);

    battlers.forEach((e, idx) => {
        const top = 30 + (idx % 2) * 40;
        const left = 20 + Math.floor(idx / 2) * 220;
        const hp = e.hp;

        const primaryElements = getPrimaryElements(e.elements);
        const elementAscii = primaryElements.map(el => elementToAscii(el)).join('');
        const nameStr = `<span id="battler-enemy-${idx}">${e.name}</span>`;

        const el = document.createElement("div");
        el.className = 'battler-container';
        el.style.position = "absolute";
        el.style.top = `${top}px`;
        el.style.left = `${left}px`;
        el.style.whiteSpace = "pre";
        el.innerHTML = `<div class="battler-name">${elementAscii}${nameStr} (HP ${hp}/${e.maxHp})</div><div class="battler-hp">${this.createHpGauge(hp, e.maxHp)}</div>`;
        this.viewportEl.appendChild(el);
    });

    party.forEach((p, idx) => {
        const top = 140 + (idx % 2) * 40;
        const left = 20 + Math.floor(idx / 2) * 220;
        const hp = p.hp;

        const primaryElements = getPrimaryElements(p.elements);
        const elementAscii = primaryElements.map(el => elementToAscii(el)).join('');
        const nameStr = `<span id="battler-party-${idx}">${p.name}</span>`;

        const el = document.createElement("div");
        el.className = 'battler-container';
        el.style.position = "absolute";
        el.style.top = `${top}px`;
        el.style.left = `${left}px`;
        el.style.whiteSpace = "pre";
        el.innerHTML = `<div class="battler-name">${elementAscii}${nameStr} (HP ${hp}/${p.maxHp})</div><div class="battler-hp">${this.createHpGauge(hp, p.maxHp)}</div>`;
        this.viewportEl.appendChild(el);
    });
  }

  createHpGauge(hp, maxHp) {
    const totalLength = 15;
    let filledCount = Math.round((hp / maxHp) * totalLength);
    if (hp > 0 && filledCount === 0) filledCount = 1;
    if (filledCount < 0) filledCount = 0;
    const emptyCount = totalLength - filledCount;
    if (emptyCount < 0) return `[${"#".repeat(totalLength)}]`;
    return `[${"#".repeat(filledCount)}${" ".repeat(emptyCount)}]`;
  }

  getBattlerId(index, isEnemy) {
      return isEnemy ? `battler-enemy-${index}` : `battler-party-${index}`;
  }

  getBattlerElement(index, isEnemy) {
      return this.viewportEl.querySelector(`#${this.getBattlerId(index, isEnemy)}`);
  }

  getHpElement(index, isEnemy) {
      const el = this.getBattlerElement(index, isEnemy);
      if (!el) return null;
      const container = el.closest('.battler-container');
      if (!container) return null;
      return container.querySelector('.battler-hp');
  }
}

/**
 * @class Window_Inspect
 */
export class Window_Inspect extends Window_Base {
  constructor() {
    super('center', 'center', 480, 320, { title: "Creature – Stillnight", id: "inspect-window" });

    const inspectBody = this.createPanel();
    // inspectBody.className = "window-panel"; // Already set by createPanel

    const layout = document.createElement('div');
    layout.className = 'inspect-layout';
    inspectBody.appendChild(layout);

    this.spriteEl = document.createElement('div');
    this.spriteEl.className = 'inspect-sprite';
    layout.appendChild(this.spriteEl);

    const fields = document.createElement('div');
    fields.className = 'inspect-fields';
    layout.appendChild(fields);

    this.nameEl = this._createField(fields, "Name");
    this.levelEl = this._createField(fields, "Level");
    this.rowPosEl = this._createField(fields, "Row");
    this.hpEl = this._createField(fields, "HP");
    this.xpEl = this._createField(fields, "XP");
    this.elementEl = this._createField(fields, "Element");
    this.equipEl = this._createField(fields, "Equipment", true);
    this.passiveEl = this._createField(fields, "Passive");
    this.skillsEl = this._createField(fields, "Skills");
    this.flavorEl = this._createField(fields, "Flavor");

    this.notesEl = document.createElement('div');
    this.notesEl.className = 'inspect-notes';
    inspectBody.appendChild(this.notesEl);

    this.btnSacrifice = this.addButton("Sacrifice", () => {});
    this.btnSacrifice.style.marginRight = "auto";
    this.btnSacrifice.style.display = "none";

    this.btnEvolve = this.addButton("Evolution", () => {});
    this.btnEvolve.style.display = "none";

    this.btnOk = this.addButton("OK", () => this.onUserClose());
  }

  _createField(parent, label, isButton = false) {
    const row = document.createElement('div');
    row.className = 'inspect-row';
    const labelSpan = document.createElement('span');
    labelSpan.className = 'inspect-label';
    labelSpan.textContent = label;
    row.appendChild(labelSpan);

    const valueEl = isButton ? document.createElement('button') : document.createElement('span');
    valueEl.className = isButton ? 'win-btn inspect-value' : 'inspect-value';
    row.appendChild(valueEl);

    parent.appendChild(row);
    return valueEl;
  }
}

/**
 * @class Window_Evolution
 */
export class Window_Evolution extends Window_Base {
  constructor() {
    super('center', 'center', 700, 400, { title: "Evolution – Stillnight", id: "evolution-window" });

    const body = document.createElement('div');
    // Generic flex row
    body.style.display = 'flex';
    body.style.flexGrow = '1';
    body.style.justifyContent = 'space-between';
    body.style.alignItems = 'center';
    body.style.padding = '10px';
    // Use panel style? Or maybe just background
    // Since it's a window, the frame is gray. We can use panels for panes.
    this.content.appendChild(body);

    this.leftPane = document.createElement('div');
    this.leftPane.className = 'window-panel evolution-pane';
    this.leftPane.style.flex = '1';
    body.appendChild(this.leftPane);

    const arrow = document.createElement('div');
    arrow.textContent = "➔";
    arrow.className = "evolution-arrow";
    body.appendChild(arrow);

    this.rightPane = document.createElement('div');
    this.rightPane.className = 'window-panel evolution-pane';
    this.rightPane.style.flex = '1';
    body.appendChild(this.rightPane);

    this.btnConfirm = this.addButton("Confirm Evolution", () => {});
    this.btnReturn = this.addButton("Return", () => this.onUserClose());
  }

  setup(current, next) {
      this.renderPane(this.leftPane, current);
      this.renderPane(this.rightPane, next);
  }

  renderPane(container, battler) {
      container.innerHTML = "";
      const layout = document.createElement('div');
      layout.className = 'inspect-layout';
      container.appendChild(layout);

      const sprite = document.createElement('div');
      sprite.className = 'inspect-sprite';
      sprite.style.backgroundImage = `url('assets/portraits/${battler.spriteKey || "pixie"}.png')`;
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
      nameVal.appendChild(createBattlerNameLabel(battler));
      createRow('Name', nameVal);

      // Level
      const levelVal = document.createElement('span');
      levelVal.textContent = battler.level;
      createRow('Level', levelVal);

      // Role
      const roleVal = document.createElement('span');
      roleVal.textContent = battler.role || "—";
      createRow('Role', roleVal);

      // HP
      const hpVal = document.createElement('span');
      hpVal.textContent = `${battler.maxHp}`;
      createRow('Max HP', hpVal);

      // Passives
      const passiveVal = document.createElement('span');
      if (battler.passives && battler.passives.length > 0) {
          battler.passives.forEach((p, i) => {
              const el = createInteractiveLabel(p, 'passive');
              passiveVal.appendChild(el);
              if (i < battler.passives.length - 1) passiveVal.appendChild(document.createTextNode(", "));
          });
      } else {
          passiveVal.textContent = "—";
      }
      createRow('Passive', passiveVal);
  }
}

/**
 * @class Window_Shop
 */
export class Window_Shop extends Window_Selectable {
  constructor() {
    super('center', 'center', 420, 320, { title: "Shop – Stillnight", id: "shop-window" });

    const shopBody = this.createPanel();
    shopBody.style.flexGrow = "1";

    const goldRow = document.createElement('div');
    goldRow.className = 'window-row';
    goldRow.textContent = 'Current gold: ';
    this.goldLabelEl = document.createElement('span');
    this.goldLabelEl.className = 'shop-gold';
    goldRow.appendChild(this.goldLabelEl);
    shopBody.appendChild(goldRow);

    this.listContainer = document.createElement('div');
    shopBody.appendChild(this.listContainer);

    this.messageEl = document.createElement('div');
    this.messageEl.className = 'window-row';
    this.messageEl.style.marginTop = '6px';
    this.messageEl.style.fontSize = '10px';
    shopBody.appendChild(this.messageEl);

    this.btnLeave = this.addButton("Leave", () => {});
  }

  setup(gold, message, items, buyCallback) {
    this.gold = gold; // Store gold for availability checks
    this.goldLabelEl.textContent = `${gold}G`;
    this.messageEl.textContent = message;

    this.setHandler('buy', (item) => {
        // Prevent buying if too expensive (safety check, though button is disabled)
        if (item.cost > this.gold) return;
        if (buyCallback) buyCallback(item.id);
    });

    this.setData(items);
  }

  refresh() {
    this.listContainer.innerHTML = "";
    this._data.forEach((tpl, index) => {
      const row = document.createElement("div");
      row.className = "window-row";
      row.dataset.index = index;

      const label = createInteractiveLabel(tpl, 'item');
      row.appendChild(label);

      const costSpan = document.createElement("span");
      costSpan.textContent = ` (${tpl.cost}G)`;
      costSpan.style.marginRight = "auto";
      row.appendChild(costSpan);

      const btn = document.createElement("button");
      btn.className = "win-btn";
      btn.textContent = "Buy";
      btn.dataset.action = "buy";

      if (tpl.cost > this.gold) {
          btn.disabled = true;
          btn.classList.add("disabled");
      }

      row.appendChild(btn);

      this.listContainer.appendChild(row);
    });
  }
}

/**
 * @class Window_Formation
 */
export class Window_Formation extends Window_Base {
  constructor() {
    super('center', 'center', 300, 320, { title: "Formation – Stillnight", id: "formation-window" });

    const formationBody = this.createPanel();
    formationBody.style.flexGrow = "1";

    const label = document.createElement('div');
    label.className = 'formation-label';
    label.textContent = 'Drag and drop to rearrange. Active party is the first 4 members.';
    formationBody.appendChild(label);

    this.gridEl = document.createElement('div');
    // JS layout
    this.gridEl.style.display = 'grid';
    this.gridEl.style.gridTemplateColumns = 'repeat(2, 1fr)'; // Scaled for wider slots
    this.gridEl.style.gap = '4px';
    this.gridEl.style.marginBottom = '4px';
    formationBody.appendChild(this.gridEl);

    const reserveLabel = document.createElement('div');
    reserveLabel.className = 'formation-label';
    reserveLabel.style.marginTop = '10px';
    reserveLabel.textContent = 'Reserve';
    formationBody.appendChild(reserveLabel);

    this.reserveGridEl = document.createElement('div');
    this.reserveGridEl.style.display = 'grid';
    this.reserveGridEl.style.gridTemplateColumns = 'repeat(2, 1fr)';
    this.reserveGridEl.style.gap = '4px';
    this.reserveGridEl.style.marginBottom = '4px';
    this.reserveGridEl.style.maxHeight = '200px';
    this.reserveGridEl.style.overflowY = 'auto';
    formationBody.appendChild(this.reserveGridEl);

    this.btnOk = this.addButton("OK", () => this.onUserClose());
    this.btnCancel = this.addButton("Cancel", () => this.onUserClose());

    this.draggedIndex = null;
    this.party = null;
    this.onChange = null;
  }

  refresh(party, onChange) {
      this.party = party;
      if (onChange) this.onChange = onChange;
      this.renderFormationGrid();
  }

  renderFormationGrid() {
    this.gridEl.innerHTML = "";
    this.reserveGridEl.innerHTML = "";

    if (!this.party) return;

    this.party.members.forEach((m, index) => {
      const slot = createPartySlot(m, index, {
          draggable: true,
          onDragStart: this.onDragStart.bind(this),
          onDragOver: this.onDragOver.bind(this),
          onDrop: this.onDrop.bind(this),
          onDragEnd: this.onDragEnd.bind(this)
      });

      if (index < 4) {
        this.gridEl.appendChild(slot);
      } else {
        this.reserveGridEl.appendChild(slot);
      }
    });
  }

  onDragStart(e, index) {
    this.draggedIndex = index;
    const slot = e.target.closest(".party-slot");
    if (slot) slot.classList.add("dragging");
  }
  onDragOver(e) {
    e.preventDefault();
    const target = e.target.closest(".party-slot");
    if (target) target.classList.add("drag-over");
  }
  onDrop(e, targetIndex) {
    e.preventDefault();
    if (this.draggedIndex === null || this.draggedIndex === targetIndex) return;
    if (this.party.reorderMembers(this.draggedIndex, targetIndex)) {
        this.draggedIndex = null;
        this.renderFormationGrid();
        SoundManager.beep(500, 80);
        if (this.onChange) this.onChange();
    }
  }
  onDragEnd(e) {
    const allSlots = this.element.querySelectorAll(".party-slot");
    allSlots.forEach((s) => s.classList.remove("dragging", "drag-over"));
  }
}

/**
 * @class Window_Inventory
 */
export class Window_Inventory extends Window_Selectable {
  constructor() {
    super('center', 'center', 400, 300, { title: "Inventory", id: "inventory-window" });

    this.content.style.overflowY = "auto";

    this.currentTab = 'consumable';

    this.tabNav = document.createElement("div");
    this.tabNav.className = "tab-nav";
    this.content.appendChild(this.tabNav);

    this.btnTabConsumable = document.createElement("button");
    this.btnTabConsumable.className = "tab-btn active";
    this.btnTabConsumable.textContent = "Consumables";
    this.btnTabConsumable.onclick = () => this.switchTab('consumable');
    this.tabNav.appendChild(this.btnTabConsumable);

    this.btnTabEquipment = document.createElement("button");
    this.btnTabEquipment.className = "tab-btn";
    this.btnTabEquipment.textContent = "Equipment";
    this.btnTabEquipment.onclick = () => this.switchTab('equipment');
    this.tabNav.appendChild(this.btnTabEquipment);

    this.listEl = document.createElement("div");
    this.listEl.style.flex = "1";
    this.content.appendChild(this.listEl);

    this.emptyMsgEl = document.createElement("p");
    this.emptyMsgEl.textContent = "Your inventory is empty.";
    this.emptyMsgEl.style.textAlign = "center";
    this.emptyMsgEl.style.display = "none";
    this.content.appendChild(this.emptyMsgEl);

    this.btnClose2 = this.addButton("Close", () => this.onUserClose());

    this.party = null;
    this.onAction = null;
    this.onDiscard = null;
  }

  setup(party, onAction, onDiscard) {
    this.party = party;
    this.onAction = onAction;
    this.onDiscard = onDiscard;

    this.setHandler('use', (item) => {
        if (this.onAction) this.onAction(item, 'use');
    });
    this.setHandler('equip', (item) => {
        if (this.onAction) this.onAction(item, 'equip');
    });
    this.setHandler('discard', (item) => {
        if (this.onDiscard) this.onDiscard(item);
    });

    this.updateList();
  }

  switchTab(tab) {
      this.currentTab = tab;
      this.btnTabConsumable.classList.toggle('active', tab === 'consumable');
      this.btnTabEquipment.classList.toggle('active', tab === 'equipment');
      this.updateList();
  }

  updateList() {
    let inventory = this.party.inventory;
    if (this.currentTab === 'consumable') {
        inventory = inventory.filter(i => i.type !== 'equipment');
    } else {
        inventory = inventory.filter(i => i.type === 'equipment');
    }
    this.setData(inventory);
  }

  refresh() {
    this.listEl.innerHTML = "";
    if (!this._data || this._data.length === 0) {
      this.emptyMsgEl.style.display = "block";
      this.emptyMsgEl.textContent = this.currentTab === 'consumable' ? "No consumables." : "No equipment.";
    } else {
      this.emptyMsgEl.style.display = "none";
      this._data.forEach((item, idx) => {
        const row = document.createElement("div");
        row.className = "window-row";
        row.style.borderBottom = "1px solid var(--bezel-shadow)";
        row.style.paddingBottom = "2px";
        row.dataset.index = idx;

        let tooltipText = item.description;
        let effectsText = "";
        const effects = [];
        if (item.effects) {
             if (item.effects.hp) effects.push(`Restores ${item.effects.hp} HP`);
             if (item.effects.maxHp) effects.push(`Max HP +${item.effects.maxHp}`);
             if (item.effects.xp) effects.push(`Grants ${item.effects.xp} XP`);
        }
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
        if (effectsText) tooltipText += `<br/><span class="text-functional" style="font-size: 0.9em;">${effectsText}</span>`;

        const label = createInteractiveLabel(item, 'item', { tooltipText });
        label.style.flexGrow = "1";
        row.appendChild(label);

        const btns = document.createElement("div");
        const useBtn = document.createElement("button");
        useBtn.className = "win-btn";
        useBtn.textContent = this.currentTab === 'equipment' ? "Equip" : "Use";
        useBtn.dataset.action = this.currentTab === 'equipment' ? "equip" : "use";

        const discardBtn = document.createElement("button");
        discardBtn.className = "win-btn";
        discardBtn.textContent = "Discard";
        discardBtn.dataset.action = "discard";

        btns.appendChild(useBtn);
        btns.appendChild(discardBtn);

        row.appendChild(btns);
        this.listEl.appendChild(row);
      });
    }
  }

}

/**
 * @class Window_Recruit
 */
export class Window_Recruit extends Window_Base {
  constructor() {
    super('center', 'center', 480, 320, { title: "Recruit – Stillnight", id: "recruit-window" });

    this.bodyEl = this.createPanel(); // used by Scene_Map to populate content
    this.buttonsEl = this.footer; // used by Scene_Map to populate buttons
    // Scene_Map appends to buttonsEl.
  }
}

/**
 * @class Window_Event
 */
export class Window_Event extends Window_Base {
  constructor() {
    // Dynamic height is handled by 'auto'.
    super('center', 'center', 520, 'auto', { title: "Event", id: "event-window" });

    this.imageContainer = document.createElement("div");
    this.imageContainer.className = "event-image-container";
    this.imageContainer.style.textAlign = "center";
    this.imageContainer.style.marginBottom = "8px";
    this.imageContainer.style.backgroundColor = "#222";
    this.imageContainer.style.display = "none";

    this.imageEl = document.createElement("img");
    this.imageEl.style.maxWidth = "100%";
    this.imageEl.style.maxHeight = "208px";
    this.imageEl.style.border = "1px solid var(--text-functional)";
    this.imageEl.style.imageRendering = "pixelated";
    this.imageEl.onerror = () => {
        if (this.imageEl.src.indexOf("default.png") === -1) {
             this.imageEl.src = `assets/eventArt/default.png`;
        }
    };
    this.imageContainer.appendChild(this.imageEl);
    this.content.appendChild(this.imageContainer);

    // Use a panel for the text/body
    const eventBody = this.createPanel();
    eventBody.style.flexGrow = "1";
    eventBody.style.display = "flex";
    eventBody.style.flexDirection = "column";

    this.descriptionEl = document.createElement('div');
    this.descriptionEl.className = 'event-description';
    this.descriptionEl.style.marginBottom = "10px";
    eventBody.appendChild(this.descriptionEl);

    // Choices handled in footer? Scene_Map currently appends choices to `.event-choices`.
    // I will use footer for choices.
    this.choicesEl = this.footer;
    // Scene_Map expects this.choicesEl to clear/add buttons.
  }

  show(data) {
      this.setTitle(data.title || "Event");

      const imgName = data.image || "default.png";
      this.imageEl.src = `assets/eventArt/${imgName}`;
      this.imageContainer.style.display = "block";

      if (data.style === 'terminal') {
          this.descriptionEl.className = "event-description terminal-style";
          this.descriptionEl.removeAttribute("style");
          this.descriptionEl.textContent = "";
          if (data.description) {
              if (Array.isArray(data.description)) {
                  data.description.forEach(line => this.appendLog(line));
              } else {
                  this.appendLog(data.description);
              }
          }
      } else {
          this.descriptionEl.className = "event-description";
          this.descriptionEl.removeAttribute("style");
          this.descriptionEl.style.marginBottom = "10px";
          this.descriptionEl.innerHTML = "";
          if (data.description) {
              if (Array.isArray(data.description)) {
                  data.description.forEach(line => {
                      if (line instanceof Node) {
                          this.descriptionEl.appendChild(line);
                      } else {
                          const p = document.createElement("div");
                          p.textContent = line;
                          this.descriptionEl.appendChild(p);
                      }
                  });
              } else if (data.description instanceof Node) {
                  this.descriptionEl.appendChild(data.description);
              } else {
                  this.descriptionEl.textContent = data.description;
              }
          }
      }

      this.updateChoices(data.choices);
  }

  appendLog(msg) {
      const p = document.createElement('div');
      if (msg instanceof Node) {
          p.appendChild(msg);
      } else {
          p.textContent = msg;
      }
      this.descriptionEl.appendChild(p);
      this.descriptionEl.scrollTop = this.descriptionEl.scrollHeight;
  }

  updateImage(imageName) {
       this.imageEl.src = `assets/eventArt/${imageName}`;
  }

  updateChoices(choices) {
      this.footer.innerHTML = ""; // Clear footer
      if (choices) {
          choices.forEach(ch => {
              this.addButton(ch.label, ch.onClick);
          });
      }
  }
}

/**
 * @class Window_Confirm
 */
export class Window_Confirm extends Window_Base {
  constructor() {
    super('center', 'center', 320, 'auto', { title: "Confirm", id: "confirm-window" });

    this.messageEl = document.createElement('div');
    this.messageEl.style.marginBottom = '8px';
    this.content.appendChild(this.messageEl);

    this.btnOk = this.addButton("OK", () => {});
    this.btnCancel = this.addButton("Cancel", () => this.onUserClose());
  }
}

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
}

/**
 * @class Window_PartyPanel
 */
export class Window_PartyPanel extends Window_Base {
    constructor() {
        super(0, 0, '100%', 'auto', { title: "Party Status", embedded: true });
        this.element.classList.add("party-panel");

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
        party.members.slice(0, 4).forEach((member, index) => {
            let evolutionStatus = null;
            if (context) {
                const statusObj = member.getEvolutionStatus(context.inventory, context.floorDepth, context.gold);
                if (statusObj.status !== 'NONE') {
                    evolutionStatus = statusObj.status;
                }
            }

            const slot = createPartySlot(member, index, {
                onClick: onInspect,
                testId: `party-slot-${index}`,
                evolutionStatus: evolutionStatus
            });
            const gaugeFill = slot.querySelector('.hp-fill');
            if (gaugeFill) {
                const startHp = member.prevHp !== undefined ? member.prevHp : member.hp;
                gaugeFill.style.width = `${Math.max(0, (startHp / member.maxHp) * 100)}%`;
                this.animateGauge(
                    gaugeFill,
                    startHp,
                    member.hp,
                    member.maxHp,
                    500
                );
            }
            member.prevHp = member.hp;
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
}

/**
 * @class Window_HUD
 * @description Manages the main static game layout.
 */
export class Window_HUD {
    constructor() {
        this.container = document.getElementById("game-container");
        this.container.style.width = "960px";
        this.container.style.height = "560px";
        this.container.style.display = "flex";
        this.container.style.flexDirection = "row";

        this.createUI();
    }

    createUI() {
        this.container.innerHTML = "";

        // Inject grid dimensions for CSS
        // The container needs to set these variables so .exploration-grid can use them.
        this.container.style.setProperty('--grid-cols', '19');
        this.container.style.setProperty('--grid-rows', '19');

        // 1. Stack Nav Window
        this.stackNav = new Window_StackNav();
        this.container.appendChild(this.stackNav.element);

        // --- Right Side Container ---
        const rightSide = document.createElement("div");
        rightSide.className = "right-side";
        this.container.appendChild(rightSide);

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
}

/**
 * Helper to render creature info.
 */
export function renderCreatureInfo(container, battler, title) {
    container.innerHTML = "";
    const layout = document.createElement('div');
    layout.className = 'inspect-layout';
    container.appendChild(layout);

    const sprite = document.createElement('div');
    sprite.className = 'inspect-sprite';
    sprite.style.backgroundImage = `url('assets/portraits/${battler.spriteKey || "pixie"}.png')`;
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

    const nameVal = document.createElement('span');
    nameVal.appendChild(createBattlerNameLabel(battler));
    createRow('Name', nameVal);

    const levelVal = document.createElement('span');
    levelVal.textContent = battler.level;
    createRow('Level', levelVal);

    const hpVal = document.createElement('span');
    hpVal.textContent = `${battler.hp} / ${battler.maxHp}`;
    createRow('HP', hpVal);

    if (battler.role) {
        const roleVal = document.createElement('span');
        roleVal.textContent = battler.role;
        createRow('Role', roleVal);
    }
}

/**
 * @class Window_PartySelect
 */
export class Window_PartySelect extends Window_Selectable {
    constructor() {
        super('center', 'center', 300, 320, { title: "Select Target", id: "party-select-window" });
        const body = this.createPanel();
        body.style.flexGrow = "1";

        this.msgEl = document.createElement("div");
        this.msgEl.style.marginBottom = "6px";
        this.msgEl.style.textAlign = "center";
        body.appendChild(this.msgEl);

        this.gridEl = document.createElement('div');
        this.gridEl.style.display = 'grid';
        this.gridEl.style.gridTemplateColumns = 'repeat(2, 1fr)';
        this.gridEl.style.gap = '4px';
        body.appendChild(this.gridEl);

        this.btnCancel = this.addButton("Cancel", () => this.onUserClose());
    }

    setup(party, message, onSelect) {
        this.party = party;
        this.onSelect = onSelect;
        this.msgEl.textContent = message;
        this.refresh();
    }

    refresh() {
        this.gridEl.innerHTML = "";
        if (!this.party) return;
        this.party.members.forEach((m, index) => {
            const slot = createPartySlot(m, index, {
                onClick: (member, idx) => {
                    if (this.onSelect) this.onSelect(member, idx);
                }
            });
            this.gridEl.appendChild(slot);
        });
    }
}

/**
 * @class Window_EquipItemSelect
 */
export class Window_EquipItemSelect extends Window_Selectable {
    constructor() {
        super('center', 'center', 420, 320, { title: "Select Equipment", id: "equip-select-window" });
        const body = this.createPanel();
        body.style.flexGrow = "1";
        this.listContainer = document.createElement('div');
        this.listContainer.style.overflowY = "auto";
        this.listContainer.style.flex = "1";
        body.appendChild(this.listContainer);
        this.btnCancel = this.addButton("Cancel", () => this.onUserClose());
    }

    setup(items, currentItem, slotName, onSelect) {
        this.currentItem = currentItem;
        this.slotName = slotName;
        this.setHandler('select', (item) => {
            if (onSelect) onSelect(item);
        });
        this.setData(items);
    }

    refresh() {
        this.listContainer.innerHTML = "";

        // Unequip Row
        const unequipRow = document.createElement("div");
        unequipRow.className = "window-row";
        unequipRow.style.borderBottom = "1px solid var(--bezel-shadow)";
        unequipRow.dataset.index = -1;

        const unequipLabel = document.createElement("span");
        unequipLabel.textContent = "Unequip";
        unequipLabel.style.flexGrow = "1";
        unequipLabel.style.paddingLeft = "20px"; // Align roughly with items that have icons
        unequipRow.appendChild(unequipLabel);

        const unequipBtns = document.createElement("div");
        const unequipBtn = document.createElement("button");
        unequipBtn.className = "win-btn";
        unequipBtn.textContent = "Unequip";
        unequipBtn.onclick = (e) => {
             e.stopPropagation();
             this.callHandler('select', null);
        };
        unequipBtns.appendChild(unequipBtn);
        unequipRow.appendChild(unequipBtns);
        this.listContainer.appendChild(unequipRow);

        if (this._data.length === 0) {
            const p = document.createElement("p");
            p.textContent = "No equipable items found.";
            p.style.textAlign = "center";
            p.style.padding = "10px";
            this.listContainer.appendChild(p);
            return;
        }

        this._data.forEach((item, index) => {
            const row = document.createElement("div");
            row.className = "window-row";
            row.dataset.index = index;
            row.style.borderBottom = "1px solid var(--bezel-shadow)";
            row.style.paddingBottom = "2px";

            if (this.currentItem && item.id === this.currentItem.id) {
                row.style.backgroundColor = "var(--bezel-light)";
            }

            let tooltipText = item.description;
            let effectsText = "";
            const effects = [];
            if (item.effects) {
                 if (item.effects.hp) effects.push(`Restores ${item.effects.hp} HP`);
                 if (item.effects.maxHp) effects.push(`Max HP +${item.effects.maxHp}`);
                 if (item.effects.xp) effects.push(`Grants ${item.effects.xp} XP`);
            }
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
            if (effectsText) tooltipText += `<br/><span class="text-functional" style="font-size: 0.9em;">${effectsText}</span>`;

            const label = createInteractiveLabel(item, 'item', { tooltipText });
            label.style.flexGrow = "1";
            row.appendChild(label);

            if (item.equippedBy) {
                const extra = document.createElement("span");
                extra.textContent = `(on ${item.equippedBy})`;
                extra.style.fontSize = "10px";
                extra.style.marginRight = "4px";
                row.appendChild(extra);
            }

            const btns = document.createElement("div");
            const equipBtn = document.createElement("button");
            equipBtn.className = "win-btn";
            equipBtn.textContent = "Equip";
            equipBtn.dataset.action = "select";

            btns.appendChild(equipBtn);
            row.appendChild(btns);

            this.listContainer.appendChild(row);
        });
    }
}

/**
 * @class Window_ConfirmEffect
 * @description Replaces Window_EquipConfirm to handle both item usage and equipment changes with effect previews.
 */
export class Window_ConfirmEffect extends Window_Base {
    constructor() {
        super('center', 'center', 500, 420, { title: "Confirm Effect", id: "confirm-effect-window" });

        this.infoPanel = this.createPanel();
        this.infoPanel.style.marginBottom = "8px";

        this.changePanel = document.createElement("div");
        this.changePanel.className = "group-box";
        this.changePanel.style.padding = "10px";
        this.content.appendChild(this.changePanel);

        const leg = document.createElement("legend");
        leg.textContent = "Changes";
        this.changePanel.appendChild(leg);

        this.slotChangeEl = document.createElement("div");
        this.slotChangeEl.style.marginBottom = "8px";
        this.slotChangeEl.style.fontWeight = "bold";
        this.slotChangeEl.style.display = "flex";
        this.slotChangeEl.style.alignItems = "center";
        this.changePanel.appendChild(this.slotChangeEl);

        this.traitListEl = document.createElement("div");
        this.traitListEl.style.fontSize = "10px";
        this.traitListEl.style.whiteSpace = "pre-wrap";
        this.changePanel.appendChild(this.traitListEl);

        this.btnConfirm = this.addButton("Confirm", () => {});
        this.btnCancel = this.addButton("Cancel", () => this.onUserClose());
    }

    setupEquip(member, newItem, oldItem, slotName, onConfirm, swapMessage) {
        this.setTitle(newItem ? "Equip Item" : "Unequip Item");
        renderCreatureInfo(this.infoPanel, member);

        this.slotChangeEl.innerHTML = "";
        const arrow = document.createElement("span");
        arrow.textContent = " ➔ ";
        arrow.style.margin = "0 8px";

        const createItemSpan = (item) => {
             const span = document.createElement("span");
             span.style.display = "inline-flex";
             span.style.alignItems = "center";
             if (item) {
                 span.appendChild(createInteractiveLabel(item, 'item', { showTooltip: true }));
             } else {
                 span.textContent = "None";
                 span.style.color = "#808080";
             }
             return span;
        };

        const slotLabel = document.createElement("span");
        slotLabel.textContent = slotName + ": ";
        this.slotChangeEl.appendChild(slotLabel);
        this.slotChangeEl.appendChild(createItemSpan(oldItem));
        this.slotChangeEl.appendChild(arrow);
        this.slotChangeEl.appendChild(createItemSpan(newItem));

        this.traitListEl.innerHTML = "";
        if (swapMessage) {
            const msg = document.createElement("div");
            msg.textContent = swapMessage;
            msg.style.color = "var(--text-highlight)";
            msg.style.marginBottom = "4px";
            this.traitListEl.appendChild(msg);
        }

        const diffs = this.calculateDiff(member, newItem, oldItem);
        diffs.forEach(diff => {
            const div = document.createElement("div");
            div.textContent = diff;
            this.traitListEl.appendChild(div);
        });

        this.btnConfirm.onclick = onConfirm;
    }

    setupUse(member, item, onConfirm) {
        this.setTitle("Use Item");
        renderCreatureInfo(this.infoPanel, member);

        this.slotChangeEl.innerHTML = "";
        const label = document.createElement("span");
        label.textContent = "Using: ";
        this.slotChangeEl.appendChild(label);
        this.slotChangeEl.appendChild(createInteractiveLabel(item, 'item', { showTooltip: true }));

        this.traitListEl.innerHTML = "";
        const changes = this.calculateUseDiff(member, item);
        if (changes.length === 0) {
            this.traitListEl.textContent = "No visible effect.";
        } else {
            changes.forEach(c => {
                const div = document.createElement("div");
                div.textContent = c;
                this.traitListEl.appendChild(div);
            });
        }

        this.btnConfirm.onclick = onConfirm;
    }

    calculateUseDiff(member, item) {
        const changes = [];
        if (!item.effects) return changes;

        const getVal = (effVal) => {
            if (typeof effVal === 'string') {
                return Math.round(evaluateFormula(effVal, member));
            }
            return effVal;
        };

        // HP
        if (item.effects.hp) {
            const val = getVal(item.effects.hp);
            const newHp = Math.min(member.maxHp, member.hp + val);
            if (newHp !== member.hp) {
                changes.push(`HP: ${member.hp}/${member.maxHp} -> ${newHp}/${member.maxHp}`);
            }
        }
        // Max HP
        if (item.effects.maxHp) {
            const val = getVal(item.effects.maxHp);
            const newMax = member.maxHp + val;
            changes.push(`Max HP: ${member.maxHp} -> ${newMax}`);
        }
        // XP
        if (item.effects.xp) {
            const val = getVal(item.effects.xp);
            // Simplified, doesn't predict level up exactly but shows XP gain
            changes.push(`XP: +${val}`);
        }

        return changes;
    }

    calculateDiff(member, newItem, oldItem) {
        const diffs = [];
        const oldTraits = oldItem ? (oldItem.traits || []) : [];
        const newTraits = newItem ? (newItem.traits || []) : [];

        const getTraitVal = (traits, code, dataId) => {
             return traits.filter(t => t.code === code && t.dataId === dataId)
                          .reduce((sum, t) => sum + t.value, 0);
        };

        const checkParamDynamic = (name, getterProp, code, dataId) => {
             const oldVal = getTraitVal(oldTraits, code, dataId);
             const newVal = getTraitVal(newTraits, code, dataId);
             if (oldVal !== newVal) {
                 const currentTotal = member[getterProp];
                 const newTotal = currentTotal - oldVal + newVal;
                 const sign = newTotal > currentTotal ? "+" : "";
                 const change = newTotal - currentTotal;
                 diffs.push(`${name}: ${sign}${change} (${currentTotal} -> ${newTotal})`);
             }
        };

        checkParamDynamic("Max HP", "maxHp", "PARAM_PLUS", "maxHp");
        checkParamDynamic("Atk", "atk", "PARAM_PLUS", "atk");

        const oldDmg = oldItem ? (oldItem.damageBonus || 0) : 0;
        const newDmg = newItem ? (newItem.damageBonus || 0) : 0;
        if (oldDmg !== newDmg) {
             diffs.push(`Damage Bonus: ${newDmg > oldDmg ? "+" : ""}${newDmg - oldDmg}`);
        }

        if (diffs.length === 0) {
            diffs.push("No stat changes.");
        }
        return diffs;
    }
}
// Alias for backward compatibility if needed, though we will update Scene_Map
export const Window_EquipConfirm = Window_ConfirmEffect;

/**
 * @class Window_Options
 */
export class Window_Options extends Window_Base {
  constructor() {
    super('center', 'center', 300, 400, { title: "Settings", id: "options-window" });

    this.bodyEl = this.createPanel();
    this.bodyEl.style.flexGrow = "1";

    this.btnOk = this.addButton("Close", () => this.onUserClose());
    this.options = [];
  }

  setup(options) {
    this.options = options;
    this.refresh();
  }

  refresh() {
    this.bodyEl.innerHTML = "";
    if (!this.options || this.options.length === 0) {
        this.bodyEl.textContent = "No options available.";
        return;
    }

    this.options.forEach(opt => {
        const row = document.createElement("div");
        row.className = "window-row";
        row.style.marginBottom = "8px";
        row.style.alignItems = "center";

        const label = document.createElement("span");
        label.textContent = opt.label + ": ";
        label.style.width = "100px";
        row.appendChild(label);

        if (opt.type === 'select') {
            const select = document.createElement("select");
            select.style.flex = "1";
            opt.options.forEach(choice => {
                const option = document.createElement("option");
                option.value = choice.value;
                option.textContent = choice.label;
                if (choice.value === opt.value) {
                    option.selected = true;
                }
                select.appendChild(option);
            });
            select.addEventListener("change", (e) => {
                if (opt.onChange) {
                    opt.onChange(e.target.value);
                }
            });
            row.appendChild(select);
        } else if (opt.type === 'text') {
             const val = document.createElement("span");
             val.textContent = opt.value;
             row.appendChild(val);
        }

        this.bodyEl.appendChild(row);
    });
  }
}

if (typeof window !== 'undefined' && window.location.search.includes("test=true")) {
    window.Window_Formation = Window_Formation;
    window.Window_Inventory = Window_Inventory;
    window.Window_Shop = Window_Shop;
    window.Window_Help = Window_Help;
    window.Window_HUD = Window_HUD;
    window.Window_ConfirmEffect = Window_ConfirmEffect;
    window.Window_PartySelect = Window_PartySelect;
    window.Window_EquipItemSelect = Window_EquipItemSelect;
}
