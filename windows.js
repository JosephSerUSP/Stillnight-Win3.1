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
 * Creates an interactive label for a game object (Skill, Passive, Item).
 * @param {Object} data - The object data (must have name, and optionally icon/elements).
 * @param {string} type - 'skill' | 'passive' | 'item' | 'generic'.
 * @param {Object} options - { tooltipText, showTooltip, className, elements }.
 * @returns {HTMLElement} The span element.
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
        // Use element icon logic if available
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
    // Inspect window styles
    if (type === 'skill' || type === 'passive') {
         nameSpan.style.textDecoration = "underline";
         nameSpan.style.textDecorationStyle = "dotted";
    }
    el.appendChild(nameSpan);

    // Tooltip
    if (options.showTooltip !== false) {
        let text = options.tooltipText || data.description || "";

        // Append extra info if not provided in text
        if (!options.tooltipText) {
             let extra = "";
             if (type === 'passive' && data.effect) {
                 extra = data.effect;
             }

             if (extra) {
                 text += `<br/><span style="color:#478174; font-size: 0.9em;">${extra}</span>`;
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
 * @class WindowLayer
 * @description A container that manages all game windows. This is a key component
 * for decoupling the UI from the main HTML file. The WindowLayer is appended to the
 * main game container, and all windows are appended to the WindowLayer. This ensures
 * that all windows are children of the game container and can be scaled and positioned
 * correctly. It also provides a single point of control for managing window z-indexing.
 */
export class WindowLayer {
  /**
   * Creates a new WindowLayer instance.
   */
  constructor() {
    /**
     * The main container element for the window layer.
     * @type {HTMLElement}
     */
    this.element = document.createElement("div");
    this.element.id = "window-layer";
  }

  /**
   * Adds a window to the layer.
   * @param {Window_Base} window - The window to add to the layer.
   */
  addChild(window) {
    this.element.appendChild(window.overlay);
  }

  /**
   * Appends the window layer to a given parent element.
   * @param {HTMLElement} parent - The element to append the layer to.
   */
  appendTo(parent) {
    parent.appendChild(this.element);
  }
}

/**
 * @class WindowManager
 * @description Manages a stack of active windows to ensure proper input focus
 * and visual hierarchy. Only the top window in the stack receives input,
 * while others are dimmed.
 */
export class WindowManager {
  /**
   * Creates a new WindowManager instance.
   */
  constructor() {
    /**
     * The stack of active windows.
     * @type {Window_Base[]}
     */
    this.stack = [];
  }

  /**
   * Pushes a window onto the stack and opens it.
   * If the window is already in the stack, it's moved to the top.
   * @method push
   * @param {Window_Base} window - The window to open.
   */
  push(window) {
    // If the window is already in the stack, move it to the top
    const index = this.stack.indexOf(window);
    if (index > -1) {
      this.stack.splice(index, 1);
    }
    this.stack.push(window);
    window.open();
    this.updateState();
  }

  /**
   * Pops the top window from the stack and closes it.
   * @method pop
   * @returns {Window_Base|null} The closed window, or null if stack was empty.
   */
  pop() {
    if (this.stack.length === 0) return null;
    const window = this.stack.pop();
    window.close();
    this.updateState();
    return window;
  }

  /**
   * Closes a specific window. If it's not the top window, it's removed from the stack.
   * @method close
   * @param {Window_Base} window - The window to close.
   */
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

  /**
   * Handles global input delegated from main.js.
   * @method handleInput
   * @param {KeyboardEvent} e
   * @returns {boolean} True if input was handled.
   */
  handleInput(e) {
      if (this.stack.length === 0) return false;

      const topWindow = this.stack[this.stack.length - 1];
      if (e.key === "Escape") {
          topWindow.onEscape();
          return true;
      }
      return false;
  }

  /**
   * Updates the visual state of all managed windows (z-index, dimming).
   * Ensures the top window is active and others are dimmed.
   * @method updateState
   */
  updateState() {
    this.stack.forEach((win, index) => {
      const isTop = index === this.stack.length - 1;

      // Update z-index to ensure correct stacking order
      // Base z-index is 10, increment by 10 for each level
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
 * @description The base class for all UI windows. Handles DOM creation, positioning,
 * and drag-and-drop functionality. Windows are rendered into a WindowLayer.
 */
export class Window_Base {
    /**
     * Creates an instance of Window_Base.
     * @param {number|string} x - The initial x coordinate, relative to the game container. Can be 'center'.
     * @param {number|string} y - The initial y coordinate, relative to the game container. Can be 'center'.
     * @param {number} width - The width of the window.
     * @param {number|string} height - The height of the window. Can be 'auto'.
     */
    constructor(x, y, width, height) {
        /**
         * The semi-transparent overlay that covers the game screen.
         * @type {HTMLElement}
         */
        this.overlay = document.createElement("div");
        this.overlay.className = "modal-overlay";

        /**
         * The main window element.
         * @type {HTMLElement}
         */
        this.element = document.createElement("div");
        this.element.className = "dialog";
        this.element.style.position = "absolute";

        const finalX = x === 'center' ? (Graphics.width - width) / 2 : x;
        const finalY = y === 'center' ? (Graphics.height - height) / 2 : y;

        this.element.style.left = `${finalX}px`;
        this.element.style.top = `${finalY}px`;
        this.element.style.width = `${width}px`;
        this.element.style.height = `${height}px`;
        this.element.style.zIndex = "10";

        this.overlay.appendChild(this.element);

        this._dragStart = null;
        this._onDragHandler = this._onDrag.bind(this);
        this._onDragEndHandler = this._onDragEnd.bind(this);
    }

    /**
     * Makes the window draggable by a specific element (usually the title bar).
     * @method makeDraggable
     * @param {HTMLElement} titleBar - The title bar element that triggers the drag.
     */
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

    /**
     * Handles the drag movement.
     * @method _onDrag
     * @private
     * @param {MouseEvent} e - The mouse event.
     */
    _onDrag(e) {
        if (this._dragStart) {
            this.element.style.left = `${e.clientX - this._dragStart.x}px`;
            this.element.style.top = `${e.clientY - this._dragStart.y}px`;
        }
    }

    /**
     * Ends the drag operation.
     * @method _onDragEnd
     * @private
     */
    _onDragEnd() {
        this._dragStart = null;
        document.removeEventListener("mousemove", this._onDragHandler);
        document.removeEventListener("mouseup", this._onDragEndHandler);
    }

    /**
     * Opens the window by adding the 'active' class to the overlay.
     * @method open
     */
    open() {
        this.overlay.classList.add("active");
    }

    /**
     * Closes the window by removing the 'active' class from the overlay.
     * @method close
     */
    close() {
        this.overlay.classList.remove("active");
    }

    /**
     * Handles the Escape key press.
     * @method onEscape
     */
    onEscape() {
        this.onUserClose();
    }

    /**
     * Logic for when the user attempts to close the window (via X or Escape).
     * Defaults to just closing. Can be overridden.
     * @method onUserClose
     */
    onUserClose() {
        this.close();
    }

    /**
     * Refreshes the window's content. Should be overridden by subclasses.
     * @method refresh
     */
    refresh() {
        // To be implemented by subclasses
    }
}

/**
 * @class Window_Battle
 * @description The window for battles. This window is designed to be a flexible,
 * terminal-style display that can be easily extended with new animations and UI
 * elements. The viewport and log are separate elements, allowing for independent
 * scrolling and content updates.
 * @extends Window_Base
 */
export class Window_Battle extends Window_Base {
  /**
   * Creates a new Window_Battle instance.
   */
  constructor() {
    super('center', 'center', 528, 360);
    this.element.style.display = 'flex';
    this.element.style.flexDirection = 'column';

    const titleBar = document.createElement("div");
    titleBar.className = "dialog-titlebar";
    this.element.appendChild(titleBar);
    this.makeDraggable(titleBar);

    const titleText = document.createElement("span");
    titleText.textContent = "Battle – Stillnight";
    titleBar.appendChild(titleText);

    this.btnClose = document.createElement("button");
    this.btnClose.className = "win-btn";
    this.btnClose.textContent = "X";
    this.btnClose.onclick = () => this.onUserClose();
    titleBar.appendChild(this.btnClose);

    const content = document.createElement("div");
    content.className = "dialog-content";
    content.style.flexGrow = "1";
    content.style.display = "flex";
    content.style.flexDirection = "column";
    this.element.appendChild(content);

    const terminal = document.createElement("div");
    terminal.className = "terminal";
    content.appendChild(terminal);

    this.viewportEl = document.createElement("div");
    this.viewportEl.className = "terminal-viewport";
    terminal.appendChild(this.viewportEl);

    this.logEl = document.createElement("div");
    this.logEl.className = "terminal-log";
    terminal.appendChild(this.logEl);

    const buttons = document.createElement("div");
    buttons.className = "dialog-buttons";
    content.appendChild(buttons);

    this.btnRound = document.createElement("button");
    this.btnRound.className = "win-btn";
    this.btnRound.textContent = "Resolve Round";
    buttons.appendChild(this.btnRound);

    this.btnFlee = document.createElement("button");
    this.btnFlee.className = "win-btn";
    this.btnFlee.textContent = "Flee";
    buttons.appendChild(this.btnFlee);

    this.btnVictory = document.createElement("button");
    this.btnVictory.className = "win-btn";
    this.btnVictory.textContent = "Claim Spoils";
    this.btnVictory.style.display = "none";
    buttons.appendChild(this.btnVictory);
  }

  onUserClose() {
      this.element.classList.add("shake");
      setTimeout(() => this.element.classList.remove("shake"), 500);
  }

  /**
   * Appends a message to the battle log and auto-scrolls to the bottom.
   * @method appendLog
   * @param {string} msg - The message to append.
   */
  appendLog(msg) {
    const div = document.createElement("div");
    div.textContent = msg;
    this.logEl.appendChild(div);
    this.logEl.scrollTop = this.logEl.scrollHeight;
  }

  /**
   * Logs the initial enemy emergence messages.
   * @method logEnemyEmergence
   * @param {Array<import("./objects.js").Game_Battler>} enemies - The enemies in the battle.
   * @param {Object} terms - The battle terms from the data manager.
   */
  logEnemyEmergence(enemies, terms) {
    this.logEl.textContent = ""; // Clear log
    this.appendLog(terms.enemies_emerge);
    enemies.forEach((e) => {
        const primaryElements = getPrimaryElements(e.elements);
        const elementAscii = primaryElements.map(el => elementToAscii(el)).join('');
        this.appendLog(` - ${e.name} (${e.role}, ${elementAscii})`);
    });
  }

  /**
   * Refreshes the battle view, including battler positions and HP gauges.
   * @method refresh
   * @param {Array<import("./objects.js").Game_Battler>} battlers - The enemies to render.
   * @param {Array<import("./objects.js").Game_Battler>} party - The party members to render.
   */
  refresh(battlers, party) {
    this.viewportEl.innerHTML = ""; // Clear previous state

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
        // Unique ID based on index and type (enemy)
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
        // Unique ID based on index and type (party)
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

  /**
   * Creates an ASCII representation of an HP gauge.
   * @method createHpGauge
   * @param {number} hp - The current HP.
   * @param {number} maxHp - The maximum HP.
   * @returns {string} The ASCII HP gauge.
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
    if (emptyCount < 0) {
        console.warn(`HP Gauge Overflow: HP=${hp}, MaxHP=${maxHp}, Filled=${filledCount}, Empty=${emptyCount}`);
        // Clamping for safety
        return `[${"#".repeat(totalLength)}]`;
    }
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
 * @description The window for inspecting creatures (actors or enemies).
 * Displays stats, equipment, and other details.
 * @extends Window_Base
 */
export class Window_Inspect extends Window_Base {
  /**
   * Creates a new Window_Inspect instance.
   */
  constructor() {
    super('center', 'center', 480, 320);
    this.element.id = "inspect-window";
    this.element.style.display = 'flex';
    this.element.style.flexDirection = 'column';

    const titleBar = document.createElement("div");
    titleBar.className = "dialog-titlebar";
    this.element.appendChild(titleBar);
    this.makeDraggable(titleBar);

    const titleText = document.createElement("span");
    titleText.textContent = "Creature – Stillnight";
    titleBar.appendChild(titleText);

    this.btnClose = document.createElement("button");
    this.btnClose.className = "win-btn";
    this.btnClose.textContent = "X";
    this.btnClose.onclick = () => this.onUserClose();
    titleBar.appendChild(this.btnClose);

    const content = document.createElement("div");
    content.className = "dialog-content";
    content.style.flexGrow = "1";
    this.element.appendChild(content);

    const inspectBody = document.createElement('div');
    inspectBody.className = 'inspect-body';
    content.appendChild(inspectBody);

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

    const buttons = document.createElement("div");
    buttons.className = "dialog-buttons";
    this.element.appendChild(buttons);

    this.btnSacrifice = document.createElement("button");
    this.btnSacrifice.className = "win-btn";
    this.btnSacrifice.style.marginRight = "auto";
    this.btnSacrifice.textContent = "Sacrifice";
    this.btnSacrifice.style.display = "none";
    buttons.appendChild(this.btnSacrifice);

    this.btnEvolve = document.createElement("button");
    this.btnEvolve.className = "win-btn";
    this.btnEvolve.textContent = "Evolution";
    this.btnEvolve.style.display = "none";
    this.btnEvolve.style.marginRight = "8px";
    buttons.appendChild(this.btnEvolve);

    this.btnOk = document.createElement("button");
    this.btnOk.className = "win-btn";
    this.btnOk.textContent = "OK";
    buttons.appendChild(this.btnOk);
  }

  /**
   * Helper to create a labeled field in the inspect window.
   * @method _createField
   * @private
   * @param {HTMLElement} parent - The parent element.
   * @param {string} label - The label text.
   * @param {boolean} [isButton=false] - Whether the value element should be a button.
   * @returns {HTMLElement} The value element (span or button).
   */
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
 * @class Window_Shop
 * @description The window for buying items in the shop.
 * @extends Window_Base
 */
/**
 * @class Window_Evolution
 * @description The window for previewing and confirming creature evolution.
 * @extends Window_Base
 */
export class Window_Evolution extends Window_Base {
  /**
   * Creates a new Window_Evolution instance.
   */
  constructor() {
    super('center', 'center', 700, 400);
    this.element.id = "evolution-window";
    this.element.style.display = 'flex';
    this.element.style.flexDirection = 'column';

    const titleBar = document.createElement("div");
    titleBar.className = "dialog-titlebar";
    this.element.appendChild(titleBar);
    this.makeDraggable(titleBar);

    const titleText = document.createElement("span");
    titleText.textContent = "Evolution – Stillnight";
    titleBar.appendChild(titleText);

    this.btnClose = document.createElement("button");
    this.btnClose.className = "win-btn";
    this.btnClose.textContent = "X";
    this.btnClose.onclick = () => this.onUserClose();
    titleBar.appendChild(this.btnClose);

    const content = document.createElement("div");
    content.className = "dialog-content";
    content.style.flexGrow = "1";
    content.style.display = "flex";
    content.style.flexDirection = "column";
    this.element.appendChild(content);

    // Main Body: Two panes
    const body = document.createElement('div');
    body.className = 'evolution-body';
    body.style.display = 'flex';
    body.style.flexGrow = '1';
    body.style.justifyContent = 'space-between';
    body.style.alignItems = 'center';
    body.style.padding = '10px';
    content.appendChild(body);

    this.leftPane = document.createElement('div');
    this.leftPane.className = 'evolution-pane';
    this.leftPane.style.flex = '1';
    body.appendChild(this.leftPane);

    const arrow = document.createElement('div');
    arrow.textContent = "➔";
    arrow.className = "evolution-arrow";
    body.appendChild(arrow);

    this.rightPane = document.createElement('div');
    this.rightPane.className = 'evolution-pane';
    this.rightPane.style.flex = '1';
    body.appendChild(this.rightPane);

    const buttons = document.createElement("div");
    buttons.className = "dialog-buttons";
    this.element.appendChild(buttons);

    this.btnConfirm = document.createElement("button");
    this.btnConfirm.className = "win-btn";
    this.btnConfirm.textContent = "Confirm Evolution";
    buttons.appendChild(this.btnConfirm);

    this.btnReturn = document.createElement("button");
    this.btnReturn.className = "win-btn";
    this.btnReturn.textContent = "Return";
    this.btnReturn.onclick = () => this.onUserClose();
    buttons.appendChild(this.btnReturn);
  }

  /**
   * Sets up the evolution window with data.
   * @param {Object} current - The current battler.
   * @param {Object} next - The next battler (preview).
   */
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

export class Window_Shop extends Window_Base {
  /**
   * Creates a new Window_Shop instance.
   */
  constructor() {
    super('center', 'center', 420, 320);
    this.element.id = "shop-window";
    this.element.style.display = 'flex';
    this.element.style.flexDirection = 'column';

    const titleBar = document.createElement("div");
    titleBar.className = "dialog-titlebar";
    this.element.appendChild(titleBar);
    this.makeDraggable(titleBar);

    const titleText = document.createElement("span");
    titleText.textContent = "Shop – Stillnight";
    titleBar.appendChild(titleText);

    this.btnClose = document.createElement("button");
    this.btnClose.className = "win-btn";
    this.btnClose.textContent = "X";
    this.btnClose.onclick = () => this.onUserClose();
    titleBar.appendChild(this.btnClose);

    const content = document.createElement("div");
    content.className = "dialog-content";
    content.style.flexGrow = "1";
    this.element.appendChild(content);

    const shopBody = document.createElement('div');
    shopBody.className = 'shop-body';
    content.appendChild(shopBody);

    const goldRow = document.createElement('div');
    goldRow.className = 'shop-row';
    goldRow.textContent = 'Current gold: ';
    this.goldLabelEl = document.createElement('span');
    this.goldLabelEl.className = 'shop-gold';
    goldRow.appendChild(this.goldLabelEl);
    shopBody.appendChild(goldRow);

    this.listContainer = document.createElement('div');
    shopBody.appendChild(this.listContainer);

    this.messageEl = document.createElement('div');
    this.messageEl.className = 'shop-row';
    this.messageEl.style.marginTop = '6px';
    this.messageEl.style.fontSize = '10px';
    shopBody.appendChild(this.messageEl);

    const buttons = document.createElement("div");
    buttons.className = "dialog-buttons";
    this.element.appendChild(buttons);

    this.btnLeave = document.createElement("button");
    this.btnLeave.className = "win-btn";
    this.btnLeave.textContent = "Leave";
    buttons.appendChild(this.btnLeave);
  }

  /**
   * Prepares the shop window with data.
   * @method setup
   * @param {number} gold - The player's current gold.
   * @param {string} message - The vendor's message.
   * @param {Object[]} items - The items available for sale.
   * @param {Function} buyCallback - The callback function to execute when an item is purchased.
   */
  setup(gold, message, items, buyCallback) {
    this.goldLabelEl.textContent = `${gold}G`;
    this.messageEl.textContent = message;
    this.renderItems(items, buyCallback);
  }

  /**
   * Renders the list of items for sale.
   * @method renderItems
   * @param {Object[]} items - The items available for sale.
   * @param {Function} buyCallback - The callback function to execute when an item is purchased.
   */
  renderItems(items, buyCallback) {
    this.listContainer.innerHTML = "";
    items.forEach((tpl) => {
      const row = document.createElement("div");
      row.className = "shop-row";

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
 * @description The window for managing party formation.
 * Allows reordering of party members.
 * @extends Window_Base
 */
export class Window_Formation extends Window_Base {
  /**
   * Creates a new Window_Formation instance.
   */
  constructor() {
    super('center', 'center', 420, 320);
    this.element.id = "formation-window";
    this.element.style.display = 'flex';
    this.element.style.flexDirection = 'column';

    const titleBar = document.createElement("div");
    titleBar.className = "dialog-titlebar";
    this.element.appendChild(titleBar);
    this.makeDraggable(titleBar);

    const titleText = document.createElement("span");
    titleText.textContent = "Formation – Stillnight";
    titleBar.appendChild(titleText);

    this.btnClose = document.createElement("button");
    this.btnClose.className = "win-btn";
    this.btnClose.textContent = "X";
    this.btnClose.onclick = () => this.onUserClose();
    titleBar.appendChild(this.btnClose);

    const content = document.createElement("div");
    content.className = "dialog-content";
    content.style.flexGrow = "1";
    this.element.appendChild(content);

    const formationBody = document.createElement('div');
    formationBody.className = 'formation-body';
    content.appendChild(formationBody);

    const label = document.createElement('div');
    label.className = 'formation-label';
    label.textContent = 'Drag and drop to rearrange. Active party is the first 4 members.';
    formationBody.appendChild(label);

    this.gridEl = document.createElement('div');
    this.gridEl.className = 'formation-grid';
    formationBody.appendChild(this.gridEl);

    const reserveLabel = document.createElement('div');
    reserveLabel.className = 'formation-label';
    reserveLabel.style.marginTop = '10px';
    reserveLabel.textContent = 'Reserve';
    formationBody.appendChild(reserveLabel);

    this.reserveGridEl = document.createElement('div');
    this.reserveGridEl.className = 'formation-reserve-grid';
    formationBody.appendChild(this.reserveGridEl);

    const buttons = document.createElement("div");
    buttons.className = "dialog-buttons";
    this.element.appendChild(buttons);

    this.btnOk = document.createElement("button");
    this.btnOk.className = "win-btn";
    this.btnOk.textContent = "OK";
    this.btnOk.onclick = () => this.onUserClose();
    buttons.appendChild(this.btnOk);

    this.btnCancel = document.createElement("button");
    this.btnCancel.className = "win-btn";
    this.btnCancel.textContent = "Cancel";
    this.btnCancel.onclick = () => this.onUserClose();
    buttons.appendChild(this.btnCancel);

    this.draggedIndex = null;
    this.party = null;
    this.onChange = null;
  }

  /**
   * Refreshes the window with the current party data.
   * @param {import("./objects.js").Game_Party} party - The party to manage.
   * @param {Function} [onChange] - Callback when formation changes.
   */
  refresh(party, onChange) {
      this.party = party;
      if (onChange) this.onChange = onChange;
      this.renderFormationGrid();
  }

  /**
   * Renders the interactive grid for formation dragging.
   */
  renderFormationGrid() {
    this.gridEl.innerHTML = "";
    this.reserveGridEl.innerHTML = "";

    if (!this.party) return;

    this.party.members.forEach((m, index) => {
      const slot = document.createElement("div");
      slot.className = "formation-slot";
      slot.dataset.index = index;
      slot.textContent = m ? `${m.name} (Lv${m.level})` : "(empty)";
      slot.draggable = true;

      slot.addEventListener("dragstart", this.onDragStart.bind(this));
      slot.addEventListener("dragover", this.onDragOver.bind(this));
      slot.addEventListener("drop", this.onDrop.bind(this));
      slot.addEventListener("dragend", this.onDragEnd.bind(this));

      if (index < 4) {
        this.gridEl.appendChild(slot);
      } else {
        this.reserveGridEl.appendChild(slot);
      }
    });
  }

  onDragStart(e) {
    this.draggedIndex = parseInt(e.target.dataset.index, 10);
    e.target.classList.add("dragging");
  }

  onDragOver(e) {
    e.preventDefault();
    const target = e.target.closest(".formation-slot");
    if (target) {
      target.classList.add("drag-over");
    }
  }

  onDrop(e) {
    e.preventDefault();
    const targetIndex = parseInt(e.target.dataset.index, 10);
    if (this.draggedIndex === null || this.draggedIndex === targetIndex) return;

    if (this.party.reorderMembers(this.draggedIndex, targetIndex)) {
        this.draggedIndex = null;
        this.renderFormationGrid();
        SoundManager.beep(500, 80);
        if (this.onChange) this.onChange();
    }
  }

  onDragEnd(e) {
    const allSlots = this.element.querySelectorAll(".formation-slot");
    allSlots.forEach((s) => s.classList.remove("dragging", "drag-over"));
  }
}

/**
 * @class Window_Inventory
 * @description The window for viewing and managing the inventory.
 * Supports using and discarding items.
 * @extends Window_Base
 */
export class Window_Inventory extends Window_Base {
  /**
   * Creates a new Window_Inventory instance.
   */
  constructor() {
    super('center', 'center', 400, 300); // x, y, width, height
    this.element.id = "inventory-window";
    this.element.style.display = 'flex';
    this.element.style.flexDirection = 'column';

    const titleBar = document.createElement("div");
    titleBar.className = "dialog-titlebar";
    this.element.appendChild(titleBar);
    this.makeDraggable(titleBar);

    const titleText = document.createElement("span");
    titleText.textContent = "Inventory";
    titleBar.appendChild(titleText);

    this.btnClose = document.createElement("button");
    this.btnClose.className = "win-btn";
    this.btnClose.textContent = "X";
    this.btnClose.onclick = () => this.onUserClose();
    titleBar.appendChild(this.btnClose);

    const content = document.createElement("div");
    content.className = "dialog-content";
    content.style.flexGrow = "1";
    content.style.overflowY = "auto";
    this.element.appendChild(content);

    this.currentTab = 'consumable';

    this.tabNav = document.createElement("div");
    this.tabNav.className = "tab-nav";
    content.appendChild(this.tabNav);

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
    content.appendChild(this.listEl);

    this.emptyMsgEl = document.createElement("p");
    this.emptyMsgEl.textContent = "Your inventory is empty.";
    this.emptyMsgEl.style.textAlign = "center";
    this.emptyMsgEl.style.display = "none";
    content.appendChild(this.emptyMsgEl);

    const buttons = document.createElement("div");
    buttons.className = "dialog-buttons";
    this.element.appendChild(buttons);

    this.btnClose2 = document.createElement("button");
    this.btnClose2.className = "win-btn";
    this.btnClose2.textContent = "Close";
    this.btnClose2.onclick = () => this.onUserClose();
    buttons.appendChild(this.btnClose2);

    this.party = null;
    this.onUse = null;
    this.onDiscard = null;
  }

  /**
   * Refreshes the inventory list.
   * @param {import("./objects.js").Game_Party} party - The party object.
   * @param {Function} onUse - Callback (item, target) => void.
   * @param {Function} onDiscard - Callback (item) => void.
   */
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
        row.className = "shop-row";

        let tooltipText = item.description;
        // Add item effects to tooltip
        let effectsText = "";
        const effects = [];
        if (item.effects) {
             if (item.effects.hp) effects.push(`Restores ${item.effects.hp} HP`);
             if (item.effects.maxHp) effects.push(`Max HP +${item.effects.maxHp}`);
             if (item.effects.xp) effects.push(`Grants ${item.effects.xp} XP`);
        }
        // Equipment stats
        if (item.traits) {
             item.traits.forEach(t => {
                 if (t.code === 'PARAM_PLUS') {
                     if (t.dataId === 'atk') effects.push(`Damage +${t.value}`);
                     if (t.dataId === 'maxHp') effects.push(`Max HP +${t.value}`);
                 }
             });
        }
        if (item.damageBonus) effects.push(`Damage +${item.damageBonus}`);

        if (effects.length > 0) {
            effectsText = effects.join(", ");
        }

        if (effectsText) {
             tooltipText += `<br/><span style="color:#478174; font-size: 0.9em;">${effectsText}</span>`;
        }

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

    this.party.members.forEach((m) => {
      const btn = document.createElement("button");
      btn.className = "win-btn";
      btn.style.display = 'block';
      btn.style.width = '90%';
      btn.style.margin = '5px auto';
      btn.textContent = `${m.name} (HP ${m.hp}/${m.maxHp})`;
      btn.addEventListener("click", () => {
        if (this.onUse) this.onUse(item, m);
      });
      this.listEl.appendChild(btn);
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
 * @description The window for recruiting new party members.
 * @extends Window_Base
 */
export class Window_Recruit extends Window_Base {
  /**
   * Creates a new Window_Recruit instance.
   */
  constructor() {
    super('center', 'center', 480, 320);
    this.element.id = "recruit-window";
    this.element.style.display = 'flex';
    this.element.style.flexDirection = 'column';

    const titleBar = document.createElement("div");
    titleBar.className = "dialog-titlebar";
    this.element.appendChild(titleBar);
    this.makeDraggable(titleBar);

    const titleText = document.createElement("span");
    titleText.textContent = "Recruit – Stillnight";
    titleBar.appendChild(titleText);

    this.btnClose = document.createElement("button");
    this.btnClose.className = "win-btn";
    this.btnClose.textContent = "X";
    this.btnClose.onclick = () => this.onUserClose();
    titleBar.appendChild(this.btnClose);

    const content = document.createElement("div");
    content.className = "dialog-content";
    content.style.flexGrow = "1";
    this.element.appendChild(content);

    this.bodyEl = document.createElement('div');
    this.bodyEl.className = 'inspect-body';
    content.appendChild(this.bodyEl);

    this.buttonsEl = document.createElement("div");
    this.buttonsEl.className = "dialog-buttons";
    this.element.appendChild(this.buttonsEl);
  }
}

/**
 * @class Window_Event
 * @description The window for displaying event text and choices.
 * @extends Window_Base
 */
export class Window_Event extends Window_Base {
  /**
   * Creates a new Window_Event instance.
   */
  constructor() {
    super('center', 'center', 520, 'auto');
    this.element.id = "event-window";
    this.element.style.display = 'flex';
    this.element.style.flexDirection = 'column';
    this.element.style.maxHeight = '90vh';

    const titleBar = document.createElement("div");
    titleBar.className = "dialog-titlebar";
    this.element.appendChild(titleBar);
    this.makeDraggable(titleBar);

    this.titleEl = document.createElement("span");
    titleBar.appendChild(this.titleEl);

    this.btnClose = document.createElement("button");
    this.btnClose.className = "win-btn";
    this.btnClose.textContent = "X";
    this.btnClose.onclick = () => this.onUserClose();
    titleBar.appendChild(this.btnClose);

    const content = document.createElement("div");
    content.className = "dialog-content";
    content.style.flexGrow = "1";
    content.style.display = "flex";
    content.style.flexDirection = "column";
    this.element.appendChild(content);

    // Image Container
    this.imageContainer = document.createElement("div");
    this.imageContainer.className = "event-image-container";
    this.imageContainer.style.textAlign = "center";
    this.imageContainer.style.marginBottom = "8px";
    this.imageContainer.style.backgroundColor = "#222";
    this.imageContainer.style.display = "none"; // Hidden by default until shown

    this.imageEl = document.createElement("img");
    this.imageEl.style.maxWidth = "100%";
    this.imageEl.style.maxHeight = "208px";
    this.imageEl.style.border = "1px solid #478174";
    this.imageEl.style.imageRendering = "pixelated";
    this.imageEl.onerror = () => {
        if (this.imageEl.src.indexOf("default.png") === -1) {
             this.imageEl.src = `assets/eventArt/default.png`;
        }
    };
    this.imageContainer.appendChild(this.imageEl);
    content.appendChild(this.imageContainer);

    const eventBody = document.createElement('div');
    eventBody.className = 'event-body';
    eventBody.style.flexGrow = "1";
    eventBody.style.display = "flex";
    eventBody.style.flexDirection = "column";
    content.appendChild(eventBody);

    this.descriptionEl = document.createElement('div');
    this.descriptionEl.className = 'event-description';
    this.descriptionEl.style.marginBottom = "10px";
    eventBody.appendChild(this.descriptionEl);

    this.choicesEl = document.createElement('div');
    this.choicesEl.className = 'event-choices dialog-buttons';
    this.choicesEl.style.marginTop = "auto";
    eventBody.appendChild(this.choicesEl);
  }

  /**
   * Configures and opens the event window.
   * @param {Object} data - The event data.
   * @param {string} [data.title] - Window title.
   * @param {string} [data.description] - Main text.
   * @param {string} [data.image] - Image filename (e.g. 'shrine.png').
   * @param {string} [data.style] - 'terminal' or 'default'.
   * @param {Array} [data.choices] - Array of choice objects { label, onClick }.
   */
  show(data) {
      this.titleEl.textContent = data.title || "Event";

      // Handle Image
      const imgName = data.image || "default.png";
      this.imageEl.src = `assets/eventArt/${imgName}`;
      this.imageContainer.style.display = "block";

      // Handle Style
      if (data.style === 'terminal') {
          this.descriptionEl.className = "event-description terminal-style";
          this.descriptionEl.style.fontFamily = "monospace";
          this.descriptionEl.style.backgroundColor = "#000";
          this.descriptionEl.style.color = "#ccc";
          this.descriptionEl.style.padding = "10px";
          this.descriptionEl.style.height = "150px";
          this.descriptionEl.style.overflowY = "auto";
          this.descriptionEl.style.whiteSpace = "pre-wrap";
          this.descriptionEl.style.border = "1px inset #444";
          this.descriptionEl.textContent = ""; // Start clean for log
          if (data.description) {
              if (Array.isArray(data.description)) {
                  data.description.forEach(line => this.appendLog(line));
              } else {
                  this.appendLog(data.description);
              }
          }
      } else {
          this.descriptionEl.className = "event-description";
          this.descriptionEl.style = ""; // Reset inline styles
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

  /**
   * Appends a message to the description area (useful for terminal style).
   * @param {string|Node} msg - Message to append.
   */
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

  /**
   * Updates the displayed image dynamically.
   * @param {string} imageName - The new image filename.
   */
  updateImage(imageName) {
       this.imageEl.src = `assets/eventArt/${imageName}`;
  }

  /**
   * Renders the choice buttons.
   * @param {Array} choices - Array of { label, onClick }.
   */
  updateChoices(choices) {
      this.choicesEl.innerHTML = "";
      if (choices) {
          choices.forEach(ch => {
              const btn = document.createElement("button");
              btn.className = "win-btn";
              btn.textContent = ch.label;
              btn.onclick = ch.onClick;
              this.choicesEl.appendChild(btn);
          });
      }
  }
}

/**
 * @class Window_Confirm
 * @description The window for generic confirmation dialogs (OK/Cancel).
 * @extends Window_Base
 */
export class Window_Confirm extends Window_Base {
  /**
   * Creates a new Window_Confirm instance.
   */
  constructor() {
    super('center', 'center', 320, 'auto');
    this.element.id = "confirm-window";
    this.element.style.display = 'flex';
    this.element.style.flexDirection = 'column';
    this.element.style.height = 'fit-content';

    const titleBar = document.createElement("div");
    titleBar.className = "dialog-titlebar";
    this.element.appendChild(titleBar);
    this.makeDraggable(titleBar);

    this.titleEl = document.createElement("span");
    titleBar.appendChild(this.titleEl);

    this.btnClose = document.createElement("button");
    this.btnClose.className = "win-btn";
    this.btnClose.textContent = "X";
    this.btnClose.onclick = () => this.onUserClose();
    titleBar.appendChild(this.btnClose);

    const content = document.createElement("div");
    content.className = "dialog-content";
    content.style.flexGrow = "1";
    this.element.appendChild(content);

    this.messageEl = document.createElement('div');
    this.messageEl.style.marginBottom = '8px';
    content.appendChild(this.messageEl);

    const buttons = document.createElement("div");
    buttons.className = "dialog-buttons";
    content.appendChild(buttons);

    this.btnOk = document.createElement("button");
    this.btnOk.className = "win-btn";
    this.btnOk.textContent = "OK";
    buttons.appendChild(this.btnOk);

    this.btnCancel = document.createElement("button");
    this.btnCancel.className = "win-btn";
    this.btnCancel.textContent = "Cancel";
    this.btnCancel.onclick = () => this.onUserClose();
    buttons.appendChild(this.btnCancel);
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
            &nbsp;&nbsp;back row is safer.<br>
            • Floors are reachable only<br>
            &nbsp;&nbsp;if you've reached their<br>
            &nbsp;&nbsp;stairs at least once.<br>
            • Shrines may offer<br>
            &nbsp;&nbsp;mysterious events.<br>
            • Boss awaits at the deepest floor.
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

    updateCardHeader(floor, index, total) {
        this.cardTitleEl.textContent = floor.title;
        this.cardIndexLabelEl.textContent = `${index + 1} / ${total}`;
        this.cardDepthLabelEl.textContent = floor.depth;
        this.statusFloorEl.textContent = floor.depth;
        this.statusCardsEl.textContent = total;
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
            const slot = document.createElement("div");
            slot.className = "party-slot";
            slot.dataset.index = index;
            slot.dataset.testid = `party-slot-${index}`;

            const portrait = document.createElement("div");
            portrait.className = "party-slot-portrait";
            portrait.style.backgroundImage = `url('assets/portraits/${member.spriteKey || "pixie"}.png')`;

            const info = document.createElement("div");
            info.className = "party-slot-info";

            const nameEl = document.createElement("div");
            nameEl.className = "party-slot-name";
            const elementIcon = createElementIcon(member.elements);
            nameEl.appendChild(elementIcon);
            const nameSpan = document.createElement('span');
            nameSpan.textContent = member.name;
            nameEl.appendChild(nameSpan);

            const hpLabel = document.createElement("div");
            const row = index <= 1 ? "Front" : "Back";
            hpLabel.textContent = `Lv${member.level} (${row})  HP ${member.hp}/${member.maxHp}`;

            const hpBar = document.createElement("div");
            hpBar.className = "hp-bar";
            const hpFill = document.createElement("div");
            hpFill.className = "hp-fill";
            hpFill.style.width = `${Math.max(0, ((member.prevHp || member.hp) / member.maxHp) * 100)}%`;

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

            slot.addEventListener("click", () => onInspect(member, index));
            this.partyGridEl.appendChild(slot);
        });
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
}

/**
 * Helper to render creature info (Sprite, Name, Level, HP, etc).
 * @param {HTMLElement} container - The container element.
 * @param {import("./objects.js").Game_Battler} battler - The battler.
 * @param {string} [title] - Optional title.
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

    // HP
    const hpVal = document.createElement('span');
    hpVal.textContent = `${battler.hp} / ${battler.maxHp}`;
    createRow('HP', hpVal);

    // Role
    if (battler.role) {
        const roleVal = document.createElement('span');
        roleVal.textContent = battler.role;
        createRow('Role', roleVal);
    }
}

/**
 * @class Window_EquipConfirm
 * @description The window for confirming equipment changes.
 * @extends Window_Base
 */
export class Window_EquipConfirm extends Window_Base {
    constructor() {
        super('center', 'center', 500, 420);
        this.element.id = "equip-confirm-window";
        this.element.style.display = 'flex';
        this.element.style.flexDirection = 'column';

        const titleBar = document.createElement("div");
        titleBar.className = "dialog-titlebar";
        this.element.appendChild(titleBar);
        this.makeDraggable(titleBar);

        const titleText = document.createElement("span");
        titleText.textContent = "Equip Item";
        titleBar.appendChild(titleText);

        this.btnClose = document.createElement("button");
        this.btnClose.className = "win-btn";
        this.btnClose.textContent = "X";
        this.btnClose.onclick = () => this.onUserClose();
        titleBar.appendChild(this.btnClose);

        const content = document.createElement("div");
        content.className = "dialog-content";
        content.style.flexGrow = "1";
        this.element.appendChild(content);

        this.infoPanel = document.createElement("div");
        this.infoPanel.className = "inspect-body";
        this.infoPanel.style.marginBottom = "8px";
        content.appendChild(this.infoPanel);

        this.changePanel = document.createElement("div");
        this.changePanel.className = "group-box";
        this.changePanel.style.padding = "10px";
        content.appendChild(this.changePanel);

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

        const buttons = document.createElement("div");
        buttons.className = "dialog-buttons";
        this.element.appendChild(buttons);

        this.btnConfirm = document.createElement("button");
        this.btnConfirm.className = "win-btn";
        this.btnConfirm.textContent = "Confirm";
        buttons.appendChild(this.btnConfirm);

        this.btnCancel = document.createElement("button");
        this.btnCancel.className = "win-btn";
        this.btnCancel.textContent = "Cancel";
        this.btnCancel.onclick = () => this.onUserClose();
        buttons.appendChild(this.btnCancel);
    }

    /**
     * Sets up the confirmation window.
     * @param {import("./objects.js").Game_Battler} member
     * @param {Object} newItem
     * @param {Object} oldItem
     * @param {string} slotName
     * @param {Function} onConfirm
     */
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

        // Traits Diff
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

        // Combine traits by code + dataId
        const getTraitVal = (traits, code, dataId) => {
             return traits.filter(t => t.code === code && t.dataId === dataId)
                          .reduce((sum, t) => sum + t.value, 0);
        };

        const checkParam = (name, code, dataId) => {
             const oldVal = getTraitVal(oldTraits, code, dataId);
             const newVal = getTraitVal(newTraits, code, dataId);
             if (oldVal !== newVal) {
                 const sign = newVal > oldVal ? "+" : "";
                 const change = newVal - oldVal;
                 diffs.push(`${name}: ${sign}${change} (${member[dataId]} -> ${member[dataId] + change})`);
             }
        };

        // Note: member stats already include oldItem stats if currently equipped.
        // So member.atk includes oldVal. New Atk = member.atk - oldVal + newVal.

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

        // Damage Bonus legacy check
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
