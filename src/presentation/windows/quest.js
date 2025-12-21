import { Window_Base } from "./base.js";
import { Window_Selectable } from "./selectable.js";
import { createIcon, setPortrait } from "./utils.js";

/**
 * @class Window_Quest
 * @description Dedicated popup for viewing and accepting quests.
 */
export class Window_Quest extends Window_Base {
    constructor() {
        super('center', 'center', 540, 'auto', { title: "Quest Offer", id: "quest-window" });

        this.bodyEl = this.createPanel();
        this.bodyEl.classList.add('quest-body');

        this.offerLayout = document.createElement('div');
        this.offerLayout.className = 'quest-offer-layout';
        this.bodyEl.appendChild(this.offerLayout);

        this.portraitEl = document.createElement('div');
        this.portraitEl.className = 'quest-portrait';
        this.offerLayout.appendChild(this.portraitEl);

        this.detailsEl = document.createElement('div');
        this.detailsEl.className = 'quest-offer-details';
        this.offerLayout.appendChild(this.detailsEl);

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
        this.detailsEl.appendChild(this.headerEl);

        this.summaryEl = document.createElement('p');
        this.summaryEl.className = 'quest-summary';
        this.detailsEl.appendChild(this.summaryEl);

        this.objectiveList = document.createElement('ul');
        this.objectiveList.className = 'quest-objectives';
        this.detailsEl.appendChild(this.objectiveList);

        this.rewardHeader = document.createElement('div');
        this.rewardHeader.className = 'quest-rewards-header';
        this.rewardHeader.textContent = 'Rewards';
        this.detailsEl.appendChild(this.rewardHeader);

        this.rewardList = document.createElement('ul');
        this.rewardList.className = 'quest-rewards';
        this.detailsEl.appendChild(this.rewardList);

        this.footer.classList.add('quest-footer');
    }

    /**
     * Renders quest data into the window.
     * @param {Object} data
     */
    show(data) {
        const { quest, status = 'inactive', npcName, npcPortrait, onAccept, onDecline } = data;
        this.titleText.textContent = quest.name;
        this.subtitleEl.textContent = npcName ? `Offered by ${npcName}` : quest.giver || '';
        this.summaryEl.textContent = quest.description || quest.summary;

        const portraitKey = quest.portrait || npcPortrait;
        if (portraitKey) {
            setPortrait(this.portraitEl, portraitKey, quest.portraitEmotion || 'neutral');
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
    }
}

/**
 * Quest Log window showing accepted quests and their progress.
 */
export class Window_QuestLog extends Window_Selectable {
    constructor() {
        super('center', 'center', 720, 420, { title: "Quest Log", id: "quest-log-window" });
        this.element.classList.add('quest-log-window');

        this.bodyEl = this.createPanel();
        this.bodyEl.classList.add('quest-log-body');

        this.listEl = document.createElement('div');
        this.listEl.className = 'quest-log-list';
        this.bodyEl.appendChild(this.listEl);

        this.detailEl = document.createElement('div');
        this.detailEl.className = 'quest-log-detail';
        this.bodyEl.appendChild(this.detailEl);

        this.detailHeader = document.createElement('div');
        this.detailHeader.className = 'quest-detail-header';

        this.detailPortrait = document.createElement('div');
        this.detailPortrait.className = 'quest-portrait';
        this.detailHeader.appendChild(this.detailPortrait);

        this.detailMeta = document.createElement('div');
        this.detailMeta.className = 'quest-detail-meta';
        this.detailHeader.appendChild(this.detailMeta);

        this.detailTitle = document.createElement('div');
        this.detailTitle.className = 'quest-title';
        this.detailMeta.appendChild(this.detailTitle);

        this.detailStatus = document.createElement('span');
        this.detailStatus.className = 'quest-status';
        this.detailMeta.appendChild(this.detailStatus);

        this.detailGiver = document.createElement('div');
        this.detailGiver.className = 'quest-subtitle';
        this.detailMeta.appendChild(this.detailGiver);

        this.detailSummary = document.createElement('p');
        this.detailSummary.className = 'quest-summary';
        this.detailMeta.appendChild(this.detailSummary);

        this.progressLabel = document.createElement('div');
        this.progressLabel.className = 'quest-progress-label';
        this.detailMeta.appendChild(this.progressLabel);

        this.detailEl.appendChild(this.detailHeader);

        this.objectiveHeader = document.createElement('div');
        this.objectiveHeader.className = 'quest-rewards-header';
        this.objectiveHeader.textContent = 'Objectives';
        this.detailEl.appendChild(this.objectiveHeader);

        this.objectiveList = document.createElement('ul');
        this.objectiveList.className = 'quest-objectives';
        this.detailEl.appendChild(this.objectiveList);

        this.progressHeader = document.createElement('div');
        this.progressHeader.className = 'quest-rewards-header';
        this.progressHeader.textContent = 'Progress';
        this.detailEl.appendChild(this.progressHeader);

        this.progressList = document.createElement('ul');
        this.progressList.className = 'quest-progress';
        this.detailEl.appendChild(this.progressList);

        this.rewardHeader = document.createElement('div');
        this.rewardHeader.className = 'quest-rewards-header';
        this.rewardHeader.textContent = 'Rewards';
        this.detailEl.appendChild(this.rewardHeader);

        this.rewardList = document.createElement('ul');
        this.rewardList.className = 'quest-rewards';
        this.detailEl.appendChild(this.rewardList);

        this.emptyState = document.createElement('div');
        this.emptyState.className = 'quest-empty';
        this.emptyState.textContent = 'No active quests yet.';
        this.emptyState.style.display = 'none';
        this.detailEl.appendChild(this.emptyState);

        this.setHandler('select', (quest) => this.renderDetail(quest));

        this.btnClose = this.addButton('Close', () => this.onUserClose());
    }

