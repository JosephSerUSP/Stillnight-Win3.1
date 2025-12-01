const { test, expect } = require('@playwright/test');

test.describe('Game Logic', () => {
  test.beforeEach(async ({ page }) => {
    // Start the local server before running tests if not already running
    // In this environment, we assume the server is running on port 8080
    await page.goto('/?test=true');
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
            window.windowManager,
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
    const battleWindow = page.locator('.window-header span', { hasText: 'Battle – Stillnight' });
    await expect(battleWindow).toBeVisible();

    // Find close button
    const closeBtn = page.locator('.window-header button', { hasText: 'X' }).last();

    // Click close button
    await closeBtn.click();

    // Verify window is still open (shake animation doesn't close it)
    const dialog = page.locator('.window-frame').last();
    await expect(dialog).toBeVisible();

    // Ideally we would check for transform style, but it's transient.
    // Confirming it didn't close is sufficient for logic verification.
    await page.waitForTimeout(600);
    await expect(dialog).toBeVisible();
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
        await page.click('.inspect-value.win-btn', { hasText: '—' }); // Assuming no equipment initially or specific text

        // Find the equip button for the test sword
        // Use .first() to handle potential multiple matches if inventory has duplicates or previous renders
        const equipBtn = page.locator('button.win-btn', { hasText: 'Equip' }).first();
        await expect(equipBtn).toBeVisible();
        await equipBtn.click();

        // Verify the inspect window is still open (Equipment list container)
        const equipList = page.locator('.group-box legend', { hasText: 'Changes' });
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
                 window.windowManager,
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
        // Use force=true because the Battle Window overlay covers the map, blocking normal clicks.
        // We want to verify that even if the click passes (or if we could click), the logic prevents movement.
        await page.click('.tile[data-x="0"][data-y="0"]', { force: true });

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
