import { Window_Base } from "./base.js";
import { getPrimaryElements, elementToAscii } from "../core/utils.js";

/**
 * @class Window_Battle
 */
export class Window_Battle extends Window_Base {
  constructor() {
    super('center', 'center', 528, 360, { title: "Battle – Stillnight" });

    const terminal = document.createElement("div");
    terminal.className = "terminal";
    this.content.appendChild(terminal);

    this.viewportEl = document.createElement("div");
    this.viewportEl.className = "terminal-viewport";
    terminal.appendChild(this.viewportEl);

    this.logEl = document.createElement("div");
    this.logEl.className = "terminal-log";
    terminal.appendChild(this.logEl);

    this.btnRound = this.addButton("Resolve Round", () => {});

    // Action Row
    const actionRow = document.createElement("div");
    actionRow.style.display = "flex";
    actionRow.style.gap = "4px";
    actionRow.style.padding = "4px";
    actionRow.style.justifyContent = "center";
    actionRow.style.alignItems = "center";
    actionRow.style.width = "100%";
    this.footer.insertBefore(actionRow, this.footer.firstChild);

    this.btnFormation = document.createElement("button");
    this.btnFormation.className = "win-btn";
    this.btnFormation.textContent = "Formation";
    actionRow.appendChild(this.btnFormation);

    this.btnItem = document.createElement("button");
    this.btnItem.className = "win-btn";
    this.btnItem.textContent = "Item";
    actionRow.appendChild(this.btnItem);

    // Toggle Switch for Auto
    const autoContainer = document.createElement("div");
    autoContainer.style.display = "flex";
    autoContainer.style.alignItems = "center";
    autoContainer.style.gap = "6px";
    autoContainer.style.marginLeft = "10px";

    const autoLabel = document.createElement("span");
    autoLabel.textContent = "Auto";
    autoContainer.appendChild(autoLabel);

    this.autoSwitch = document.createElement("label");
    this.autoSwitch.className = "toggle-switch";

    this.autoCheckbox = document.createElement("input");
    this.autoCheckbox.type = "checkbox";
    this.autoSwitch.appendChild(this.autoCheckbox);

    const slider = document.createElement("span");
    slider.className = "toggle-slider";
    this.autoSwitch.appendChild(slider);

    autoContainer.appendChild(this.autoSwitch);
    actionRow.appendChild(autoContainer);

    this.btnFlee = this.addButton("Flee", () => {});
    // btnVictory is removed; using Window_Victory instead.
  }

  updateAutoButton(isAuto) {
      this.autoCheckbox.checked = isAuto;
  }

  onUserClose() {
      this.animator.shake(this.element);
  }

  appendLog(msg) {
    const div = document.createElement("div");
    div.textContent = msg;
    this.logEl.appendChild(div);
    this.logEl.scrollTop = this.logEl.scrollHeight;
  }

  logEnemyEmergence(enemies, terms) {
    this.logEl.textContent = "";
    this.appendLog(terms.enemies_emerge);
    enemies.forEach((e) => {
        const primaryElements = getPrimaryElements(e.elements);
        const elementAscii = primaryElements.map(el => elementToAscii(el)).join('');
        this.appendLog(` - ${e.name} (${e.role}, ${elementAscii})`);
    });
  }

