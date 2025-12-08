
import { test, expect } from '@playwright/test';

test('Log messages have priority', async ({ page }) => {
  // Go to the game page with test mode enabled
  await page.goto('http://localhost:8000/?test=true');

  // Wait for game to initialize
  await page.waitForSelector('#game-container');

  // Start a new run to ensure we are in map scene
  await page.click('#btn-new-run');

  // Verify normal message
  // "New run started." should be normal priority (opacity 1.0)
  const normalMsg = page.locator('.log-message', { hasText: 'New run started.' });
  await expect(normalMsg).toBeVisible();
  await expect(normalMsg).toHaveCSS('opacity', '1');

  // Move to trigger "Your footsteps echo softly"
  // Assuming player starts at some position, moving normally triggers it.
  // We can try to simulate a move or just call logMessage via console since we expose sceneManager.

  await page.evaluate(() => {
     window.sceneManager.currentScene().logMessage("This is a low priority message", "low");
  });

  const lowMsg = page.locator('.log-message', { hasText: 'This is a low priority message' });
  await expect(lowMsg).toBeVisible();

  // Check opacity. It should be 0.5
  await expect(lowMsg).toHaveCSS('opacity', '0.5');

  await page.evaluate(() => {
     window.sceneManager.currentScene().logMessage("This is a normal priority message");
  });

  const normalMsg2 = page.locator('.log-message', { hasText: 'This is a normal priority message' });
  await expect(normalMsg2).toBeVisible();
  await expect(normalMsg2).toHaveCSS('opacity', '1');

});
