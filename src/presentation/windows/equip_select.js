import { Window_Selectable } from "./selectable.js";
import { createInteractiveLabel } from "./utils.js";

/**
 * @class Window_EquipItemSelect
 */
export class Window_EquipItemSelect extends Window_Selectable {
    constructor() {
        super('center', 'center', 420, 320, { title: "Select Equipment", id: "equip-select-window" });
        const body = this.createPanel();
        body.style.flexGrow = "1";
        this.listContainer = document.createElement('div');
        this.listContainer.style.overflowY = "auto";
        this.listContainer.style.flex = "1";
        body.appendChild(this.listContainer);
        this.btnCancel = this.addButton("Cancel", () => this.onUserClose());
    }

    setup(items, currentItem, slotName, onSelect) {
        this.currentItem = currentItem;
        this.slotName = slotName;
        this.setHandler('select', (item) => {
            if (onSelect) onSelect(item);
        });
        this.setData(items);
    }

    refresh() {
        this.listContainer.innerHTML = "";

        // Unequip Row
        const unequipRow = document.createElement("div");
        unequipRow.className = "window-row";
        unequipRow.style.borderBottom = "1px solid var(--bezel-shadow)";
        unequipRow.dataset.index = -1;

        const unequipLabel = document.createElement("span");
        unequipLabel.textContent = "Unequip";
        unequipLabel.style.flexGrow = "1";
        unequipLabel.style.paddingLeft = "20px"; // Align roughly with items that have icons
        unequipRow.appendChild(unequipLabel);

        const unequipBtns = document.createElement("div");
        const unequipBtn = document.createElement("button");
        unequipBtn.className = "win-btn";
        unequipBtn.textContent = "Unequip";
        unequipBtn.onclick = (e) => {
             e.stopPropagation();
             this.callHandler('select', null);
        };
        unequipBtns.appendChild(unequipBtn);
        unequipRow.appendChild(unequipBtns);
        this.listContainer.appendChild(unequipRow);

        if (this._data.length === 0) {
            const p = document.createElement("p");
            p.textContent = "No equipable items found.";
            p.style.textAlign = "center";
            p.style.padding = "10px";
            this.listContainer.appendChild(p);
            return;
        }

        this._data.forEach((item, index) => {
            const row = document.createElement("div");
            row.className = "window-row";
            row.dataset.index = index;
            row.style.borderBottom = "1px solid var(--bezel-shadow)";
            row.style.paddingBottom = "2px";

            if (this.currentItem && item.id === this.currentItem.id) {
                row.style.backgroundColor = "var(--bezel-light)";
            }

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

            const label = createInteractiveLabel(item, 'item', { tooltipText });
            label.style.flexGrow = "1";
            row.appendChild(label);

            if (item.equippedBy) {
                const extra = document.createElement("span");
                extra.textContent = `(on ${item.equippedBy})`;
                extra.style.fontSize = "10px";
                extra.style.marginRight = "4px";
                row.appendChild(extra);
            }

            const btns = document.createElement("div");
            const equipBtn = document.createElement("button");
            equipBtn.className = "win-btn";
            equipBtn.textContent = "Equip";
            equipBtn.dataset.action = "select";

            btns.appendChild(equipBtn);
            row.appendChild(btns);

            this.listContainer.appendChild(row);
        });
    }
}
