/**
 * The base class for all windows.
 * @class
 */
class Window {
  /**
   * @param {string} overlayId - The ID of the modal overlay element.
   */
  constructor(overlayId) {
    this.overlay = document.getElementById(overlayId);
  }

  /**
   * Opens the window.
   */
  open() {
    this.overlay.classList.add("active");
  }

  /**
   * Closes the window.
   */
  close() {
    this.overlay.classList.remove("active");
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
 * @extends Window
 */
export class Window_Confirm extends Window {
  constructor() {
    super("confirm-overlay");
    this.titleEl = document.getElementById("confirm-title");
    this.messageEl = document.getElementById("confirm-message");
    this.btnOk = document.getElementById("btn-confirm-ok");
    this.btnCancel = document.getElementById("btn-confirm-cancel");
  }
}
