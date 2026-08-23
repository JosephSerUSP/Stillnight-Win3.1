import { test, expect } from '@playwright/test';

test('Battle UI Features', async ({ page }) => {
  await page.goto('/?test=true');
  await page.waitForFunction(() =>
    window.sceneManager &&
    window.sceneManager.currentScene() &&
    window.sceneManager.currentScene().constructor.name === 'Scene_Map'
  );

  await page.evaluate(() => {
    window.ConfigManager.windowAnimations = false;
    window.sceneManager.currentScene().startBattle(0, 0);
  });

  const battleWin = page.locator('.window-frame:has-text("Battle – Stillnight")');
  await expect(battleWin.locator('button:has-text("Formation")')).toBeVisible();
  await expect(battleWin.locator('button:has-text("Item")')).toBeVisible();

  const autoSwitchContainer = battleWin.locator('div:has(> span:text-is("Auto"))');
  await expect(autoSwitchContainer).toBeVisible();
  const autoSwitch = autoSwitchContainer.locator('.toggle-switch');
  const autoSwitchInput = autoSwitch.locator('input');

  await autoSwitch.click();
  await expect(autoSwitchInput).toBeChecked();
  await autoSwitch.click();
  await expect(autoSwitchInput).not.toBeChecked();

  await battleWin.locator('button:has-text("Formation")').click();
  await expect(page.locator('#formation-window')).toBeVisible();
  await page.click('#formation-window button:has-text("Cancel")');

  await page.waitForTimeout(500);
  await battleWin.locator('button:has-text("Flee")').click();

  await page.click('button:has-text("Settings")');
  await expect(page.locator('text="Auto Battle:"')).toBeVisible();
});
