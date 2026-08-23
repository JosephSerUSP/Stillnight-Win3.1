import { test, expect } from '@playwright/test';

test.describe('Sacrifice and Permadeath', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?test=true');
    await page.waitForFunction(() =>
      window.dataManager &&
      window.dataManager.actors &&
      window.sceneManager &&
      window.sceneManager.currentScene() &&
      window.sceneManager.currentScene().constructor.name === 'Scene_Map'
    );
    await page.evaluate(() => { window.ConfigManager.windowAnimations = false; });
  });

  test('Sacrifice a unit', async ({ page }) => {
    const initialMembers = await page.evaluate(() => window.sceneManager.currentScene().party.members.length);
    const initialGold = await page.evaluate(() => window.sceneManager.currentScene().party.gold);

    await page.click('.party-slot[data-index="0"]');
    await expect(page.locator('#inspect-window')).toBeVisible();

    await page.click('button:has-text("Sacrifice")');
    await expect(page.locator('#confirm-window')).toBeVisible();
    await page.click('#confirm-window button:has-text("OK")');

    const finalMembers = await page.evaluate(() => window.sceneManager.currentScene().party.members.length);
    const finalGold = await page.evaluate(() => window.sceneManager.currentScene().party.gold);

    expect(finalMembers).toBe(initialMembers - 1);
    expect(finalGold).toBeGreaterThan(initialGold);
  });

  test('Permadeath in battle', async ({ page }) => {
    const initialMemberCount = await page.evaluate(() => window.sceneManager.currentScene().party.members.length);

    await page.evaluate(() => window.sceneManager.currentScene().startBattle(0, 0));
    await expect(page.locator('#map-mode')).toHaveText('Battle');

    await page.evaluate(() => {
      const battleScene = window.sceneManager.currentScene();
      battleScene.party.members[0].hp = 0;
      battleScene.battleManager.enemies.forEach(enemy => { enemy.hp = 0; });
      battleScene.battleManager.isBattleFinished = true;
      battleScene.battleManager.isVictoryPending = true;
      battleScene.showVictoryPopup();
    });

    await page.click('button:has-text("Claim Rewards")');
    await page.waitForFunction(() =>
      window.sceneManager.currentScene() &&
      window.sceneManager.currentScene().constructor.name === 'Scene_Map'
    );
    await expect(page.locator('#map-mode')).toHaveText('Exploration');

    const memberCount = await page.evaluate(() => window.sceneManager.currentScene().party.members.length);
    expect(memberCount).toBe(initialMemberCount - 1);

    const logText = await page.evaluate(() => document.getElementById('log-content').textContent);
    expect(logText).toContain('has fallen and is lost forever');
  });
});
