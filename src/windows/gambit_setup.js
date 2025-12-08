
import { Window_Base } from "./base.js";
import { gambitTargets } from "../../data/gambits.js";

export class Window_GambitSetup extends Window_Base {
    constructor() {
        super("gambit-setup-window");
        this.element.className = "window centered-window gambit-setup";
        this.member = null;
        this.dataManager = null;
    }

    setup(member, dataManager) {
        this.member = member;
        this.dataManager = dataManager;
        this.refresh();
    }

    refresh() {
        this.content.innerHTML = `<h2>Gambits: ${this.member.name}</h2>`;

        if (!this.member.gambits || this.member.gambits.length === 0) {
            this.content.innerHTML += "<p>No gambit slots available. Unlock more on the License Board.</p>";
            this.addCloseButton();
            return;
        }

        const list = document.createElement("div");
        list.style.display = "flex";
        list.style.flexDirection = "column";
        list.style.gap = "5px";

        this.member.gambits.forEach((gambit, index) => {
            const row = document.createElement("div");
            row.className = "gambit-row";
            row.style.display = "flex";
            row.style.gap = "10px";
            row.style.alignItems = "center";
            row.style.background = "rgba(0,0,0,0.3)";
            row.style.padding = "5px";

            // Toggle Active
            const toggle = document.createElement("input");
            toggle.type = "checkbox";
            toggle.checked = gambit.active;
            toggle.title = "Enable/Disable";
            toggle.onchange = (e) => { gambit.active = e.target.checked; };

            // Target Select
            const targetSelect = document.createElement("select");
            targetSelect.style.width = "150px";
            gambitTargets.forEach(t => {
                const opt = document.createElement("option");
                opt.value = t.id;
                opt.textContent = t.name;
                if (t.id === gambit.targetId) opt.selected = true;
                targetSelect.appendChild(opt);
            });
            targetSelect.onchange = (e) => { gambit.targetId = e.target.value; };

            // Skill Select
            const skillSelect = document.createElement("select");
            skillSelect.style.width = "150px";
            // Add Attack
            const optAtk = document.createElement("option");
            optAtk.value = 'attack';
            optAtk.textContent = 'Attack';
            if (gambit.skillId === 'attack') optAtk.selected = true;
            skillSelect.appendChild(optAtk);

            // Add Skills (Only learned skills)
            this.member.skills.forEach(skillId => {
                const opt = document.createElement("option");
                opt.value = skillId;
                if (this.dataManager && this.dataManager.skills[skillId]) {
                    opt.textContent = this.dataManager.skills[skillId].name;
                } else {
                    opt.textContent = skillId;
                }
                if (skillId === gambit.skillId) opt.selected = true;
                skillSelect.appendChild(opt);
            });

            skillSelect.onchange = (e) => { gambit.skillId = e.target.value; };

            const label = document.createElement("span");
            label.textContent = `${index + 1}.`;
            label.style.width = "20px";

            row.appendChild(label);
            row.appendChild(toggle);
            row.appendChild(targetSelect);
            row.appendChild(skillSelect);
            list.appendChild(row);
        });

        this.content.appendChild(list);
        this.addCloseButton();
    }
}
