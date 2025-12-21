import { Window_Base } from "./base.js";
import { UI } from "./builder.js";

export class Window_QuestOffer extends Window_Base {
    constructor() {
        super('center', 'center', 560, 'auto', { title: "Quest Offer", id: 'quest-offer-window' });
        this.element.classList.add('quest-offer-window');

        this.titleTextEl = document.createElement('h2');
        this.titleTextEl.className = 'quest-offer-title';
        this.content.appendChild(this.titleTextEl);

        this.metaEl = document.createElement('div');
        this.metaEl.className = 'quest-offer-meta';
        this.content.appendChild(this.metaEl);

        this.summaryEl = document.createElement('div');
        this.summaryEl.className = 'quest-offer-summary';
        this.content.appendChild(this.summaryEl);

        this.objectivesEl = document.createElement('div');
        this.objectivesEl.className = 'quest-offer-objectives';
        this.content.appendChild(this.objectivesEl);

        this.rewardsEl = document.createElement('div');
        this.rewardsEl.className = 'quest-offer-rewards';
        this.content.appendChild(this.rewardsEl);
    }

    showOffer(viewModel, status, onAccept, onDecline) {
        this.titleTextEl.textContent = viewModel.title;
        this.metaEl.textContent = viewModel.giver ? `Given by ${viewModel.giver}` : "";
        this.summaryEl.textContent = viewModel.summary || viewModel.description;

        this.objectivesEl.innerHTML = "";
        const list = document.createElement('ul');
        list.className = 'quest-objective-list';
        (viewModel.objectives || []).forEach(obj => {
            const li = document.createElement('li');
            li.textContent = obj.description;
            li.className = obj.status === 'complete' ? 'quest-objective complete' : 'quest-objective';
            list.appendChild(li);
        });
        this.objectivesEl.appendChild(UI.build(document.createElement('div'), {
            type: 'panel',
            props: { className: 'quest-section-header', text: 'Objectives' }
        }));
        this.objectivesEl.appendChild(list);

        this.rewardsEl.innerHTML = "";
        this.rewardsEl.appendChild(UI.build(document.createElement('div'), {
            type: 'panel',
            props: { className: 'quest-section-header', text: 'Rewards' }
        }));
        const rewards = document.createElement('div');
        rewards.className = 'quest-rewards-body';
        const rewardsText = [];
        if (viewModel.rewards?.gold) rewardsText.push(`${viewModel.rewards.gold} Gold`);
        if (Array.isArray(viewModel.rewards?.items)) {
            rewardsText.push(...viewModel.rewards.items.map(i => i.name || i.id));
        }
        rewards.textContent = rewardsText.length > 0 ? rewardsText.join(', ') : 'To be decided';
        this.rewardsEl.appendChild(rewards);

        this.footer.innerHTML = "";
        const acceptBtn = document.createElement('button');
        acceptBtn.className = 'win-btn';
        acceptBtn.textContent = status === 'active' ? 'Already Accepted' : status === 'completed' ? 'Completed' : 'Accept Quest';
        acceptBtn.disabled = status === 'active' || status === 'completed' || status === 'missing';
        acceptBtn.addEventListener('click', () => onAccept && onAccept());

        const declineBtn = document.createElement('button');
        declineBtn.className = 'win-btn';
        declineBtn.textContent = 'Decline';
        declineBtn.addEventListener('click', () => onDecline && onDecline());

        this.footer.appendChild(acceptBtn);
        this.footer.appendChild(declineBtn);
    }
}

export class Window_QuestLog extends Window_Base {
    constructor() {
        super('center', 'center', 780, 480, { title: "Quest Log", id: 'quest-log-window' });
        this.element.classList.add('quest-log-window');

        this.listContainer = document.createElement('div');
        this.listContainer.className = 'quest-log-list';

        this.detailContainer = document.createElement('div');
        this.detailContainer.className = 'quest-log-detail';

        this.selectedQuestId = null;

        const layout = document.createElement('div');
        layout.className = 'quest-log-layout';
        layout.appendChild(this.listContainer);
        layout.appendChild(this.detailContainer);
        this.content.appendChild(layout);
    }

    setLog(viewModel, onSelect) {
        this.listContainer.innerHTML = "";
        const sections = [
            { label: 'Active', entries: viewModel.active || [] },
            { label: 'Completed', entries: viewModel.completed || [] },
            { label: 'Failed', entries: viewModel.failed || [] }
        ];

        sections.forEach(section => {
            const header = document.createElement('div');
            header.className = 'quest-section-header';
            header.textContent = section.label;
            this.listContainer.appendChild(header);

            if (section.entries.length === 0) {
                const empty = document.createElement('div');
                empty.className = 'quest-empty';
                empty.textContent = '— none —';
                this.listContainer.appendChild(empty);
                return;
            }

            section.entries.forEach(entry => {
                const item = document.createElement('button');
                item.className = 'win-btn quest-list-item';
                item.textContent = entry.title;
                item.addEventListener('click', () => {
                    this.selectedQuestId = entry.id;
                    onSelect && onSelect(entry);
                });
                this.listContainer.appendChild(item);
            });
        });

        const combined = [...(viewModel.active || []), ...(viewModel.completed || []), ...(viewModel.failed || [])];
        const selected = combined.find(q => q.id === this.selectedQuestId)
            || (viewModel.active && viewModel.active[0])
            || (viewModel.completed && viewModel.completed[0])
            || (viewModel.failed && viewModel.failed[0]);
        if (selected) {
            this.selectedQuestId = selected.id;
        }
        this.showQuest(selected);
    }

    showQuest(entry) {
        this.detailContainer.innerHTML = "";
        if (!entry) {
            this.detailContainer.textContent = 'No quest selected.';
            return;
        }

        this.selectedQuestId = entry.id;

        const header = document.createElement('div');
        header.className = 'quest-detail-header';
        header.textContent = entry.title;
        this.detailContainer.appendChild(header);

        if (entry.summary) {
            const summary = document.createElement('div');
            summary.className = 'quest-detail-summary';
            summary.textContent = entry.summary;
            this.detailContainer.appendChild(summary);
        }

        if (entry.description) {
            const desc = document.createElement('div');
            desc.className = 'quest-detail-description';
            desc.textContent = entry.description;
            this.detailContainer.appendChild(desc);
        }

        const objectivesHeader = document.createElement('div');
        objectivesHeader.className = 'quest-section-header';
        objectivesHeader.textContent = 'Objectives';
        this.detailContainer.appendChild(objectivesHeader);

        const list = document.createElement('ul');
        list.className = 'quest-objective-list';
        this.detailContainer.appendChild(list);
        (entry.objectives || []).forEach(obj => {
            const li = document.createElement('li');
            li.className = 'quest-objective';
            if (obj.status === 'complete') li.classList.add('complete');
            li.textContent = obj.description;
            list.appendChild(li);
        });

        const rewardsHeader = document.createElement('div');
        rewardsHeader.className = 'quest-section-header';
        rewardsHeader.textContent = 'Rewards';
        this.detailContainer.appendChild(rewardsHeader);

        const rewards = document.createElement('div');
        rewards.className = 'quest-rewards-body';
        const rewardsText = [];
        if (entry.rewards?.gold) rewardsText.push(`${entry.rewards.gold} Gold`);
        if (Array.isArray(entry.rewards?.items)) {
            rewardsText.push(...entry.rewards.items.map(i => i.name || i.id));
        }
        rewards.textContent = rewardsText.length > 0 ? rewardsText.join(', ') : 'Unknown reward';
        this.detailContainer.appendChild(rewards);
    }
}
