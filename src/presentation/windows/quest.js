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
        super('center', 'center', 600, 'auto', { title: "Quest Offer", id: "quest-window" });

        this.bodyEl = this.createPanel();
        this.bodyEl.classList.add('quest-body');

        // Layout Container
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.gap = '12px';
        this.bodyEl.appendChild(container);

        // Left: Portrait
        this.portraitEl = document.createElement('div');
        this.portraitEl.className = 'quest-portrait';
        this.portraitEl.style.width = '128px';
        this.portraitEl.style.height = '192px';
        this.portraitEl.style.flexShrink = '0';
        this.portraitEl.style.backgroundRepeat = 'no-repeat';
        this.portraitEl.style.border = '1px solid #333';
        this.portraitEl.style.backgroundColor = '#111';
        container.appendChild(this.portraitEl);

        // Right: Content
        const contentCol = document.createElement('div');
        contentCol.style.flex = '1';
        contentCol.style.display = 'flex';
        contentCol.style.flexDirection = 'column';
        container.appendChild(contentCol);

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
        contentCol.appendChild(this.headerEl);

        this.summaryEl = document.createElement('p');
        this.summaryEl.className = 'quest-summary';
        contentCol.appendChild(this.summaryEl);

        this.objectiveList = document.createElement('ul');
        this.objectiveList.className = 'quest-objectives';
        contentCol.appendChild(this.objectiveList);

        this.rewardHeader = document.createElement('div');
        this.rewardHeader.className = 'quest-rewards-header';
        this.rewardHeader.textContent = 'Rewards';
        contentCol.appendChild(this.rewardHeader);

        this.rewardList = document.createElement('ul');
        this.rewardList.className = 'quest-rewards';
        contentCol.appendChild(this.rewardList);

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

        // Portrait
        if (quest.portrait) {
            setPortrait(this.portraitEl, quest.portrait);
            this.portraitEl.style.display = 'block';
        } else {
            // Fallback to hidden if no portrait
            this.portraitEl.style.display = 'none';
        }

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
                const goldData = { name: "Gold", icon: 85, description: "Currency used to buy items." };
                const label = createInteractiveLabel(goldData, 'item');
                label.style.marginRight = "5px";
                li.appendChild(label);
                li.appendChild(document.createTextNode(`x${quest.rewards.gold}`));
                this.rewardList.appendChild(li);
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
        super('center', 'center', 700, 500, { title: "Quest Log", id: "quest-log-window" }); // Increased size for portrait

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
                             props: { className: 'quest-list-panel', style: { width: '30%', display: 'flex', flexDirection: 'column', border: '1px solid var(--bezel-shadow)', background: 'var(--input-bg)' } },
                             children: [
                                 { type: 'panel', props: { className: 'quest-list-content', style: { flex: '1', overflowY: 'auto' } } }
                             ]
                         },
                         {
                             type: 'panel', // Details
                             props: { className: 'quest-details-panel', style: { flex: '1', padding: '8px', border: '1px solid var(--bezel-shadow)', overflowY: 'auto' } },
                             children: [
                                 // Top Section: Flex Row for Portrait + Header Info
                                 {
                                     type: 'flex',
                                     props: { style: { gap: '12px', marginBottom: '12px' } },
                                     children: [
                                         {
                                             type: 'panel',
                                             props: {
                                                 className: 'quest-detail-portrait',
                                                 style: { width: '128px', height: '192px', flexShrink: '0', backgroundRepeat: 'no-repeat', border: '1px solid #333', backgroundColor: '#111' }
                                             }
                                         },
                                         {
                                             type: 'flex',
                                             props: { style: { flexDirection: 'column', flex: '1' } },
                                             children: [
                                                 { type: 'label', props: { tag: 'h3', className: 'quest-detail-title', text: '', style: { marginTop: '0' } } },
                                                 { type: 'label', props: { tag: 'div', className: 'quest-detail-subtitle', text: '', style: { fontSize: '0.9em', color: '#aaa', marginBottom: '8px' } } },
                                                 { type: 'label', props: { tag: 'p', className: 'quest-detail-summary', text: '' } }
                                             ]
                                         }
                                     ]
                                 },
                                 // Bottom Section: Objectives and Rewards
                                 { type: 'label', props: { tag: 'h4', text: 'Objectives', style: { marginTop: '0', marginBottom: '4px' } } },
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

        // Access deeply nested elements
        const topSection = this.detailsEl.children[0];
        this.detailPortrait = topSection.children[0];
        const infoSection = topSection.children[1];

        this.detailTitle = infoSection.children[0];
        this.detailSubtitle = infoSection.children[1];
        this.detailSummary = infoSection.children[2];

        this.detailObjectives = this.detailsEl.children[2]; // Objectives UL (index 2 is the list, index 1 is label)
        this.detailRewards = this.detailsEl.children[4];    // Rewards UL (index 4 is the list, index 3 is label)

        // Wait, UI.build children access relies on exact order.
        // Structure:
        // Details Panel -> [0: Flex (Portrait+Info), 1: Label(Obj), 2: UL(Obj), 3: Label(Rew), 4: UL(Rew)]
        // Correct.

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
            this.listEl.appendChild(item);
        });
    }

    // Override select to update details and visual state
    select(index) {
        super.select(index);

        if (this._index >= 0 && this._data[this._index]) {
            this.renderDetails(this._data[this._index]);
        }

        Array.from(this.listEl.children).forEach((el) => {
             if (el.dataset.index == index) el.classList.add('selected');
             else el.classList.remove('selected');
        });

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

        // Update Portrait
        if (quest.portrait) {
            setPortrait(this.detailPortrait, quest.portrait);
            this.detailPortrait.style.display = 'block';
        } else {
            this.detailPortrait.style.display = 'none';
        }

        this.detailTitle.textContent = quest.name;
        this.detailSubtitle.textContent = quest.giver ? `From: ${quest.giver}` : '';
        this.detailSummary.textContent = quest.description;

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
        this.detailPortrait.style.display = 'none'; // Hide portrait when clear
        this.detailTitle.textContent = "No Quest Selected";
        this.detailSubtitle.textContent = "";
        this.detailSummary.textContent = "";
        this.detailObjectives.innerHTML = "";
        this.detailRewards.innerHTML = "";
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
                if (this.currentTab === 'completed') this.switchTab('active');
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
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
