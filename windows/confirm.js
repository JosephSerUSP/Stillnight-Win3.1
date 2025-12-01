import { Window_Base } from "./base.js";
import { renderCreatureInfo, createInteractiveLabel } from "./utils.js";
import { evaluateFormula } from "../core.js";

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

        const getVal = (effVal) => {
            if (typeof effVal === 'string') {
                return Math.round(evaluateFormula(effVal, member));
            }
            return effVal;
        };

        // HP
        if (item.effects.hp) {
            const val = getVal(item.effects.hp);
            const newHp = Math.min(member.maxHp, member.hp + val);
            if (newHp !== member.hp) {
                changes.push(`HP: ${member.hp}/${member.maxHp} -> ${newHp}/${member.maxHp}`);
            }
        }
        // Max HP
        if (item.effects.maxHp) {
            const val = getVal(item.effects.maxHp);
            const newMax = member.maxHp + val;
            changes.push(`Max HP: ${member.maxHp} -> ${newMax}`);
        }
        // XP
        if (item.effects.xp) {
            const val = getVal(item.effects.xp);
            // Simplified, doesn't predict level up exactly but shows XP gain
            changes.push(`XP: +${val}`);
        }

        return changes;
    }

    calculateDiff(member, newItem, oldItem) {
        const diffs = [];
        const oldTraits = oldItem ? (oldItem.traits || []) : [];
        const newTraits = newItem ? (newItem.traits || []) : [];

        const getTraitVal = (traits, code, dataId) => {
             return traits.filter(t => t.code === code && t.dataId === dataId)
                          .reduce((sum, t) => sum + t.value, 0);
        };

        const checkParamDynamic = (name, getterProp, code, dataId) => {
             const oldVal = getTraitVal(oldTraits, code, dataId);
             const newVal = getTraitVal(newTraits, code, dataId);
             if (oldVal !== newVal) {
                 const currentTotal = member[getterProp];
                 const newTotal = currentTotal - oldVal + newVal;
                 const sign = newTotal > currentTotal ? "+" : "";
                 const change = newTotal - currentTotal;
                 diffs.push(`${name}: ${sign}${change} (${currentTotal} -> ${newTotal})`);
             }
        };

        checkParamDynamic("Max HP", "maxHp", "PARAM_PLUS", "maxHp");
        checkParamDynamic("Atk", "atk", "PARAM_PLUS", "atk");

        const oldDmg = oldItem ? (oldItem.damageBonus || 0) : 0;
        const newDmg = newItem ? (newItem.damageBonus || 0) : 0;
        if (oldDmg !== newDmg) {
             diffs.push(`Damage Bonus: ${newDmg > oldDmg ? "+" : ""}${newDmg - oldDmg}`);
        }

        if (diffs.length === 0) {
            diffs.push("No stat changes.");
        }
        return diffs;
    }
}
