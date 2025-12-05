import { Window_Base } from "./base.js";
import { UI } from "./builder.js";
import { createBattlerNameLabel, createIcon } from "./utils.js";
import { DataManager } from "../managers/index.js";

/**
 * @class Window_Recruit
 */
export class Window_Recruit extends Window_Base {
  constructor() {
    super('center', 'center', 500, 480, { title: "Recruit", id: "recruit-window" });

    // Scene_Map expects bodyEl and buttonsEl
    this.bodyEl = this.content;
    this.buttonsEl = this.footer;
  }

  /**
   * Renders the recruit information using a layout similar to Window_Inspect.
   * @param {import("../objects/battler.js").Game_Battler} recruit
   * @param {string} [quote] - Optional flavor text/quote.
   */
  render(recruit, quote) {
    this.content.innerHTML = "";
    this.setTitle(`Recruit: ${recruit.name}`);

    const structure = {
        type: 'div',
        class: 'inspect-container',
        style: { display: 'flex', flexDirection: 'column', gap: '8px', height: '100%', paddingBottom: '4px' },
        children: [
            this._buildHeader(recruit),
            this._buildStats(recruit),
            this._buildDetails(recruit),
            quote ? this._buildQuote(quote) : null
        ].filter(Boolean)
    };

    UI.build(this.content, structure);
  }

  _buildHeader(battler) {
      return {
          type: 'div',
          class: 'inspect-header window-panel',
          style: { display: 'flex', alignItems: 'center', padding: '8px', gap: '8px' },
          children: [
              createBattlerNameLabel(battler, { evolutionStatus: 'NONE' }) // Recruits don't show evo status usually
          ]
      };
  }

  _buildStats(battler) {
      const stats = [
          { label: 'HP', value: `${battler.hp}/${battler.maxHp}`, icon: 162 },
          { label: 'ATK', value: battler.atk, icon: 76 },
          { label: 'ASP', value: battler.asp, icon: 82 },
      ];

      return {
          type: 'div',
          class: 'inspect-stats window-panel',
          style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', padding: '8px' },
          children: stats.map(s => ({
              type: 'div',
              style: { display: 'flex', alignItems: 'center', gap: '4px' },
              children: [
                  createIcon(s.icon),
                  { type: 'span', text: `${s.label}: ${s.value}` }
              ]
          }))
      };
  }

  _buildDetails(battler) {
      return {
          type: 'div',
          class: 'inspect-details window-panel',
          style: { flexGrow: '1', display: 'flex', flexDirection: 'column', gap: '8px', padding: '8px', overflowY: 'auto' },
          children: [
              this._buildSection('Skills', battler.skills.map(sId => DataManager.getSkill(sId))),
              this._buildSection('Passives', battler.passives.map(pId => DataManager.getPassive(pId))),
              this._buildEquipment(battler),
              // We could add Elements here if needed
          ]
      };
  }

  _buildSection(title, items) {
      if (!items || items.length === 0) return null;

      return {
          type: 'div',
          children: [
              { type: 'div', class: 'text-functional', text: title, style: { marginBottom: '4px' } },
              {
                  type: 'div',
                  style: { display: 'flex', flexWrap: 'wrap', gap: '4px' },
                  children: items.map(item => ({
                      type: 'span',
                      class: 'window-tag',
                      text: item.name,
                      tooltip: item, // Enables tooltip
                      style: { padding: '2px 6px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px', cursor: 'help' }
                  }))
              }
          ]
      };
  }

  _buildEquipment(battler) {
      const slots = ['weapon', 'armor', 'accessory'];
      const items = slots.map(slot => battler.equipment[slot]).filter(i => i);

      if (items.length === 0) return null;

      return {
          type: 'div',
          children: [
              { type: 'div', class: 'text-functional', text: 'Equipment', style: { marginBottom: '4px' } },
               {
                  type: 'div',
                  style: { display: 'flex', flexWrap: 'wrap', gap: '4px' },
                  children: items.map(item => ({
                      type: 'span',
                      class: 'window-tag',
                      children: [
                          createIcon(item.icon),
                          { type: 'span', text: item.name, style: { marginLeft: '4px' } }
                      ],
                      tooltip: item,
                      style: { display: 'inline-flex', alignItems: 'center', padding: '2px 6px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px', cursor: 'help' }
                  }))
              }
          ]
      };
  }

