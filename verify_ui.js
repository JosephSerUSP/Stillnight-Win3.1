const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto('http://localhost:8080/?test=true');

    // Wait for game to load
    await page.waitForSelector('#game-container');
    await page.click('#btn-new-run');

    // Open Inventory
    await page.click('#btn-inventory');
    await page.waitForSelector('#inventory-window');

    // Screenshot Inventory Centered
    await page.screenshot({ path: 'verification_inventory.png' });

    // Close Inventory
    await page.click('.modal-overlay'); // Click overlay to close (test new functionality)

    // Inject Battle and open it
    await page.evaluate(() => {
        const sceneMap = window.sceneManager.currentScene();
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

    await page.waitForSelector('.window-header span:has-text("Battle – Stillnight")');

    // Screenshot Battle Centered
    await page.screenshot({ path: 'verification_battle.png' });

    // Try to close battle (shake)
    const overlay = page.locator('.modal-overlay').last(); // Battle overlay
    await overlay.click();

    // Take a screenshot immediately to catch shake (might be tricky)
    await page.screenshot({ path: 'verification_battle_shake.png' });

    await browser.close();
})();
