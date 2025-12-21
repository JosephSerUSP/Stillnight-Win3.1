import { Window_Base } from "./base.js";
import { createIcon } from "./utils.js";

export class Window_Quest extends Window_Base {
  constructor() {
    super("center", "center", 520, "auto", { title: "Quest", id: "quest-window" });
    this.element.classList.add("quest-window");

    this.headerInfo = document.createElement("div");
    this.headerInfo.className = "quest-header";

    this.bodyEl = document.createElement("div");
    this.bodyEl.className = "quest-body";

    this.objectivesEl = document.createElement("ul");
    this.objectivesEl.className = "quest-objectives";

    this.rewardsEl = document.createElement("div");
    this.rewardsEl.className = "quest-rewards";

    this.footer.innerHTML = "";
    this.btnAccept = document.createElement("button");
    this.btnAccept.className = "win-btn primary";
    this.btnAccept.textContent = "Accept Quest";

    this.btnDecline = document.createElement("button");
    this.btnDecline.className = "win-btn";
    this.btnDecline.textContent = "Maybe Later";

    const footerGroup = document.createElement("div");
    footerGroup.className = "quest-footer";
    footerGroup.appendChild(this.btnAccept);
    footerGroup.appendChild(this.btnDecline);
    this.footer.appendChild(footerGroup);

    this.content.appendChild(this.headerInfo);
    this.content.appendChild(this.bodyEl);
    this.content.appendChild(this.objectivesEl);
    this.content.appendChild(this.rewardsEl);
  }

  showQuest(quest, { onAccept, onDecline, canAccept = true } = {}) {
    this.setTitle(quest.title || "Quest");
    this.headerInfo.innerHTML = "";

    const giverLine = document.createElement("div");
    giverLine.className = "quest-giver";
    giverLine.textContent = quest.giver ? `Offered by ${quest.giver}` : "";
    this.headerInfo.appendChild(giverLine);

    const summary = document.createElement("div");
    summary.className = "quest-summary";
    summary.textContent = quest.summary || "";
    this.headerInfo.appendChild(summary);

    this.bodyEl.innerHTML = "";
    const desc = document.createElement("p");
    desc.textContent = quest.description || "";
    this.bodyEl.appendChild(desc);

    this.objectivesEl.innerHTML = "";
    const objectivesTitle = document.createElement("div");
    objectivesTitle.className = "quest-section-title";
    objectivesTitle.textContent = "Objectives";
    this.objectivesEl.appendChild(objectivesTitle);

    (quest.objectives || []).forEach((objective) => {
      const li = document.createElement("li");
      li.className = "quest-objective";
      const icon = createIcon(objective.fulfilled ? 190 : 189);
      icon.classList.add("quest-objective-icon");
      li.appendChild(icon);
      const label = document.createElement("span");
      label.textContent = objective.label || objective.description || "Objective";
      li.appendChild(label);
      this.objectivesEl.appendChild(li);
    });

    this.rewardsEl.innerHTML = "";
    const rewardTitle = document.createElement("div");
    rewardTitle.className = "quest-section-title";
    rewardTitle.textContent = "Rewards";
    this.rewardsEl.appendChild(rewardTitle);

    if (quest.rewards) {
      if (quest.rewards.gold) {
        const goldLine = document.createElement("div");
        goldLine.textContent = `${quest.rewards.gold} gold`;
        goldLine.className = "quest-reward";
        this.rewardsEl.appendChild(goldLine);
      }
      if (Array.isArray(quest.rewards.items)) {
        quest.rewards.items.forEach((item) => {
          const itemLine = document.createElement("div");
          itemLine.textContent = `${item.qty || 1} x ${item.name || item.id}`;
          itemLine.className = "quest-reward";
          this.rewardsEl.appendChild(itemLine);
        });
      }
    }

    this.btnAccept.disabled = !canAccept;
    this.btnAccept.textContent = canAccept ? "Accept Quest" : "Already Accepted";

    this.btnAccept.onclick = () => onAccept && onAccept();
    this.btnDecline.onclick = () => onDecline && onDecline();
  }
}

export class Window_QuestLog extends Window_Base {
  constructor() {
    super("center", "center", 620, 420, { title: "Quest Log", id: "quest-log-window" });
    this.element.classList.add("quest-log-window");

    this.activeContainer = document.createElement("div");
    this.activeContainer.className = "quest-log-section";

    this.completedContainer = document.createElement("div");
    this.completedContainer.className = "quest-log-section";

    this.content.appendChild(this.activeContainer);
    this.content.appendChild(this.completedContainer);
  }

  render(questViews = []) {
    const active = questViews.filter((q) => q && q.status !== "completed");
    const completed = questViews.filter((q) => q && q.status === "completed");

    this._renderSection(this.activeContainer, "Active", active);
    this._renderSection(this.completedContainer, "Completed", completed);
  }

  _renderSection(container, title, quests) {
    container.innerHTML = "";
    const titleEl = document.createElement("h3");
    titleEl.textContent = `${title} Quests`;
    container.appendChild(titleEl);

    if (!quests || quests.length === 0) {
      const empty = document.createElement("div");
      empty.className = "quest-empty";
      empty.textContent = `No ${title.toLowerCase()} quests.`;
      container.appendChild(empty);
      return;
    }

    quests.forEach((quest) => {
      const card = document.createElement("div");
      card.className = "quest-log-card";

      const header = document.createElement("div");
      header.className = "quest-log-card__header";
      const titleEl = document.createElement("div");
      titleEl.textContent = quest.title;
      const status = document.createElement("span");
      status.className = `quest-status quest-status-${quest.status}`;
      status.textContent = quest.status;
      header.appendChild(titleEl);
      header.appendChild(status);

      const summary = document.createElement("div");
      summary.className = "quest-log-card__summary";
      summary.textContent = quest.summary;

      const objectives = document.createElement("ul");
      objectives.className = "quest-log-card__objectives";
      (quest.objectives || []).forEach((obj) => {
        const li = document.createElement("li");
        li.textContent = obj.label;
        if (obj.fulfilled) li.classList.add("done");
        objectives.appendChild(li);
      });

      card.appendChild(header);
      card.appendChild(summary);
      card.appendChild(objectives);
      container.appendChild(card);
    });
  }
}
