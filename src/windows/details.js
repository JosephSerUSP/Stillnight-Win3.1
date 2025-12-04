import { Window_Base } from "./base.js";
import { createBattlerNameLabel, renderElements, createInteractiveLabel, createGauge } from "./utils.js";
import { UI } from "./builder.js";
import { evaluateFormula } from "../core/utils.js";
import { ProgressionSystem } from "../managers/progression.js";

/**
 * @class Window_Inspect
 */
export class Window_Inspect extends Window_Base {
  constructor() {
    super('center', 'center', 480, 320, { title: "Inspect", id: "inspect-window" });

    // Initialize content structure using UI.build
    this.mainPanel = UI.build(this.content, {
        type: 'panel',
        props: { className: 'window-panel' },
        children: [
            {
                type: 'flex',
                props: { className: 'inspect-layout', gap: '10px' },
                children: [
                    {
                        type: 'panel', // Sprite container
                        props: { className: 'inspect-sprite' }
                    },
                    {
                        type: 'flex', // Fields container
                        props: { className: 'inspect-fields', direction: 'column' }
                    }
                ]
            },
            {
                type: 'panel', // Footer/Notes (Empty now as requested)
                props: { className: 'inspect-notes' }
            }
        ]
    });

    const layout = this.mainPanel.children[0];
    this.spriteEl = layout.children[0];
    this.fieldsContainer = layout.children[1];
    this.notesEl = this.mainPanel.children[1];

    // Buttons
    this.btnSacrifice = this.addButton("Sacrifice", () => {});
    this.btnSacrifice.style.marginRight = "auto";
    this.btnSacrifice.style.display = "none";

    this.btnEvolve = this.addButton("Evolution", () => {});
    this.btnEvolve.style.display = "none";

    this.btnOk = this.addButton("OK", () => this.onUserClose());
  }

