import { Window_Base } from "./base.js";
import { renderCreatureInfo, createInteractiveLabel } from "./utils.js";
import { evaluateFormula } from "../../core/utils.js";
import { TRAIT_DEFINITIONS } from "../../../data/traits.js";
import { EffectAdapter } from "../../adapters/effect_adapter.js";

/**
 * @class Window_Confirm
 */
export class Window_Confirm extends Window_Base {
  constructor() {
    super('center', 'center', 320, 'auto', { title: "Confirm", id: "confirm-window" });

    this.messageEl = document.createElement('div');
    this.messageEl.style.marginBottom = '8px';
    this.content.appendChild(this.messageEl);

    this.btnOk = this.addButton("OK", () => {});
    this.btnCancel = this.addButton("Cancel", () => this.onUserClose());
  }
}

/**
 * @class Window_ConfirmEffect
 * @description Replaces Window_EquipConfirm to handle both item usage and equipment changes with effect previews.
 */
export class Window_ConfirmEffect extends Window_Base {
    constructor() {
        super('center', 'center', 500, 420, { title: "Confirm Effect", id: "confirm-effect-window" });

        this.infoPanel = this.createPanel();
        this.infoPanel.style.marginBottom = "8px";

        this.changePanel = document.createElement("div");
        this.changePanel.className = "group-box";
        this.changePanel.style.padding = "10px";
        this.content.appendChild(this.changePanel);

        const leg = document.createElement("legend");
        leg.textContent = "Changes";
        this.changePanel.appendChild(leg);

        this.slotChangeEl = document.createElement("div");
        this.slotChangeEl.style.marginBottom = "8px";
        this.slotChangeEl.style.fontWeight = "bold";
        this.slotChangeEl.style.display = "flex";
        this.slotChangeEl.style.alignItems = "center";
        this.changePanel.appendChild(this.slotChangeEl);

        this.traitListEl = document.createElement("div");
        this.traitListEl.style.fontSize = "10px";
        this.traitListEl.style.whiteSpace = "pre-wrap";
        this.changePanel.appendChild(this.traitListEl);

        this.btnConfirm = this.addButton("Confirm", () => {});
        this.btnCancel = this.addButton("Cancel", () => this.onUserClose());
    }

    setupEquip(member, newItem, oldItem, slotName, onConfirm, swapMessage) {
        this.setTitle(newItem ? "Equip Item" : "Unequip Item");
        renderCreatureInfo(this.infoPanel, member);

        this.slotChangeEl.innerHTML = "";
        const arrow = document.createElement("span");
        arrow.textContent = " ➔ ";
        arrow.style.margin = "0 8px";

        const createItemSpan = (item) => {
             const span = document.createElement("span");
             span.style.display = "inline-flex";
             span.style.alignItems = "center";
             if (item) {
                 span.appendChild(createInteractiveLabel(item, 'item', { showTooltip: true }));
             } else {
                 span.textContent = "None";
                 span.style.color = "#808080";
             }
             return span;
        };

        const slotLabel = document.createElement("span");
        slotLabel.textContent = slotName + ": ";
        this.slotChangeEl.appendChild(slotLabel);
        this.slotChangeEl.appendChild(createItemSpan(oldItem));
        this.slotChangeEl.appendChild(arrow);
        this.slotChangeEl.appendChild(createItemSpan(newItem));

        this.traitListEl.innerHTML = "";
        if (swapMessage) {
            const msg = document.createElement("div");
            msg.textContent = swapMessage;
            msg.style.color = "var(--text-highlight)";
            msg.style.marginBottom = "4px";
            this.traitListEl.appendChild(msg);
        }

        const diffs = this.calculateDiff(member, newItem, oldItem);
        diffs.forEach(diff => {
            const div = document.createElement("div");
            div.textContent = diff;
            this.traitListEl.appendChild(div);
        });

        this.btnConfirm.onclick = onConfirm;
    }

    setupUse(member, item, onConfirm) {
        this.setTitle("Use Item");
        renderCreatureInfo(this.infoPanel, member);

        this.slotChangeEl.innerHTML = "";
        const label = document.createElement("span");
        label.textContent = "Using: ";
        this.slotChangeEl.appendChild(label);
        this.slotChangeEl.appendChild(createInteractiveLabel(item, 'item', { showTooltip: true }));

        this.traitListEl.innerHTML = "";
        const changes = this.calculateUseDiff(member, item);
        if (changes.length === 0) {
            this.traitListEl.textContent = "No visible effect.";
        } else {
            changes.forEach(c => {
                const div = document.createElement("div");
                div.textContent = c;
                this.traitListEl.appendChild(div);
            });
        }

        this.btnConfirm.onclick = onConfirm;
    }

