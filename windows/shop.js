import { Window_Selectable } from "./selectable.js";
import { createInteractiveLabel } from "./utils.js";

/**
 * @class Window_Shop
 */
export class Window_Shop extends Window_Selectable {
  constructor() {
    super('center', 'center', 420, 360, { title: "Shop – Stillnight", id: "shop-window" });

    const shopBody = this.createPanel();
    shopBody.style.flexGrow = "1";

    this.tabNav = document.createElement("div");
    this.tabNav.className = "tab-nav";

    this.btnBuy = document.createElement("button");
    this.btnBuy.className = "tab-btn active";
    this.btnBuy.textContent = "Buy";
    this.btnBuy.onclick = () => this.callHandler('mode_buy');
    this.tabNav.appendChild(this.btnBuy);

    this.btnSell = document.createElement("button");
    this.btnSell.className = "tab-btn";
    this.btnSell.textContent = "Sell";
    this.btnSell.onclick = () => this.callHandler('mode_sell');
    this.tabNav.appendChild(this.btnSell);

    shopBody.appendChild(this.tabNav);

    const goldRow = document.createElement('div');
    goldRow.className = 'window-row';
    goldRow.textContent = 'Current gold: ';
    this.goldLabelEl = document.createElement('span');
    this.goldLabelEl.className = 'shop-gold';
    goldRow.appendChild(this.goldLabelEl);
    shopBody.appendChild(goldRow);

    this.listContainer = document.createElement('div');
    this.listContainer.style.flex = "1";
    this.listContainer.style.overflowY = "auto";
    shopBody.appendChild(this.listContainer);

    this.messageEl = document.createElement('div');
    this.messageEl.className = 'window-row';
    this.messageEl.style.marginTop = '6px';
    this.messageEl.style.fontSize = '10px';
    shopBody.appendChild(this.messageEl);

    this.btnLeave = this.addButton("Leave", () => {});

    this.mode = 'buy';
  }

  setMode(mode) {
      this.mode = mode;
      this.btnBuy.classList.toggle('active', mode === 'buy');
      this.btnSell.classList.toggle('active', mode === 'sell');
  }

  setupBuy(gold, message, items, buyCallback) {
    this.setMode('buy');
    this.gold = gold;
    this.goldLabelEl.textContent = `${gold}G`;
    this.messageEl.textContent = message;

    this.setHandler('buy', (item) => {
        if (item.cost > this.gold) return;
        if (buyCallback) buyCallback(item.id);
    });

    this.setData(items);
  }

  setupSell(gold, inventory, sellCallback) {
      this.setMode('sell');
      this.gold = gold;
      this.goldLabelEl.textContent = `${gold}G`;
      this.messageEl.textContent = "Select an item to sell.";

      this.setHandler('sell', (item) => {
          if (sellCallback) sellCallback(item);
      });

      this.setData(inventory);
  }

  refresh() {
    this.listContainer.innerHTML = "";
    if (this._data.length === 0) {
        const p = document.createElement("div");
        p.textContent = this.mode === 'buy' ? "No items for sale." : "Nothing to sell.";
        p.style.padding = "4px";
        this.listContainer.appendChild(p);
        return;
    }

    this._data.forEach((tpl, index) => {
      const row = document.createElement("div");
      row.className = "window-row";
      row.dataset.index = index;

      const label = createInteractiveLabel(tpl, 'item');
      row.appendChild(label);

      let price = tpl.cost;
      if (this.mode === 'sell') {
          price = Math.floor(tpl.cost / 2);
      }

      const costSpan = document.createElement("span");
      costSpan.textContent = ` (${price}G)`;
      costSpan.style.marginRight = "auto";
      row.appendChild(costSpan);

      const btn = document.createElement("button");
      btn.className = "win-btn";

      if (this.mode === 'buy') {
          btn.textContent = "Buy";
          btn.dataset.action = "buy";
          if (price > this.gold) {
              btn.disabled = true;
              btn.classList.add("disabled");
          }
      } else {
          btn.textContent = "Sell";
          btn.dataset.action = "sell";
      }

      row.appendChild(btn);

      this.listContainer.appendChild(row);
    });
  }
}