  setup(member, context, dataManager, callbacks) {
      this.member = member;
      this.callbacks = callbacks || {};

      // Update Sprite
      const spriteKey = member.spriteKey || 'pixie';
      this.spriteEl.style.backgroundImage = `url('assets/portraits/${spriteKey}.png')`;

      // Clear fields
      this.fieldsContainer.innerHTML = "";

      // 1. Header (Name + Level + Icons)
      const floorDepth = context.floorDepth || 1;
      const gold = context.gold || 0;
      const inventory = context.inventory || [];
      const evoStatus = ProgressionSystem.getEvolutionStatus(member, inventory, floorDepth, gold);

      const headerRow = document.createElement("div");
      headerRow.className = "inspect-header";
      headerRow.style.marginBottom = "8px";

      const nameLabel = createBattlerNameLabel(member, { evolutionStatus: evoStatus.status });
      nameLabel.style.fontSize = "1.2em";
      headerRow.appendChild(nameLabel);
      this.fieldsContainer.appendChild(headerRow);

      // Helper for rows
      const addRow = (label, content) => {
           const row = document.createElement("div");
           row.className = "inspect-row";
           row.style.display = "flex";
           row.style.alignItems = "center";
           row.style.marginBottom = "4px";

           const lbl = document.createElement("span");
           lbl.className = "inspect-label";
           lbl.style.width = "80px";
           lbl.textContent = label;

           const val = document.createElement("div");
           val.className = "inspect-value";
           val.style.flexGrow = "1";

           if (typeof content === 'string' || typeof content === 'number') {
               val.textContent = content;
           } else {
               val.appendChild(content);
           }

           row.appendChild(lbl);
           row.appendChild(val);
           this.fieldsContainer.appendChild(row);
           return val;
      };

      // HP Bar
      const hpContainer = document.createElement("div");
      hpContainer.style.width = "100%";
      hpContainer.style.display = "flex";
      hpContainer.style.alignItems = "center";

      const hpText = document.createElement("span");
      hpText.textContent = `${member.hp}/${member.maxHp}`;
      hpText.style.marginRight = "6px";
      hpText.style.fontSize = "10px";
      hpText.style.minWidth = "50px";

      const hpGauge = createGauge({ height: "8px", color: "var(--gauge-hp)", width: "100%" });
      hpGauge.fill.style.width = `${Math.max(0, (member.hp / member.maxHp) * 100)}%`;

      hpContainer.appendChild(hpText);
      hpContainer.appendChild(hpGauge.container);
      addRow("HP", hpContainer);

      // XP Bar
      const xpNeeded = ProgressionSystem.xpNeeded(member.level, member.expGrowth);
      const xpContainer = document.createElement("div");
      xpContainer.style.width = "100%";
      xpContainer.style.display = "flex";
      xpContainer.style.alignItems = "center";

      const xpText = document.createElement("span");
      xpText.textContent = `${member.xp || 0}/${xpNeeded}`;
      xpText.style.marginRight = "6px";
      xpText.style.fontSize = "10px";
      xpText.style.minWidth = "50px";

      const xpGauge = createGauge({ height: "6px", color: "#60a0ff", bgColor: "#333", width: "100%" });
      const xpPercent = xpNeeded > 0 ? ((member.xp || 0) / xpNeeded) * 100 : 0;
      xpGauge.fill.style.width = `${Math.min(100, Math.max(0, xpPercent))}%`;

      xpContainer.appendChild(xpText);
      xpContainer.appendChild(xpGauge.container);
      addRow("XP", xpContainer);

      // Element & Equipment
      const elEquipContainer = document.createElement("div");
      elEquipContainer.style.display = "flex";
      elEquipContainer.style.alignItems = "center";
      elEquipContainer.style.gap = "10px";

      if (member.elements && member.elements.length > 0) {
          elEquipContainer.appendChild(renderElements(member.elements));
      } else {
          const elSpan = document.createElement("span");
          elSpan.textContent = "—";
          elEquipContainer.appendChild(elSpan);
      }

      // Equipment Button
      const equipText = member.equipmentItem ? member.equipmentItem.name : (member.baseEquipment || "Unequipped");
      const equipBtn = document.createElement("div");
      equipBtn.className = "win-btn";
      equipBtn.textContent = equipText;
      equipBtn.style.cursor = "pointer";
      equipBtn.style.padding = "2px 6px";
      equipBtn.style.fontSize = "0.9em";
      equipBtn.onclick = () => {
          if (this.callbacks.onEquip) this.callbacks.onEquip();
      };
      elEquipContainer.appendChild(equipBtn);

      addRow("Element", elEquipContainer);

      // Skills & Passives Container
      const listsContainer = document.createElement("div");
      listsContainer.style.display = "flex";
      listsContainer.style.gap = "10px";
      listsContainer.style.marginTop = "8px";
      listsContainer.style.marginBottom = "8px";

      // Helper to create list column
      const createListColumn = (title, items, renderer) => {
          const col = document.createElement("div");
          col.style.flex = "1";
          col.style.minWidth = "0"; // Enable truncation in flex child

          const header = document.createElement("div");
          header.textContent = title;
          header.style.fontWeight = "bold";
          header.style.marginBottom = "4px";
          header.style.borderBottom = "1px solid var(--bezel-light)";
          col.appendChild(header);

          const list = document.createElement("div");
          list.style.display = "flex";
          list.style.flexDirection = "column";
          list.style.gap = "2px";

          if (items && items.length > 0) {
              items.forEach(item => {
                  const row = document.createElement("div");
                  row.style.whiteSpace = "nowrap";
                  row.style.overflow = "hidden";
                  row.style.textOverflow = "ellipsis";

                  const content = renderer(item);
                  if (typeof content === 'string') {
                      row.textContent = content;
                  } else {
                      row.appendChild(content);
                  }
                  list.appendChild(row);
              });
          } else {
               const empty = document.createElement("div");
               empty.textContent = "—";
               empty.className = "text-muted";
               list.appendChild(empty);
          }
          col.appendChild(list);
          return col;
      };

      // Skills Column
      const skillsCol = createListColumn("Skills", member.skills || [], (sId) => {
            const skill = dataManager.skills[sId];
            if (skill) {
                let effectsText = "";
                if (skill.effects && skill.effects.length > 0) {
                    const descriptions = [];
                    skill.effects.forEach(eff => {
                         if (eff.type === 'hp_damage') {
                             const val = Math.round(evaluateFormula(eff.formula, member));
                             descriptions.push(`Deals ~${val} Damage`);
                         } else if (eff.type === 'hp_heal') {
                             const val = Math.round(evaluateFormula(eff.formula, member));
                             descriptions.push(`Heals ~${val} HP`);
                         } else if (eff.type === 'add_status') {
                             const chance = Math.round((eff.chance || 1) * 100);
                             descriptions.push(`${chance}% chance to add ${eff.status}`);
                         }
                    });
                    if (descriptions.length > 0) {
                        effectsText = descriptions.join(", ");
                    }
                }
                let tooltipText = skill.description;
                if (effectsText) {
                    tooltipText += `<br/><span style="color:#478174; font-size: 0.9em;">${effectsText}</span>`;
                }
                return createInteractiveLabel(skill, 'skill', { tooltipText });
            }
            return sId;
      });

      // Passives Column
      const passivesCol = createListColumn("Passives", member.passives || [], (pData) => {
           const code = pData.code || pData.id;
           let def = null;
           if (dataManager && dataManager.passives) {
               def = Object.values(dataManager.passives).find(p => p.id === code || p.code === code);
           }
           if (!def) def = pData;
           return createInteractiveLabel(def, 'passive');
      });

      listsContainer.appendChild(skillsCol);
      listsContainer.appendChild(passivesCol);
      this.fieldsContainer.appendChild(listsContainer);

      // Flavor (No label)
      const flavorVal = document.createElement('div');
      flavorVal.textContent = member.flavor || "—";
      flavorVal.style.fontStyle = "italic";
      flavorVal.style.fontSize = "0.9em";
      flavorVal.className = "text-muted";
      flavorVal.style.marginTop = "8px";
      this.fieldsContainer.appendChild(flavorVal);

      // Update Buttons
      const sacrificeValue = member.level * (member.hp + member.maxHp);
      this.btnSacrifice.textContent = `Sacrifice (${sacrificeValue}G)`;
      this.btnSacrifice.style.display = "block";
      this.btnSacrifice.onclick = () => {
          if (this.callbacks.onSacrifice) this.callbacks.onSacrifice(sacrificeValue);
      };

      if (evoStatus.status === 'AVAILABLE') {
          this.btnEvolve.style.display = "inline-block";
          this.btnEvolve.onclick = () => {
              if (this.callbacks.onEvolve) this.callbacks.onEvolve(evoStatus.evolution);
          };
      } else {
          this.btnEvolve.style.display = "none";
      }

      this.notesEl.textContent = "";
  }
}

