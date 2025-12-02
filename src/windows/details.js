import { Window_Base } from "./base.js";
import { createBattlerNameLabel, renderElements, createInteractiveLabel } from "./utils.js";
import { UI } from "./builder.js";

/**
 * @class Window_Inspect
 */
export class Window_Inspect extends Window_Base {
  constructor() {
    super('center', 'center', 480, 320, { title: "Creature – Stillnight", id: "inspect-window" });

    // Initialize content structure using UI.build
    // We create a panel for the main body
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
                type: 'panel',
                props: { className: 'inspect-notes' }
            }
        ]
    });

    // Cache references to dynamically updated elements
    // The structure is: content -> mainPanel -> [0:layout, 1:notes]
    // layout -> [0:sprite, 1:fields]
    const layout = this.mainPanel.children[0];
    this.spriteEl = layout.children[0];
    this.fieldsContainer = layout.children[1];
    this.notesEl = this.mainPanel.children[1];

    // Create fields map for easy access
    this.fieldElements = {};
    const fieldKeys = ["Name", "Level", "Row", "HP", "XP", "Element", "Equipment", "Passive", "Skills", "Flavor"];

    fieldKeys.forEach(key => {
        const isButton = key === "Equipment";
        const row = UI.build(this.fieldsContainer, {
            type: 'flex',
            props: { className: 'inspect-row', align: 'center' },
            children: [
                { type: 'label', props: { className: 'inspect-label', text: key } },
                {
                    type: isButton ? 'button' : 'label',
                    props: { className: isButton ? 'win-btn inspect-value' : 'inspect-value', text: '' }
                }
            ]
        });
        // Store the value element (2nd child)
        this.fieldElements[key] = row.children[1];
    });

    // Map legacy property names to the new elements to maintain API compatibility
    this.nameEl = this.fieldElements["Name"];
    this.levelEl = this.fieldElements["Level"];
    this.rowPosEl = this.fieldElements["Row"];
    this.hpEl = this.fieldElements["HP"];
    this.xpEl = this.fieldElements["XP"];
    this.elementEl = this.fieldElements["Element"];
    this.equipEl = this.fieldElements["Equipment"];
    this.passiveEl = this.fieldElements["Passive"];
    this.skillsEl = this.fieldElements["Skills"];
    this.flavorEl = this.fieldElements["Flavor"];

    // Buttons
    this.btnSacrifice = this.addButton("Sacrifice", () => {});
    this.btnSacrifice.style.marginRight = "auto";
    this.btnSacrifice.style.display = "none";

    this.btnEvolve = this.addButton("Evolution", () => {});
    this.btnEvolve.style.display = "none";

    this.btnOk = this.addButton("OK", () => this.onUserClose());
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

  setup(current, next) {
      this.renderPane(this.leftPane, current);
      this.renderPane(this.rightPane, next);
  }

  renderPane(container, battler) {
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
                      // Fields will be added dynamically below or we can construct data here
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
                  // Placeholder for value, we append the actual element
                  { type: 'panel', props: { className: 'inspect-value' } }
              ]
          });
          const valueContainer = row.children[1];
          // Clear styles/classes that might interfere if we just append?
          // Actually inspect-value is a good class for text, but if we have complex content...
          valueContainer.innerHTML = ''; // Clear default

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
      addRow('Passive', passiveVal);
  }
}