    setQuests(quests) {
        this.setData(quests);
        if (quests && quests.length > 0) {
            const nextIndex = this._index >= 0 && this._index < quests.length ? this._index : 0;
            this.select(nextIndex);
        } else {
            this.renderDetail(null);
        }
    }

    refresh() {
        this.listEl.innerHTML = '';

        if (!this._data || this._data.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'quest-empty';
            empty.textContent = 'No quests accepted.';
            this.listEl.appendChild(empty);
            return;
        }

        this._data.forEach((quest, idx) => {
            const row = document.createElement('div');
            row.className = 'quest-log-item';
            row.dataset.index = idx;

            const portrait = document.createElement('div');
            portrait.className = 'quest-portrait small';
            if (quest.portrait) {
                setPortrait(portrait, quest.portrait, quest.portraitEmotion || 'neutral');
            }
            row.appendChild(portrait);

            const info = document.createElement('div');
            info.className = 'quest-log-item-info';

            const title = document.createElement('div');
            title.className = 'quest-log-item-title';
            title.textContent = quest.name;
            info.appendChild(title);

            const giver = document.createElement('div');
            giver.className = 'quest-log-item-giver';
            giver.textContent = quest.giver ? `From ${quest.giver}` : '';
            info.appendChild(giver);

            const progress = document.createElement('div');
            progress.className = 'quest-log-item-progress';
            progress.textContent = quest.progressSummary || '';
            info.appendChild(progress);

            row.appendChild(info);

            const status = document.createElement('span');
            status.className = 'quest-status';
            status.dataset.status = quest.status;
            status.textContent = quest.status === 'completed' ? 'Completed' : 'In Progress';
            row.appendChild(status);

            this.listEl.appendChild(row);
        });
    }

    renderDetail(quest) {
        if (!quest) {
            this.detailEl.classList.add('is-empty');
            this.emptyState.style.display = 'block';
            this.detailHeader.style.display = 'none';
            this.objectiveHeader.style.display = 'none';
            this.objectiveList.style.display = 'none';
            this.progressHeader.style.display = 'none';
            this.progressList.style.display = 'none';
            this.rewardHeader.style.display = 'none';
            this.rewardList.style.display = 'none';
            return;
        }

        this.detailEl.classList.remove('is-empty');
        this.emptyState.style.display = 'none';
        this.detailHeader.style.display = 'flex';
        this.objectiveHeader.style.display = '';
        this.objectiveList.style.display = '';
        this.progressHeader.style.display = '';
        this.progressList.style.display = '';
        this.rewardHeader.style.display = '';
        this.rewardList.style.display = '';

        if (quest.portrait) {
            setPortrait(this.detailPortrait, quest.portrait, quest.portraitEmotion || 'neutral');
            this.detailPortrait.style.display = 'block';
        } else {
            this.detailPortrait.style.display = 'none';
        }

        this.detailTitle.textContent = quest.name;
        this.detailStatus.textContent = quest.status === 'completed' ? 'Completed' : 'In Progress';
        this.detailStatus.dataset.status = quest.status;
        this.detailGiver.textContent = quest.giver ? `From ${quest.giver}` : '';
        this.detailSummary.textContent = quest.description || quest.summary || '';
        this.progressLabel.textContent = quest.progressSummary || '';

        this.objectiveList.innerHTML = '';
        (quest.objectives || []).forEach(obj => {
            const li = document.createElement('li');
            li.textContent = obj.text || obj;
            if (obj.complete) li.classList.add('completed');
            this.objectiveList.appendChild(li);
        });

        this.progressList.innerHTML = '';
        if (quest.progress && quest.progress.length > 0) {
            quest.progress.forEach(req => {
                const li = document.createElement('li');
                li.title = `${req.owned}/${req.qty} collected`;
                if (req.icon) {
                    const icon = createIcon(req.icon);
                    li.appendChild(icon);
                }
                const label = document.createElement('span');
                label.textContent = `${Math.min(req.owned, req.qty)}/${req.qty} ${req.name}`;
                li.appendChild(label);

                const bar = document.createElement('div');
                bar.className = 'quest-progress-bar';
                const fill = document.createElement('div');
                fill.className = 'quest-progress-fill';
                const ratio = Math.min(1, req.owned / req.qty);
                fill.style.width = `${ratio * 100}%`;
                bar.appendChild(fill);
                li.appendChild(bar);

                this.progressList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = quest.status === 'completed' ? 'Complete' : 'Progress tracked on objectives.';
            this.progressList.appendChild(li);
        }

        this.rewardList.innerHTML = '';
        const rewards = quest.rewards || {};
        if (rewards.gold) {
            const li = document.createElement('li');
            const icon = createIcon(85);
            li.appendChild(icon);
            li.append(` ${rewards.gold} Gold`);
            this.rewardList.appendChild(li);
        }
        if (Array.isArray(rewards.items)) {
            for (const item of rewards.items) {
                const li = document.createElement('li');
                const icon = createIcon(item.icon || 173);
                li.appendChild(icon);
                li.append(` ${item.qty || 1}x ${item.name || item.id}`);
                this.rewardList.appendChild(li);
            }
        }
    }
}
