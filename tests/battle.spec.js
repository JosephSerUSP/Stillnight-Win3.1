const { test, expect } = require('@playwright/test');

test.describe('Battle Screen', () => {
  let scene;

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080?test=true');
    await page.evaluate(() => window.startGame());
    scene = await page.evaluateHandle(() => window.scene);
  });

  test('should render battlers correctly inside Window_Battle', async ({ page }) => {
    // 1. Force a battle to start
    await scene.evaluate(scene => {
      scene.openBattle(1, 1);
    });

    // 2. Check that the battle window is visible
    const battleWindow = page.locator('#window-layer .modal-overlay.active .dialog');
    await expect(battleWindow).toBeVisible();

    // 3. Get the battler data from the game state
    const battleScene = await page.evaluateHandle(() => window.scene);
    const enemies = await battleScene.evaluate(scene => scene.enemies);
    const party = await battleScene.evaluate(scene => scene.party.members.slice(0, 4));

    // 4. Verify that the correct number of battler containers are rendered
    const battlerContainers = battleWindow.locator('.battler-container');
    await expect(battlerContainers).toHaveCount(enemies.length + party.length);

    // 5. Verify the content of a sample enemy and party member
    const firstEnemy = enemies[0];
    const firstEnemyLocator = battleWindow.locator(`#battler-${firstEnemy.name.replace(/\s/g, '-')}`).first();
    await expect(firstEnemyLocator).toBeVisible();
    await expect(firstEnemyLocator.locator('xpath=..')).toContainText(`(HP ${firstEnemy.hp}/${firstEnemy.maxHp})`);

    const firstPartyMember = party[0];
    const firstPartyMemberLocator = battleWindow.locator(`#battler-${firstPartyMember.name.replace(/\s/g, '-')}`).first();
    await expect(firstPartyMemberLocator).toBeVisible();
    await expect(firstPartyMemberLocator.locator('xpath=..')).toContainText(`(HP ${firstPartyMember.hp}/${firstPartyMember.maxHp})`);

    // 6. Close the battle window
     await battleScene.evaluate(scene => {
      scene.battleWindow.close();
    });
     await expect(battleWindow).not.toBeVisible();
  });
});