  refresh(battlers, party) {
    this.viewportEl.innerHTML = "";

    const header = document.createElement("div");
    header.textContent = "== BATTLE ==";
    header.style.textAlign = "center";
    header.style.padding = "5px 0";
    this.viewportEl.appendChild(header);

    battlers.forEach((e, idx) => {
        if (!e) return;
        if (e.hidden) return;
        const top = 30 + Math.floor(idx / 2) * 40;
        const left = 20 + (idx % 2) * 220;
        const hp = e.hp;

        const primaryElements = getPrimaryElements(e.elements);
        const elementAscii = primaryElements.map(el => elementToAscii(el)).join('');
        const nameStr = `<span id="battler-enemy-${idx}">${e.name}</span>`;

        const el = document.createElement("div");
        el.className = 'battler-container';
        el.style.position = "absolute";
        el.style.top = `${top}px`;
        el.style.left = `${left}px`;
        el.style.whiteSpace = "pre";
        el.innerHTML = `<div class="battler-name">${elementAscii}${nameStr} (HP ${hp}/${e.maxHp})</div><div class="battler-hp">${this.createHpGauge(hp, e.maxHp)}</div>`;
        this.viewportEl.appendChild(el);
    });

    party.forEach((p, idx) => {
        if (!p) return;
        if (p.hidden) return;
        const top = 140 + Math.floor(idx / 2) * 40;
        const left = 20 + (idx % 2) * 220;
        const hp = p.hp;

        const primaryElements = getPrimaryElements(p.elements);
        const elementAscii = primaryElements.map(el => elementToAscii(el)).join('');
        const nameStr = `<span id="battler-party-${idx}">${p.name}</span>`;

        const el = document.createElement("div");
        el.className = 'battler-container';
        el.style.position = "absolute";
        el.style.top = `${top}px`;
        el.style.left = `${left}px`;
        el.style.whiteSpace = "pre";
        el.innerHTML = `<div class="battler-name">${elementAscii}${nameStr} (HP ${hp}/${p.maxHp})</div><div class="battler-hp">${this.createHpGauge(hp, p.maxHp)}</div>`;
        this.viewportEl.appendChild(el);
    });
  }

  createHpGauge(hp, maxHp) {
    const totalLength = 15;
    let filledCount = Math.round((hp / maxHp) * totalLength);
    if (hp > 0 && filledCount === 0) filledCount = 1;
    if (filledCount < 0) filledCount = 0;
    const emptyCount = totalLength - filledCount;
    if (emptyCount < 0) return `[${"#".repeat(totalLength)}]`;
    return `[${"#".repeat(filledCount)}${" ".repeat(emptyCount)}]`;
  }

  getBattlerId(index, isEnemy) {
      return isEnemy ? `battler-enemy-${index}` : `battler-party-${index}`;
  }

  getBattlerElement(index, isEnemy) {
      return this.viewportEl.querySelector(`#${this.getBattlerId(index, isEnemy)}`);
  }

  getHpElement(index, isEnemy) {
      const el = this.getBattlerElement(index, isEnemy);
      if (!el) return null;
      const container = el.closest('.battler-container');
      if (!container) return null;
      return container.querySelector('.battler-hp');
  }
}

/**
 * @class Window_Victory
 */
export class Window_Victory extends Window_Base {
  constructor() {
    super('center', 'center', 320, 240, { title: "Victory!", id: "victory-window" });

    const contentPanel = this.createPanel();
    contentPanel.style.flex = "1";
    contentPanel.style.padding = "8px";
    contentPanel.style.display = "flex";
    contentPanel.style.flexDirection = "column";
    contentPanel.style.gap = "8px";

    this.messageEl = document.createElement("div");
    this.messageEl.style.fontWeight = "bold";
    this.messageEl.style.textAlign = "center";
    this.messageEl.textContent = "Victory Achieved!";
    contentPanel.appendChild(this.messageEl);

    this.spoilsEl = document.createElement("div");
    this.spoilsEl.style.flex = "1";
    this.spoilsEl.style.whiteSpace = "pre-wrap";
    this.spoilsEl.style.overflowY = "auto";
    this.spoilsEl.style.fontSize = "11px";
    contentPanel.appendChild(this.spoilsEl);

    this.btnClaim = this.addButton("Claim Rewards", () => {});
    // Typically close logic is handled by the caller or btnClaim
  }

  setup(spoils, onClaim) {
      this.spoilsEl.textContent = spoils;
      this.btnClaim.onclick = onClaim;
  }
}
