import { Window_Selectable } from "./selectable.js";
import { createPartySlot, createReserveSlot, createCommanderSlot } from "./utils.js";

/**
 * @class Window_PartySelect
 */
export class Window_PartySelect extends Window_Selectable {
    constructor() {
    super('center', 'center', 300, 480, { title: "Select Target", id: "party-select-window" });
        const body = this.createPanel();
        body.style.flexGrow = "1";
        body.style.overflowY = "auto";

        this.msgEl = document.createElement("div");
        this.msgEl.style.marginBottom = "6px";
        this.msgEl.style.textAlign = "center";
        body.appendChild(this.msgEl);

        this.gridEl = document.createElement('div');
        this.gridEl.style.display = 'grid';
        this.gridEl.style.gridTemplateColumns = 'repeat(2, 1fr)';
        this.gridEl.style.gap = '4px';
        body.appendChild(this.gridEl);

        this.btnCancel = this.addButton("Cancel", () => this.onUserClose());
    }

    setup(party, message, onSelect, context = null) {
        this.party = party;
        this.context = context;
        this.onSelect = onSelect;
        this.msgEl.textContent = message;
        this.refresh();
    }

    refresh() {
        this.gridEl.innerHTML = "";
        if (!this.party) return;
        this.party.members.forEach((m) => {
            const realIndex = this.party.slots.indexOf(m);
            let evolutionStatus = null;
            if (this.context) {
                const statusObj = m.getEvolutionStatus(this.context.inventory, this.context.floorDepth, this.context.gold);
                if (statusObj.status !== 'NONE') {
                    evolutionStatus = statusObj.status;
                }
            }

            const options = {
                onClick: (member) => {
                    if (this.onSelect) this.onSelect(member);
                },
                evolutionStatus: evolutionStatus
            };

            let slot;
            if (realIndex === 4) {
                slot = createCommanderSlot(m, options);
                // Commander slot is usually wide. In a grid of 2, it might fit in one cell but look squished,
                // or we can make it span 2 columns if grid layout allows.
                // But the grid is set to repeat(2, 1fr).
                // Let's set it to span 2 columns to look nice.
                slot.style.gridColumn = "span 2";
            } else if (realIndex > 4) { // Reserve
                slot = createReserveSlot(m, realIndex, options);
            } else { // Active Party
                slot = createPartySlot(m, realIndex, options);
            }
            this.gridEl.appendChild(slot);
        });
    }
}
