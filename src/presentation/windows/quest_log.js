
import { Window_Base } from "./base.js";
import { UI } from "./builder.js";

/**
 * @class Window_QuestLog
 * @description Displays a list of active and completed quests.
 */
export class Window_QuestLog extends Window_Base {
    constructor() {
        super('center', 'center', 400, 500, { title: "Quest Log" });
        this.listEl = UI.build(this.content, {
            type: 'panel',
            props: {
                className: 'quest-log-list',
                style: { overflowY: 'auto', height: '100%', display: 'flex', flexDirection: 'column', gap: '4px' }
            }
        });
    }

    /**
     * Sets up the quest log with a list of quests.
     * @param {Array} quests
     */
    setup(quests) {
        this.listEl.innerHTML = "";
        if (!quests || Object.keys(quests).length === 0) {
            UI.build(this.listEl, { type: 'label', props: { text: "No active quests." } });
            return;
        }

        // Quests might be an object or array depending on state structure.
        // Assuming array or object values.
        const questList = Array.isArray(quests) ? quests : Object.values(quests);

        questList.forEach(q => {
            const container = UI.build(this.listEl, {
                type: 'panel',
                props: { className: 'group-box' }
            });

            UI.build(container, {
                type: 'label',
                props: {
                    tag: 'legend',
                    text: q.title || q.name || "Unknown Quest"
                }
            });

            UI.build(container, {
                type: 'label',
                props: {
                    text: q.status || "Active",
                    style: { fontSize: '10px', color: 'var(--text-info)' }
                }
            });

            if (q.description) {
                UI.build(container, {
                    type: 'label',
                    props: { text: q.description, style: { fontSize: '11px', marginTop: '4px' } }
                });
            }
        });
    }
}
