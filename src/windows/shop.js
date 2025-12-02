import { Window_Selectable } from "./selectable.js";
import { UI } from "./builder.js";
import { createInteractiveLabel } from "./utils.js";

/**
 * @class Window_Shop
 */
export class Window_Shop extends Window_Selectable {
  constructor() {
    super('center', 'center', 420, 360, { title: "Shop – Stillnight", id: "shop-window" });

    // 1. Structure
    const structure = {
        type: 'flex',
        props: {
            className: 'window-panel',
            style: { flexGrow: '1', display: 'flex', flexDirection: 'column' }
        },
        children: [
            {
                type: 'flex', // Tab Nav
                props: { className: 'tab-nav' },
                children: [
                    { type: 'button', props: { className: 'tab-btn active', label: 'Buy', onClick: () => this.callHandler('mode_buy') } },
                    { type: 'button', props: { className: 'tab-btn', label: 'Sell', onClick: () => this.callHandler('mode_sell') } }
                ]
            },
            {
                type: 'flex', // Gold Row
                props: { className: 'window-row' },
                children: [
                    { type: 'label', props: { text: 'Current gold: ' } },
                    { type: 'label', props: { className: 'shop-gold' } }
                ]
            },
            {
                type: 'panel', // List Container
                props: {
                    style: { flex: '1', overflowY: 'auto' }
                }
            },
            {
                type: 'label', // Message
                props: {
                    className: 'window-row',
                    style: { marginTop: '6px', fontSize: '10px' }
                }
            }
        ]
    };

    const shopBody = UI.build(this.content, structure);

    // 2. Cache Elements
    this.btnBuy = shopBody.children[0].children[0];
    this.btnSell = shopBody.children[0].children[1];
    this.goldLabelEl = shopBody.children[1].children[1];
    this.listContainer = shopBody.children[2];
    this.messageEl = shopBody.children[3];

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
        UI.build(this.listContainer, {
            type: 'label',
            props: {
                text: this.mode === 'buy' ? "No items for sale." : "Nothing to sell.",
                style: { padding: '4px', display: 'block' }
            }
        });
        return;
    }

    this._data.forEach((tpl, index) => {
      let price = tpl.cost;
      if (this.mode === 'sell') {
          price = Math.floor(tpl.cost / 2);
      }

      const isBuyMode = this.mode === 'buy';
      const isDisabled = isBuyMode && price > this.gold;

      const rowStructure = {
          type: 'flex',
          props: {
              className: 'window-row',
              dataset: { index: index },
              align: 'center'
          },
          children: [
              {
                  type: 'panel', // Wrapper for label
                  props: { className: 'shop-item-label', style: { flex: '1' } }
              },
              {
                  type: 'label',
                  props: { text: ` (${price}G)`, style: { marginRight: '8px' } }
              },
              {
                  type: 'button',
                  props: {
                      className: 'win-btn',
                      label: isBuyMode ? 'Buy' : 'Sell',
                      disabled: isDisabled,
                      dataset: { action: isBuyMode ? 'buy' : 'sell' }
                  }
              }
          ]
      };

      const row = UI.build(this.listContainer, rowStructure);
      const labelContainer = row.children[0];

      // Insert interactive label
      const label = createInteractiveLabel(tpl, 'item');
      labelContainer.appendChild(label);
    });
  }
}
