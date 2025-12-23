
import { test, expect } from '@playwright/test';

test('Verify Campaign Data Load', async ({ page }) => {
  // 1. Load the game with test mode enabled to access internals
  await page.goto('http://localhost:8000/?test=true');

  // 2. Wait for the game to initialize
  await page.waitForFunction(() => window.sceneManager && window.sceneManager.currentScene());

  // 3. Verify Map Title
  const mapTitle = await page.evaluate(() => {
    return window.sceneManager.currentScene().map.data.title;
  });
  console.log('Current Map:', mapTitle);
  expect(mapTitle).toBe('Aetheria');

  // 4. Verify NPCs are present (Biggs at 15, 5)
  const hasBiggs = await page.evaluate(() => {
    const scene = window.sceneManager.currentScene();
    return scene.map.events.some(e => e.id === 'npc_biggs');
  });
  expect(hasBiggs).toBe(true);

  // 5. Verify Quest Data is loaded
  const questName = await page.evaluate(() => {
    return window.dataManager.quests['q_contact'].name;
  });
  expect(questName).toBe('The Contact');

  // 6. Verify Item Data is loaded
  const itemName = await page.evaluate(() => {
    return window.dataManager.items['magitek_blade'].name;
  });
  expect(itemName).toBe('Magitek Blade');

  // 7. Verify Actor Data is loaded
  const enemyName = await page.evaluate(() => {
    return window.dataManager.actors.find(a => a.id === 'magitek_soldier').name;
  });
  expect(enemyName).toBe('Magitek Soldier');
});
