import { getPrimaryElements, Graphics, elementToAscii, getIconStyle, elementToIconId } from "./core.js";
import { tooltip } from "./tooltip.js";

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
    if (type === 'skill' || (data.element || data.elements)) {
        // Use element icon logic if available
        let elements = data.elements || (data.element ? [data.element] : []);
        if (options.elements) elements = options.elements;

        if (elements.length > 0) {
            const iconEl = createElementIcon(elements);
            el.appendChild(iconEl);
        } else if (data.icon) {
             const icon = document.createElement("span");
             icon.className = "icon";
             if (data.icon > 0) {
                 icon.style.backgroundPosition = getIconStyle(data.icon);
             }
             icon.style.marginRight = "4px";
             el.appendChild(icon);
        }
    } else if (data.icon) {
        const icon = document.createElement("span");
        icon.className = "icon";
        if (data.icon > 0) {
            icon.style.backgroundPosition = getIconStyle(data.icon);
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
    this.btnClose.onclick = () => {
        this.element.classList.add("shake");
        setTimeout(() => this.element.classList.remove("shake"), 500);
    };
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

      const icon = document.createElement('div');
      icon.className = 'icon';
      const iconId = tpl.icon || 6; // Use icon 6 as a placeholder
      if (iconId > 0) {
          icon.style.backgroundPosition = getIconStyle(iconId);
      }
      row.appendChild(icon);

      const label = document.createElement("span");
      label.textContent = `${tpl.name} (${tpl.cost}G): ${tpl.description}`;
      const btn = document.createElement("button");
      btn.className = "win-btn";
      btn.textContent = "Buy";
      btn.addEventListener("click", () => {
        buyCallback(tpl.id);
      });
      row.appendChild(label);
      row.appendChild(btn);

      // Tooltip
      row.addEventListener("mouseenter", (e) => {
        tooltip.show(e.clientX, e.clientY, null, tpl.description);
      });
      row.addEventListener("mouseleave", () => {
        tooltip.hide();
      });
      row.addEventListener("mousemove", (e) => {
         if (tooltip.visible) {
             tooltip.show(e.clientX, e.clientY, null, tpl.description);
         }
      });

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
    buttons.appendChild(this.btnOk);

    this.btnCancel = document.createElement("button");
    this.btnCancel.className = "win-btn";
    this.btnCancel.textContent = "Cancel";
    buttons.appendChild(this.btnCancel);
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
    titleBar.appendChild(this.btnClose);

    const content = document.createElement("div");
    content.className = "dialog-content";
    content.style.flexGrow = "1";
    content.style.overflowY = "auto";
    this.element.appendChild(content);

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
    buttons.appendChild(this.btnClose2);
  }

  /**
   * Refreshes the inventory list.
   * @method refresh
   * @param {Object[]} inventory - The party's inventory.
   * @param {Function} useItemCallback - Callback for using an item.
   * @param {Function} discardItemCallback - Callback for discarding an item.
   */
  refresh(inventory, useItemCallback, discardItemCallback) {
    this.listEl.innerHTML = "";
    if (inventory.length === 0) {
      this.emptyMsgEl.style.display = "block";
    } else {
      this.emptyMsgEl.style.display = "none";
      inventory.forEach((item, idx) => {
        const row = document.createElement("div");
        row.className = "shop-row";

        const icon = document.createElement('div');
        icon.className = "icon";
        const iconId = item.icon || 6;
        if (iconId > 0) {
            icon.style.backgroundPosition = getIconStyle(iconId);
        }
        row.appendChild(icon);

        const desc = document.createElement("span");
        desc.textContent = `${item.name}`;
        desc.style.flexGrow = "1";
        row.appendChild(desc);

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

        // Tooltip
        row.addEventListener("mouseenter", (e) => {
            tooltip.show(e.clientX, e.clientY, null, tooltipText);
        });
        row.addEventListener("mouseleave", () => {
            tooltip.hide();
        });
        row.addEventListener("mousemove", (e) => {
            if (tooltip.visible) {
                tooltip.show(e.clientX, e.clientY, null, tooltipText);
            }
        });

        const btns = document.createElement("div");
        const useBtn = document.createElement("button");
        useBtn.className = "win-btn";
        useBtn.textContent = "Use";
        useBtn.addEventListener("click", () => useItemCallback(item, idx));
        const discardBtn = document.createElement("button");
        discardBtn.className = "win-btn";
        discardBtn.textContent = "Discard";
        discardBtn.addEventListener("click", () => discardItemCallback(item, idx));
        btns.appendChild(useBtn);
        btns.appendChild(discardBtn);

        row.appendChild(btns);
        this.listEl.appendChild(row);
      });
    }
  }

  /**
   * Renders a list of party members for target selection when using an item.
   * @method showTargetSelection
   * @param {import("./objects.js").Game_Battler[]} members - The party members to display.
   * @param {Function} onSelectCallback - Callback for when a member is selected.
   */
  showTargetSelection(members, onSelectCallback) {
    this.listEl.innerHTML = "<div>Select a party member to use this on:</div>";
    this.emptyMsgEl.style.display = "none";

    members.forEach((m, idx) => {
      const btn = document.createElement("button");
      btn.className = "win-btn";
      btn.style.display = 'block';
      btn.style.width = '90%';
      btn.style.margin = '5px auto';
      btn.textContent = `${m.name} (HP ${m.hp}/${m.maxHp})`;
      btn.addEventListener("click", () => {
        onSelectCallback(idx);
      });
      this.listEl.appendChild(btn);
    });
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
    this.btnClose.onclick = () => this.close();
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
          if (data.description) this.appendLog(data.description);
      } else {
          this.descriptionEl.className = "event-description";
          this.descriptionEl.style = ""; // Reset inline styles
          this.descriptionEl.style.marginBottom = "10px";
          this.descriptionEl.textContent = data.description || "";
      }

      this.updateChoices(data.choices);
      this.open();
  }

  /**
   * Appends a message to the description area (useful for terminal style).
   * @param {string} msg - Message to append.
   */
  appendLog(msg) {
      const p = document.createElement('div');
      p.textContent = msg;
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
    buttons.appendChild(this.btnCancel);
  }
}
