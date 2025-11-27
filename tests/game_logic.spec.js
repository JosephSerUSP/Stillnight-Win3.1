const { test, expect } = require('@playwright/test');

test.describe('Game Logic', () => {
  test.beforeEach(async ({ page }) => {
    // Start the local server before running tests if not already running
    // In this environment, we assume the server is running on port 8080
    await page.goto('http://localhost:8080/?test=true');
  });

  test('Battle window shake on close attempt', async ({ page }) => {
    // Wait for game to load
    await page.waitForSelector('#game-container');

    // Start a new run
    await page.click('#btn-new-run');

    // We need to trigger a battle. Since map generation is random,
    // we can try to find an 'E' tile or inject a battle.
    // Easier: Inject a battle scene directly via console since we have test=true

    await page.evaluate(() => {
        const sceneMap = window.sceneManager.stack[0];
        // Create a dummy battle
        const battleScene = new window.Scene_Battle(
            window.dataManager,
            window.sceneManager,
            sceneMap.party,
            sceneMap.battleManager,
            sceneMap.windowLayer,
            sceneMap.map,
            0, 0
        );
        window.sceneManager.push(battleScene);
        battleScene.start();
    });

    // Wait for battle window to appear
    const battleWindow = page.locator('.dialog-titlebar span', { hasText: 'Battle' });
    await expect(battleWindow).toBeVisible();

    // Find close button
    const closeBtn = page.locator('.dialog-titlebar button', { hasText: 'X' }).last();

    // Click close button
    await closeBtn.click();

    // Verify shake class is added to the dialog
    // We need to check the parent dialog element
    const dialog = page.locator('.dialog').last();
    await expect(dialog).toHaveClass(/shake/);

    // Wait a bit and verify shake is removed
    await page.waitForTimeout(600);
    await expect(dialog).not.toHaveClass(/shake/);
  });

    test('Equipment switch keeps window open', async ({ page }) => {
        await page.waitForSelector('#game-container');
        await page.click('#btn-new-run');

        // Add a dummy item to inventory
        await page.evaluate(() => {
            const sceneMap = window.sceneManager.stack[0];
            const sword = {
                id: "test_sword",
                name: "Test Sword",
                type: "equipment",
                equipType: "Weapon",
                damageBonus: 5,
                cost: 10,
                description: "A test sword"
            };
            sceneMap.party.inventory.push(sword);
            sceneMap.updateAll();
        });

        // Open inspect window for first party member
        await page.click('.party-slot[data-index="0"]');

        // Open equipment screen
        await page.click('.inspect-value.win-btn', { hasText: '—' }); // Assuming no equipment initially or specific text

        // Find the equip button for the test sword
        const equipBtn = page.locator('button.win-btn', { hasText: 'Equip' });
        await expect(equipBtn).toBeVisible();
        await equipBtn.click();

        // Verify the inspect window is still open (Equipment list container)
        const equipList = page.locator('.group-box legend', { hasText: 'Change Equipment' });
        await expect(equipList).toBeVisible();

        // Verify item is now equipped (button should say Swap or disappear if list refreshes)
        // Since we refreshed, the item is now on the character.
        // The list shows "All" by default. The item was in inventory, now it's equipped.
        // It should still appear in the list but maybe with "Swap" if we implemented that logic for equipped items?
        // Wait, the logic is:
        // const otherMemberItems = ... (items on OTHER members)
        // const inventoryItems = ...
        // If I equip it, it's no longer in inventory, so it won't show up in the list unless it's on ANOTHER member.
        // But the current member has it.
        // Let's check if the list is empty or shows "No equipable items" if that was the only item.
        // Or we can check the equipment slot text on the inspect window behind the list.

        // Actually, if I equipped it, it should no longer be in the "available to equip" list for THIS member
        // unless I have another one.
        // So the list might be empty or show other items.
        // Key verification is that the window is STILL VISIBLE.
        await expect(equipList).toBeVisible();
    });

    test('Map interaction blocked during battle', async ({ page }) => {
        await page.waitForSelector('#game-container');
        await page.click('#btn-new-run');

        // Inject battle
        await page.evaluate(() => {
             const sceneMap = window.sceneManager.stack[0];
             // Mock battle
             const battleScene = new window.Scene_Battle(
                 window.dataManager,
                 window.sceneManager,
                 sceneMap.party,
                 sceneMap.battleManager,
                 sceneMap.windowLayer,
                 sceneMap.map,
                 0, 0
             );
             window.sceneManager.push(battleScene);
             // We don't necessarily need to start it fully, just push it.
             // But let's start it to be safe.
             battleScene.start();
        });

        // Try to click a tile
        // We need to find a valid tile to click (e.g., player position or adjacent)
        // Let's try to click the tile at 0,0 (assuming it exists)
        await page.click('.tile[data-x="0"][data-y="0"]');

        // Check if log contains "Your footsteps echo softly" or "You move"
        // It SHOULD NOT because we are in battle.
        const log = page.locator('#log-content');
        const text = await log.textContent();
        expect(text).not.toContain("footsteps echo");

        // Also check if status changed to "You move."
        const status = page.locator('#status-message');
        await expect(status).not.toHaveText("You move.");
    });
});
