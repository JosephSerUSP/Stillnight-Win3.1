import { Window_Base } from "./base.js";
import { createBattlerNameLabel, renderElements, createInteractiveLabel } from "./utils.js";

/**
 * @class Window_Inspect
 */
export class Window_Inspect extends Window_Base {
  constructor() {
    super('center', 'center', 480, 320, { title: "Creature – Stillnight", id: "inspect-window" });

    const inspectBody = this.createPanel();
    // inspectBody.className = "window-panel"; // Already set by createPanel

    const layout = document.createElement('div');
    layout.className = 'inspect-layout';
    inspectBody.appendChild(layout);

    this.spriteEl = document.createElement('div');
    this.spriteEl.className = 'inspect-sprite';
    layout.appendChild(this.spriteEl);

    const fields = document.createElement('div');
    fields.className = 'inspect-fields';
    layout.appendChild(fields);

    this.nameEl = this._createField(fields, "Name");
    this.levelEl = this._createField(fields, "Level");
    this.rowPosEl = this._createField(fields, "Row");
    this.hpEl = this._createField(fields, "HP");
    this.xpEl = this._createField(fields, "XP");
    this.elementEl = this._createField(fields, "Element");
    this.equipEl = this._createField(fields, "Equipment", true);
    this.passiveEl = this._createField(fields, "Passive");
    this.skillsEl = this._createField(fields, "Skills");
    this.flavorEl = this._createField(fields, "Flavor");

    this.notesEl = document.createElement('div');
    this.notesEl.className = 'inspect-notes';
    inspectBody.appendChild(this.notesEl);

    this.btnSacrifice = this.addButton("Sacrifice", () => {});
    this.btnSacrifice.style.marginRight = "auto";
    this.btnSacrifice.style.display = "none";

    this.btnEvolve = this.addButton("Evolution", () => {});
    this.btnEvolve.style.display = "none";

    this.btnOk = this.addButton("OK", () => this.onUserClose());
  }

  _createField(parent, label, isButton = false) {
    const row = document.createElement('div');
    row.className = 'inspect-row';
    const labelSpan = document.createElement('span');
    labelSpan.className = 'inspect-label';
    labelSpan.textContent = label;
    row.appendChild(labelSpan);

    const valueEl = isButton ? document.createElement('button') : document.createElement('span');
    valueEl.className = isButton ? 'win-btn inspect-value' : 'inspect-value';
    row.appendChild(valueEl);

    parent.appendChild(row);
    return valueEl;
  }
}

/**
 * @class Window_Evolution
 */
export class Window_Evolution extends Window_Base {
  constructor() {
    super('center', 'center', 700, 400, { title: "Evolution – Stillnight", id: "evolution-window" });

    const body = document.createElement('div');
    // Generic flex row
    body.style.display = 'flex';
    body.style.flexGrow = '1';
    body.style.justifyContent = 'space-between';
    body.style.alignItems = 'center';
    body.style.padding = '10px';
    // Use panel style? Or maybe just background
    // Since it's a window, the frame is gray. We can use panels for panes.
    this.content.appendChild(body);

    this.leftPane = document.createElement('div');
    this.leftPane.className = 'window-panel evolution-pane';
    this.leftPane.style.flex = '1';
    body.appendChild(this.leftPane);

    const arrow = document.createElement('div');
    arrow.textContent = "➔";
    arrow.className = "evolution-arrow";
    body.appendChild(arrow);

    this.rightPane = document.createElement('div');
    this.rightPane.className = 'window-panel evolution-pane';
    this.rightPane.style.flex = '1';
    body.appendChild(this.rightPane);

    this.btnConfirm = this.addButton("Confirm Evolution", () => {});
    this.btnReturn = this.addButton("Return", () => this.onUserClose());
  }

  setup(current, next) {
      this.renderPane(this.leftPane, current);
      this.renderPane(this.rightPane, next);
  }

  renderPane(container, battler) {
      container.innerHTML = "";
      const layout = document.createElement('div');
      layout.className = 'inspect-layout';
      container.appendChild(layout);

      const sprite = document.createElement('div');
      sprite.className = 'inspect-sprite';
      sprite.style.backgroundImage = `url('assets/portraits/${battler.spriteKey || "pixie"}.png')`;
      layout.appendChild(sprite);

      const fields = document.createElement('div');
      fields.className = 'inspect-fields';
      layout.appendChild(fields);

      const createRow = (label, valueEl) => {
        const row = document.createElement('div');
        row.className = 'inspect-row';
        const lbl = document.createElement('span');
        lbl.className = 'inspect-label';
        lbl.textContent = label;
        row.appendChild(lbl);
        valueEl.classList.add('inspect-value');
        row.appendChild(valueEl);
        fields.appendChild(row);
      };

      // Name
      const nameVal = document.createElement('span');
      nameVal.appendChild(createBattlerNameLabel(battler));
      createRow('Name', nameVal);

      // Level
      const levelVal = document.createElement('span');
      levelVal.textContent = battler.level;
      createRow('Level', levelVal);

      // Role
      const roleVal = document.createElement('span');
      roleVal.textContent = battler.role || "—";
      createRow('Role', roleVal);

      // HP
      const hpVal = document.createElement('span');
      hpVal.textContent = `${battler.maxHp}`;
      createRow('Max HP', hpVal);

      // Passives
      const passiveVal = document.createElement('span');
      if (battler.passives && battler.passives.length > 0) {
          battler.passives.forEach((p, i) => {
              const el = createInteractiveLabel(p, 'passive');
              passiveVal.appendChild(el);
              if (i < battler.passives.length - 1) passiveVal.appendChild(document.createTextNode(", "));
          });
      } else {
          passiveVal.textContent = "—";
      }
      createRow('Passive', passiveVal);
  }
}
