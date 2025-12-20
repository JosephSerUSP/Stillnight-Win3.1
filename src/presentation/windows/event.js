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

    // --- Standard Event Layout Elements ---
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

    // --- Visual Novel Layout Elements ---
    this.vnContainer = document.createElement("div");
    this.vnContainer.className = "vn-container";
    this.vnContainer.style.display = "none";
    this.vnContainer.style.flexDirection = "row";
    this.vnContainer.style.alignItems = "flex-start"; // Align top
    this.vnContainer.style.gap = "10px";
    this.vnContainer.style.minHeight = "300px";

    this.portraitContainer = document.createElement("div");
    this.portraitContainer.className = "vn-portrait";
    this.portraitContainer.style.flex = "0 0 120px"; // Fixed width for portrait

    this.portraitEl = document.createElement("img");
    this.portraitEl.style.width = "100%";
    this.portraitEl.style.height = "auto";
    this.portraitEl.style.border = "1px solid var(--window-border)";
    this.portraitEl.style.imageRendering = "pixelated";
    this.portraitContainer.appendChild(this.portraitEl);

    this.vnTextContainer = document.createElement("div");
    this.vnTextContainer.className = "vn-text";
    this.vnTextContainer.style.flex = "1";
    this.vnTextContainer.style.display = "flex";
    this.vnTextContainer.style.flexDirection = "column";

    this.vnContainer.appendChild(this.portraitContainer);
    this.vnContainer.appendChild(this.vnTextContainer);
    this.content.appendChild(this.vnContainer);


    // Use a panel for the text/body (Shared / Standard)
    // In standard mode, this is appended to this.content directly (after image).
    // In VN mode, we might move this or duplicate logic.
    // For simplicity, let's keep descriptionEl separate or reparent it.

    // Actually, let's have a dedicated text area for standard mode
    this.standardBody = this.createPanel();
    this.standardBody.style.flexGrow = "1";
    this.standardBody.style.display = "flex";
    this.standardBody.style.flexDirection = "column";

    this.descriptionEl = document.createElement('div');
    this.descriptionEl.className = 'event-description';
    this.descriptionEl.style.marginBottom = "10px";
    this.standardBody.appendChild(this.descriptionEl);

    // Initial State: Standard
    // this.content.appendChild(this.standardBody) is handled by createPanel() usage?
    // Wait, createPanel() creates a div but doesn't append it to content automatically unless we do.
    // Window_Base doesn't automatically append return of createPanel().
    // So I need to append it.

    // In the previous code:
    // const eventBody = this.createPanel();
    // eventBody...
    // this.descriptionEl...
    // Wait, where was eventBody appended?
    // The previous code:
    // "const eventBody = this.createPanel(); ... eventBody.appendChild(this.descriptionEl);"
    // It NEVER appended eventBody to this.content!
    // Ah, `createPanel` usually appends to `this.content`. Let's check `Window_Base`.

    // Assuming createPanel appends to content:
    // I will use `this.descriptionEl` as the primary text target.
    // I will move `this.descriptionEl` depending on layout.

    this.choicesEl = this.footer;
  }

  show(data) {
      this.setTitle(data.title || "Event");

      const layout = data.layout || 'standard';

      if (layout === 'visual_novel') {
          // Switch to VN layout
          this.imageContainer.style.display = "none";
          this.standardBody.style.display = "none";
          this.vnContainer.style.display = "flex";

          // Setup Portrait
          if (data.portrait) {
              this.portraitEl.src = data.portrait;
              this.portraitContainer.style.display = "block";
          } else {
              this.portraitContainer.style.display = "none";
          }

          // Move descriptionEl to VN text container
          this.vnTextContainer.innerHTML = ""; // Clear wrapper
          this.vnTextContainer.appendChild(this.descriptionEl);

          // Reset styles for VN
          this.descriptionEl.className = "event-description vn-style";
          this.descriptionEl.style.height = "100%";
          this.descriptionEl.style.overflowY = "auto";

      } else {
          // Standard Layout
          this.vnContainer.style.display = "none";
          this.standardBody.style.display = "flex"; // If I append standardBody to content

          const imgName = data.image || "default.png";
          this.imageEl.src = `assets/eventArt/${imgName}`;
          this.imageContainer.style.display = "block";

          // Move descriptionEl to standard body
          this.standardBody.innerHTML = "";
          this.standardBody.appendChild(this.descriptionEl);

          // Ensure standardBody is visible in content
          if (!this.standardBody.parentNode) {
               this.content.appendChild(this.standardBody);
          }
      }

      // Populate Text
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