/**
 * @class Window_Evolution
 */
export class Window_Evolution extends Window_Base {
  constructor() {
    super('center', 'center', 700, 400, { title: "Evolution – Stillnight", id: "evolution-window" });

    // Build main layout
    const structure = {
        type: 'flex',
        props: {
            style: { flexGrow: '1', justifyContent: 'space-between', alignItems: 'center', padding: '10px' }
        },
        children: [
            { type: 'panel', props: { className: 'window-panel evolution-pane', style: { flex: '1' } } },
            { type: 'label', props: { className: 'evolution-arrow', text: '➔' } },
            { type: 'panel', props: { className: 'window-panel evolution-pane', style: { flex: '1' } } }
        ]
    };

    const body = UI.build(this.content, structure);
    this.leftPane = body.children[0];
    this.rightPane = body.children[2];

    this.btnConfirm = this.addButton("Confirm Evolution", () => {});
    this.btnReturn = this.addButton("Return", () => this.onUserClose());
  }

  setup(current, next, dataManager) {
      this.renderPane(this.leftPane, current, dataManager);
      this.renderPane(this.rightPane, next, dataManager);
  }

  renderPane(container, battler, dataManager) {
      container.innerHTML = "";

      const structure = {
          type: 'flex',
          props: { className: 'inspect-layout', gap: '10px' },
          children: [
              {
                  type: 'panel',
                  props: {
                      className: 'inspect-sprite',
                      style: { backgroundImage: `url('assets/portraits/${battler.spriteKey || "pixie"}.png')` }
                  }
              },
              {
                  type: 'flex',
                  props: { className: 'inspect-fields', direction: 'column' },
                  children: [
                      // Fields will be added dynamically below
                  ]
              }
          ]
      };

      const layout = UI.build(container, structure);
      const fieldsContainer = layout.children[1];

      // Helper to add rows
      const addRow = (label, contentElement) => {
          const row = UI.build(fieldsContainer, {
              type: 'flex',
              props: { className: 'inspect-row', align: 'center' },
              children: [
                  { type: 'label', props: { className: 'inspect-label', text: label } },
                  { type: 'panel', props: { className: 'inspect-value' } }
              ]
          });
          const valueContainer = row.children[1];
          valueContainer.innerHTML = '';

          if (contentElement instanceof HTMLElement) {
              valueContainer.appendChild(contentElement);
          } else {
              valueContainer.textContent = contentElement;
          }
      };

      // Name
      const nameVal = document.createElement('span');
      nameVal.appendChild(createBattlerNameLabel(battler));
      addRow('Name', nameVal);

      // Level
      addRow('Level', battler.level);

      // Role
      addRow('Role', battler.role || "—");

      // HP
      addRow('Max HP', `${battler.maxHp}`);

      // Atk
      addRow('Atk', `${battler.atk}`);

      // Element
      const elementVal = document.createElement('span');
      if (battler.elements && battler.elements.length > 0) {
          elementVal.appendChild(renderElements(battler.elements));
      } else {
          elementVal.textContent = "—";
      }
      addRow('Element', elementVal);

      // Skills & Passives Container
      const listsContainer = document.createElement("div");
      listsContainer.style.display = "flex";
      listsContainer.style.gap = "10px";
      listsContainer.style.marginTop = "8px";
      listsContainer.style.marginBottom = "8px";

      // Helper to create list column
      const createListColumn = (title, items, renderer) => {
          const col = document.createElement("div");
          col.style.flex = "1";
          col.style.minWidth = "0"; // Enable truncation in flex child

          const header = document.createElement("div");
          header.textContent = title;
          header.style.fontWeight = "bold";
          header.style.marginBottom = "4px";
          header.style.borderBottom = "1px solid var(--bezel-light)";
          col.appendChild(header);

          const list = document.createElement("div");
          list.style.display = "flex";
          list.style.flexDirection = "column";
          list.style.gap = "2px";

          if (items && items.length > 0) {
              items.forEach(item => {
                  const row = document.createElement("div");
                  row.style.whiteSpace = "nowrap";
                  row.style.overflow = "hidden";
                  row.style.textOverflow = "ellipsis";

                  const content = renderer(item);
                  if (typeof content === 'string') {
                      row.textContent = content;
                  } else {
                      row.appendChild(content);
                  }
                  list.appendChild(row);
              });
          } else {
               const empty = document.createElement("div");
               empty.textContent = "—";
               empty.className = "text-muted";
               list.appendChild(empty);
          }
          col.appendChild(list);
          return col;
      };

      // Skills Column
      const skillsCol = createListColumn("Skills", battler.skills || [], (sId) => {
            const skill = dataManager && dataManager.skills ? dataManager.skills[sId] : null;
            if (skill) {
                // Calculate dynamic effects
                let effectsText = "";
                if (skill.effects && skill.effects.length > 0) {
                    const descriptions = [];
                    skill.effects.forEach(eff => {
                         if (eff.type === 'hp_damage') {
                             const val = Math.round(evaluateFormula(eff.formula, battler));
                             descriptions.push(`Deals ~${val} Damage`);
                         } else if (eff.type === 'hp_heal') {
                             const val = Math.round(evaluateFormula(eff.formula, battler));
                             descriptions.push(`Heals ~${val} HP`);
                         } else if (eff.type === 'add_status') {
                             const chance = Math.round((eff.chance || 1) * 100);
                             descriptions.push(`${chance}% chance to add ${eff.status}`);
                         }
                    });
                    if (descriptions.length > 0) {
                        effectsText = descriptions.join(", ");
                    }
                }

                let tooltipText = skill.description;
                if (effectsText) {
                    tooltipText += `<br/><span style="color:#478174; font-size: 0.9em;">${effectsText}</span>`;
                }
                return createInteractiveLabel(skill, 'skill', { tooltipText });
            }
            return sId;
      });

      // Passives Column
      const passivesCol = createListColumn("Passives", battler.passives || [], (p) => {
           return createInteractiveLabel(p, 'passive');
      });

      listsContainer.appendChild(skillsCol);
      listsContainer.appendChild(passivesCol);
      fieldsContainer.appendChild(listsContainer);

      // Flavor
      const flavorVal = document.createElement('div');
      flavorVal.textContent = battler.flavor || "—";
      flavorVal.style.fontStyle = "italic";
      flavorVal.style.fontSize = "0.9em";
      flavorVal.className = "text-muted";
      flavorVal.style.marginTop = "8px";
      fieldsContainer.appendChild(flavorVal);
  }
}
