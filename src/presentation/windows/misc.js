import { Window_Base } from "./base.js";
import { createToggleSwitch } from "./utils.js";

/**
 * @class Window_Help
 */
export class Window_Help extends Window_Base {
  constructor() {
    super('center', 'center', 400, 350, { title: "Help – Stillnight", id: "help-window" });

    // Use a panel for the help content
    const body = this.createPanel();
    body.className = "window-panel help-body"; // keep help-body for specific styling if needed
    body.style.flexGrow = "1";
    body.style.overflowY = "auto";

    body.innerHTML = `
      <div class="help-section">
        <h2>Controls</h2>
        <div>• Click adjacent tiles (up/down/left/right) or use Arrow/WASD keys to move.</div>
        <div>• Click 'Formation' to change party order.</div>
        <div>• Click 'Inventory' to use items.</div>
      </div>
      <div class="help-section">
        <h2>Map Legend</h2>
        <div class="help-legend-grid">
           <div class="help-legend-item"><div class="help-legend-icon tile-player">☺</div> Party</div>
           <div class="help-legend-item"><div class="help-legend-icon">█</div> Wall</div>
           <div class="help-legend-item"><div class="help-legend-icon tile-enemy">E</div> Enemy</div>
           <div class="help-legend-item"><div class="help-legend-icon tile-recovery">R</div> Recovery</div>
           <div class="help-legend-item"><div class="help-legend-icon tile-stairs">S</div> Stairs</div>
           <div class="help-legend-item"><div class="help-legend-icon tile-shrine">♱</div> Shrine</div>
           <div class="help-legend-item"><div class="help-legend-icon tile-shop">¥</div> Shop</div>
           <div class="help-legend-item"><div class="help-legend-icon tile-recruit">U</div> Recruit</div>
           <div class="help-legend-item"><div class="help-legend-icon tile-fog">?</div> Unseen</div>
        </div>
      </div>
      <div class="help-section">
        <h2>Tips</h2>
        <div>• Front row deals more damage but takes more.</div>
        <div>• Back row is safer but deals less melee damage.</div>
        <div>• You must reach the stairs to unlock the next floor permanently.</div>
      </div>
    `;

    this.btnOk = this.addButton("Close", () => this.onUserClose());
  }
}

/**
 * @class Window_Options
 */
export class Window_Options extends Window_Base {
  constructor(title = "Settings") {
    super('center', 'center', 300, 400, { title: title, id: "options-window" });

    this.bodyEl = this.createPanel();
    this.bodyEl.style.flexGrow = "1";

    this.btnOk = this.addButton("Close", () => this.onUserClose());
    this.options = [];
  }

  setup(options) {
    this.options = options;
    this.refresh();
  }

  refresh() {
    this.bodyEl.innerHTML = "";
    if (!this.options || this.options.length === 0) {
        this.bodyEl.textContent = "No options available.";
        return;
    }

    this.options.forEach(opt => {
        const row = document.createElement("div");
        row.className = "window-row";
        row.style.marginBottom = "8px";
        row.style.alignItems = "center";

        if (opt.type === 'toggle') {
            const toggle = createToggleSwitch(opt.label + ":", opt.value, (val) => {
                if (opt.onChange) opt.onChange(val);
            });
            const labelEl = toggle.querySelector("span");
            if (labelEl) labelEl.style.width = "100px";
            row.appendChild(toggle);

        } else if (opt.type === 'slider') {
            const label = document.createElement("span");
            label.textContent = opt.label + ": ";
            label.style.width = "100px";
            row.appendChild(label);

            const sliderContainer = document.createElement("div");
            sliderContainer.style.flex = "1";
            sliderContainer.style.display = "flex";
            sliderContainer.style.alignItems = "center";
            sliderContainer.style.gap = "8px";

            const input = document.createElement("input");
            input.type = "range";
            input.className = "win-slider";
            input.min = "0";
            input.max = "100";
            input.value = Math.round(opt.value * 100);
            input.style.flex = "1";

            const valueLabel = document.createElement("span");
            valueLabel.textContent = `${input.value}%`;
            valueLabel.style.width = "40px";
            valueLabel.style.textAlign = "right";

            input.addEventListener("input", (e) => {
                const val = parseInt(e.target.value, 10);
                valueLabel.textContent = `${val}%`;
                if (opt.onChange) {
                    opt.onChange(val / 100.0);
                }
            });

            sliderContainer.appendChild(input);
            sliderContainer.appendChild(valueLabel);
            row.appendChild(sliderContainer);

        } else if (opt.type === 'action') {
             const label = document.createElement("span");
             label.textContent = opt.label;
             label.style.width = "100px";

             const btn = document.createElement("button");
             btn.textContent = "Open..."; // Or specific text
             btn.className = "win-btn";
             btn.style.flex = "1";
             btn.onclick = () => {
                 if (opt.action) opt.action();
             };

             row.appendChild(label);
             row.appendChild(btn);

        } else {
            const label = document.createElement("span");
            label.textContent = opt.label + ": ";
            label.style.width = "100px";
            row.appendChild(label);

            if (opt.type === 'select') {
                const select = document.createElement("select");
                select.style.flex = "1";
                opt.options.forEach(choice => {
                    const option = document.createElement("option");
                    option.value = choice.value;
                    option.textContent = choice.label;
                    if (choice.value === opt.value) {
                        option.selected = true;
                    }
                    select.appendChild(option);
                });
                select.addEventListener("change", (e) => {
                    if (opt.onChange) {
                        opt.onChange(e.target.value);
                    }
                });
                row.appendChild(select);
            } else if (opt.type === 'text') {
                 const val = document.createElement("span");
                 val.textContent = opt.value;
                 row.appendChild(val);
            }
        }

        this.bodyEl.appendChild(row);
    });
  }
}
