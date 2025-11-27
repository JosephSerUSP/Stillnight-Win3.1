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

    // Inject a battle scene directly via console
    await page.evaluate(() => {
        const sceneMap = window.sceneManager.currentScene();
        // Create a dummy battle
        const battleScene = new window.Scene_Battle(
            window.dataManager,
            window.sceneManager,
            sceneMap.party,
            sceneMap.battleManager,
            window.windowManager, // UPDATED: Pass global windowManager
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
            const sceneMap = window.sceneManager.currentScene();
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
        // The equipment field is a button with class "win-btn inspect-value"
        const equipFieldBtn = page.locator('.inspect-value.win-btn').first(); // Should be the equipment button
        await expect(equipFieldBtn).toBeVisible();
        await equipFieldBtn.click();

        // Find the equip button for the test sword
        const equipBtn = page.locator('button.win-btn', { hasText: 'Equip' }).first();
        await expect(equipBtn).toBeVisible();
        await equipBtn.click();

        // Verify the inspect window is still open (Equipment list container)
        const equipList = page.locator('.group-box legend', { hasText: 'Change Equipment' });
        await expect(equipList).toBeVisible();
    });

    test('Map interaction blocked during battle', async ({ page }) => {
        await page.waitForSelector('#game-container');
        await page.click('#btn-new-run');

        // Inject battle
        await page.evaluate(() => {
             const sceneMap = window.sceneManager.currentScene();
             // Mock battle
             const battleScene = new window.Scene_Battle(
                 window.dataManager,
                 window.sceneManager,
                 sceneMap.party,
                 sceneMap.battleManager,
                 window.windowManager, // UPDATED: Pass global windowManager
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
        // Note: The battle window might be covering the map if it's modal.
        // But Playwright click tries to click the element. If it's covered by overlay, it might fail or click overlay.
        // If the overlay captures clicks (pointer-events: auto), the click won't reach the tile.
        // This effectively verifies blocking.
        // However, if Playwright complains "element is not clickable because... receives the click", that IS passing the test requirement physically,
        // but might throw an error in the test script.
        // So we should wrap it in try/catch or expect it to fail?
        // Actually, if we use force: true, it bypasses checks.
        // But we want to simulate user.
        // If we just click, and it hits overlay, the event listener on tile won't fire.
        // So checking the log/status is the correct way to verify *logic*, provided the click *attempt* was made.

        // If the overlay blocks the click, Playwright might error out.
        // Let's see. If it errors, we can catch it and say "blocked".

        try {
            await page.click('.tile[data-x="0"][data-y="0"]', { timeout: 1000 });
        } catch (e) {
            // If it times out or is intercepted, that's good!
            // But we should verify the game state didn't change.
        }

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
