import { Window_Base } from "./base.js";
import { UI } from "./builder.js";

export class Window_Journal extends Window_Base {
  constructor() {
    super("center", "center", 620, 440, { title: "Journal" });

    const structure = {
      type: "panel",
      props: { className: "journal-layout" },
      children: [
        {
          type: "panel",
          props: { className: "journal-list" },
          children: [{ type: "panel", props: { id: "journal-list" } }],
        },
        {
          type: "panel",
          props: { className: "journal-detail" },
          children: [
            { type: "label", props: { id: "journal-detail-title", className: "journal-detail-title" } },
            { type: "panel", props: { id: "journal-detail-body", className: "journal-detail-body" } },
          ],
        },
      ],
    };

    const root = UI.build(this.content, structure);
    this.listEl = root.querySelector("#journal-list");
    this.detailTitleEl = root.querySelector("#journal-detail-title");
    this.detailBodyEl = root.querySelector("#journal-detail-body");
  }

  renderEntries(entries) {
    this.listEl.innerHTML = "";
    entries.forEach((entry, idx) => {
      const status = entry.completed ? "(Complete)" : `Step ${entry.stage + 1}`;
      const row = UI.build(this.listEl, {
        type: "panel",
        props: {
          className: "journal-row win-btn",
          text: `${entry.title} ${status}`,
          onClick: () => this.renderDetail(entry),
        },
      });
      row.dataset.id = entry.id;
      if (idx === 0) {
        this.renderDetail(entry);
      }
    });
  }

  renderDetail(entry) {
    this.detailTitleEl.textContent = entry.completed
      ? `${entry.title} (Complete)`
      : `${entry.title} — ${entry.current ? entry.current.title : "Complete"}`;

    this.detailBodyEl.innerHTML = "";
    const addLine = (text) => {
      const p = document.createElement("div");
      p.textContent = text;
      this.detailBodyEl.appendChild(p);
    };

    if (entry.overview) addLine(entry.overview);
    if (entry.current && !entry.completed) {
      addLine(`Current: ${entry.current.title}`);
      if (entry.current.description) addLine(entry.current.description);
    } else {
      addLine("All steps complete.");
    }
    if (entry.previous && entry.completed === false && entry.stage > 0) {
      addLine(`Last step: ${entry.previous.title}`);
    }
  }
}
