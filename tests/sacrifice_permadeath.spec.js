import { test, expect } from '@playwright/test';

test.describe('Sacrifice and Permadeath', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?test=true');
    await page.waitForFunction(() => window.dataManager && window.dataManager.actors);
    await page.waitForFunction(() => window.Scene_Battle);
    await page.click('#btn-new-run');
    // Disable animations
    await page.evaluate(() => {
      window.ConfigManager.windowAnimations = false;
    });
  });

  test('Sacrifice a unit', async ({ page }) => {
    // 1. Check initial state
    const initialMembers = await page.evaluate(() => window.sceneManager.currentScene().party.members.length);
    const initialGold = await page.evaluate(() => window.sceneManager.currentScene().party.gold);

    // 2. Open Inspect for first member
    await page.click('.party-slot[data-index="0"]');
    await expect(page.locator('#inspect-window')).toBeVisible();

    // 3. Click Sacrifice
    await page.click('button:has-text("Sacrifice")');
    await expect(page.locator('#confirm-window')).toBeVisible();

    // 4. Confirm
    await page.click('#confirm-window button:has-text("OK")');

    // 5. Verify Member removed and Gold gained
    const finalMembers = await page.evaluate(() => window.sceneManager.currentScene().party.members.length);
    const finalGold = await page.evaluate(() => window.sceneManager.currentScene().party.gold);

    expect(finalMembers).toBe(initialMembers - 1);
    expect(finalGold).toBeGreaterThan(initialGold);
  });

  test('Permadeath in battle', async ({ page }) => {
    // 0. Get initial party count
    const initialMemberCount = await page.evaluate(() => window.sceneManager.currentScene().party.members.length);

    // 1. Force a battle
    await page.evaluate(() => {
        const scene = window.sceneManager.currentScene();
        // Spawning an enemy to start battle (using 'bat' instead of 'rat')
        const enemy = new window.Game_Battler(window.dataManager.actors.find(a => a.id === 'bat'), 1, true);
        scene.battleManager.setup([enemy], 0, 0);
        const battleScene = new window.Scene_Battle(
            window.dataManager,
            window.sceneManager,
            window.windowManager,
            scene.party,
            scene.battleManager,
            scene.windowLayer,
            scene.map,
            0, 0,
            scene.getSharedWindows()
        );
        window.sceneManager.push(battleScene);
    });

    await expect(page.locator('#mode-label')).toHaveText('Battle');

    // 2. Kill a party member and the enemy
    await page.evaluate(() => {
        const bm = window.sceneManager.currentScene().battleManager;
        // Kill first party member
        bm.party.members[0].hp = 0;
        // Kill enemy
        bm.enemies[0].hp = 0;
        // Force victory pending state logic (BattleManager checks end in executeAction/startTurn usually)
        // We can manually trigger check or just set flags
        bm.isBattleFinished = true;
        bm.isVictoryPending = true;
        // Force victory popup
        window.sceneManager.currentScene().showVictoryPopup();
    });

    // 3. Click Claim Spoils
    await page.click('button:has-text("Claim Rewards")');

    // 4. Verify we are back on map and member is gone
    await expect(page.locator('#mode-label')).toHaveText('Exploration');

    const memberCount = await page.evaluate(() => window.sceneManager.currentScene().party.members.length);

    expect(memberCount).toBe(initialMemberCount - 1);

    // Verify Log
    const logText = await page.evaluate(() => document.getElementById('log-content').textContent);
    expect(logText).toContain('has fallen and is lost forever');
  });
});
