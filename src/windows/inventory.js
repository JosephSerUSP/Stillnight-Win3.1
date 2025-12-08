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

    this.party = null;
    this.onAction = null;
    this.onDiscard = null;
  }

  setup(party, onAction, onDiscard) {
    this.party = party;
    this.onAction = onAction;
    this.onDiscard = onDiscard;

    this.setHandler('use', (item) => {
        if (this.onAction) this.onAction(item, 'use');
    });
    this.setHandler('equip', (item) => {
        if (this.onAction) this.onAction(item, 'equip');
    });
    this.setHandler('discard', (item) => {
        if (this.onDiscard) this.onDiscard(item);
    });

    this.updateList();
  }

  switchTab(tab) {
      this.currentTab = tab;
      this.btnTabConsumable.classList.toggle('active', tab === 'consumable');
      this.btnTabEquipment.classList.toggle('active', tab === 'equipment');
      this.updateList();
  }

  updateList() {
    let inventory = this.party.inventory;
    if (this.currentTab === 'consumable') {
        inventory = inventory.filter(i => i.type !== 'equipment');
    } else {
        inventory = inventory.filter(i => i.type === 'equipment');
    }
    this.setData(inventory);
  }

  refresh() {
    this.listEl.innerHTML = "";
    if (!this._data || this._data.length === 0) {
      this.emptyMsgEl.style.display = "block";
      this.emptyMsgEl.textContent = this.currentTab === 'consumable' ? "No consumables." : "No equipment.";
    } else {
      this.emptyMsgEl.style.display = "none";
      this._data.forEach((item, idx) => {

        let tooltipText = item.description;
        let effectsText = "";
        const effects = [];
        if (item.effects) {
             item.effects.forEach(e => {
                 const val = e.formula || e.value;
                 if (e.type === 'hp') effects.push(`Restores ${val} HP`);
                 if (e.type === 'maxHp') effects.push(`Max HP +${val}`);
                 if (e.type === 'xp') effects.push(`Grants ${val} XP`);
             });
        }
        if (item.traits) {
             item.traits.forEach(t => {
                 if (t.code === 'PARAM_PLUS') {
                     if (t.dataId === 'atk') effects.push(`Damage +${t.value}`);
                     if (t.dataId === 'maxHp') effects.push(`Max HP +${t.value}`);
                 }
             });
        }
        if (item.damageBonus) effects.push(`Damage +${item.damageBonus}`);

        if (effects.length > 0) effectsText = effects.join(", ");
        if (effectsText) tooltipText += `<br/><span class="text-functional" style="font-size: 0.9em;">${effectsText}</span>`;

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

        const label = createInteractiveLabel(item, 'item', { tooltipText });
        // Ensure the label component is inline-flex to align nicely
        label.style.display = 'inline-flex';
        labelWrapper.appendChild(label);
      });
    }
  }
}
