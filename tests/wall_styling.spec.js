import { test, expect } from '@playwright/test';

test('Wall tiles should have tile-wall class and empty symbol', async ({ page }) => {
  await page.goto('/?test=true');
  await page.waitForFunction(() =>
    window.sceneManager &&
    window.sceneManager.currentScene() &&
    window.sceneManager.currentScene().constructor.name === 'Scene_Map' &&
    window.sceneManager.currentScene().map?.floors?.length
  );

  await page.evaluate(() => {
    const scene = window.sceneManager.currentScene();
    const map = scene.map;
    const floor = map.floors[map.floorIndex];
    floor.tiles[0][0] = '#';
    floor.visited[0][0] = true;
    floor.events = floor.events.filter(e => e.x !== 0 || e.y !== 0);
    scene.updateGrid();
  });

  const wallTile = page.locator('.tile[data-x="0"][data-y="0"]');
  await expect(wallTile).toHaveClass(/tile-wall/);
  const text = await wallTile.textContent();
  expect(text.trim()).toBe('');
});
