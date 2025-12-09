import { Window_Selectable } from "./selectable.js";

export class Window_Command extends Window_Selectable {
  constructor() {
    super(20, 200, 200, 'auto', { title: "Command" });
    this.setup([]);
    this.hide();
  }

  setup(commands, onSelect) {
    this.element.innerHTML = '';
    this.titleEl = document.createElement("div");
    this.titleEl.className = "window-title";
    this.titleEl.textContent = "Command";
    this.element.appendChild(this.titleEl);

    this.listEl = document.createElement("ul");
    this.listEl.className = "selectable-list";
    this.element.appendChild(this.listEl);

    this.commands = commands; // [{ name: 'Attack', key: 'attack' }, ...]
    this.onSelect = onSelect;

    this.refresh();
  }

  refresh() {
    this.listEl.innerHTML = '';
    this.commands.forEach((cmd, index) => {
      const li = document.createElement("li");
      li.textContent = cmd.name;
      li.className = index === this.selectedParamIndex ? "selected" : "";
      if (cmd.disabled) li.classList.add('disabled');

      li.onclick = () => {
          if (cmd.disabled) return;
          this.onSelect(cmd.key);
      };

      this.listEl.appendChild(li);
    });
  }

  show(x, y) {
      if (x !== undefined) this.element.style.left = x + 'px';
      if (y !== undefined) this.element.style.top = y + 'px';
      this.element.style.display = 'block';
      this.select(0);
  }

  hide() {
      this.element.style.display = 'none';
  }
}
