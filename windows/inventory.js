import { Window_Selectable } from "./selectable.js";
import { createInteractiveLabel } from "./utils.js";

/**
 * @class Window_Inventory
 */
export class Window_Inventory extends Window_Selectable {
  constructor() {
    super('center', 'center', 400, 300, { title: "Inventory", id: "inventory-window" });

    this.content.style.overflowY = "auto";

    this.currentTab = 'consumable';

    this.tabNav = document.createElement("div");
    this.tabNav.className = "tab-nav";
    this.content.appendChild(this.tabNav);

    this.btnTabConsumable = document.createElement("button");
    this.btnTabConsumable.className = "tab-btn active";
    this.btnTabConsumable.textContent = "Consumables";
    this.btnTabConsumable.onclick = () => this.switchTab('consumable');
    this.tabNav.appendChild(this.btnTabConsumable);

    this.btnTabEquipment = document.createElement("button");
    this.btnTabEquipment.className = "tab-btn";
    this.btnTabEquipment.textContent = "Equipment";
    this.btnTabEquipment.onclick = () => this.switchTab('equipment');
    this.tabNav.appendChild(this.btnTabEquipment);

    this.listEl = document.createElement("div");
    this.listEl.style.flex = "1";
    this.content.appendChild(this.listEl);

    this.emptyMsgEl = document.createElement("p");
    this.emptyMsgEl.textContent = "Your inventory is empty.";
    this.emptyMsgEl.style.textAlign = "center";
    this.emptyMsgEl.style.display = "none";
    this.content.appendChild(this.emptyMsgEl);

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
        const row = document.createElement("div");
        row.className = "window-row";
        row.style.borderBottom = "1px solid var(--bezel-shadow)";
        row.style.paddingBottom = "2px";
        row.dataset.index = idx;

        let tooltipText = item.description;
        let effectsText = "";
        const effects = [];
        if (item.effects) {
             if (item.effects.hp) effects.push(`Restores ${item.effects.hp} HP`);
             if (item.effects.maxHp) effects.push(`Max HP +${item.effects.maxHp}`);
             if (item.effects.xp) effects.push(`Grants ${item.effects.xp} XP`);
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

        const label = createInteractiveLabel(item, 'item', { tooltipText });
        label.style.flexGrow = "1";
        row.appendChild(label);

        const btns = document.createElement("div");
        const useBtn = document.createElement("button");
        useBtn.className = "win-btn";
        useBtn.textContent = this.currentTab === 'equipment' ? "Equip" : "Use";
        useBtn.dataset.action = this.currentTab === 'equipment' ? "equip" : "use";

        const discardBtn = document.createElement("button");
        discardBtn.className = "win-btn";
        discardBtn.textContent = "Discard";
        discardBtn.dataset.action = "discard";

        btns.appendChild(useBtn);
        btns.appendChild(discardBtn);

        row.appendChild(btns);
        this.listEl.appendChild(row);
      });
    }
  }

}
