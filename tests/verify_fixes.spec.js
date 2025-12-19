import { test, expect } from '@playwright/test';

test('Verify Battle Layout and Evolution Preview', async ({ page }) => {
    // 1. Go to game with test mode
    await page.goto('http://127.0.0.1:8080/?test=true');
    await page.waitForLoadState('networkidle');

    // Disable animations
    await page.evaluate(() => {
        window.ConfigManager.windowAnimations = false;
    });

    // --- BATTLE LAYOUT VERIFICATION ---
    await page.evaluate(async () => {
        const battleManager = new window.BattleManager(window.sceneManager.currentScene().party, window.dataManager);
        const enemies = [
            new window.Game_Battler(window.dataManager.actors.find(a => a.id === 'bat'), 1, true)
        ];

        window.sceneManager.currentScene().startBattle(0, 0);
    });

    const battleWindow = page.locator('.window-frame', { hasText: 'Battle – Stillnight' });
    await expect(battleWindow).toBeVisible();

    // Select the first battler container
    const battlerContainer = page.locator('.battler-container').first();
    await expect(battlerContainer).toBeVisible();

    // Check internal structure: Name then HP
    const name = battlerContainer.locator('.battler-name');
    const hp = battlerContainer.locator('.battler-hp');

    // Verify they are stacked: bounding box comparison
    const nameBox = await name.boundingBox();
    const hpBox = await hp.boundingBox();

    if (nameBox && hpBox) {
        console.log('Name Y:', nameBox.y, 'HP Y:', hpBox.y);
        expect(hpBox.y).toBeGreaterThan(nameBox.y);
    }

    // Take screenshot of battle
    await page.screenshot({ path: 'verification/battle_layout.png' });

    // Reload to reset state
    await page.reload();
    await page.waitForLoadState('networkidle');

    // --- EVOLUTION PREVIEW VERIFICATION ---
    await page.evaluate(async () => {
        const party = window.sceneManager.currentScene().party;
        let pixie = party.members.find(m => m.actorData.id === 'pixie');
        if (!pixie) {
            const data = window.dataManager.actors.find(a => a.id === 'pixie');
            pixie = window.Game_Battler.create(data, 1);
            party.addMember(pixie);
        }

        // Grow to level 20
        if (pixie.level < 20) {
             window.ProgressionSystem.growToLevel(pixie, 20);
        }

        const evolutionData = { evolvesTo: 'highPixie' };
        window.sceneManager.currentScene().openEvolution(pixie, evolutionData);
    });

    const evoWindow = page.locator('#evolution-window');
    await expect(evoWindow).toBeVisible();

    // Verify "After" stats.
    const rightPane = evoWindow.locator('.evolution-pane').nth(1);

    // Check Level text using more specific locator
    // The structure is row -> label, value. Value contains text.
    await expect(rightPane.locator('.inspect-row').filter({ hasText: 'Level' }).locator('.inspect-value')).toHaveText('20');

    // Take screenshot of evolution
    await page.screenshot({ path: 'verification/evolution_preview.png' });
});

test('Verify Shop and Inventory Refactor', async ({ page }) => {
    await page.goto('http://127.0.0.1:8080/?test=true');
    await page.waitForLoadState('networkidle');

    // --- SHOP VERIFICATION ---
    await page.evaluate(() => {
        window.sceneManager.currentScene().startShop();
    });

    const shopWindow = page.locator('#shop-window');
    await expect(shopWindow).toBeVisible();
    await page.screenshot({ path: 'verification/shop_ui.png' });

    // Close shop
    await page.locator('button:has-text("Leave")').click();

    // --- INVENTORY VERIFICATION ---
    await page.locator('button[data-testid="btn-inventory"]').click();

    const invWindow = page.locator('#inventory-window');
    await expect(invWindow).toBeVisible();
    await page.screenshot({ path: 'verification/inventory_ui.png' });
});
