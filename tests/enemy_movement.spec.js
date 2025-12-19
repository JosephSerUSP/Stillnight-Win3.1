import { test, expect } from '@playwright/test';

test.describe('Enemy Movement', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?test=true');
    await page.waitForFunction(() =>
        window.dataManager &&
        window.sceneManager &&
        window.sceneManager.currentScene() &&
        window.sceneManager.currentScene().constructor.name === "Scene_Map"
    );
  });

  test('Enemy should move one tile per turn', async ({ page }) => {
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    const movement = await page.evaluate(async () => {
      const scene = window.sceneManager.currentScene();
      const map = scene.map;
      const floor = map.floors[map.floorIndex];

      // Setup: clear events and wall blocks to ensure free movement
      floor.events = [];
      for(let y=0; y<map.MAX_H; y++) {
          for(let x=0; x<map.MAX_W; x++) {
              floor.tiles[y][x] = '.';
          }
      }

      // Place player at 5,5
      map.playerX = 5;
      map.playerY = 5;

      // Place enemy at 5,8 (3 tiles away)
      const enemy = new window.Game_Event(5, 8, {
          type: 'enemy',
          symbol: 'E',
          behavior: 'chase',
          hidden: false
      });
      floor.events.push(enemy);

      // Force update grid to render
      scene.updateGrid();

      const startX = enemy.x;
      const startY = enemy.y;

      // Move player one step right (to 6,5)
      // This triggers one turn.
      // Enemy should move towards player.

      scene.movePlayer(1, 0);

      return {
          startX: startX,
          startY: startY,
          endX: enemy.x,
          endY: enemy.y
      };
    });

    const dist = Math.abs(movement.startX - movement.endX) + Math.abs(movement.startY - movement.endY);
    console.log(`Enemy moved dist: ${dist}. From (${movement.startX},${movement.startY}) to (${movement.endX},${movement.endY})`);

    expect(dist).toBe(1);
  });
});
