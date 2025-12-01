const { test, expect } = require('@playwright/test');

test('Battle UI Features', async ({ page }) => {
  await page.goto('/?test=true');
  await page.waitForLoadState('networkidle');

  // Start New Run
  await page.click('button:has-text("New Run")');

  // Force Battle
  await page.evaluate(() => {
    window.sceneManager.currentScene().startBattle(0, 0);
  });

  // Scope to Battle Window
  const battleWin = page.locator('.window-frame:has-text("Battle – Stillnight")');

  // Check Buttons
  await expect(battleWin.locator('button:has-text("Formation")')).toBeVisible();
  await expect(battleWin.locator('button:has-text("Item")')).toBeVisible();
  await expect(battleWin.locator('button:has-text("Auto: Off")')).toBeVisible();

  // Test Auto Toggle
  await battleWin.locator('button:has-text("Auto: Off")').click();
  await expect(battleWin.locator('button:has-text("Auto: ON")')).toBeVisible();

  // Toggle back
  await battleWin.locator('button:has-text("Auto: ON")').click();
  await expect(battleWin.locator('button:has-text("Auto: Off")')).toBeVisible();

  // Test Formation Button (should open formation window)
  await battleWin.locator('button:has-text("Formation")').click();
  await expect(page.locator('#formation-window')).toBeVisible();
  // Close via Cancel
  await page.click('#formation-window button:has-text("Cancel")');

  // End Battle (Flee for speed)
  // Wait for busy state to clear if any animation
  await page.waitForTimeout(500);
  await battleWin.locator('button:has-text("Flee")').click();

  // Settings check
  await page.click('button:has-text("Settings")');
  await expect(page.locator('text="Auto Battle:"')).toBeVisible();
});
