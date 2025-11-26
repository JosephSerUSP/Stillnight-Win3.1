/**
 * @class Window_Base
 * @description The base class for all windows.
 */
class Window_Base {
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
 * @class Window_Battle
 * @description The window for battles.
 * @extends Window_Base
 */
export class Window_Battle extends Window_Base {
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
 * @class Window_Inspect
 * @description The window for inspecting creatures.
 * @extends Window_Base
 */
export class Window_Inspect extends Window_Base {
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
 * @extends Window_Base
 */
export class Window_Shop extends Window_Base {
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
 * @extends Window_Base
 */
export class Window_Formation extends Window_Base {
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
 * @extends Window_Base
 */
export class Window_Inventory extends Window_Base {
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
 * @extends Window_Base
 */
export class Window_Recruit extends Window_Base {
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
 * @extends Window_Base
 */
export class Window_Event extends Window_Base {
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
 * @extends Window_Base
 */
export class Window_Confirm extends Window_Base {
  constructor() {
    super("confirm-overlay");
    this.titleEl = document.getElementById("confirm-title");
    this.messageEl = document.getElementById("confirm-message");
    this.btnOk = document.getElementById("btn-confirm-ok");
    this.btnCancel = document.getElementById("btn-confirm-cancel");
  }
}
