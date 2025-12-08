import { test, expect } from '@playwright/test';

test('Verify Evolution System', async ({ page }) => {
  // 1. Load game with test mode
  await page.goto('/?test=true');
  await page.waitForSelector('#game-container');

  // Disable animations
  await page.evaluate(() => {
    window.ConfigManager.windowAnimations = false;
  });

  // 2. Wait for data to load
  await page.waitForFunction(() => window.dataManager && window.dataManager.actors && window.dataManager.items);

  // 3. Setup Scenario: Add "Pixie" (Lv 1, evolves at 6) and level her up.
  await page.evaluate(() => {
    const scene = window.sceneManager.currentScene();
    if (!scene || !scene.party) return;

    // Clear party slots
    scene.party.slots.fill(null);

    // Add Fayt
    const faytData = window.dataManager.actors.find(a => a.id === 'fayt');
    const fayt = new window.Game_Battler(faytData);
    scene.party.addMember(fayt);

    // Level up to 11 (Strictly greater than 10)
    fayt.level = 11;
    fayt._baseMaxHp = 20;
    fayt.hp = 20;

    // Update UI
    scene.updateParty();
  });

  // 4. Click on the first party member (Fayt) to inspect
  await page.click('[data-testid="party-slot-0"]');

  // 5. Verify Inspect Window is open and "Evolution" button is visible
  const inspectWindow = page.locator('#inspect-window');
  await expect(inspectWindow).toBeVisible();

  const evolveBtn = inspectWindow.locator('button:has-text("Evolution")');
  await expect(evolveBtn).toBeVisible();

  // Verify Icon 6 in name (Title check)
  const header = inspectWindow.locator('.inspect-header');
  const evoIcon = header.locator('span[title="Evolution Available"]');
  await expect(evoIcon).toBeVisible();

  // 6. Click Evolution
  await evolveBtn.click();

  // 7. Verify Evolution Window is open
  const evolutionWindow = page.locator('#evolution-window');
  await expect(evolutionWindow).toBeVisible();

  // Verify content: Left pane Fayt, Right pane Fayt (Awakened)
  // Note: Fayt name might have element icons. Fayt (Awakened) too.
  await expect(evolutionWindow.locator('.evolution-pane').first()).toContainText('Fayt');
  await expect(evolutionWindow.locator('.evolution-pane').last()).toContainText('Fayt (Awakened)');

  // 8. Click Confirm
  await evolutionWindow.locator('button:has-text("Confirm Evolution")').click();

  // 9. Verify Confirmation Popup
  const confirmWindow = page.locator('#confirm-window');
  await expect(confirmWindow).toBeVisible();
  await expect(confirmWindow).toContainText('Evolve Fayt into Fayt (Awakened)?');

  // 10. Click OK
  await confirmWindow.locator('button:has-text("OK")').click();

  // 11. Verify Result
  // Windows should close (Evolution window at least)
  await expect(evolutionWindow).toBeHidden();

  // Party member should be High Pixie
  await page.waitForTimeout(500); // Wait for UI update

  // Check party slot 0 name
  const slot0 = page.locator('[data-testid="party-slot-0"]');
  await expect(slot0).toContainText('Fayt (Awakened)');
});
