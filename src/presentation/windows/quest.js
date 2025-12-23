import { Window_Base } from "./base.js";
import { createIcon } from "./utils.js";

/**
 * @class Window_Quest
 * @description Dedicated popup for viewing and accepting quests.
 */
export class Window_Quest extends Window_Base {
    constructor() {
        super('center', 'center', 540, 'auto', { title: "Quest Offer", id: "quest-window" });

        this.bodyEl = this.createPanel();
        this.bodyEl.classList.add('quest-body');

        this.headerEl = document.createElement('div');
        this.headerEl.className = 'quest-header';

        this.titleText = document.createElement('div');
        this.titleText.className = 'quest-title';

        this.statusTag = document.createElement('span');
        this.statusTag.className = 'quest-status';

        this.subtitleEl = document.createElement('div');
        this.subtitleEl.className = 'quest-subtitle';

        this.headerEl.appendChild(this.titleText);
        this.headerEl.appendChild(this.statusTag);
        this.headerEl.appendChild(this.subtitleEl);
        this.bodyEl.appendChild(this.headerEl);

        this.summaryEl = document.createElement('p');
        this.summaryEl.className = 'quest-summary';
        this.bodyEl.appendChild(this.summaryEl);

        this.objectiveList = document.createElement('ul');
        this.objectiveList.className = 'quest-objectives';
        this.bodyEl.appendChild(this.objectiveList);

        this.rewardHeader = document.createElement('div');
        this.rewardHeader.className = 'quest-rewards-header';
        this.rewardHeader.textContent = 'Rewards';
        this.bodyEl.appendChild(this.rewardHeader);

        this.rewardList = document.createElement('ul');
        this.rewardList.className = 'quest-rewards';
        this.bodyEl.appendChild(this.rewardList);

        this.footer.classList.add('quest-footer');

        // Keyboard Navigation
        this._inputListener = null;
        this._selectedIndex = 0;
    }

    /**
     * Renders quest data into the window.
     * @param {Object} data
     */
    show(data) {
        const { quest, status = 'inactive', npcName, onAccept, onDecline } = data;
        this.titleText.textContent = quest.name;
        this.subtitleEl.textContent = npcName ? `Offered by ${npcName}` : quest.giver || '';
        this.summaryEl.textContent = quest.description || quest.summary;

        this.statusTag.textContent = status === 'completed' ? 'Completed' : status === 'active' ? 'In Progress' : 'New Quest';
        this.statusTag.dataset.status = status;

        this.objectiveList.innerHTML = '';
        (quest.objectives || []).forEach(obj => {
            const li = document.createElement('li');
            li.textContent = obj;
            this.objectiveList.appendChild(li);
        });

        this.rewardList.innerHTML = '';
        if (quest.rewards) {
            if (quest.rewards.gold) {
                const li = document.createElement('li');
                const icon = createIcon(85);
                li.appendChild(icon);
                li.append(` ${quest.rewards.gold} Gold`);
                this.rewardList.appendChild(li);
            }
            if (Array.isArray(quest.rewards.items)) {
                for (const item of quest.rewards.items) {
                    const li = document.createElement('li');
                    const icon = createIcon(item.icon || 173);
                    li.appendChild(icon);
                    li.append(` ${item.qty || 1}x ${item.name || item.id}`);
                    this.rewardList.appendChild(li);
                }
            }
        }

        this.footer.innerHTML = '';

        const declineBtn = this.addButton('Decline', (e) => {
            e.stopPropagation();
            if (onDecline) onDecline();
        });
        declineBtn.classList.add('secondary');

        const acceptLabel = status === 'completed' ? 'Completed' : status === 'active' ? 'Already Accepted' : 'Accept Quest';
        const acceptBtn = this.addButton(acceptLabel, (e) => {
            e.stopPropagation();
            if (onAccept) onAccept();
        });

        if (status !== 'inactive') {
            acceptBtn.disabled = true;
        }

        // Prepare keyboard selection
        this.resetSelection();
        this.attachInputListener();
    }

    resetSelection() {
        // Default to 'Accept' (last button) if enabled, otherwise 'Decline' (first button)
        const buttons = Array.from(this.footer.children).filter(el => el.tagName === 'BUTTON');
        if (buttons.length > 1 && !buttons[1].disabled) {
             this._selectedIndex = 1; // Accept
        } else {
             this._selectedIndex = 0; // Decline
        }
        this.updateSelection();
    }

    updateSelection() {
        const buttons = Array.from(this.footer.children).filter(el => el.tagName === 'BUTTON');
        if (buttons.length === 0) return;

        if (this._selectedIndex < 0) this._selectedIndex = buttons.length - 1;
        if (this._selectedIndex >= buttons.length) this._selectedIndex = 0;

        buttons.forEach((btn, index) => {
            if (index === this._selectedIndex) {
                btn.focus();
                btn.classList.add('selected');
            } else {
                btn.blur();
                btn.classList.remove('selected');
            }
        });
    }

    moveSelection(delta) {
        this._selectedIndex += delta;
        this.updateSelection();
    }

    triggerSelection() {
        const buttons = Array.from(this.footer.children).filter(el => el.tagName === 'BUTTON');
        if (buttons[this._selectedIndex] && !buttons[this._selectedIndex].disabled) {
            buttons[this._selectedIndex].click();
        }
    }

    attachInputListener() {
        if (this._inputListener) return;
        this._inputListener = (e) => {
            if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                e.preventDefault();
                this.moveSelection(-1);
            } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                e.preventDefault();
                this.moveSelection(1);
            } else if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.triggerSelection();
            }
        };
        document.addEventListener('keydown', this._inputListener);
    }

    removeInputListener() {
         if (this._inputListener) {
             document.removeEventListener('keydown', this._inputListener);
             this._inputListener = null;
         }
    }

    close() {
        this.removeInputListener();
        super.close();
    }
}
