
import { Window_Base } from "./base.js";
import { licenses } from "../../data/licenses.js";

export class Window_LicenseBoard extends Window_Base {
    constructor() {
        super("license-board-window");
        this.element.className = "window centered-window license-board";
        this.member = null;
    }

    setup(member, onUnlock) {
        this.member = member;
        this.onUnlock = onUnlock;
        this.refresh();
    }

    refresh() {
        this.content.innerHTML = "";

        const header = document.createElement("div");
        header.innerHTML = `<h2>License Board: ${this.member.name}</h2><p>LP: ${this.member.lp}</p>`;
        this.content.appendChild(header);

        const list = document.createElement("div");
        list.className = "license-list";
        list.style.maxHeight = "400px";
        list.style.overflowY = "auto";
        list.style.display = "grid";
        list.style.gap = "10px";

        // Render licenses
        for (const [id, license] of Object.entries(licenses)) {
            const item = document.createElement("div");
            item.className = "license-item";
            item.style.border = "1px solid #444";
            item.style.padding = "10px";
            item.style.background = "rgba(0,0,0,0.5)";

            const isLearned = this.member.licenses.has(id);
            const canLearn = !isLearned && this.checkPrereqs(id) && this.member.lp >= license.cost;

            item.innerHTML = `
                <div class="license-info">
                    <strong class="license-name" style="color: #ffd700;">${license.name}</strong>
                    <span class="license-cost" style="float: right;">${license.cost} LP</span>
                    <div class="license-desc" style="font-size: 0.9em; color: #ccc;">${license.description}</div>
                </div>
                <div class="license-status" style="margin-top: 5px; text-align: right;">
                    ${isLearned ? '<span style="color: #4caf50;">Learned</span>' : ''}
                </div>
            `;

            if (!isLearned) {
                if (canLearn) {
                    const btn = document.createElement("button");
                    btn.textContent = "Unlock";
                    btn.className = "btn-unlock";
                    btn.onclick = () => {
                        if (this.member.unlockLicense(id)) {
                            if (this.onUnlock) this.onUnlock();
                            this.refresh();
                        }
                    };
                    item.querySelector(".license-status").appendChild(btn);
                } else {
                    const msg = document.createElement("span");
                    msg.textContent = "Locked";
                    msg.style.color = "#777";
                    item.querySelector(".license-status").appendChild(msg);
                }
            }

            list.appendChild(item);
        }

        this.content.appendChild(list);

        this.addCloseButton();
    }

    checkPrereqs(id) {
        const license = licenses[id];
        if (!license.prerequisites) return true;
        return license.prerequisites.every(req => this.member.licenses.has(req));
    }
}
