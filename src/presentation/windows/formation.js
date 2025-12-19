import { Window_Base } from "./base.js";
import { createPartySlot, createReserveSlot, createCommanderSlot } from "./utils.js";
import { SoundManager } from "../../managers/index.js";

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

    this.commanderSlotContainer = document.createElement('div');
    this.commanderSlotContainer.style.marginBottom = '4px';
    formationBody.appendChild(this.commanderSlotContainer);

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
    this.onSwapAttempt = null;
    this.context = null;
  }

  refresh(partyView, onChange, onSwapAttempt = null) {
      this.partyView = partyView;
      if (onChange) this.onChange = onChange;
      this.onSwapAttempt = onSwapAttempt;
      this.selectedSlotIndex = null;
      this.renderFormationGrid();
  }

  renderFormationGrid() {
    this.gridEl.innerHTML = "";
    this.reserveGridEl.innerHTML = "";
    this.commanderSlotContainer.innerHTML = "";

    if (!this.partyView || !this.partyView.slots) return;

    this.partyView.slots.forEach((memberView, index) => {
      // Special handling for Slot 4 (Summoner)
      if (index === 4) {
          if (memberView) {
              const cSlot = createCommanderSlot(memberView, {
                  onClick: () => SoundManager.play('UI_ERROR') // Non-interactible
              });
              cSlot.style.cursor = 'default';
              this.commanderSlotContainer.appendChild(cSlot);
          }
          return;
      }

      const isReserve = index >= 5; // 5 and above are reserve
      const options = {
          onClick: this.onSlotClick.bind(this),
          evolutionStatus: memberView ? memberView.evolutionStatus : undefined
      };

      let slot;
      if (isReserve) {
          slot = createReserveSlot(memberView, index, options);
      } else {
          slot = createPartySlot(memberView, index, options);
      }

      if (this.selectedSlotIndex === index) {
          slot.classList.add('selected');
      }

      if (index < 4) {
        this.gridEl.appendChild(slot);
      } else if (index >= 5) {
        this.reserveGridEl.appendChild(slot);
      }
    });
  }

  onSlotClick(battler, index) {
      if (this.selectedSlotIndex === null) {
          this.selectedSlotIndex = index;
      } else {
          if (this.selectedSlotIndex !== index) {
              if (this.onSwapAttempt) {
                  // Delegate swap logic to callback
                  this.onSwapAttempt(this.selectedSlotIndex, index);
                  // Selection clears after attempt regardless of outcome usually, but can be controlled by Scene
                  this.selectedSlotIndex = null;
              } else {
                  // Default immediate swap
                  if (this.party.reorderMembers(this.selectedSlotIndex, index)) {
                      SoundManager.play('UI_SELECT');
                      if (this.onChange) this.onChange();
                  }
                  this.selectedSlotIndex = null;
              }
          } else {
             // Deselect if same slot clicked
             this.selectedSlotIndex = null;
          }
      }
      this.renderFormationGrid();
  }
}
