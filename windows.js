/**
 * The base class for all windows. Handles the creation of the window's HTML structure.
 * @class
 */
export class Window_Base {
  /**
   * @param {number} x - The x-coordinate of the window.
   * @param {number} y - The y-coordinate of the window.
   * @param {number} width - The width of the window.
   * @param {number} height - The height of the window.
   */
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this._createWindowElement();
  }

  /**
   * Creates the window element and its inner structure.
   * @private
   */
  _createWindowElement() {
    this.overlay = document.createElement("div");
    this.overlay.className = "modal-overlay";
    this.overlay.style.display = "none";

    this.windowElement = document.createElement("div");
    this.windowElement.className = "dialog";
    this.windowElement.style.width = `${this.width}px`;
    this.windowElement.style.height = `${this.height}px`;
    this.windowElement.style.left = `${this.x}px`;
    this.windowElement.style.top = `${this.y}px`;

    this.titleBar = document.createElement("div");
    this.titleBar.className = "dialog-titlebar";

    this.titleText = document.createElement("span");
    this.titleText.textContent = "Window";

    this.content = document.createElement("div");
    this.content.className = "dialog-content";

    this.titleBar.appendChild(this.titleText);
    this.windowElement.appendChild(this.titleBar);
    this.windowElement.appendChild(this.content);
    this.overlay.appendChild(this.windowElement);

    document.body.appendChild(this.overlay);
  }

  /**
   * Sets the title of the window.
   * @param {string} title - The title text.
   */
  setTitle(title) {
    this.titleText.textContent = title;
  }

  /**
   * Opens the window.
   */
  open() {
    this.overlay.style.display = "flex";
  }

  /**
   * Closes the window.
   */
  close() {
    this.overlay.style.display = "none";
  }

  /**
   * Returns the main content element of the window.
   * @returns {HTMLElement} The content element.
   */
  getContent() {
    return this.content;
  }
}

/**
 * A window class that displays a list of clickable commands.
 * @class
 * @extends Window_Base
 */
export class Window_Selectable extends Window_Base {
  /**
   * @param {number} x - The x-coordinate of the window.
   * @param {number} y - The y-coordinate of the window.
   * @param {number} width - The width of the window.
   * @param {number} height - The height of the window.
   */
  constructor(x, y, width, height) {
    super(x, y, width, height);
    this.commands = [];
    this.handlers = {};

    this.commandContainer = document.createElement("div");
    this.commandContainer.className = "dialog-buttons";
    this.content.appendChild(this.commandContainer);
  }

  /**
   * Adds a command to the window.
   * @param {string} name - The name of the command to display.
   * @param {string} symbol - The symbol to identify the command.
   * @param {function} handler - The function to call when the command is selected.
   */
  addCommand(name, symbol, handler) {
    this.commands.push({ name, symbol });
    this.handlers[symbol] = handler;
    this._createButton(name, symbol);
  }

  /**
   * Creates a button for a command.
   * @param {string} name - The name of the command.
   * @param {string} symbol - The symbol of the command.
   * @private
   */
  _createButton(name, symbol) {
    const button = document.createElement("button");
    button.className = "win-btn";
    button.textContent = name;
    button.addEventListener("click", () => {
      this.handlers[symbol]();
    });
    this.commandContainer.appendChild(button);
  }
}

/**
 * The window for battles.
 * @class
 * @extends Window
 */
export class Window_Battle extends Window {
  constructor() {
    super("battle-overlay");
    this.asciiEl = document.getElementById("battle-ascii");
    this.logEl = document.getElementById("battle-log");
    this.btnClose = document.getElementById("btn-battle-close");
    this.btnRound = document.getElementById("btn-battle-round");
    this.btnFlee = document.getElementById("btn-battle-flee");
    this.btnVictory = document.getElementById("btn-battle-victory");
  }
}

/**
 * The window for inspecting creatures.
 * @class
 * @extends Window
 */
export class Window_Inspect extends Window {
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
 * The window for the shop.
 * @class
 * @extends Window
 */
export class Window_Shop extends Window {
  constructor() {
    super("shop-overlay");
    this.goldLabelEl = document.getElementById("shop-gold-label");
    this.messageEl = document.getElementById("shop-message");
    this.btnClose = document.getElementById("btn-shop-close");
    this.btnLeave = document.getElementById("btn-shop-leave");
  }

  closeShop() {
    this.close();
  }
}

/**
 * The window for party formation.
 * @class
 * @extends Window
 */
export class Window_Formation extends Window {
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
 * The window for the inventory.
 * @class
 * @extends Window
 */
export class Window_Inventory extends Window {
  constructor() {
    super("inventory-overlay");
    this.listEl = document.getElementById("inventory-list");
    this.emptyMsgEl = document.getElementById("inventory-empty-message");
    this.btnClose = document.getElementById("btn-inventory-close");
    this.btnClose2 = document.getElementById("btn-inventory-close2");
  }
}

/**
 * The window for recruiting new members.
 * @class
 * @extends Window
 */
export class Window_Recruit extends Window {
  constructor() {
    super("recruit-overlay");
    this.bodyEl = document.getElementById("recruit-body");
    this.buttonsEl = document.getElementById("recruit-buttons");
    this.btnClose = document.getElementById("btn-recruit-close");
  }
}

/**
 * The window for events.
 * @class
 * @extends Window
 */
export class Window_Event extends Window {
  constructor() {
    super("event-overlay");
    this.titleEl = document.getElementById("event-title");
    this.descriptionEl = document.getElementById("event-description");
    this.choicesEl = document.getElementById("event-choices");
    this.btnClose = document.getElementById("btn-event-close");
  }
}

/**
 * The window for generic confirmations.
 * @class
 * @extends Window_Selectable
 */
export class Window_Confirm extends Window_Selectable {
  constructor() {
    const width = 320;
    const height = 120;
    const x = Math.floor((960 - width) / 2);
    const y = Math.floor((560 - height) / 2);
    super(x, y, width, height);

    this.messageEl = document.createElement("div");
    this.messageEl.style.marginBottom = "8px";
    this.getContent().prepend(this.messageEl);
  }

  /**
   * Sets the message text of the confirmation window.
   * @param {string} message - The message to display.
   */
  setMessage(message) {
    this.messageEl.textContent = message;
  }
}