import { Window_Base } from "./base.js";
import { createIcon } from "./utils.js";

/**
 * @class Window_Quest
 * @description Displays quest offers and details.
 */
export class Window_Quest extends Window_Base {
  constructor() {
    super('center', 'center', 520, 'auto', { title: "Quest", id: "quest-window" });

    this.bodyEl = this.createPanel();
    this.bodyEl.style.padding = "10px";
    this.bodyEl.style.minHeight = "200px";

    this.titleContainer = document.createElement("div");
    this.titleContainer.style.fontSize = "18px";
    this.titleContainer.style.fontWeight = "bold";
    this.titleContainer.style.marginBottom = "10px";
    this.titleContainer.style.borderBottom = "1px solid var(--window-border-color)";
    this.titleContainer.style.paddingBottom = "5px";
    this.bodyEl.appendChild(this.titleContainer);

    this.descEl = document.createElement("div");
    this.descEl.style.marginBottom = "15px";
    this.descEl.style.lineHeight = "1.4";
    this.bodyEl.appendChild(this.descEl);

    this.rewardsContainer = document.createElement("div");
    this.rewardsContainer.style.marginTop = "auto";
    this.rewardsContainer.style.paddingTop = "10px";
    this.rewardsContainer.style.borderTop = "1px solid var(--window-border-color)";
    this.bodyEl.appendChild(this.rewardsContainer);

    this.buttonsEl = this.footer;
  }

  /**
   * Shows a quest offer.
   * @param {Object} quest - The quest data object.
   * @param {Function} onAccept - Callback for acceptance.
   * @param {Function} onDecline - Callback for decline.
   */
  showOffer(quest, onAccept, onDecline) {
      this.titleEl.textContent = "Quest Offer";

      this.titleContainer.textContent = quest.title;
      this.descEl.innerHTML = `<strong>Given by:</strong> ${quest.giver}<br><br>${quest.description}`;

      this.rewardsContainer.innerHTML = "<strong>Rewards:</strong><br>";
      if (quest.rewards) {
          quest.rewards.forEach(r => {
              const div = document.createElement("div");
              if (r.type === 'gold') div.textContent = `- ${r.value} Gold`;
              else if (r.type === 'xp') div.textContent = `- ${r.value} XP`;
              else if (r.type === 'item') div.textContent = `- Item: ${r.id}`; // Should resolve name
              else div.textContent = `- ${r.type}`;
              this.rewardsContainer.appendChild(div);
          });
      }

      this.buttonsEl.innerHTML = "";
      this.addButton("Accept Quest", () => {
          if (onAccept) onAccept();
      });
      this.addButton("Decline", () => {
          if (onDecline) onDecline();
      });
  }
}
