import { Window_Base } from "./base.js";
import { Window_Selectable } from "./selectable.js";
import { createIcon, createInteractiveLabel, setPortrait } from "./utils.js";
import { UI } from "./builder.js";

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

        if (quest.portrait) {
            setPortrait(this.portraitEl, quest.portrait);
            this.portraitEl.style.display = 'block';
        } else {
            this.portraitEl.style.display = 'none';
        }

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
                const goldData = { name: "Gold", icon: 85, description: "Currency used to buy items." };
                const label = createInteractiveLabel(goldData, 'item');
                // Label includes the name. We want "X Gold".
                // InteractiveLabel renders "Icon Name".
                // We can append qty manually or just rely on text.
                // Standard: Icon + Name. We can append quantity.
                // Or create a custom label structure reusing the component.
                // Let's use the component for the item part and append quantity text.
                // But InteractiveLabel puts name inside.
                // Let's use it as: createInteractiveLabel({name: "Gold", icon: 85}) then append qty.
                // Actually the current impl was: Icon + " 100 Gold".
                // InteractiveLabel produces: [Icon] [Name] (with tooltip).
                // If we use that, we get: [Icon] [Gold]. Then we need to show quantity.
                // Maybe: [Icon] [Gold] x100 ?

                // Let's just use the label for the "Gold" part.
                label.style.marginRight = "5px";
                li.appendChild(label);
                li.appendChild(document.createTextNode(`x${quest.rewards.gold}`));
                this.rewardList.appendChild(li);
            }
            if (Array.isArray(quest.rewards.items)) {
                for (const item of quest.rewards.items) {
                    const li = document.createElement('li');
                    // Item usually has { name, icon, id, qty }
                    // createInteractiveLabel expects data with name/icon/description
                    // We might need to ensure 'item' has enough data for tooltip if possible.
                    // If it's just a reward struct { id: 'potion', qty: 1 }, we might miss details.
                    // Ideally we should look it up, but Window_Quest might not have dataManager.
                    // The caller passes 'data'. If data.quest is fully hydrated great.
                    // If not, we do our best.

                    const label = createInteractiveLabel(item, 'item');
                    label.style.marginRight = "5px";
                    li.appendChild(label);

                    if (item.qty && item.qty > 1) {
                         li.appendChild(document.createTextNode(`x${item.qty}`));
                    }
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

/**
 * @class Window_QuestLog
 * @description Displays active and completed quests.
 */
export class Window_QuestLog extends Window_Selectable {
    constructor() {
        super('center', 'center', 600, 450, { title: "Quest Log", id: "quest-log-window" });

        this.currentTab = 'active';
        this.questData = { active: [], completed: [] };

        // Keyboard Support
        this._inputListener = null;

        const structure = {
            type: 'flex',
            props: { style: { flexDirection: 'column', flex: '1', gap: '8px', overflow: 'hidden' } },
            children: [
                 {
                    type: 'flex', // Tab Nav
                    props: { className: 'tab-nav' },
                    children: [
                        { type: 'button', props: { className: 'tab-btn active', label: 'Active', onClick: () => this.switchTab('active') } },
                        { type: 'button', props: { className: 'tab-btn', label: 'Completed', onClick: () => this.switchTab('completed') } }
                    ]
                 },
                 {
                     type: 'flex',
                     props: { style: { flex: '1', gap: '8px', minHeight: '0' } },
                     children: [
                         {
                             type: 'panel', // List
                             props: { className: 'quest-list-panel', style: { width: '40%', display: 'flex', flexDirection: 'column', border: '1px solid var(--bezel-shadow)', background: 'var(--input-bg)' } },
                             children: [
                                 { type: 'panel', props: { className: 'quest-list-content', style: { flex: '1', overflowY: 'auto' } } }
                             ]
                         },
                         {
                             type: 'panel', // Details
                             props: { className: 'quest-details-panel', style: { flex: '1', padding: '8px', border: '1px solid var(--bezel-shadow)', overflowY: 'auto' } },
                             children: [
                                 { type: 'label', props: { tag: 'h3', className: 'quest-detail-title', text: '', style: { marginTop: '0' } } },
                                 { type: 'label', props: { tag: 'div', className: 'quest-detail-subtitle', text: '', style: { fontSize: '0.9em', color: '#aaa', marginBottom: '8px' } } },
                                 { type: 'label', props: { tag: 'p', className: 'quest-detail-summary', text: '' } },
                                 { type: 'label', props: { tag: 'h4', text: 'Objectives', style: { marginTop: '12px', marginBottom: '4px' } } },
                                 { type: 'label', props: { tag: 'ul', className: 'quest-detail-objectives', style: { paddingLeft: '20px', margin: '0' } } },
                                 { type: 'label', props: { tag: 'h4', text: 'Rewards', style: { marginTop: '12px', marginBottom: '4px' } } },
                                 { type: 'label', props: { tag: 'ul', className: 'quest-detail-rewards', style: { paddingLeft: '20px', margin: '0' } } }
                             ]
                         }
                     ]
                 }
            ]
        };

        const root = UI.build(this.content, structure);

        this.btnTabActive = root.children[0].children[0];
        this.btnTabCompleted = root.children[0].children[1];

        this.listEl = root.children[1].children[0].children[0];
        this.detailsEl = root.children[1].children[1];

        this.detailPortrait = this.detailsEl.querySelector('.quest-detail-portrait');
        this.detailTitle = this.detailsEl.querySelector('.quest-detail-title');
        this.detailSubtitle = this.detailsEl.querySelector('.quest-detail-subtitle');
        this.detailSummary = this.detailsEl.querySelector('.quest-detail-summary');
        this.detailObjectives = this.detailsEl.querySelector('.quest-detail-objectives');
        this.detailRewards = this.detailsEl.querySelector('.quest-detail-rewards');

        this.addButton("Close", () => this.onUserClose());
    }

    setup(questData) {
        this.questData = questData;
        this.switchTab('active');
        this.attachInputListener();
    }

    switchTab(tab) {
        this.currentTab = tab;
        this.btnTabActive.classList.toggle('active', tab === 'active');
        this.btnTabCompleted.classList.toggle('active', tab === 'completed');

        this.renderList();
        // Select first item if available
        if (this._data.length > 0) {
            this.select(0);
        } else {
            this.deselect();
            this.clearDetails();
        }
    }

    renderList() {
        this.listEl.innerHTML = "";
        const items = this.questData[this.currentTab] || [];
        this.setData(items); // Updates this._data for Window_Selectable

        if (items.length === 0) {
            const empty = document.createElement('div');
            empty.textContent = "No quests.";
            empty.style.padding = "8px";
            empty.style.color = "#888";
            this.listEl.appendChild(empty);
            return;
        }

        items.forEach((q, idx) => {
            const item = document.createElement('div');
            item.className = 'list-item';
            item.style.padding = "4px 8px";
            item.style.cursor = "pointer";
            item.textContent = q.name;
            item.dataset.index = idx;
            // The click is handled by Window_Selectable delegation if we use standard data-index
            // But Window_Selectable relies on click. We want to ensure focus.
            // Let's rely on Window_Selectable's onClick for mouse.
            this.listEl.appendChild(item);
        });
    }

    // Override select to update details and visual state
    select(index) {
        super.select(index);

        // Window_Selectable updates this._index
        if (this._index >= 0 && this._data[this._index]) {
            this.renderDetails(this._data[this._index]);
        }

        // Update visual selection class
        Array.from(this.listEl.children).forEach((el) => {
             if (el.dataset.index == index) el.classList.add('selected');
             else el.classList.remove('selected');
        });

        // Ensure visible
        const selectedEl = this.listEl.querySelector(`[data-index="${index}"]`);
        if (selectedEl) {
            selectedEl.scrollIntoView({ block: 'nearest' });
        }
    }

    renderDetails(quest) {
        if (!quest) {
            this.clearDetails();
            return;
        }

        this.detailTitle.textContent = quest.name;
        this.detailSubtitle.textContent = quest.giver ? `From: ${quest.giver}` : '';
        this.detailSummary.textContent = quest.description;

        if (quest.portrait && this.detailPortrait) {
            setPortrait(this.detailPortrait, quest.portrait);
            this.detailPortrait.style.display = 'block';
        } else if (this.detailPortrait) {
            this.detailPortrait.style.display = 'none';
        }

        this.detailObjectives.innerHTML = "";
        (quest.objectives || []).forEach(obj => {
            const li = document.createElement('li');
            li.textContent = obj;
            this.detailObjectives.appendChild(li);
        });

        this.detailRewards.innerHTML = "";
        if (quest.rewards) {
             if (quest.rewards.gold) {
                const li = document.createElement('li');
                const goldData = { name: "Gold", icon: 85, description: "Currency used to buy items." };
                const label = createInteractiveLabel(goldData, 'item');
                label.style.marginRight = "5px";
                li.appendChild(label);
                li.appendChild(document.createTextNode(`x${quest.rewards.gold}`));
                this.detailRewards.appendChild(li);
             }
             if (Array.isArray(quest.rewards.items)) {
                for (const item of quest.rewards.items) {
                    const li = document.createElement('li');
                    const label = createInteractiveLabel(item, 'item');
                    label.style.marginRight = "5px";
                    li.appendChild(label);

                    if (item.qty && item.qty > 1) {
                         li.appendChild(document.createTextNode(`x${item.qty}`));
                    }
                    this.detailRewards.appendChild(li);
                }
             }
        }
    }

    clearDetails() {
        this.detailTitle.textContent = "No Quest Selected";
        this.detailSubtitle.textContent = "";
        this.detailSummary.textContent = "";
        this.detailObjectives.innerHTML = "";
        this.detailRewards.innerHTML = "";
        if (this.detailPortrait) this.detailPortrait.style.display = 'none';
    }

    attachInputListener() {
        if (this._inputListener) return;
        this._inputListener = (e) => {
            if (!this.isFullyOpen) return;

            if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.moveSelection(-1);
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.moveSelection(1);
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                // Optional: Switch Tabs
                if (this.currentTab === 'completed') this.switchTab('active');
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                // Optional: Switch Tabs
                if (this.currentTab === 'active') this.switchTab('completed');
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.onUserClose();
            }
        };
        document.addEventListener('keydown', this._inputListener);
    }

    moveSelection(delta) {
        if (this._data.length === 0) return;
        let newIndex = this._index + delta;
        if (newIndex < 0) newIndex = this._data.length - 1;
        if (newIndex >= this._data.length) newIndex = 0;
        this.select(newIndex);
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
