import { Window_Base } from "./base.js";
import { setPortrait, createIcon } from "./utils.js";
import { Graphics } from "../../core/utils.js";

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
    const baseWidth = 520;
    super('center', 'center', baseWidth, 'auto', { title: "Event", id: "event-window" });
    this.baseWidth = baseWidth;

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
    this.vnContainer.style.alignItems = "stretch";
    this.vnContainer.style.gap = "10px";
    this.vnContainer.style.minHeight = "200px";

    this.portraitsWrapper = document.createElement("div");
    this.portraitsWrapper.className = "vn-portraits-wrapper";
    this.portraitsWrapper.style.display = "flex";
    this.portraitsWrapper.style.flexDirection = "row";
    this.portraitsWrapper.style.alignItems = "flex-end";
    this.portraitsWrapper.style.gap = "0px";

    this.vnTextContainer = document.createElement("div");
    this.vnTextContainer.className = "vn-text";

    this.vnContainer.appendChild(this.portraitsWrapper);
    this.vnContainer.appendChild(this.vnTextContainer);
    this.content.appendChild(this.vnContainer);

    // --- Standard Body (Text Area) ---
    this.standardBody = this.createPanel();
    this.standardBody.style.flexGrow = "1";
    this.standardBody.style.display = "flex";
    this.standardBody.style.flexDirection = "column";

    this.descriptionEl = document.createElement('div');
    this.descriptionEl.className = 'event-description';
    this.descriptionEl.style.marginBottom = "10px";
    this.standardBody.appendChild(this.descriptionEl);

    // Add click listener to skip typing
    this.element.addEventListener('click', (e) => {
        // Only skip if not clicking a button
        if (e.target.closest('button')) return;

        if (this._isTyping) {
            this.finishTyping();
        }
    });

    this.choicesEl = this.footer;
  }

  onOpenComplete() {
      if (this._pendingTypewriter) {
          this.startTypewriter(
              this._pendingTypewriter.textContent,
              this._pendingTypewriter.targetTextEl,
              this._pendingTypewriter.onComplete
          );
          this._pendingTypewriter = null;
      }
  }

  setPortrait(spriteKey, emotion = 'neutral') {
      // Direct update if currently showing VN layout
      if (this.vnContainer.style.display !== 'none') {
          this.renderSpeakers([{ portrait: spriteKey, emotion, active: true }]);
      }
  }

  renderSpeakers(speakers) {
      this.portraitsWrapper.innerHTML = "";
      if (!speakers || speakers.length === 0) {
          this.portraitsWrapper.style.display = "none";
          return;
      }
      this.portraitsWrapper.style.display = "flex";

      speakers.forEach(s => {
          const p = document.createElement("div");
          p.className = "inspect-sprite";
          p.style.width = "128px";
          p.style.height = "192px";
          p.style.flexShrink = "0";
          p.style.transition = "filter 0.2s, opacity 0.2s"; // Smooth transition

          setPortrait(p, s.portrait, s.emotion || 'neutral');

          if (s.active === false) {
              p.style.filter = "brightness(0.5) grayscale(0.3)";
          } else {
              p.style.filter = "none";
              p.style.opacity = "1";
          }

          this.portraitsWrapper.appendChild(p);
      });
  }

  show(data) {
      // Clear lingering choices immediately to prevent layout jumps/stale interactions
      this.footer.innerHTML = "";

      // Custom Title Handling with Icon
      this.titleEl.innerHTML = ""; // Clear existing
      const titleText = data.title || "Event";

      if (data.layout === 'visual_novel') {
           const icon = createIcon(103);
           icon.style.marginRight = "6px";
           icon.style.verticalAlign = "middle";
           this.titleEl.appendChild(icon);
      }

      const textSpan = document.createElement("span");
      textSpan.textContent = titleText;
      textSpan.style.verticalAlign = "middle";
      this.titleEl.appendChild(textSpan);

      const layout = data.layout || 'standard';
      this.currentData = data; // Store data for re-rendering if needed

      if (layout === 'visual_novel') {
          // Switch to VN layout
          this.imageContainer.style.display = "none";
          this.standardBody.style.display = "none";
          this.vnContainer.style.display = "flex";

          // Setup Portraits and Adjust Width
          let speakers = [];
          if (data.speakers) {
              speakers = data.speakers;
          } else if (data.portrait) {
              speakers = [{ portrait: data.portrait, emotion: data.emotion || 'neutral', active: true }];
          }

          this.renderSpeakers(speakers);

          // Resize Window based on speakers
          // Base (1 speaker) = 520px
          // Each extra speaker adds 128px
          const speakerCount = speakers.length || 1;
          const extraSpeakers = Math.max(0, speakerCount - 1);
          const newWidth = this.baseWidth + (extraSpeakers * 128);

          this.element.style.width = `${newWidth}px`;
          // Recalculate center
          const left = (Graphics.width - newWidth) / 2;
          this.element.style.left = `${left}px`;

          // Target Element for Text
          this.targetTextEl = this.vnTextContainer;

      } else {
          // Standard Layout (reset width)
          this.element.style.width = `${this.baseWidth}px`;
          const left = (Graphics.width - this.baseWidth) / 2;
          this.element.style.left = `${left}px`;

          this.vnContainer.style.display = "none";
          this.standardBody.style.display = "flex";

          const imgName = data.image || "default.png";
          this.imageEl.src = `assets/eventArt/${imgName}`;
          this.imageContainer.style.display = "block";

          // Ensure standardBody is visible
          if (!this.standardBody.parentNode) {
               this.content.appendChild(this.standardBody);
          }

          this.targetTextEl = this.descriptionEl;
      }

      // Clear target
      this.targetTextEl.innerHTML = "";
      this.targetTextEl.className = layout === 'visual_novel' ? 'vn-text' : 'event-description';

      if (data.style === 'terminal') {
          this.targetTextEl.classList.add('terminal-style');
      }

      // Handle Text (Typewriter or Instant)
      let textContent = "";
      if (Array.isArray(data.description)) {
          // Check for DOM nodes
          const hasNodes = data.description.some(l => l instanceof Node);
          if (hasNodes) {
               // Render instantly
               data.description.forEach(line => this.appendLog(line, this.targetTextEl));
               this.updateChoices(data.choices);
               return;
          }
          textContent = data.description.join('\n');
      } else if (data.description instanceof Node) {
          this.targetTextEl.appendChild(data.description);
          this.updateChoices(data.choices);
          return;
      } else {
          textContent = data.description || "";
      }

      // Start Typewriter Logic
      const onComplete = () => {
          // Add a small delay before showing choices to prevent accidental double-clicks
          // from skipping text directly into a choice selection.
          setTimeout(() => {
              if (this.element.parentNode) { // Ensure window is still active
                  this.updateChoices(data.choices);
              }
          }, 150);
      };

      if (this.isFullyOpen) {
          this.startTypewriter(textContent, this.targetTextEl, onComplete);
      } else {
          this._pendingTypewriter = {
              textContent,
              targetTextEl: this.targetTextEl,
              onComplete
          };
      }
  }

  startTypewriter(text, container, onComplete) {
      if (this._isTyping) {
          this.finishTyping();
      }
      this.typewriterEffect(text, container, onComplete);
  }

  typewriterEffect(text, container, onComplete) {
      // Clear previous interval
      if (this._typewriterInterval) clearInterval(this._typewriterInterval);

      container.innerHTML = '';

      // Add cursor
      const cursor = document.createElement('span');
      cursor.className = 'blinking-cursor';
      container.appendChild(cursor);

      this._isTyping = true;
      this._fullText = text;
      this._targetContainer = container;
      this._onComplete = onComplete;

      const tokens = this.tokenize(text);
      let tokenIndex = 0;
      let charIndex = 0;

      // Delay: 20ms
      this._typewriterInterval = setInterval(() => {
          if (tokenIndex >= tokens.length) {
              this.finishTyping();
              return;
          }

          const token = tokens[tokenIndex];

          if (token.isTag) {
              cursor.insertAdjacentHTML('beforebegin', token.text);
              tokenIndex++;
          } else {
              const char = token.text[charIndex];
              cursor.insertAdjacentText('beforebegin', char);
              charIndex++;
              if (charIndex >= token.text.length) {
                  charIndex = 0;
                  tokenIndex++;
              }
          }

          container.scrollTop = container.scrollHeight;

      }, 5);
  }

  tokenize(text) {
      // Split by HTML tags
      const parts = text.split(/(<[^>]+>)/g);
      return parts.map(p => {
          if (!p) return null;
          return {
              isTag: p.startsWith('<') && p.endsWith('>'),
              text: p
          };
      }).filter(p => p !== null && p.text !== '');
  }

  finishTyping() {
      if (this._typewriterInterval) clearInterval(this._typewriterInterval);
      this._typewriterInterval = null;
      this._isTyping = false;

      if (this._targetContainer) {
           this._targetContainer.innerHTML = this._fullText;

           // Re-add cursor
           const cursor = document.createElement('span');
           cursor.className = 'blinking-cursor';
           this._targetContainer.appendChild(cursor);
           this._targetContainer.scrollTop = this._targetContainer.scrollHeight;
      }

      if (this._onComplete) {
          this._onComplete();
          this._onComplete = null;
      }
  }

  appendLog(msg, container) {
      const target = container || this.descriptionEl;
      const p = document.createElement('div');
      if (msg instanceof Node) {
          p.appendChild(msg);
      } else {
          p.textContent = msg;
      }
      target.appendChild(p);
      target.scrollTop = target.scrollHeight;
  }

  updateImage(imageName) {
       this.imageEl.src = `assets/eventArt/${imageName}`;
  }

  updateChoices(choices) {
      this.footer.innerHTML = "";
      if (choices) {
          choices.forEach(ch => {
              this.addButton(ch.label, (e) => {
                  e.stopPropagation();
                  if (ch.onClick) ch.onClick(e);
              });
          });
      }
  }
}
