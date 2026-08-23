import { Window_Selectable } from "./selectable.js";

/** Battle-only selector for data-driven Summoner spells. */
export class Window_SpellSelect extends Window_Selectable {
  constructor() {
    super('center', 'center', 360, 360, { title: 'Summoner Spells', id: 'spell-select-window' });

    const body = this.createPanel();
    body.style.flexGrow = '1';
    body.style.overflowY = 'auto';

    this.listEl = document.createElement('div');
    this.listEl.style.display = 'flex';
    this.listEl.style.flexDirection = 'column';
    this.listEl.style.gap = '4px';
    body.appendChild(this.listEl);

    this.btnCancel = this.addButton('Cancel', () => this.onUserClose());
    this.setHandler('click', (option) => {
      if (option?.available && this.onSelect) this.onSelect(option);
    });
  }

  setup(options, onSelect) {
    this._data = Array.isArray(options) ? options : [];
    this.onSelect = onSelect;
    this.deselect();
    this.refresh();
  }

  refresh() {
    this.listEl.innerHTML = '';

    this._data.forEach((option, index) => {
      const { spell, available, reason } = option;
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'win-btn';
      row.dataset.index = String(index);
      row.dataset.spellId = spell.id;
      row.disabled = !available;
      row.style.display = 'grid';
      row.style.gridTemplateColumns = '1fr auto';
      row.style.gap = '3px 6px';
      row.style.textAlign = 'left';
      row.style.width = '100%';
      row.style.height = 'auto';
      row.style.minHeight = '48px';
      row.style.boxSizing = 'border-box';
      row.style.whiteSpace = 'normal';
      row.style.alignItems = 'start';

      const name = document.createElement('span');
      name.textContent = spell.name;
      row.appendChild(name);

      const cost = document.createElement('span');
      cost.textContent = `${spell.mpCost} MP`;
      cost.style.whiteSpace = 'nowrap';
      row.appendChild(cost);

      const description = document.createElement('span');
      description.textContent = spell.description || '';
      description.style.gridColumn = '1 / -1';
      description.style.opacity = '0.75';
      description.style.lineHeight = '1.2';
      row.appendChild(description);

      if (!available && reason) {
        const status = document.createElement('span');
        status.textContent = reason.replaceAll('_', ' ');
        status.style.gridColumn = '1 / -1';
        status.style.opacity = '0.55';
        status.style.lineHeight = '1.2';
        row.appendChild(status);
      }

      this.listEl.appendChild(row);
    });
  }
}
