import { Window_Base } from "./base.js";
import { createToggleSwitch, createBattleUnitSlot, formatHpGaugeText } from "./utils.js";
import { getPrimaryElements, elementToAscii } from "../core/utils.js";
import { UI } from "./builder.js";
import { ProgressionSystem } from "../managers/progression.js";

const GAUGE_LENGTH_STANDARD = 15;
const GAUGE_LENGTH_SUMMONER = 40;

/**
 * @class Window_Battle
 */
export class Window_Battle extends Window_Base {
  constructor() {
    // Increased size to 600x480 to fit the summoner and new layout
    super('center', 'center', 600, 480, { title: "Battle – Stillnight" });

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
    this.btnRound = this.addButton("Resolve Round", () => {
        if (this.handlers.onRound) this.handlers.onRound();
    });

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
            {
                type: 'button',
                props: {
                    className: 'win-btn',
                    label: 'Formation',
                    onClick: () => { if (this.handlers.onFormation) this.handlers.onFormation(); }
                }
            },
            {
                type: 'button',
                props: {
                    className: 'win-btn',
                    label: 'Item',
                    onClick: () => { if (this.handlers.onItem) this.handlers.onItem(); }
                }
            }
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
        if (this.handlers.onAutoToggle) this.handlers.onAutoToggle(val);
    });
    autoSwitchContainer.style.marginLeft = "10px";
    actionRow.appendChild(autoSwitchContainer);

    this.autoCheckbox = autoSwitchContainer.checkbox;
    this.autoSwitch = autoSwitchContainer.querySelector('.toggle-switch');

    this.btnFlee = this.addButton("Flee", () => {
        if (this.handlers.onFlee) this.handlers.onFlee();
    });

    this.handlers = {};
  }

  setHandlers(handlers) {
      this.handlers = { ...this.handlers, ...handlers };
  }

  updateAutoButton(isAuto) {
      this.autoCheckbox.checked = isAuto;
  }

  onUserClose() {
      this.animator.shake(this.element);
  }

  appendLog(msg, options = {}) {
    const div = document.createElement("div");
    div.textContent = msg;
    if (options.priority === 'low') {
        div.style.opacity = '0.5';
    }
    this.logEl.appendChild(div);
    this.logEl.scrollTop = this.logEl.scrollHeight;
  }

  appendToLastLog(msg, options = {}) {
      if (this.logEl.lastElementChild) {
          const span = document.createElement("span");
          span.textContent = " " + msg; // Add space separator
          if (options.priority === 'low') {
              span.style.opacity = '0.5';
          }
          this.logEl.lastElementChild.appendChild(span);
          this.logEl.scrollTop = this.logEl.scrollHeight;
      } else {
          this.appendLog(msg, options);
      }
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

  refresh(battlers, partySlots, partyInstance, battleManager) {
    this.viewportEl.innerHTML = "";

    UI.build(this.viewportEl, {
          type: 'label',
          props: {
              text: "== BATTLE ==",
              style: { display: 'block', textAlign: 'center', padding: '5px 0' }
          }
    });

    const render = (b, idx, type) => {
        if (!b || b.hidden) return;

        const isEnemy = type === 'enemy';
        const isSummoner = type === 'summoner';

        let top, left, width, textAlign;
        let battlerId = '';
        let showMp = false;
        let gaugeLength = GAUGE_LENGTH_STANDARD;
        let battlerH = 48;
        let battlerW = 256;

        // Default positioning logic
        left = battlerW / 8 + (idx % 2) * battlerW;
        top = battlerH + Math.floor(idx / 2) * battlerH;

        if (isEnemy) {
            battlerId = `battler-enemy-${idx}`;
        } else if (isSummoner) {
            // Summoner (3rd row) - Fixed to center
            top = battlerH * 7;
            left = 0;
            width = "100%";
            textAlign = "center";
            battlerId = `battler-summoner`; 
            showMp = true;
            gaugeLength = GAUGE_LENGTH_SUMMONER;
        } else {
            // Party members
            top += battlerH * 2;
            battlerId = `battler-party-${idx}`;
        }

        let evoStatus = 'NONE';
        if (!isEnemy && partyInstance) {
            const status = ProgressionSystem.getEvolutionStatus(b, partyInstance.inventory || [], 1, partyInstance.gold || 0); // floorDepth 1 default
            evoStatus = status.status;
        }

        let actionPreview = null;
        if (!isSummoner && battleManager) {
            actionPreview = battleManager.getPlannedAction(b);
        }

        const slot = createBattleUnitSlot(b, {
            id: battlerId,
            top,
            left: isSummoner ? undefined : left, // Let width: 100% handle summoner if centered
            width,
            textAlign,
            nameElementId: battlerId + '-name',
            evolutionStatus: evoStatus,
            showMp,
            gaugeLength,
            actionPreview
        });

        // Extra positioning for Summoner if needed to center specifically
        // But with width 100% and textAlign center, it should be fine if container is 100% relative to viewport.
        // Viewport is relative? Yes, 'terminal-viewport' is a panel.
        // If left is undefined, it defaults to auto. If width is 100%, it fills.
        // If left is 0, it starts at left edge.
        if (isSummoner) {
            // Override if needed, but 'left' passed to createBattleUnitSlot handles it.
        }

        this.viewportEl.appendChild(slot);
    };

    battlers.forEach((e, idx) => render(e, idx, 'enemy'));
    partySlots.forEach((p, idx) => render(p, idx, 'party'));

    if (partyInstance && partyInstance.slots[4]) {
        render(partyInstance.slots[4], 4, 'summoner');
    }
  }

  getBattlerId(index, isEnemy) {
      if (index === 'summoner') return 'battler-summoner';
      return isEnemy ? `battler-enemy-${index}` : `battler-party-${index}`;
  }

  getBattlerElement(index, isEnemy) {
      const id = this.getBattlerId(index, isEnemy);
      return this.viewportEl.querySelector(`#${id}`);
  }

  getHpElement(index, isEnemy) {
      const el = this.getBattlerElement(index, isEnemy);
      if (!el) return null;
      return el.querySelector('.battler-hp');
  }

  getMpElement(index, isEnemy) {
      const el = this.getBattlerElement(index, isEnemy);
      if (!el) return null;
      return el.querySelector('.battler-mp');
  }

  _getBattlerContext(battler, enemies, partySlots) {
      const enemyIndex = enemies.indexOf(battler);
      if (enemyIndex !== -1) return { index: enemyIndex, isEnemy: true };

      const partyIndex = partySlots.indexOf(battler);
      if (partyIndex !== -1) return { index: partyIndex, isEnemy: false };

      if (battler.role === 'Summoner') return { index: 'summoner', isEnemy: false, isSummoner: true };
      return null;
  }

  /**
   * Animates the HP gauge of a battler.
   */
  animateBattleHpGauge(battler, startHp, endHp, enemies, partySlots) {
    return new Promise((resolve) => {
      const duration = 500;
      const interval = 30;
      let elapsed = 0;

      const ctx = this._getBattlerContext(battler, enemies, partySlots);

      const interpolator = () => {
        elapsed += interval;
        const progress = Math.min(elapsed / duration, 1);
        const currentHp = Math.round(startHp + (endHp - startHp) * progress);

        if (ctx) {
            const hpEl = this.getHpElement(ctx.index, ctx.isEnemy);
            if (hpEl) {
                const gaugeLength = ctx.isSummoner ? GAUGE_LENGTH_SUMMONER : GAUGE_LENGTH_STANDARD;
                hpEl.textContent = formatHpGaugeText(currentHp, battler.maxHp, gaugeLength);
            }
        }

        if (progress < 1) {
          setTimeout(interpolator, interval);
        } else {
          resolve();
        }
      };

      interpolator();
    });
  }

  /**
   * Applies a visual animation class to a battler's DOM element.
   */
  animateBattler(battler, animationType, enemies, partySlots) {
    const ctx = this._getBattlerContext(battler, enemies, partySlots);
    if (!ctx) return;

    const battlerElement = this.getBattlerElement(ctx.index, ctx.isEnemy);

    if (battlerElement) {
      let animationClass = '';
      let duration = 0;

      switch (animationType) {
        case 'flash':
          animationClass = 'blink';
          duration = 200;
          break;
        case 'shake':
          animationClass = 'shake';
          duration = 500;
          break;
        default:
          return;
      }

      battlerElement.classList.add(animationClass);
      setTimeout(() => {
        battlerElement.classList.remove(animationClass);
      }, duration);
    }
  }

  /**
   * Animates the battler's name (e.g. text scramble effect).
   */
  animateBattlerName(battler, enemies, partySlots) {
    return new Promise((resolve) => {
      const originalName = battler.name;
      let frame = 0;
      const maxFrames = 15;
      const interval = 50;

      const ctx = this._getBattlerContext(battler, enemies, partySlots);
      const battlerEl = ctx ? this.getBattlerElement(ctx.index, ctx.isEnemy) : null;

      // Look for the name span.
      // Structure: .battler-container -> .battler-name -> .battler-name-label -> [Elements] [Level] [Name]
      // We need to find the specific span with the name.
      // Standard heuristic: span text matches originalName? Or simply the last text node?
      // createBattlerNameLabel puts name in a span.

      let targetEl = null;
      if (battlerEl) {
          const nameContainer = battlerEl.querySelector('.battler-name-label');
          if (nameContainer) {
              const spans = nameContainer.querySelectorAll('span');
              targetEl = Array.from(spans).find(s => s.textContent === originalName);
          }
      }

      const animator = () => {
        if (frame >= maxFrames) {
          battler.name = originalName;
          if (targetEl) targetEl.textContent = originalName;
          resolve();
          return;
        }

        let newName = "";
        for (let i = 0; i < originalName.length; i++) {
          const char = originalName[i];
          if (i === frame % originalName.length) {
            newName += char === char.toUpperCase() ? char.toLowerCase() : char.toUpperCase();
          } else {
            newName += char;
          }
        }

        if (targetEl) {
            targetEl.textContent = newName;
        } else {
            battler.name = newName;
        }

        frame++;
        setTimeout(animator, interval);
      };

      animator();
    });
  }

  /**
   * Animates the action preview text into the arrow before clearing it.
   */
  animateActionPreview(battler, enemies, partySlots) {
    return new Promise((resolve) => {
      const ctx = this._getBattlerContext(battler, enemies, partySlots);
      const battlerEl = ctx ? this.getBattlerElement(ctx.index, ctx.isEnemy) : null;
      const previewEl = battlerEl ? battlerEl.querySelector('.action-preview') : null;

      if (!previewEl) {
        resolve();
        return;
      }

      const leadingEl = previewEl.querySelector('.action-preview-leading');
      const arrowEl = previewEl.querySelector('.action-preview-arrow');
      const targetEl = previewEl.querySelector('.action-preview-target');

      if (!leadingEl || !arrowEl) {
        previewEl.textContent = '';
        resolve();
        return;
      }

      const leadingRect = leadingEl.getBoundingClientRect();
      const arrowRect = arrowEl.getBoundingClientRect();
      const shift = Math.max(arrowRect.left - leadingRect.left + arrowRect.width, 0);
      previewEl.style.setProperty('--action-preview-shift', `${shift}px`);

      const animatedEls = [leadingEl, targetEl].filter(Boolean);
      if (animatedEls.length === 0) {
        previewEl.textContent = '';
        resolve();
        return;
      }

      let remaining = animatedEls.length;
      const handleComplete = () => {
        remaining -= 1;
        if (remaining === 0) {
          previewEl.textContent = '';
          resolve();
        }
      };

      animatedEls.forEach((el) => {
        el.classList.remove('action-preview-animate');
        void el.offsetWidth; // restart animation
        el.classList.add('action-preview-animate');
        el.addEventListener('animationend', function onEnd() {
          el.removeEventListener('animationend', onEnd);
          handleComplete();
        });
      });
    });
  }

  /**
   * Plays a data-driven animation on a target.
   */
  playAnimation(target, animationId, dataManager, enemies, partySlots) {
       return new Promise((resolve) => {
           if (!dataManager.animations || !dataManager.animations[animationId]) {
               resolve();
               return;
           }

           const anim = dataManager.animations[animationId];
           const ctx = this._getBattlerContext(target, enemies, partySlots);
           if (!ctx) { resolve(); return; }

           const battlerElement = this.getBattlerElement(ctx.index, ctx.isEnemy);
           if (!battlerElement) { resolve(); return; }

           let targetEl = battlerElement;
           let preserveBrackets = false;
           if (anim.targetPart === "hp_gauge") {
                targetEl = this.getHpElement(ctx.index, ctx.isEnemy);
                if (targetEl) preserveBrackets = true;
                else targetEl = battlerElement; // fallback
           }

           if (anim.type === "death_sequence") {
               const hpEl = this.getHpElement(ctx.index, ctx.isEnemy);
               const delay = (ms) => new Promise((res) => setTimeout(res, ms));

               const collapse = async () => {
                   if (hpEl) {
                       for (let i = 15; i >= 0; i--) {
                           hpEl.textContent = `[${" ".repeat(i)}]`;
                           await delay(30);
                       }
                   }
                   if (battlerElement) {
                       this.animateBattler(target, 'flash', enemies, partySlots);
                       await delay(200);
                       target.hidden = true;
                   }
                   resolve();
               };
               collapse();
               return;
           }

           if (anim.type === "text_flow" || anim.type === "text_flow_liquid") {
               const originalText = targetEl.textContent;
               const duration = anim.duration || 1000;
               const interval = anim.interval || 50;
               const sequence = anim.sequence || "*";
               const color = anim.color || "";

               if (color) targetEl.style.color = color;

               let animationContainer = targetEl;
               let contentLen = originalText.length;

               if (preserveBrackets && originalText.startsWith("[") && originalText.endsWith("]")) {
                   contentLen = originalText.length - 2;
                   const innerContent = originalText.substring(1, originalText.length - 1);

                   const measureSpan = document.createElement("span");
                   measureSpan.style.visibility = "hidden";
                   measureSpan.style.position = "absolute";
                   measureSpan.style.whiteSpace = "pre";
                   measureSpan.textContent = innerContent;
                   targetEl.appendChild(measureSpan);
                   const width = measureSpan.getBoundingClientRect().width;
                   targetEl.removeChild(measureSpan);

                   targetEl.innerHTML = "";
                   targetEl.appendChild(document.createTextNode("["));
                   animationContainer = document.createElement("span");
                   animationContainer.style.display = "inline-block";
                   animationContainer.style.width = `${width}px`;
                   animationContainer.style.whiteSpace = "pre";
                   animationContainer.style.overflow = "hidden";
                   animationContainer.style.verticalAlign = "bottom";
                   animationContainer.style.textAlign = "center";
                   targetEl.appendChild(animationContainer);
                   targetEl.appendChild(document.createTextNode("]"));
               }

               let startTime = Date.now();

               const animator = () => {
                   const now = Date.now();
                   const elapsed = now - startTime;
                   if (elapsed >= duration) {
                       targetEl.textContent = originalText;
                       targetEl.style.color = "";
                       resolve();
                       return;
                   }

                   let frameContent = "";

                   if (anim.type === "text_flow_liquid") {
                       for (let i = 0; i < contentLen; i++) {
                           const timeFactor = elapsed / 100;
                           const wave = Math.sin(i * 0.5 + timeFactor);
                           const index = Math.floor(i + timeFactor * 2 + wave * 2) % sequence.length;
                           const safeIndex = (index + sequence.length * 100) % sequence.length;
                           frameContent += sequence[safeIndex];
                       }
                   } else {
                       const offset = Math.floor(elapsed / interval);
                       let s = "";
                       while (s.length < contentLen + sequence.length) s += sequence;
                       const startIdx = (sequence.length - (offset % sequence.length)) % sequence.length;
                       frameContent = s.substring(startIdx, startIdx + contentLen);
                   }

                   animationContainer.textContent = frameContent;

                   setTimeout(animator, interval);
               };
               animator();

           } else {
               resolve();
           }
       });
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
