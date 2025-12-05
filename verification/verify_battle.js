const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:8080?test=true');

  // Start new run
  await page.waitForSelector('button:has-text("New Run")');
  await page.click('button:has-text("New Run")');

  // Wait for transition
  await page.waitForTimeout(1000);

  // Trigger battle
  console.log('Starting battle...');
  await page.evaluate(() => {
      const scene = window.sceneManager.currentScene();
      if (scene.startBattle) {
          scene.startBattle(0, 0);
      } else {
          console.error("Not in Scene_Map");
      }
  });

  // Wait for battle window
  await page.waitForSelector('.battler-container');
  console.log('Battle started.');

  // Click Resolve Round
  await page.click('button:has-text("Resolve Round")');
  console.log('Round resolving...');

  // Wait for animation (middle of animation)
  await page.waitForTimeout(500);

  // Screenshot
  await page.screenshot({ path: 'verification/battle_ui.png' });
  console.log('Screenshot taken.');

  await browser.close();
})();
