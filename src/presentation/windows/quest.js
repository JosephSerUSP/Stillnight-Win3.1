import { Window_Base } from "./base.js";
import { Component_InteractiveLabel } from "./components.js";

/**
 * Window for displaying quest offers.
 */
export class Window_Quest extends Window_Base {
    constructor(rect) {
        super(rect);
        this.questData = null;
        this.onAccept = null;
        this.onDecline = null;
        this.render();
    }

    /**
     * Shows the quest offer.
     * @param {Object} questData - The quest data object.
     * @param {Object} callbacks - { onAccept, onDecline }
     */
    showOffer(questData, callbacks = {}) {
        this.questData = questData;
        this.onAccept = callbacks.onAccept;
        this.onDecline = callbacks.onDecline;
        this.dataManager = callbacks.dataManager;
        this.show();
        this.refresh();
    }

    refresh() {
        this.content.innerHTML = "";
        if (!this.questData) return;

        // Title
        const title = document.createElement("div");
        title.className = "window-title";
        title.textContent = "Quest Offer";
        title.style.textAlign = "center";
        title.style.marginBottom = "10px";
        this.content.appendChild(title);

        // Quest Name
        const name = document.createElement("div");
        name.style.fontSize = "18px";
        name.style.fontWeight = "bold";
        name.style.textAlign = "center";
        name.style.marginBottom = "15px";
        name.style.color = "#ffffaa";
        name.textContent = this.questData.title;
        this.content.appendChild(name);

        // Description
        const desc = document.createElement("div");
        desc.style.marginBottom = "20px";
        desc.style.lineHeight = "1.4";
        desc.textContent = this.questData.description;
        this.content.appendChild(desc);

        // Rewards
        if (this.questData.rewards && this.questData.rewards.length > 0) {
            const rewardHeader = document.createElement("div");
            rewardHeader.textContent = "Rewards:";
            rewardHeader.style.fontWeight = "bold";
            rewardHeader.style.marginBottom = "5px";
            this.content.appendChild(rewardHeader);

            const rewardList = document.createElement("div");
            rewardList.style.display = "flex";
            rewardList.style.flexDirection = "column";
            rewardList.style.gap = "5px";
            rewardList.style.marginBottom = "20px";
            rewardList.style.paddingLeft = "10px";

            this.questData.rewards.forEach(reward => {
                const row = document.createElement("div");
                row.style.display = "flex";
                row.style.alignItems = "center";

                if (reward.type === 'gold') {
                    row.textContent = `${reward.value} Gold`;
                } else if (reward.type === 'item') {
                    if (this.dataManager) {
                        const item = this.dataManager.items.find(i => i.id === reward.id);
                        if (item) {
                            if (reward.amount && reward.amount > 1) {
                                const qty = document.createElement("span");
                                qty.textContent = `${reward.amount}x `;
                                qty.style.marginRight = "5px";
                                row.appendChild(qty);
                            }
                            Component_InteractiveLabel(row, { data: item, type: 'item' });
                        } else {
                            row.textContent = `${reward.amount || 1}x Item (${reward.id})`;
                        }
                    } else {
                        row.textContent = `${reward.amount || 1}x Item (${reward.id})`;
                    }
                }
                rewardList.appendChild(row);
            });
            this.content.appendChild(rewardList);
        }

        // Buttons
        const buttonContainer = document.createElement("div");
        buttonContainer.style.display = "flex";
        buttonContainer.style.justifyContent = "space-around";
        buttonContainer.style.marginTop = "auto";

        const acceptBtn = document.createElement("button");
        acceptBtn.className = "win-btn";
        acceptBtn.textContent = "Accept";
        acceptBtn.onclick = () => {
            if (this.onAccept) this.onAccept();
        };

        const declineBtn = document.createElement("button");
        declineBtn.className = "win-btn";
        declineBtn.textContent = "Decline";
        declineBtn.onclick = () => {
            if (this.onDecline) this.onDecline();
        };

        buttonContainer.appendChild(acceptBtn);
        buttonContainer.appendChild(declineBtn);
        this.content.appendChild(buttonContainer);
    }
}
