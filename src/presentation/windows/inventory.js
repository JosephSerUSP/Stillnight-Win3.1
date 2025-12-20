import { Window_Selectable } from "./selectable.js";
import { UI } from "./builder.js";
import { createInteractiveLabel } from "./utils.js";

/**
 * @class Window_Inventory
 */
export class Window_Inventory extends Window_Selectable {
  constructor() {
    super('center', 'center', 400, 300, { title: "Inventory", id: "inventory-window" });

    this.content.style.overflowY = "auto";
    this.currentTab = 'consumable';
    this.items = []; // List of item view models

    // 1. Structure
    const structure = {
        type: 'flex',
        props: {
            style: { flexDirection: 'column', flex: '1' }
        },
        children: [
            {
                type: 'flex', // Tab Nav
                props: { className: 'tab-nav' },
                children: [
                    { type: 'button', props: { className: 'tab-btn active', label: 'Consumables', onClick: () => this.switchTab('consumable') } },
                    { type: 'button', props: { className: 'tab-btn', label: 'Equipment', onClick: () => this.switchTab('equipment') } }
                ]
            },
            {
                type: 'panel', // List Container
                props: { style: { flex: '1' } }
            },
            {
                type: 'label', // Empty Msg
                props: {
                    text: "Your inventory is empty.",
                    style: { textAlign: 'center', display: 'none' }
                }
            }
        ]
    };

    const body = UI.build(this.content, structure);

    // 2. Cache
    this.btnTabConsumable = body.children[0].children[0];
    this.btnTabEquipment = body.children[0].children[1];
    this.listEl = body.children[1];
    this.emptyMsgEl = body.children[2];

    this.btnClose2 = this.addButton("Close", () => this.onUserClose());

    this.onAction = null;
    this.onDiscard = null;
  }

  // Accepts list of item view models
  setup(items, onAction, onDiscard) {
    this.items = items;
    this.onAction = onAction;
    this.onDiscard = onDiscard;

    this.setHandler('use', (itemSource) => {
        if (this.onAction) this.onAction(itemSource, 'use');
    });
    this.setHandler('equip', (itemSource) => {
        if (this.onAction) this.onAction(itemSource, 'equip');
    });
    this.setHandler('discard', (itemSource) => {
        if (this.onDiscard) this.onDiscard(itemSource);
    });

    this.updateList();
  }

  // Called when inventory changes without full setup?
  // Ideally scene calls setup again. But we can expose updateItems(items).
  updateItems(items) {
      this.items = items;
      this.updateList();
  }

  switchTab(tab) {
      this.currentTab = tab;
      this.btnTabConsumable.classList.toggle('active', tab === 'consumable');
      this.btnTabEquipment.classList.toggle('active', tab === 'equipment');
      this.updateList();
  }

  updateList() {
    let filtered = this.items;
    if (this.currentTab === 'consumable') {
        filtered = filtered.filter(i => i.type !== 'equipment');
    } else {
        filtered = filtered.filter(i => i.type === 'equipment');
    }
    this.setData(filtered);
  }

  refresh() {
    this.listEl.innerHTML = "";
    if (!this._data || this._data.length === 0) {
      this.emptyMsgEl.style.display = "block";
      this.emptyMsgEl.textContent = this.currentTab === 'consumable' ? "No consumables." : "No equipment.";
    } else {
      this.emptyMsgEl.style.display = "none";
      this._data.forEach((itemView, idx) => {
        const rowStructure = {
            type: 'flex',
            props: {
                className: 'window-row',
                dataset: { index: idx },
                style: {
                    borderBottom: '1px solid var(--bezel-shadow)',
                    paddingBottom: '2px',
                    alignItems: 'center'
                }
            },
            children: [
                {
                    type: 'panel', // Label Wrapper
                    props: { style: { flexGrow: '1', display: 'flex', alignItems: 'center' } }
                },
                {
                    type: 'flex', // Buttons
                    props: { gap: '4px' },
                    children: [
                        {
                            type: 'button',
                            props: {
                                className: 'win-btn',
                                label: this.currentTab === 'equipment' ? 'Equip' : 'Use',
                                dataset: { action: this.currentTab === 'equipment' ? 'equip' : 'use' }
                            }
                        },
                        {
                            type: 'button',
                            props: {
                                className: 'win-btn',
                                label: 'Discard',
                                dataset: { action: 'discard' }
                            }
                        }
                    ]
                }
            ]
        };

        const row = UI.build(this.listEl, rowStructure);
        const labelWrapper = row.children[0];

        const label = createInteractiveLabel(itemView, 'item', {
            tooltipText: itemView.tooltip
        });
        label.style.display = 'inline-flex';
        labelWrapper.appendChild(label);

        // Wire up buttons
        const buttons = row.children[1];
        const btnAction = buttons.children[0];
        const btnDiscard = buttons.children[1];

        if (itemView.type === 'quest') {
            btnAction.textContent = 'Story';
            btnAction.disabled = true;
            btnDiscard.disabled = true;
        }

        btnAction.onclick = () => {
            const action = this.currentTab === 'equipment' ? 'equip' : 'use';
            this.callHandler(action, idx);
        };

        btnDiscard.onclick = () => {
            this.callHandler('discard', idx);
        };
      });
    }
  }

  callHandler(action, index) {
      const item = this._data[index];
      if (!item) return;
      const handler = this._handlers[action];
      if (handler) {
          // Pass source if available, otherwise item (view)
          handler(item.source || item);
      }
  }
}
