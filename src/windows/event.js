import { Window_Base } from "./base.js";

/**
 * @class Window_Recruit
 */
export class Window_Recruit extends Window_Base {
  constructor() {
    super('center', 'center', 480, 320, { title: "Recruit – Stillnight", id: "recruit-window" });

    this.bodyEl = this.createPanel(); // used by Scene_Map to populate content
    this.buttonsEl = this.footer; // used by Scene_Map to populate buttons
    // Scene_Map appends to buttonsEl.
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

      // Reset base styles
      this.element.style.bottom = "auto";
      this.element.style.top = "50%";
      this.element.style.left = "50%";
      this.element.style.transform = "translate(-50%, -50%)";
      this.element.style.width = "520px";

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
      } else if (data.style === 'dialogue') {
          // VN Style
          this.element.style.top = "auto";
          this.element.style.bottom = "20px";
          this.element.style.left = "50%";
          this.element.style.transform = "translateX(-50%)";
          this.element.style.width = "600px";

          this.descriptionEl.className = "event-description";
          this.descriptionEl.style.marginBottom = "10px";
          this.descriptionEl.style.fontSize = "16px";
          this.descriptionEl.innerHTML = "";

          if (data.description) {
               this.descriptionEl.textContent = data.description;
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