  _buildQuote(text) {
      return {
          type: 'div',
          class: 'window-panel',
          style: { padding: '8px', fontStyle: 'italic', marginTop: 'auto', textAlign: 'center' },
          text: `"${text}"`
      };
  }
}

/**
 * @class Window_Event
 */
export class Window_Event extends Window_Base {
  constructor() {
    // Dynamic height is handled by 'auto'.
    super('center', 'center', 520, 'auto', { title: "Event", id: "event-window" });

    this.imageContainer = document.createElement("div");
    this.imageContainer.className = "event-image-container";
    this.imageContainer.style.textAlign = "center";
    this.imageContainer.style.marginBottom = "8px";
    this.imageContainer.style.backgroundColor = "#222";
    this.imageContainer.style.display = "none";

    this.imageEl = document.createElement("img");
    this.imageEl.style.maxWidth = "100%";
    this.imageEl.style.maxHeight = "208px";
    this.imageEl.style.border = "1px solid var(--text-functional)";
    this.imageEl.style.imageRendering = "pixelated";
    this.imageEl.onerror = () => {
        if (this.imageEl.src.indexOf("default.png") === -1) {
             this.imageEl.src = `assets/eventArt/default.png`;
        }
    };
    this.imageContainer.appendChild(this.imageEl);
    this.content.appendChild(this.imageContainer);

    // Use a panel for the text/body
    const eventBody = this.createPanel();
    eventBody.style.flexGrow = "1";
    eventBody.style.display = "flex";
    eventBody.style.flexDirection = "column";

    this.descriptionEl = document.createElement('div');
    this.descriptionEl.className = 'event-description';
    this.descriptionEl.style.marginBottom = "10px";
    eventBody.appendChild(this.descriptionEl);

    // Choices handled in footer? Scene_Map currently appends choices to `.event-choices`.
    // I will use footer for choices.
    this.choicesEl = this.footer;
    // Scene_Map expects this.choicesEl to clear/add buttons.
  }

  show(data) {
      this.setTitle(data.title || "Event");

      const imgName = data.image || "default.png";
      this.imageEl.src = `assets/eventArt/${imgName}`;
      this.imageContainer.style.display = "block";

      if (data.style === 'terminal') {
          this.descriptionEl.className = "event-description terminal-style";
          this.descriptionEl.removeAttribute("style");
          this.descriptionEl.textContent = "";
          if (data.description) {
              if (Array.isArray(data.description)) {
                  data.description.forEach(line => this.appendLog(line));
              } else {
                  this.appendLog(data.description);
              }
          }
      } else {
          this.descriptionEl.className = "event-description";
          this.descriptionEl.removeAttribute("style");
          this.descriptionEl.style.marginBottom = "10px";
          this.descriptionEl.innerHTML = "";
          if (data.description) {
              if (Array.isArray(data.description)) {
                  data.description.forEach(line => {
                      if (line instanceof Node) {
                          this.descriptionEl.appendChild(line);
                      } else {
                          const p = document.createElement("div");
                          p.textContent = line;
                          this.descriptionEl.appendChild(p);
                      }
                  });
              } else if (data.description instanceof Node) {
                  this.descriptionEl.appendChild(data.description);
              } else {
                  this.descriptionEl.textContent = data.description;
              }
          }
      }

      this.updateChoices(data.choices);
  }

  appendLog(msg) {
      const p = document.createElement('div');
      if (msg instanceof Node) {
          p.appendChild(msg);
      } else {
          p.textContent = msg;
      }
      this.descriptionEl.appendChild(p);
      this.descriptionEl.scrollTop = this.descriptionEl.scrollHeight;
  }

  updateImage(imageName) {
       this.imageEl.src = `assets/eventArt/${imageName}`;
  }

  updateChoices(choices) {
      this.footer.innerHTML = ""; // Clear footer
      if (choices) {
          choices.forEach(ch => {
              this.addButton(ch.label, ch.onClick);
          });
      }
  }
}
