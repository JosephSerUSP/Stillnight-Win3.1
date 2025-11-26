const { test, expect } = require('@playwright/test');

test.describe('Creature Inspect Window', () => {
  let scene;

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080?test=true');
    await page.waitForTimeout(500); // Allow game to initialize
    scene = await page.evaluateHandle(() => window.scene);
  });

  test('should open, display data, and allow equipment changes', async ({ page }) => {
    // 1. Add an equippable item to the inventory for testing
    await scene.evaluate(scene => {
      scene.party.inventory.push({
        id: "test_sword",
        name: "Test Sword",
        description: "A sword for testing.",
        type: "equipment",
        equipType: "Weapon",
        damageBonus: 5,
        icon: 1,
      });
    }, scene);

    // 2. Open the inspect window for the first party member
    const firstPartyMember = await scene.evaluate(scene => scene.party.members[0], scene);
    await scene.evaluate(scene => scene.openInspect(scene.party.members[0], 0), scene);

    // 3. Verify the inspect window is visible and shows the correct data
    const inspectWindow = page.locator('#inspect-window');
    await expect(inspectWindow).toBeVisible();
    await expect(inspectWindow.locator('.inspect-value').first()).toContainText(firstPartyMember.name);

    // 4. Click the equipment button to open the equipment screen
    const equipmentButton = inspectWindow.locator('button.inspect-value');
    await equipmentButton.click();

    // 5. Verify the equipment list is now visible
    const equipmentList = inspectWindow.locator('.group-box');
    await expect(equipmentList).toBeVisible();
    await expect(equipmentList).toContainText('Test Sword');

    // 6. Click the "Equip" button for the test sword
    const swordRow = equipmentList.locator('.shop-row:has-text("Test Sword")');
    await swordRow.locator('button:has-text("Equip")').click();

    // 7. The inspect window should close automatically after equipping. Verify it's gone.
    await expect(inspectWindow).not.toBeVisible();

    // 8. Re-open the inspect window to verify the change
    await scene.evaluate(scene => scene.openInspect(scene.party.members[0], 0), scene);
    const updatedEquipmentButton = page.locator('#inspect-window button.inspect-value');
    await expect(updatedEquipmentButton).toContainText('Test Sword');

    // 9. Close the window for cleanup
    await scene.evaluate(scene => scene.closeInspect(), scene);
    await expect(inspectWindow).not.toBeVisible();
  });
});
