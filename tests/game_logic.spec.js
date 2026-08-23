import { test, expect } from '@playwright/test';

test.describe('Game Logic', () => {
  const waitForMap = async (page) => {
    await page.waitForFunction(() =>
      window.sceneManager &&
      window.sceneManager.currentScene() &&
      window.sceneManager.currentScene().constructor.name === 'Scene_Map'
    );
  };

  test.beforeEach(async ({ page }) => {
    await page.goto('/?test=true');
    await page.waitForFunction(() => window.Scene_Battle && window.ConfigManager);
    await page.evaluate(() => { window.ConfigManager.windowAnimations = false; });
    await waitForMap(page);
  });

  test('Battle window shake on close attempt', async ({ page }) => {
    await page.evaluate(() => window.sceneManager.currentScene().startBattle(0, 0));

    const battleFrame = page.locator('.window-frame:has-text("Battle – Stillnight")');
    await expect(battleFrame).toBeVisible();

    // Window_Battle deliberately rejects direct close attempts by shaking.
    // Scope to the battle window so hidden close buttons from other windows
    // cannot satisfy this locator.
    const closeBtn = battleFrame.locator('.window-header button', { hasText: 'X' });
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();

    await expect(battleFrame).toBeVisible();
    await page.waitForTimeout(600);
    await expect(battleFrame).toBeVisible();
    expect(await page.evaluate(() => window.sceneManager.currentScene().constructor.name)).toBe('Scene_Battle');
  });

  test('Equipment switch keeps window open', async ({ page }) => {
    await page.evaluate(() => {
      const sceneMap = window.sceneManager.currentScene();
      sceneMap.party.inventory.push({
        id: "test_sword",
        name: "Test Sword",
        type: "equipment",
        equipType: "Weapon",
        damageBonus: 5,
        cost: 10,
        description: "A test sword"
      });
      sceneMap.updateAll();
    });

    await page.click('.party-slot[data-index="0"]');
    await page.click('.inspect-value .win-btn', { hasText: 'Unequipped' });

    const equipBtn = page.locator('button.win-btn', { hasText: 'Equip' }).first();
    await expect(equipBtn).toBeVisible();
    await equipBtn.click();

    const equipList = page.locator('.group-box legend', { hasText: 'Changes' });
    await expect(equipList).toBeVisible();
  });

  test('Map interaction blocked during battle', async ({ page }) => {
    await page.evaluate(() => window.sceneManager.currentScene().startBattle(0, 0));

    await page.click('.tile[data-x="0"][data-y="0"]', { force: true });

    const log = page.locator('#log-content');
    const text = await log.textContent();
    expect(text).not.toContain("footsteps echo");

    const status = page.locator('#status-message');
    await expect(status).not.toHaveText("You move.");
  });
});