    calculateUseDiff(member, item) {
        const changes = [];
        if (!item.effects) return changes;

        item.effects.forEach(effect => {
            const key = effect.type;
            const value = effect.formula || effect.value;
            // EffectSystem expects (key, value, target, source)
            // member is target. source is implicit/unknown here (could be null).
            const preview = EffectAdapter.getPreview(key, value, member, null);
            if (preview) {
                changes.push(preview);
            }
        });

        return changes;
    }

    calculateDiff(member, newItem, oldItem) {
        const diffs = [];
        const oldTraits = oldItem ? (oldItem.traits || []) : [];
        const newTraits = newItem ? (newItem.traits || []) : [];

        // Group by Label
        const changes = {}; // Label -> { oldVals: [], newVals: [] }

        const process = (traits, type) => {
            traits.forEach(t => {
                const def = TRAIT_DEFINITIONS[t.code];
                if (!def) return;
                const label = def.label ? def.label(t.dataId) : t.code;

                if (!changes[label]) changes[label] = { oldVals: [], newVals: [] };
                if (!changes[label][type]) changes[label][type] = [];
                changes[label][type].push(t);
            });
        };

        process(oldTraits, 'oldVals');
        process(newTraits, 'newVals');

        Object.keys(changes).sort().forEach(label => {
             const data = changes[label];
             const rep = data.oldVals[0] || data.newVals[0];
             const def = TRAIT_DEFINITIONS[rep.code];

             // Check if we can sum/multiply
             const isNumeric = data.oldVals.every(t => typeof t.value === 'number') &&
                               data.newVals.every(t => typeof t.value === 'number');

             if (isNumeric && (data.oldVals.length + data.newVals.length > 0)) {
                 let oldVal, newVal;

                 if (def.combine === 'multiply') {
                     // Multiplicative
                     oldVal = data.oldVals.reduce((acc, t) => acc * t.value, 1.0);
                     newVal = data.newVals.reduce((acc, t) => acc * t.value, 1.0);
                 } else {
                     // Additive (Default)
                     oldVal = data.oldVals.reduce((acc, t) => acc + t.value, 0);
                     newVal = data.newVals.reduce((acc, t) => acc + t.value, 0);
                 }

                 const oldStr = def.format(oldVal, rep.dataId);
                 const newStr = def.format(newVal, rep.dataId);

                 // Compare with tolerance for floats
                 if (Math.abs(oldVal - newVal) > 0.0001) {
                     // Determine "empty" state.
                     // For Additive, 0 is empty.
                     // For Multiplicative, 1 is empty.
                     const oldIsEmpty = (def.combine === 'multiply' && oldVal === 1.0) || (!def.combine && oldVal === 0);
                     const newIsEmpty = (def.combine === 'multiply' && newVal === 1.0) || (!def.combine && newVal === 0);

                     if (oldIsEmpty) {
                         diffs.push(`${label}: ${newStr}`); // New
                     } else if (newIsEmpty) {
                         diffs.push(`${label}: ${oldStr} (Removed)`); // Removed
                     } else {
                         diffs.push(`${label}: ${oldStr} -> ${newStr}`); // Changed
                     }
                 }
             } else {
                 // Qualitative
                 const fmt = (t) => {
                     const d = TRAIT_DEFINITIONS[t.code];
                     return d.format(t.value, t.dataId);
                 };

                 const oldStrs = data.oldVals.map(fmt).sort().join(", ");
                 const newStrs = data.newVals.map(fmt).sort().join(", ");

                 if (oldStrs !== newStrs) {
                     if (!oldStrs) diffs.push(`${label}: ${newStrs}`);
                     else if (!newStrs) diffs.push(`${label}: ${oldStrs} (Removed)`);
                     else diffs.push(`${label}: ${oldStrs} -> ${newStrs}`);
                 }
             }
        });

        if (diffs.length === 0) {
            diffs.push("No changes.");
        }
        return diffs;
    }
}
