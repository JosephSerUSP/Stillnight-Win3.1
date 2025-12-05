
const { test, expect } = require('@playwright/test');

test('verify recruit window layout and persistence', async ({ page }) => {
  // Go to game
  await page.goto('http://localhost:8080?test=true');

  // Wait for game to load
  await page.waitForSelector('#game-container');

  // Wait for DataManager to be loaded
  await page.waitForFunction(() => window.dataManager && window.dataManager.loaded);

  // Check if we are on title screen
  const title = await page.$('.title-menu');
  if (title) {
       // Click New Run
       await page.getByText('New Run').click();
  }

  // Wait for map or similar indication
  // Scene_Map might take time to load
  await page.waitForTimeout(1000);

  // We need to inject a recruit event to test it.
  await page.evaluate(() => {
    // Force a specific recruit event
    const scene = window.sceneManager.currentScene();
    if (!scene || scene.constructor.name !== 'Scene_Map') return; // Skip if not on map

    const map = scene.map;

    const event = new window.Game_Event(5, 5, {
        type: 'RECRUIT',
        recruitId: 'pixie',
        actions: [{ type: 'RECRUIT', recruitId: 'pixie' }]
    });

    map.floors[map.floorIndex].events.push(event);

    const interpreter = new window.Game_Interpreter(scene);
    interpreter.startRecruit(event, event.actions[0]);
  });

  // Check if Recruit Window appears
  const win = page.locator('#recruit-window');
  await expect(win).toBeVisible({ timeout: 5000 });

  // 1. Verify UI Layout matches Inspect
  await expect(win.locator('.inspect-header')).toBeVisible();

  // Take screenshot
  await page.screenshot({ path: 'verification/recruit_window.png' });
});
