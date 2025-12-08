const { test, expect } = require('@playwright/test');

test('Journal window opens and displays content', async ({ page }) => {
  await page.goto('/?test=true');

  // Wait for Scene_Map
  await page.waitForFunction(() => window.sceneManager && window.sceneManager.currentScene() && window.sceneManager.currentScene().constructor.name === 'Scene_Map');

  // Click Journal button (J)
  await page.click('#btn-journal');

  // Verify window opens
  const journalWindow = page.locator('#journal-window');
  await expect(journalWindow).toBeVisible();

  // Verify empty message initially
  await expect(page.locator('text="No journal entries."')).toBeVisible();

  // Close window
  await page.click('#journal-window button:has-text("Close")');
  await expect(journalWindow).toBeHidden();

  // Add a journal entry programmatically
  await page.evaluate(() => {
      const scene = window.sceneManager.currentScene();
      scene.party.addJournalEntry({ id: 'test1', title: 'Test Entry', text: 'This is a test.' });
      scene.openJournal();
  });

  await expect(journalWindow).toBeVisible();
  await expect(page.locator('text="Test Entry"')).toBeVisible();
  await expect(page.locator('text="This is a test."')).toBeVisible();

  // Take screenshot
  await page.screenshot({ path: 'verification/journal_screenshot.png' });
});
