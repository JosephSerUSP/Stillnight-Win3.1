import { getPrimaryElements, Graphics } from "./core.js";

/**
 * @class WindowLayer
 * @description A dedicated container for managing all game windows. This class is a cornerstone
 * of the engine's decoupled architecture, serving as the single attachment point for all
 * `Window_Base` instances.
 *
 * Future-forward architectural notes:
 * - **Scene Graph Integration:** In a future ideal state, this `WindowLayer` will be a child
 *   of the current `Scene` object (e.g., `Scene_Map`, `Scene_Battle`). The `SceneManager`
 *   would be responsible for adding the active scene's `WindowLayer` to the main game
 *   container. This will ensure that windows are automatically torn down and garbage
 *   collected when a scene changes.
 * - **Z-Indexing:** While currently simple, the `addChild` method could be expanded to
 *   manage a sorted list of windows, allowing for more complex z-indexing logic
 *   (e.g., ensuring a confirmation dialog always appears on top of other windows).
 * - **Global Access:** For debugging purposes, a global accessor (e.g., `Graphics.windowLayer`)
 *   could be implemented to allow developers to inspect the current window stack from
 *   the browser console.
 */
export class WindowLayer {
  constructor() {
    this.element = document.createElement("div");
    this.element.id = "window-layer";
  }

  /**
   * @param {Window_Base} window - The window to add to the layer.
   */
  addChild(window) {
    this.element.appendChild(window.overlay);
  }

  /**
   * @description Appends the window layer to a given element.
   * @param {HTMLElement} parent - The element to append the layer to.
   */
  appendTo(parent) {
    parent.appendChild(this.element);
  }
}

/**
 * @class Window_Base
 * @description The foundational class for all UI windows in the game. It abstracts
 * away the direct manipulation of the DOM by handling the creation of window elements,
 * managing their position and dimensions, and providing core functionalities like
 * opening, closing, and dragging. Each window is self-contained and generates its
 * own HTML structure, which is then managed by the WindowLayer. This approach
 * decouples the UI from the static index.html file, allowing for a fully dynamic
 * and scalable interface.
 *
 * @property {HTMLElement} overlay - The parent container for the window, which includes
 * the semi-transparent background overlay. This element is added to the WindowLayer.
 * @property {HTMLElement} element - The main window element (`<div class="dialog">`)
 * that contains the window's content and title bar.
 */
export class Window_Base {
    /**
     * Creates an instance of Window_Base. The coordinate system is relative to the
     * main game container, and the class handles the calculation of the final
     * on-screen position.
     *
     * @param {number|string} x - The initial x coordinate. Can be a number (pixels)
     * or 'center' to automatically center the window horizontally.
     * @param {number|string} y - The initial y coordinate. Can be a number (pixels)
     * or 'center' to automatically center the window vertically.
     * @param {number} width - The width of the window in pixels.
     * @param {number|string} height - The height of the window. Can be a number (pixels)
     * or 'auto' to allow the content to determine the height.
     */
    constructor(x, y, width, height) {
        this.overlay = document.createElement("div");
        this.overlay.className = "modal-overlay";

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
     * @method makeDraggable
     * @description Makes the window draggable.
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
     * @method _onDrag
     * @description Handles the drag movement.
     * @param {MouseEvent} e - The mouse event.
     * @private
     */
    _onDrag(e) {
        if (this._dragStart) {
            this.element.style.left = `${e.clientX - this._dragStart.x}px`;
            this.element.style.top = `${e.clientY - this._dragStart.y}px`;
        }
    }

    /**
     * @method _onDragEnd
     * @description Ends the drag operation.
     * @private
     */
    _onDragEnd() {
        this._dragStart = null;
        document.removeEventListener("mousemove", this._onDragHandler);
        document.removeEventListener("mouseup", this._onDragEndHandler);
    }

    /**
     * @method open
     * @description Opens the window.
     */
    open() {
        this.overlay.classList.add("active");
    }

    /**
     * @method close
     * @description Closes the window.
     */
    close() {
        this.overlay.classList.remove("active");
    }

    /**
     * @method refresh
     * @description Refreshes the window's content.
     */
    refresh() {
        // To be implemented by subclasses
    }
}

/**
 * @class Window_Battle
 * @description This window handles the visual presentation of the battle scene. It is designed
 * as a flexible, terminal-style display.
 *
 * Future-forward architectural notes:
 * - **Component-Based Design:** The current `refresh` method monolithically redraws all battlers.
 *   A future refactor should create a `Sprite_Battler` class for each actor and enemy. The
 *   `Window_Battle` would then manage a collection of these sprites, updating them individually
 *   when their corresponding game objects change. This is critical for implementing animations
 *   (e.g., a sprite flashing when it takes damage) without redrawing the entire scene.
 * - **Decoupling from BattleManager:** Currently, the Scene_Map class directly calls methods on this
 *   window. In Phase 2, the `BattleManager` will take over this responsibility. `Window_Battle`
 *   should not contain any game logic; it should only be responsible for displaying the state
 *   provided by the `BattleManager`.
 * - **ASCII Art & Theming:** The `elementToAscii` and `createHpGauge` methods are simple
 *   placeholders. A more robust solution would involve a dedicated `AsciiArt_Renderer` class
 *   that could be swapped out to support different visual themes or graphical tilesets.
 *
 * @extends Window_Base
 */
export class Window_Battle extends Window_Base {
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
    this.btnClose.onclick = () => this.close();
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
   * Appends a message to the battle log.
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
   * @param {Array<import("./objects.js").Game_Battler>} enemies - The enemies in the battle.
   * @param {Object} terms - The battle terms from the data manager.
   */
  logEnemyEmergence(enemies, terms) {
    this.logEl.textContent = ""; // Clear log
    this.appendLog(terms.enemies_emerge);
    enemies.forEach((e) => {
        const primaryElements = getPrimaryElements(e.elements);
        const elementAscii = primaryElements.map(el => this.elementToAscii(el)).join('');
        this.appendLog(` - ${e.name} (${e.role}, ${elementAscii})`);
    });
  }

