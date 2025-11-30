import { getPrimaryElements, Graphics, elementToAscii, getIconStyle, elementToIconId } from "./core.js";
import { tooltip } from "./tooltip.js";
import { SoundManager } from "./managers.js";

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
    nameEl.style.whiteSpace = "nowrap";

    const nameSpan = document.createElement('span');
    nameSpan.textContent = battler.name;

    if (battler.elements) {
        nameEl.appendChild(createElementIcon(battler.elements));
    }
    nameEl.appendChild(nameSpan);

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

        // 1. Header
        this.header = document.createElement("div");
        this.header.className = "window-header";
        this.element.appendChild(this.header);

        this.titleEl = document.createElement("span");
        this.titleEl.textContent = options.title || "";
        this.header.appendChild(this.titleEl);

        this.makeDraggable(this.header);

        if (options.closeButton !== false) {
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

    open() { this.overlay.classList.add("active"); }
    close() { this.overlay.classList.remove("active"); }
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

    this.equipmentListContainerEl = document.createElement('div');
    this.equipmentListContainerEl.style.display = 'none';
    fields.appendChild(this.equipmentListContainerEl);

    const groupBox = document.createElement('div');
    groupBox.className = 'group-box';
    this.equipmentListContainerEl.appendChild(groupBox);

    const legend = document.createElement('legend');
    legend.textContent = 'Change Equipment';
    groupBox.appendChild(legend);

    this.equipmentFilterEl = document.createElement('div');
    this.equipmentFilterEl.className = 'stack-nav-buttons';
    this.equipmentFilterEl.style.marginBottom = '4px';
    groupBox.appendChild(this.equipmentFilterEl);

    this.equipmentListEl = document.createElement('div');
    groupBox.appendChild(this.equipmentListEl);

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
    this.leftPane.className = 'window-panel';
    this.leftPane.style.flex = '1';
    body.appendChild(this.leftPane);

    const arrow = document.createElement('div');
    arrow.textContent = "➔";
    arrow.className = "evolution-arrow";
    body.appendChild(arrow);

    this.rightPane = document.createElement('div');
    this.rightPane.className = 'window-panel';
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
      if (battler.elements) {
          nameVal.appendChild(createElementIcon(battler.elements));
      }
      nameVal.appendChild(document.createTextNode(battler.name));
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
export class Window_Shop extends Window_Base {
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
    this.goldLabelEl.textContent = `${gold}G`;
    this.messageEl.textContent = message;
    this.renderItems(items, buyCallback);
  }

  renderItems(items, buyCallback) {
    this.listContainer.innerHTML = "";
    items.forEach((tpl) => {
      const row = document.createElement("div");
      row.className = "window-row";

      const label = createInteractiveLabel(tpl, 'item');
      row.appendChild(label);

      const costSpan = document.createElement("span");
      costSpan.textContent = ` (${tpl.cost}G)`;
      costSpan.style.marginRight = "auto";
      row.appendChild(costSpan);

      const btn = document.createElement("button");
      btn.className = "win-btn";
      btn.textContent = "Buy";
      btn.addEventListener("click", () => {
        buyCallback(tpl.id);
      });
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
    super('center', 'center', 420, 320, { title: "Formation – Stillnight", id: "formation-window" });

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
export class Window_Inventory extends Window_Base {
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

    // List container (using panel style? Or simple div)
    this.listEl = document.createElement("div");
    // We can style it as a panel if we want
    this.listEl.style.flex = "1";
    this.content.appendChild(this.listEl);

    this.emptyMsgEl = document.createElement("p");
    this.emptyMsgEl.textContent = "Your inventory is empty.";
    this.emptyMsgEl.style.textAlign = "center";
    this.emptyMsgEl.style.display = "none";
    this.content.appendChild(this.emptyMsgEl);

    this.btnClose2 = this.addButton("Close", () => this.onUserClose());

    this.party = null;
    this.onUse = null;
    this.onDiscard = null;
  }

  refresh(party, onUse, onDiscard) {
    this.party = party;
    this.onUse = onUse;
    this.onDiscard = onDiscard;
    this.showItemList();
  }

  switchTab(tab) {
      this.currentTab = tab;
      this.btnTabConsumable.classList.toggle('active', tab === 'consumable');
      this.btnTabEquipment.classList.toggle('active', tab === 'equipment');
      this.showItemList();
  }

  showItemList() {
    this.listEl.innerHTML = "";
    let inventory = this.party.inventory;
    if (this.currentTab === 'consumable') {
        inventory = inventory.filter(i => i.type !== 'equipment');
    } else {
        inventory = inventory.filter(i => i.type === 'equipment');
    }

    if (inventory.length === 0) {
      this.emptyMsgEl.style.display = "block";
      this.emptyMsgEl.textContent = this.currentTab === 'consumable' ? "No consumables." : "No equipment.";
    } else {
      this.emptyMsgEl.style.display = "none";
      inventory.forEach((item, idx) => {
        const row = document.createElement("div");
        row.className = "window-row";
        row.style.borderBottom = "1px solid var(--bezel-shadow)";
        row.style.paddingBottom = "2px";

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
        useBtn.addEventListener("click", () => this.showTargetSelection(item));
        const discardBtn = document.createElement("button");
        discardBtn.className = "win-btn";
        discardBtn.textContent = "Discard";
        discardBtn.addEventListener("click", () => {
            if (this.onDiscard) this.onDiscard(item);
        });
        btns.appendChild(useBtn);
        btns.appendChild(discardBtn);

        row.appendChild(btns);
        this.listEl.appendChild(row);
      });
    }
  }

  showTargetSelection(item) {
    this.listEl.innerHTML = "";
    const action = this.currentTab === 'equipment' ? "Equip" : "Use";
    const header = document.createElement("div");
    header.textContent = `${action} ${item.name} on:`;
    header.style.marginBottom = "10px";
    header.style.textAlign = "center";
    this.listEl.appendChild(header);

    this.party.members.forEach((m, index) => {
      const slot = createPartySlot(m, index, {
          onClick: () => {
              if (this.onUse) this.onUse(item, m);
          }
      });
      slot.style.marginBottom = "4px";
      this.listEl.appendChild(slot);
    });

    const backBtn = document.createElement("button");
    backBtn.className = "win-btn";
    backBtn.style.display = 'block';
    backBtn.style.width = '90%';
    backBtn.style.margin = '20px auto 5px auto';
    backBtn.textContent = "Back";
    backBtn.onclick = () => this.showItemList();
    this.listEl.appendChild(backBtn);
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
 * @class Window_HUD
 * @description Manages the main static game layout.
 */
export class Window_HUD {
    constructor() {
        this.container = document.getElementById("game-container");
        this.createUI();
        this.getDomElements();
    }

    createUI() {
        this.container.innerHTML = `
      <div class="stack-nav panel">
        <h1>Stillnight Stack</h1>
        <div class="group-box">
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
        </div>

        <div class="location-art-container">
             <img id="location-art" class="location-art-img" src="assets/eventArt/default.png">
        </div>

        <div class="group-box">
          <legend>Cards (Floors)</legend>
          <div class="card-list" id="card-list"></div>
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
                <span>☺: Party</span>
                <span>█: Wall</span>
                <span>E: Enemy</span>
                <span>R: Recovery</span>
                <span>S: Stairs</span>
                <span>♱: Shrine</span>
                <span>¥: Shop</span>
                <span>?: Unseen</span>
                <span>U: Recruit</span>
              </div>
            </div>
          </div>
          <div class="card-side-panels">
            <div class="party-panel panel">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span>Party Status</span>
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
        this.locationArtEl = document.getElementById("location-art");
        this.btnNewRun = document.getElementById("btn-new-run");
        this.btnRevealAll = document.getElementById("btn-reveal-all");
        this.btnSettings = document.getElementById("btn-settings");
        this.btnHelp = document.getElementById("btn-help");
        this.btnClearLog = document.getElementById("btn-clear-log");
        this.btnFormation = document.getElementById("btn-formation");
        this.btnInventory = document.getElementById("btn-inventory");
    }

    updateCardHeader(floor, index, total) {
        this.cardTitleEl.textContent = floor.title;
        this.cardIndexLabelEl.textContent = `${index + 1} / ${total}`;
        this.cardDepthLabelEl.textContent = floor.depth;
        this.statusFloorEl.textContent = floor.depth;
        this.statusCardsEl.textContent = total;
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

    updateParty(party, onInspect) {
        this.partyGridEl.innerHTML = "";
        party.members.slice(0, 4).forEach((member, index) => {
            const slot = createPartySlot(member, index, {
                onClick: onInspect,
                testId: `party-slot-${index}`
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
    if (battler.elements) {
        nameVal.appendChild(createElementIcon(battler.elements));
    }
    nameVal.appendChild(document.createTextNode(battler.name));
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
 * @class Window_EquipConfirm
 */
export class Window_EquipConfirm extends Window_Base {
    constructor() {
        super('center', 'center', 500, 420, { title: "Equip Item", id: "equip-confirm-window" });

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

    setup(member, newItem, oldItem, slotName, onConfirm) {
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
        const diffs = this.calculateDiff(member, newItem, oldItem);
        diffs.forEach(diff => {
            const div = document.createElement("div");
            div.textContent = diff;
            this.traitListEl.appendChild(div);
        });

        this.btnConfirm.onclick = onConfirm;
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
    window.Window_Help = Window_Help;
    window.Window_HUD = Window_HUD;
}
