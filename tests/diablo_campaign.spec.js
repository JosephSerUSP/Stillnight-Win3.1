const { test, expect } = require('@playwright/test');

test.describe('Diablo Campaign Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?test=true');
    await page.evaluate(() => {
      window.ConfigManager.windowAnimations = false;
    });
    await page.waitForFunction(() => window.Scene_Map);
  });

  test('Campaign Initialization', async ({ page }) => {
    // Start New Run
    await page.click('#btn-new-run');

    // Check Map Title
    const mapHeader = page.locator('.window-header span', { hasText: 'Tristram' });
    await expect(mapHeader).toBeVisible();

    // Check Party Members
    const warrior = page.locator('.party-slot-name', { hasText: 'Warrior' });
    const rogue = page.locator('.party-slot-name', { hasText: 'Rogue' });
    const sorcerer = page.locator('.party-slot-name', { hasText: 'Sorcerer' });

    await expect(warrior).toBeVisible();
    await expect(rogue).toBeVisible();
    await expect(sorcerer).toBeVisible();

    // Check Inventory
    await page.evaluate(() => {
        const party = window.sceneManager.currentScene().party;
        const hasScroll = party.inventory.some(i => i.id === 'town_portal_scroll');
        if (!hasScroll) throw new Error("Scroll of Town Portal not found");

        const hasPotion = party.inventory.some(i => i.id === 'healing_potion');
        if (!hasPotion) throw new Error("Healing Potion not found");
    });
  });

  test('Dungeon Entry', async ({ page }) => {
      await page.click('#btn-new-run');

      // Simulate taking the stairs
      await page.evaluate(() => {
          const scene = window.sceneManager.currentScene();
          const gameMap = scene.map;
          // Events are on the current floor object
          const currentFloor = gameMap.floors[gameMap.floorIndex];
          const stairs = currentFloor.events.find(e => e.type === 'stairs');

          if (stairs) {
              scene.executeEvent(stairs);
          } else {
              throw new Error("Stairs not found in Tristram");
          }
      });

      // Check next map title
      // It might take a moment for the transition
      await page.waitForTimeout(1000);
      const mapHeader = page.locator('.window-header span', { hasText: 'Cathedral Level 1' });
      await expect(mapHeader).toBeVisible();
  });
});
