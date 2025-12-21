import { Window_Base } from "./base.js";
import { UI } from "./builder.js";

export class Window_FloorSelect extends Window_Base {
    constructor() {
        super('center', 'center', 320, 400, { title: "Cards (Floors)", id: "floor-select-window" });

        this.listEl = UI.build(this.content, {
            type: 'panel',
            props: { className: 'card-list card-select-list' }
        });
    }

    setFloors(floors, currentIndex, maxReachedIndex, onSelect) {
        this.listEl.innerHTML = "";
        floors.forEach((floor, idx) => {
            const canVisit = floor.discovered && idx <= maxReachedIndex;
            const item = UI.build(this.listEl, {
                type: 'panel',
                props: {
                    className: `card-item${idx === currentIndex ? ' selected' : ''}${!floor.discovered ? ' disabled' : ''}`,
                    text: `${idx + 1}. ${floor.discovered ? floor.title : "Unknown Floor"}`,
                    onClick: canVisit ? () => onSelect(idx) : undefined
                }
            });
            item.textContent = `${idx + 1}. ${floor.discovered ? floor.title : "Unknown Floor"}`;
        });
    }
}