  /**
   * @param {Array<Object>} battlers - The battler data to render.
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
        const elementAscii = primaryElements.map(el => this.elementToAscii(el)).join('');
        const nameStr = `<span id="battler-${e.name.replace(/\s/g, '-')}">${e.name}</span>`;

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
        const elementAscii = primaryElements.map(el => this.elementToAscii(el)).join('');
        const nameStr = `<span id="battler-${p.name.replace(/\s/g, '-')}">${p.name}</span>`;

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
    if (hp > 0 && filledCount === 0) {
      filledCount = 1;
    }
    if (filledCount < 0) {
      filledCount = 0;
    }
    const emptyCount = totalLength - filledCount;
    return `[${"#".repeat(filledCount)}${" ".repeat(emptyCount)}]`;
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
}

/**
 * @class Window_Inspect
 * @description The window for inspecting creatures.
 * @extends Legacy_Window_Base
 */
export class Window_Inspect extends Window_Base {
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
 * @description The window for the shop.
 * @extends Window_Base
 */
export class Window_Shop extends Window_Base {
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
   * @method open
   * @description Opens the shop window.
   * @param {number} gold - The player's current gold.
   * @param {string} message - The vendor's message.
   * @param {Object[]} items - The items available for sale.
   * @param {Function} buyCallback - The callback function to execute when an item is purchased.
   */
  open(gold, message, items, buyCallback) {
    this.goldLabelEl.textContent = `${gold}G`;
    this.messageEl.textContent = message;
    this.renderItems(items, buyCallback);
    super.open();
  }

  /**
   * @method renderItems
   * @description Renders the list of items for sale.
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
          const iconIndex = iconId - 1;
          icon.style.backgroundPosition = `-${(iconIndex % 10) * 12}px -${Math.floor(iconIndex / 10) * 12}px`;
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
      this.listContainer.appendChild(row);
    });
  }
}

/**
 * @class Window_Formation
 * @description The window for party formation.
 * @extends Window_Base
 */
export class Window_Formation extends Window_Base {
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
 * @description The window for the inventory.
 * @extends Window_Base
 */
export class Window_Inventory extends Window_Base {
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
            const iconIndex = iconId - 1;
            icon.style.backgroundPosition = `-${(iconIndex % 10) * 12}px -${Math.floor(iconIndex / 10) * 12}px`;
        }
        row.appendChild(icon);

        const desc = document.createElement("span");
        desc.textContent = `${item.name}: ${item.description}`;
        desc.style.flexGrow = "1";
        row.appendChild(desc);

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
   * Renders a list of party members for target selection.
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
 * @description The window for recruiting new members.
 * @extends Legacy_Window_Base
 */
export class Window_Recruit extends Window_Base {
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
 * @description The window for events.
 * @extends Window_Base
 */
export class Window_Event extends Window_Base {
  constructor() {
    super('center', 'center', 480, 'auto');
    this.element.id = "event-window";
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

    const eventBody = document.createElement('div');
    eventBody.className = 'event-body';
    content.appendChild(eventBody);

    this.descriptionEl = document.createElement('div');
    this.descriptionEl.className = 'event-description';
    eventBody.appendChild(this.descriptionEl);

    this.choicesEl = document.createElement('div');
    this.choicesEl.className = 'event-choices';
    eventBody.appendChild(this.choicesEl);
  }
}

/**
 * @class Window_Confirm
 * @description The window for generic confirmations.
 * @extends Window_Base
 */
export class Window_Confirm extends Window_Base {
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
