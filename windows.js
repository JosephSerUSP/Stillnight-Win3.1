/**
 * @class WindowLayer
 * @description A container that manages the z-indexing of windows.
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
   * @description Appends the window layer to the document body.
   */
  appendToBody() {
    document.body.appendChild(this.element);
  }
}

/**
 * @class Legacy_Window_Base
 * @description The base class for all legacy windows.
 */
class Legacy_Window_Base {
  /**
   * @param {string} overlayId - The ID of the modal overlay element.
   */
  constructor(overlayId) {
    this.overlay = document.getElementById(overlayId);
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
 * @class Window_Base
 * @description The base class for all windows.
 */
export class Window_Base {
    /**
     * @param {number} x - The x coordinate on screen.
     * @param {number} y - The y coordinate on screen.
     * @param {number} width - The width of the window.
     * @param {number} height - The height of the window.
     */
    constructor(x, y, width, height) {
        this.overlay = document.createElement("div");
        this.overlay.className = "modal-overlay";

        this.element = document.createElement("div");
        this.element.className = "dialog";
        this.element.style.position = "absolute";
        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;
        this.element.style.width = `${width}px`;
        this.element.style.height = `${height}px`;
        this.element.style.zIndex = "10";

        this.overlay.appendChild(this.element);
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
 * @description The window for battles.
 * @extends Window_Base
 */
export class Window_Battle extends Window_Base {
  constructor() {
    super(20, 20, 600, 400); // Example dimensions, adjust as needed

    // Create title bar
    const titleBar = document.createElement("div");
    titleBar.className = "dialog-titlebar";
    this.element.appendChild(titleBar);

    const titleText = document.createElement("span");
    titleText.textContent = "Battle – Stillnight";
    titleBar.appendChild(titleText);

    this.btnClose = document.createElement("button");
    this.btnClose.className = "win-btn";
    this.btnClose.textContent = "X";
    this.btnClose.onclick = () => this.close();
    titleBar.appendChild(this.btnClose);

    // Create content area
    const content = document.createElement("div");
    content.className = "dialog-content";
    this.element.appendChild(content);

    // Create ASCII display area
    this.asciiEl = document.createElement("pre");
    this.asciiEl.className = "battle-ascii";
    content.appendChild(this.asciiEl);

    // Create log area
    this.logEl = document.createElement("div");
    this.logEl.className = "battle-log";
    content.appendChild(this.logEl);

    // Create buttons
    const buttons = document.createElement("div");
    buttons.className = "dialog-buttons";
    this.element.appendChild(buttons);

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
   * @param {string} asciiArt - The ASCII art to display.
   */
  refresh(asciiArt) {
    this.asciiEl.innerHTML = asciiArt;
  }
}

/**
 * @class Window_Inspect
 * @description The window for inspecting creatures.
 * @extends Legacy_Window_Base
 */
export class Window_Inspect extends Legacy_Window_Base {
  constructor() {
    super("inspect-overlay");
    this.spriteEl = document.getElementById("inspect-sprite");
    this.nameEl = document.getElementById("inspect-name");
    this.levelEl = document.getElementById("inspect-level");
    this.rowPosEl = document.getElementById("inspect-rowpos");
    this.hpEl = document.getElementById("inspect-hp");
    this.xpEl = document.getElementById("inspect-xp");
    this.elementEl = document.getElementById("inspect-element");
    this.equipEl = document.getElementById("inspect-equip");
    this.passiveEl = document.getElementById("inspect-passive");
    this.skillsEl = document.getElementById("inspect-skills");
    this.flavorEl = document.getElementById("inspect-flavor");
    this.notesEl = document.getElementById("inspect-notes");
    this.equipmentListContainerEl = document.getElementById("inspect-equipment-list-container");
    this.equipmentListEl = document.getElementById("inspect-equipment-list");
    this.equipmentFilterEl = document.getElementById("inspect-equipment-filter");
    this.btnClose = document.getElementById("btn-inspect-close");
    this.btnOk = document.getElementById("btn-inspect-ok");
  }
}

/**
 * @class Window_Shop
 * @description The window for the shop.
 * @extends Legacy_Window_Base
 */
export class Window_Shop extends Legacy_Window_Base {
  constructor() {
    super("shop-overlay");
    this.goldLabelEl = document.getElementById("shop-gold-label");
    this.messageEl = document.getElementById("shop-message");
    this.listContainer = document.getElementById("shop-item-list");
    this.btnClose = document.getElementById("btn-shop-close");
    this.btnLeave = document.getElementById("btn-shop-leave");
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
    this.goldLabelEl.textContent = gold;
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
 * @extends Legacy_Window_Base
 */
export class Window_Formation extends Legacy_Window_Base {
  constructor() {
    super("formation-overlay");
    this.gridEl = document.getElementById("formation-grid");
    this.reserveGridEl = document.getElementById("formation-reserve-grid");
    this.btnClose = document.getElementById("btn-formation-close");
    this.btnOk = document.getElementById("btn-formation-ok");
    this.btnCancel = document.getElementById("btn-formation-cancel");
  }
}

/**
 * @class Window_Inventory
 * @description The window for the inventory.
 * @extends Legacy_Window_Base
 */
export class Window_Inventory extends Legacy_Window_Base {
  constructor() {
    super("inventory-overlay");
    this.listEl = document.getElementById("inventory-list");
    this.emptyMsgEl = document.getElementById("inventory-empty-message");
    this.btnClose = document.getElementById("btn-inventory-close");
    this.btnClose2 = document.getElementById("btn-inventory-close2");
  }
}

/**
 * @class Window_Recruit
 * @description The window for recruiting new members.
 * @extends Legacy_Window_Base
 */
export class Window_Recruit extends Legacy_Window_Base {
  constructor() {
    super("recruit-overlay");
    this.bodyEl = document.getElementById("recruit-body");
    this.buttonsEl = document.getElementById("recruit-buttons");
    this.btnClose = document.getElementById("btn-recruit-close");
  }
}

/**
 * @class Window_Event
 * @description The window for events.
 * @extends Legacy_Window_Base
 */
export class Window_Event extends Legacy_Window_Base {
  constructor() {
    super("event-overlay");
    this.titleEl = document.getElementById("event-title");
    this.descriptionEl = document.getElementById("event-description");
    this.choicesEl = document.getElementById("event-choices");
    this.btnClose = document.getElementById("btn-event-close");
  }
}

/**
 * @class Window_Confirm
 * @description The window for generic confirmations.
 * @extends Legacy_Window_Base
 */
export class Window_Confirm extends Legacy_Window_Base {
  constructor() {
    super("confirm-overlay");
    this.titleEl = document.getElementById("confirm-title");
    this.messageEl = document.getElementById("confirm-message");
    this.btnOk = document.getElementById("btn-confirm-ok");
    this.btnCancel = document.getElementById("btn-confirm-cancel");
  }
}
