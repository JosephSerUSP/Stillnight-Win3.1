import { Window_Selectable } from "./selectable.js";
import { UI } from "./builder.js";

export class Window_Journal extends Window_Selectable {
  constructor() {
    super('center', 'center', 500, 400, { title: "Journal", id: "journal-window" });
    this.content.style.overflowY = "auto";

    const structure = {
        type: 'flex',
        props: {
            style: { flexDirection: 'column', flex: '1', gap: '10px' }
        },
        children: [
             {
                type: 'label', // Empty Msg
                props: {
                    text: "No journal entries.",
                    style: { textAlign: 'center', display: 'none', color: '#888', marginTop: '20px' }
                }
            }
        ]
    };

    const body = UI.build(this.content, structure);
    this.listEl = body; // Container
    this.emptyMsgEl = body.children[0];

    this.addButton("Close", () => this.onUserClose());
    this.party = null;
  }

  setup(party) {
      this.party = party;
      this.refresh();
  }

  refresh() {
      // Clear previous list (keep empty msg)
      const listContainer = this.listEl;
      // Remove all except empty msg (which is last index 0 currently?? No, it is the only child initially)
      // Actually, if I append before it, I should be careful.

      // Let's just clear everything and rebuild.
      listContainer.innerHTML = '';
      listContainer.appendChild(this.emptyMsgEl);

      const entries = this.party ? this.party.journal : [];

      if (entries.length === 0) {
          this.emptyMsgEl.style.display = 'block';
      } else {
          this.emptyMsgEl.style.display = 'none';
          entries.forEach(entry => {
              const entryEl = document.createElement('div');
              entryEl.className = 'journal-entry';
              Object.assign(entryEl.style, {
                  border: '1px solid var(--bezel-highlight)',
                  padding: '10px',
                  background: 'rgba(0,0,0,0.3)',
                  marginBottom: '10px'
              });

              const title = document.createElement('div');
              Object.assign(title.style, { fontWeight: 'bold', marginBottom: '5px', color: 'var(--text-highlight)' });
              title.textContent = entry.title;

              const text = document.createElement('div');
              Object.assign(text.style, { fontSize: '0.9em', lineHeight: '1.4' });
              text.textContent = entry.text;

              entryEl.appendChild(title);
              entryEl.appendChild(text);

              listContainer.insertBefore(entryEl, this.emptyMsgEl);
          });
      }
  }
}
