import { Window_Base } from "./base.js";
import { createToggleSwitch } from "./utils.js";
import { getPrimaryElements, elementToAscii } from "../core/utils.js";
import { UI } from "./builder.js";

/**
 * @class Window_Battle
 */
export class Window_Battle extends Window_Base {
  constructor() {
    super('center', 'center', 528, 360, { title: "Battle – Stillnight" });

    // 1. Content: Terminal with Viewport and Log
    const contentStructure = {
        type: 'flex',
        props: { className: 'terminal', direction: 'column' },
        children: [
            {
                type: 'panel',
                props: { className: 'terminal-viewport', id: 'battle-viewport' }
            },
            {
                type: 'panel',
                props: { className: 'terminal-log', id: 'battle-log' }
            }
        ]
    };

    const terminal = UI.build(this.content, contentStructure);
    // Flex container children: [0] viewport, [1] log
    this.viewportEl = terminal.children[0];
    this.logEl = terminal.children[1];

    // 2. Footer: Action Buttons
    this.btnRound = this.addButton("Resolve Round", () => {});

    // Action Row Structure
    const actionRowStructure = {
        type: 'flex',
        props: {
            style: {
                gap: '4px',
                padding: '4px',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%'
            }
        },
        children: [
            { type: 'button', props: { className: 'win-btn', label: 'Formation' } },
            { type: 'button', props: { className: 'win-btn', label: 'Item' } }
        ]
    };

    // Build detached and insert
    const actionRow = UI.build(null, actionRowStructure);
    this.footer.insertBefore(actionRow, this.footer.firstChild);

    this.btnFormation = actionRow.children[0];
    this.btnItem = actionRow.children[1];

    // Auto Toggle
    // The helper createToggleSwitch returns a label containing a checkbox.
    const autoSwitchContainer = createToggleSwitch("Auto", false, (val) => {
        // Callback handled by Scene listeners if needed, or polling check state
    });
    autoSwitchContainer.style.marginLeft = "10px";
    actionRow.appendChild(autoSwitchContainer);

    this.autoCheckbox = autoSwitchContainer.checkbox;
    this.autoSwitch = autoSwitchContainer.querySelector('.toggle-switch');

    this.btnFlee = this.addButton("Flee", () => {});
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

    UI.build(this.viewportEl, {
          type: 'label',
          props: {
              text: "== BATTLE ==",
              style: { display: 'block', textAlign: 'center', padding: '5px 0' }
          }
    });

    const renderBattler = (b, idx, isEnemy) => {
        if (!b || b.hidden) return;

        const top = isEnemy ? 30 + Math.floor(idx / 2) * 40 : 140 + Math.floor(idx / 2) * 40;
        const left = 20 + (idx % 2) * 220;

        const primaryElements = getPrimaryElements(b.elements);
        const elementAscii = primaryElements.map(el => elementToAscii(el)).join('');

        const battlerId = isEnemy ? `battler-enemy-${idx}` : `battler-party-${idx}`;

        // Use UI.build for the battler container
        const container = UI.build(this.viewportEl, {
            type: 'panel',
            props: {
                className: 'battler-container',
                style: {
                    position: 'absolute',
                    top: `${top}px`,
                    left: `${left}px`,
                    whiteSpace: 'pre'
                }
            },
            children: [
               {
                   type: 'label',
                   props: { className: 'battler-name' },
               },
               {
                   type: 'label',
                   props: { className: 'battler-hp', text: this.createHpGauge(b.hp, b.maxHp) }
               }
            ]
        });

        const nameEl = container.children[0];
        nameEl.innerHTML = `${elementAscii}<span id="${battlerId}">${b.name}</span> (HP ${b.hp}/${b.maxHp})`;
    };

    battlers.forEach((e, idx) => renderBattler(e, idx, true));
    party.forEach((p, idx) => renderBattler(p, idx, false));
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

    const structure = {
        type: 'flex',
        props: {
            className: 'window-panel',
            style: { flex: '1', padding: '8px', gap: '8px' },
            direction: 'column'
        },
        children: [
            {
                type: 'label',
                props: {
                    text: 'Victory Achieved!',
                    style: { fontWeight: 'bold', textAlign: 'center' }
                }
            },
            {
                type: 'panel', // Spoils container
                props: {
                    style: { flex: '1', whiteSpace: 'pre-wrap', overflowY: 'auto', fontSize: '11px' }
                }
            }
        ]
    };

    const panel = UI.build(this.content, structure);
    this.messageEl = panel.children[0];
    this.spoilsEl = panel.children[1];

    this.btnClaim = this.addButton("Claim Rewards", () => {});
  }

  setup(spoils, onClaim) {
      this.spoilsEl.textContent = spoils;
      this.btnClaim.onclick = onClaim;
  }
}
