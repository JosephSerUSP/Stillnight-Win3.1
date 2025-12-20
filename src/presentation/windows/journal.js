import { Window_Base } from "./base.js";
import { UI } from "./builder.js";

export class Window_Journal extends Window_Base {
    constructor() {
        super('center', 'center', 520, 420, { title: 'Quest Journal', id: 'journal-window' });
        this.content.classList.add('journal-window');
        this.bodyEl = UI.build(this.content, {
            type: 'panel',
            props: { className: 'journal-body', style: { overflowY: 'auto', gap: '8px', display: 'flex', flexDirection: 'column' } }
        });
        this.addButton('Close', () => this.onUserClose());
    }

    refresh(entries = []) {
        this.bodyEl.innerHTML = '';
        if (!entries.length) {
            UI.build(this.bodyEl, { type: 'label', props: { text: 'No quests yet.' } });
            return;
        }

        entries.forEach((entry) => {
            const statusClass = entry.isComplete ? 'text-success' : 'text-info';
            const header = `${entry.name} ${entry.isComplete ? '(Complete)' : ''}`;
            const giver = entry.giver ? `Given by ${entry.giver}` : '';
            const hint = entry.stageData && entry.stageData.hint ? entry.stageData.hint : '';
            const summary = entry.stageData && entry.stageData.summary ? entry.stageData.summary : '';

            UI.build(this.bodyEl, {
                type: 'panel',
                props: { className: 'journal-card' },
                children: [
                    { type: 'label', props: { tag: 'h4', text: header, className: statusClass } },
                    giver ? { type: 'label', props: { className: 'text-subtle', text: giver } } : null,
                    { type: 'label', props: { className: 'text-subtle', text: `Stage ${entry.stage}: ${entry.stageData?.title || ''}` } },
                    summary ? { type: 'label', props: { text: summary } } : null,
                    hint ? { type: 'label', props: { className: 'text-functional', text: `Hint: ${hint}` } } : null
                ].filter(Boolean)
            });
        });
    }
}
