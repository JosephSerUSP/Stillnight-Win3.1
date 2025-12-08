import { Window_Base } from "./base.js";
import { UI } from "./builder.js";
import { generateTraitDescription } from "../core/utils.js";

export class Window_TuneUp extends Window_Base {
    constructor() {
        super('center', 'center', 600, 400, { title: "Weapon Tune-up" });

        const structure = {
            type: 'flex',
            props: { direction: 'column', style: { height: '100%', gap: '10px' } },
            children: [
                {
                    type: 'label',
                    props: { text: "Select Source Weapon (Donate Trait)", style: { textAlign: 'center', fontWeight: 'bold' } }
                },
                {
                    type: 'panel',
                    props: { id: 'source-list', className: 'window-panel', style: { flex: '1', overflowY: 'auto', border: '1px solid #444', padding: '5px' } }
                },
                {
                    type: 'label',
                    props: { text: "Select Target Weapon (Receive Trait)", style: { textAlign: 'center', fontWeight: 'bold' } }
                },
                 {
                    type: 'panel',
                    props: { id: 'target-list', className: 'window-panel', style: { flex: '1', overflowY: 'auto', border: '1px solid #444', padding: '5px' } }
                },
                {
                    type: 'label',
                    props: { id: 'status-label', text: "Select a source weapon.", style: { textAlign: 'center', color: '#aaa', minHeight: '20px' } }
                }
            ]
        };

        const panel = UI.build(this.content, structure);
        this.sourceListEl = panel.querySelector('#source-list');
        this.targetListEl = panel.querySelector('#target-list');
        this.statusLabel = panel.querySelector('#status-label');

        this.btnConfirm = this.addButton("Tune Up", () => {});
        this.btnCancel = this.addButton("Cancel", () => {
             if (this.onUserClose) this.onUserClose();
        });

        this.reset();
    }

    reset() {
        this.sourceItem = null;
        this.targetItem = null;
        this.selectedTraitIndex = null;
        this.btnConfirm.disabled = true;
        this.statusLabel.textContent = "Select a source weapon.";
        if (this.inventory) {
            this.renderSourceList();
            this.renderTargetList();
        }
    }

    setup(inventory, onTuneUp) {
        this.inventory = inventory.filter(i => i.type === 'equipment');
        this.onTuneUp = onTuneUp;
        this.reset();
    }

    renderSourceList() {
        this.sourceListEl.innerHTML = "";
        if (this.inventory.length === 0) {
            this.sourceListEl.textContent = "No equipment found.";
            return;
        }

        this.inventory.forEach(item => {
            if (item === this.targetItem) return;

            const div = document.createElement("div");
            div.className = "list-item";
            div.textContent = item.name;
            div.style.cursor = "pointer";
            div.style.padding = "4px";
            div.style.borderBottom = "1px solid #333";
            if (item === this.sourceItem) div.style.backgroundColor = "#444";

            div.onclick = () => {
                this.sourceItem = item;
                this.selectedTraitIndex = null;
                this.statusLabel.textContent = "Select a trait to transfer.";
                this.renderSourceList(); // Re-render to show traits
                this.renderTargetList();
            };

            this.sourceListEl.appendChild(div);

            if (item === this.sourceItem) {
                // Show traits
                const traitList = document.createElement("div");
                traitList.style.paddingLeft = "20px";
                if (item.traits) {
                    item.traits.forEach((trait, idx) => {
                        const tDiv = document.createElement("div");
                        tDiv.className = "list-item sub-item";
                        tDiv.textContent = generateTraitDescription(trait);
                        tDiv.style.cursor = "pointer";
                        tDiv.style.fontSize = "0.9em";
                        tDiv.style.color = "#ccc";
                        if (this.selectedTraitIndex === idx) {
                            tDiv.style.color = "#fff";
                            tDiv.style.fontWeight = "bold";
                            tDiv.textContent = "> " + tDiv.textContent;
                        }

                        tDiv.onclick = (e) => {
                            e.stopPropagation();
                            this.selectedTraitIndex = idx;
                            this.statusLabel.textContent = "Select a target weapon.";
                            this.renderSourceList(); // Update selection highlight
                            this.renderTargetList();
                        };
                        traitList.appendChild(tDiv);
                    });
                }
                this.sourceListEl.appendChild(traitList);
            }
        });
    }

    renderTargetList() {
        this.targetListEl.innerHTML = "";
        if (!this.sourceItem || this.selectedTraitIndex === null) {
            this.targetListEl.textContent = "Select a source trait first.";
            return;
        }

        this.inventory.forEach(item => {
            if (item === this.sourceItem) return;

            const div = document.createElement("div");
            div.className = "list-item";
            div.textContent = item.name;
            div.style.cursor = "pointer";
            div.style.padding = "4px";
            if (item === this.targetItem) div.style.backgroundColor = "#444";

            div.onclick = () => {
                this.targetItem = item;
                this.statusLabel.textContent = "Ready to Tune Up. (Requires Tool)";
                this.btnConfirm.disabled = false;
                this.btnConfirm.onclick = () => {
                    if (this.onTuneUp) this.onTuneUp(this.sourceItem, this.selectedTraitIndex, this.targetItem);
                };
                this.renderTargetList();
            };

            this.targetListEl.appendChild(div);
        });
    }
}
