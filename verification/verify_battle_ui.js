const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Navigate to the battle test URL
  await page.goto('http://127.0.0.1:8080/index.html?test=true');

  // Wait for sceneManager and dataManager
  await page.waitForFunction(() =>
      window.dataManager &&
      window.dataManager.actors &&
      window.dataManager.maps &&
      window.sceneManager
  );

  // Wait for Scene_Map to be active
  await page.waitForFunction(() => {
      const scene = window.sceneManager.currentScene();
      return scene && scene.constructor.name === 'Scene_Map';
  });

  // Trigger a battle via the existing scene
  await page.evaluate(() => {
    const scene = window.sceneManager.currentScene();
    scene.startBattle(0, 0);
  });

  // Wait for battle window
  // Use a selector specific to the Battle Window to avoid HUD buttons
  const battleWindowSelector = '.win-window:has-text("Battle – Stillnight")';
  await page.waitForSelector(battleWindowSelector);

  // Take screenshot of initial battle UI (Auto switch check)
  await page.screenshot({ path: 'verification/battle_ui_initial.png' });
  console.log("Screenshot taken: verification/battle_ui_initial.png");

  // Click Formation BUTTON inside the battle window
  // "Formation" text might be in HUD too, so scope it
  await page.click(`${battleWindowSelector} button:has-text("Formation")`);

  // Wait for formation window to appear
  await page.waitForSelector('.formation-slot');
  await page.screenshot({ path: 'verification/battle_ui_formation.png' });
  console.log("Screenshot taken: verification/battle_ui_formation.png");

  // Close formation
  await page.click('button:has-text("Cancel")');

  // Toggle Auto Switch
  // Scope to battle window
  const autoSwitch = await page.$(`${battleWindowSelector} .toggle-switch`);
  if (autoSwitch) {
      await autoSwitch.click();
      await page.waitForTimeout(500); // Wait for visual toggle
      await page.screenshot({ path: 'verification/battle_ui_auto_toggled.png' });
      console.log("Screenshot taken: verification/battle_ui_auto_toggled.png");
  }

  await browser.close();
})();
