import { Window_Base } from "./base.js";
import { createPartySlot, createReserveSlot } from "./utils.js";
import { SoundManager } from "../managers.js";

/**
 * @class Window_Formation
 */
export class Window_Formation extends Window_Base {
  constructor() {
    super('center', 'center', 300, 480, { title: "Formation – Stillnight", id: "formation-window" });

    const formationBody = this.createPanel();
    formationBody.style.flexGrow = "1";
    formationBody.style.overflowY = "auto";

    const label = document.createElement('div');
    label.className = 'formation-label';
    label.textContent = 'Click a member to select, then another to swap. Active party is the first 4.';
    formationBody.appendChild(label);

    this.gridEl = document.createElement('div');
    // JS layout
    this.gridEl.style.display = 'grid';
    this.gridEl.style.gridTemplateColumns = 'repeat(2, 1fr)'; // Scaled for wider slots
    this.gridEl.style.gap = '4px';
    this.gridEl.style.marginBottom = '4px';
    formationBody.appendChild(this.gridEl);

    const reserveLabel = document.createElement('div');
    reserveLabel.className = 'formation-label';
    reserveLabel.style.marginTop = '10px';
    reserveLabel.textContent = 'Reserve';
    formationBody.appendChild(reserveLabel);

    this.reserveGridEl = document.createElement('div');
    this.reserveGridEl.style.display = 'grid';
    this.reserveGridEl.style.gridTemplateColumns = 'repeat(2, 1fr)';
    this.reserveGridEl.style.gap = '4px';
    this.reserveGridEl.style.marginBottom = '4px';
    // Removed inner scroll to match width and let parent scroll
    formationBody.appendChild(this.reserveGridEl);

    this.btnOk = this.addButton("OK", () => this.onUserClose());
    this.btnCancel = this.addButton("Cancel", () => this.onUserClose());

    this.selectedSlotIndex = null;
    this.party = null;
    this.onChange = null;
    this.context = null;
  }

  refresh(party, onChange, context = null) {
      this.party = party;
      this.context = context;
      if (onChange) this.onChange = onChange;
      this.selectedSlotIndex = null;
      this.renderFormationGrid();
  }

  renderFormationGrid() {
    this.gridEl.innerHTML = "";
    this.reserveGridEl.innerHTML = "";

    if (!this.party) return;

    this.party.slots.forEach((m, index) => {
      let evolutionStatus = null;
      if (m && this.context) {
          const statusObj = m.getEvolutionStatus(this.context.inventory, this.context.floorDepth, this.context.gold);
          if (statusObj.status !== 'NONE') {
              evolutionStatus = statusObj.status;
          }
      }

      const isReserve = index >= 4;
      const options = {
          onClick: this.onSlotClick.bind(this),
          evolutionStatus: evolutionStatus
      };

      let slot;
      if (isReserve) {
          slot = createReserveSlot(m, index, options);
      } else {
          slot = createPartySlot(m, index, options);
      }

      if (this.selectedSlotIndex === index) {
          slot.classList.add('selected');
      }

      if (index < 4) {
        this.gridEl.appendChild(slot);
      } else {
        this.reserveGridEl.appendChild(slot);
      }
    });
  }

  onSlotClick(battler, index) {
      if (this.selectedSlotIndex === null) {
          this.selectedSlotIndex = index;
      } else {
          if (this.selectedSlotIndex !== index) {
              if (this.party.reorderMembers(this.selectedSlotIndex, index)) {
                  SoundManager.beep(500, 80);
                  if (this.onChange) this.onChange();
              }
          }
          this.selectedSlotIndex = null;
      }
      this.renderFormationGrid();
  }
}
