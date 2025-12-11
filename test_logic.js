
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const dom = new JSDOM(`<!DOCTYPE html>
<html>
<body>
  <div id="battler-1">
     <div class="action-preview-container">
        <span class="action-name-arrow" data-action-name="Firaga">Firaga --> </span>
        <div class="action-preview-target">Target</div>
     </div>
  </div>
</body>
</html>`);

global.document = dom.window.document;
global.window = dom.window;

// Mock Window_Battle context
const mockWindow = {
    _getBattlerContext: () => ({ index: 1, isEnemy: false }),
    getBattlerElement: () => document.getElementById('battler-1'),
};

// Paste the logic from Window_Battle to verify
mockWindow.animateActionConsumption = function(battler, enemies, partySlots) {
    return new Promise((resolve) => {
      const ctx = this._getBattlerContext(battler, enemies, partySlots);
      if (!ctx) { resolve(); return; }

      const battlerElement = this.getBattlerElement(ctx.index, ctx.isEnemy);
      const previewContainer = battlerElement.querySelector('.action-preview-container');
      const actionNameSpan = battlerElement.querySelector('.action-name-arrow');
      const targetLabel = battlerElement.querySelector('.action-preview-target');

      if (!previewContainer || !actionNameSpan) { resolve(); return; }

      const originalName = actionNameSpan.dataset.actionName || "";
      if (!originalName) {
        previewContainer.style.visibility = 'hidden';
        resolve();
        return;
      }

      let currentName = originalName;
      const interval = 10; // Fast
      const originalLength = originalName.length;

      console.log(`Start: "${currentName}"`);

      const step = () => {
        if (currentName.length > 0) {
          currentName = currentName.slice(0, -1);
          const displayString = currentName.padStart(originalLength, ' ');
          actionNameSpan.textContent = `${displayString} --> `;

          console.log(`Step: "${displayString}"`);

          setTimeout(step, interval);
        } else {
          console.log("Animation Done. Flashing...");
          if (targetLabel) {
             targetLabel.classList.add('blink');
             setTimeout(() => {
                 targetLabel.classList.remove('blink');
                 previewContainer.style.visibility = 'hidden';
                 resolve();
             }, 50);
          } else {
             previewContainer.style.visibility = 'hidden';
             resolve();
          }
        }
      };
      step();
    });
};

// Run simulation
// We can't run this without jsdom installed in the environment (which failed before).
// But I can run logical verification here in my mind or rely on the frontend verification script (python).
// The user asked for "Run a python script to simulate...".
// I'll create a python script that does string manipulation to verify the logic.
