
const { test, expect } = require('@playwright/test');

test.setTimeout(60000); // Increase timeout to 60s

test('Quest Window Verification', async ({ page }) => {
  // 1. Navigate to the game with test mode enabled
  await page.goto('/?test=true');

  // 2. Wait for game initialization
  await page.waitForFunction(() => window.sceneManager && window.sceneManager.currentScene());

  // 3. Inject a test quest data
  await page.evaluate(() => {
    window.dataManager.quests = {
      'test_quest': {
        id: 'test_quest',
        title: 'Test Quest',
        description: 'This is a test quest description to verify the UI layout.',
        rewards: [
          { type: 'gold', amount: 100, text: '100 Gold' },
          { type: 'xp', amount: 50, text: '50 XP' }
        ]
      }
    };
  });

  // 4. Trigger the quest window manually via the HUD Manager
  await page.evaluate(() => {
    const scene = window.sceneManager.currentScene();
    const quest = window.dataManager.quests['test_quest'];
    scene.hudManager.questWindow.showOffer(
      quest,
      () => console.log('Accepted'),
      () => console.log('Declined')
    );
    window.sceneManager.windowManager.push(scene.hudManager.questWindow);
  });

  // 5. Verify the window visibility and content
  // Since multiple windows might exist, we check for visibility of text inside the window
  const title = page.getByText('Test Quest', { exact: true }); // Exact match for title
  await expect(title).toBeVisible({ timeout: 10000 });

  const desc = page.getByText('This is a test quest description');
  await expect(desc).toBeVisible();

  const reward1 = page.getByText('100 Gold');
  await expect(reward1).toBeVisible();

  // 6. Verify Buttons
  await expect(page.getByRole('button', { name: 'Accept' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Decline' })).toBeVisible();

  // 7. Take Screenshot
  await page.screenshot({ path: 'quest_window.png' });
});
