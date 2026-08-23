import { test, expect } from '@playwright/test';

test('Verify Evolution System', async ({ page }) => {
  await page.goto('/?test=true');
  await page.waitForFunction(() =>
    window.dataManager &&
    window.dataManager.actors &&
    window.dataManager.items &&
    window.sceneManager &&
    window.sceneManager.currentScene() &&
    window.sceneManager.currentScene().constructor.name === 'Scene_Map'
  );

  await page.evaluate(() => {
    window.ConfigManager.windowAnimations = false;

    const scene = window.sceneManager.currentScene();
    scene.party.slots.fill(null);

    const pixieData = window.dataManager.actors.find(a => a.id === 'pixie');
    const pixie = new window.Game_Battler(pixieData);
    scene.party.addMember(pixie);

    pixie.level = 7;
    pixie._baseMaxHp = 20;
    pixie.hp = 20;
    scene.updateParty();
  });

  await page.click('[data-testid="party-slot-0"]');

  const inspectWindow = page.locator('#inspect-window');
  await expect(inspectWindow).toBeVisible();

  const evolveBtn = inspectWindow.locator('button:has-text("Evolution")');
  await expect(evolveBtn).toBeVisible();

  const header = inspectWindow.locator('.inspect-header');
  const evoIcon = header.locator('span[title="Evolution Available"]');
  await expect(evoIcon).toBeVisible();

  await evolveBtn.click();

  const evolutionWindow = page.locator('#evolution-window');
  await expect(evolutionWindow).toBeVisible();
  await expect(evolutionWindow.locator('.evolution-pane').first()).toContainText('Pixie');
  await expect(evolutionWindow.locator('.evolution-pane').last()).toContainText('High Pixie');

  await evolutionWindow.locator('button:has-text("Confirm Evolution")').click();

  const confirmWindow = page.locator('#confirm-window');
  await expect(confirmWindow).toBeVisible();
  await expect(confirmWindow).toContainText('Evolve Pixie into High Pixie?');
  await confirmWindow.locator('button:has-text("OK")').click();

  await expect(evolutionWindow).toBeHidden();
  await page.waitForTimeout(500);

  const slot0 = page.locator('[data-testid="party-slot-0"]');
  await expect(slot0).toContainText('High Pixie');
});
