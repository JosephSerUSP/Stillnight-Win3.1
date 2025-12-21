
import { Window_Base } from "./base.js";
import { UI } from "./builder.js";

/**
 * @class Window_FloorSelect
 * @description A simple list window to select a floor.
 */
export class Window_FloorSelect extends Window_Base {
    constructor(floors, onSelect) {
        super('center', 'center', 200, 300, { title: "Select Floor" });
        this.floors = floors;
        this.onSelect = onSelect;

        this.listEl = UI.build(this.content, {
            type: 'panel',
            props: {
                style: {
                    overflowY: 'auto',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                }
            }
        });

        this.render();
    }

    render() {
        this.listEl.innerHTML = "";
        this.floors.forEach((f, idx) => {
            UI.build(this.listEl, {
                type: 'button',
                props: {
                    className: 'win-btn',
                    label: `${idx + 1}. ${f.title}`,
                    style: { textAlign: 'left', width: '100%' },
                    onClick: () => {
                        if (this.onSelect) this.onSelect(idx);
                        this.close();
                    }
                }
            });
        });
    }
}
