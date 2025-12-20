import { Window_Base } from "./base.js";
import { createBattlerNameLabel, renderElements, createInteractiveLabel, createGauge, setPortrait } from "./utils.js";
import { UI } from "./builder.js";

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

  // Expects view model
  setup(memberView, callbacks) {
      this.member = memberView; // Actually view model
      this.callbacks = callbacks || {};

      // Update Sprite
      const spriteKey = memberView.spriteKey || 'pixie';
      setPortrait(this.spriteEl, spriteKey);

      // Clear fields
      this.fieldsContainer.innerHTML = "";

      // 1. Header (Name + Level + Icons)
      const headerRow = document.createElement("div");
      headerRow.className = "inspect-header";
      headerRow.style.marginBottom = "8px";

      const nameLabel = createBattlerNameLabel(memberView, { evolutionStatus: memberView.evolutionStatus });
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
      hpText.textContent = `${memberView.hp}/${memberView.maxHp}`;
      hpText.style.marginRight = "6px";
      hpText.style.fontSize = "10px";
      hpText.style.minWidth = "50px";

      const hpGauge = createGauge({ height: "8px", color: "var(--gauge-hp)", width: "100%" });
      hpGauge.fill.style.width = `${Math.max(0, (memberView.hp / memberView.maxHp) * 100)}%`;

      hpContainer.appendChild(hpText);
      hpContainer.appendChild(hpGauge.container);
      addRow("HP", hpContainer);

      // XP Bar
      const xpContainer = document.createElement("div");
      xpContainer.style.width = "100%";
      xpContainer.style.display = "flex";
      xpContainer.style.alignItems = "center";

      const xpText = document.createElement("span");
      xpText.textContent = `${memberView.xp || 0}/${memberView.xpNeeded}`;
      xpText.style.marginRight = "6px";
      xpText.style.fontSize = "10px";
      xpText.style.minWidth = "50px";

      const xpGauge = createGauge({ height: "6px", color: "#60a0ff", bgColor: "#333", width: "100%" });
      const xpPercent = memberView.xpPercent;
      xpGauge.fill.style.width = `${Math.min(100, Math.max(0, xpPercent))}%`;

      xpContainer.appendChild(xpText);
      xpContainer.appendChild(xpGauge.container);
      addRow("XP", xpContainer);

      // Element & Equipment
      const elEquipContainer = document.createElement("div");
      elEquipContainer.style.display = "flex";
      elEquipContainer.style.alignItems = "center";
      elEquipContainer.style.gap = "10px";

      if (memberView.elements && memberView.elements.length > 0) {
          elEquipContainer.appendChild(renderElements(memberView.elements));
      } else {
          const elSpan = document.createElement("span");
          elSpan.textContent = "—";
          elEquipContainer.appendChild(elSpan);
      }

      // Equipment Button
      let equipBtn;
      if (memberView.equipmentItem) {
          equipBtn = createInteractiveLabel(memberView.equipmentItem, 'item');
          equipBtn.classList.add("win-btn");
          equipBtn.style.padding = "2px 6px";
          equipBtn.style.cursor = "pointer";
      } else {
          equipBtn = document.createElement("div");
          equipBtn.className = "win-btn";
          equipBtn.textContent = memberView.baseEquipment || "Unequipped";
          equipBtn.style.padding = "2px 6px";
          equipBtn.style.fontSize = "0.9em";
          equipBtn.style.cursor = "pointer";
      }

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
      const skillsCol = createListColumn("Skills", memberView.skills || [], (skillView) => {
          // skillView is an object { name, tooltip, ... } prepared by selector
          // createInteractiveLabel expects data (skill object) and type 'skill'
          // It uses description or name for display.
          // Since we passed tooltipText in options, it should use that.
          return createInteractiveLabel(skillView, 'skill', { tooltipText: skillView.tooltip });
      });

      // Passives Column
      const passivesCol = createListColumn("Passives", memberView.passives || [], (p) => {
           return createInteractiveLabel(p, 'passive');
      });

      listsContainer.appendChild(skillsCol);
      listsContainer.appendChild(passivesCol);
      this.fieldsContainer.appendChild(listsContainer);

      // Flavor (No label)
      const flavorVal = document.createElement('div');
      flavorVal.textContent = memberView.flavor || "—";
      flavorVal.style.fontStyle = "italic";
      flavorVal.style.fontSize = "0.9em";
      flavorVal.className = "text-muted";
      flavorVal.style.marginTop = "8px";
      this.fieldsContainer.appendChild(flavorVal);

      // Update Buttons
      const sacrificeValue = memberView.sacrificeValue;
      this.btnSacrifice.textContent = `Sacrifice (${sacrificeValue}G)`;
      this.btnSacrifice.style.display = "block";
      this.btnSacrifice.onclick = () => {
          if (this.callbacks.onSacrifice) this.callbacks.onSacrifice(sacrificeValue);
      };

      if (memberView.evolutionStatus === 'AVAILABLE') {
          this.btnEvolve.style.display = "inline-block";
          this.btnEvolve.onclick = () => {
              if (this.callbacks.onEvolve) this.callbacks.onEvolve(memberView.evolutionData);
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

  // Accepts view models/objects for display.
  setup(currentView, nextView) {
      this.renderPane(this.leftPane, currentView);
      this.renderPane(this.rightPane, nextView);
  }

  renderPane(container, battlerView) {
      container.innerHTML = "";

      const structure = {
          type: 'flex',
          props: { className: 'inspect-layout', gap: '10px' },
          children: [
              {
                  type: 'panel',
                  props: {
                      className: 'inspect-sprite'
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
      const spriteEl = layout.children[0];
      setPortrait(spriteEl, battlerView.spriteKey || "pixie");

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
      nameVal.appendChild(createBattlerNameLabel(battlerView));
      addRow('Name', nameVal);

      // Level
      addRow('Level', battlerView.level);

      // Role
      addRow('Role', battlerView.role || "—");

      // HP
      addRow('Max HP', `${battlerView.maxHp}`);

      // Atk - Note: view model might not have atk unless we added it.
      if (battlerView.atk !== undefined) {
         addRow('Atk', `${battlerView.atk}`);
      }

      // Element
      const elementVal = document.createElement('span');
      if (battlerView.elements && battlerView.elements.length > 0) {
          elementVal.appendChild(renderElements(battlerView.elements));
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
      const skillsCol = createListColumn("Skills", battlerView.skills || [], (skillView) => {
            // skillView is now an object from selectBattlerDetails
            if (skillView.name) {
                return createInteractiveLabel(skillView, 'skill', { tooltipText: skillView.tooltip });
            }
            return skillView; // Fallback if string
      });

      // Passives Column
      const passivesCol = createListColumn("Passives", battlerView.passives || [], (p) => {
           return createInteractiveLabel(p, 'passive');
      });

      listsContainer.appendChild(skillsCol);
      listsContainer.appendChild(passivesCol);
      fieldsContainer.appendChild(listsContainer);

      // Flavor
      const flavorVal = document.createElement('div');
      flavorVal.textContent = battlerView.flavor || "—";
      flavorVal.style.fontStyle = "italic";
      flavorVal.style.fontSize = "0.9em";
      flavorVal.className = "text-muted";
      flavorVal.style.marginTop = "8px";
      fieldsContainer.appendChild(flavorVal);
  }
}
