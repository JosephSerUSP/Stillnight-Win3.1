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

  // Leave the injected battle deterministically. Flee is intentionally random
  // gameplay and should not decide whether this UI regression test can proceed.
  await page.evaluate(() => window.sceneManager.pop());
  await page.waitForFunction(() =>
    window.sceneManager.currentScene() &&
    window.sceneManager.currentScene().constructor.name === 'Scene_Map'
  );

  await page.getByRole('button', { name: 'Settings' }).click();
  await page.click('#menu-item-settings-general');
  await expect(page.locator('#options-window')).toBeVisible();
  await expect(page.locator('#options-window')).toContainText('Auto Battle');
});
