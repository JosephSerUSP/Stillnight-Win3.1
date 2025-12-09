const { test, expect } = require('@playwright/test');

test.describe('Summoner Mechanics', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('http://127.0.0.1:8000/?test=true');
    await page.waitForFunction(() =>
        window.sceneManager &&
        window.sceneManager.currentScene() &&
        window.sceneManager.currentScene().party &&
        window.sceneManager.currentScene().party.summoner
    );
  });

  test('Summoner exists and has MP', async ({ page }) => {
    const summoner = await page.evaluate(() => {
        const party = window.sceneManager.currentScene().party;
        return party.summoner ? {
            name: party.summoner.name,
            mp: party.summoner.mp,
            maxMp: party.summoner.maxMp
        } : null;
    });

    expect(summoner).not.toBeNull();
    expect(summoner.name).toBe('Summoner');
    expect(summoner.maxMp).toBe(100);
    expect(summoner.mp).toBe(100);
  });

  test('Moving on map drains Summoner MP', async ({ page }) => {
      // Ensure we are in map scene and have minions
      await page.evaluate(() => {
          const scene = window.sceneManager.currentScene();
          // Summoner MP starts at 100
          scene.party.summoner.mp = 100;

          // Ensure we have active minions
          // We can't use Game_Battler directly if not exposed.
          // Check if we have members.
          if (scene.party.activeMembers.length === 0) {
              // Try to reload initial members if empty
              scene.party.createInitialMembers(scene.dataManager);
          }
          if (scene.party.activeMembers.length === 0) {
              throw new Error("No active members even after createInitialMembers");
          }
      });

      // Move one step (try multiple directions until one works)
      const directions = ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'];
      let moved = false;

      for (const dir of directions) {
          const startPos = await page.evaluate(() => {
              const m = window.sceneManager.currentScene().map;
              return { x: m.playerX, y: m.playerY };
          });

          await page.keyboard.press(dir);
          await page.waitForTimeout(200);

          const endPos = await page.evaluate(() => {
              const m = window.sceneManager.currentScene().map;
              return { x: m.playerX, y: m.playerY };
          });

          if (startPos.x !== endPos.x || startPos.y !== endPos.y) {
              moved = true;
              break;
          }
      }

      if (!moved) console.log("WARNING: Could not move in any direction!");

      const result = await page.evaluate(() => {
          const scene = window.sceneManager.currentScene();
          return {
              mp: scene.party.summoner.mp,
              activeMembers: scene.party.activeMembers.length,
              playerX: scene.map.playerX,
              playerY: scene.map.playerY
          };
      });

      console.log('Debug Move:', result);

      // Should be less than 100. Formula: mp - activeMinions (assuming >0 minions)
      expect(result.mp).toBeLessThan(100);
  });

  test('Depleted Summoner MP causes minion HP loss on move', async ({ page }) => {
      await page.evaluate(() => {
          const scene = window.sceneManager.currentScene();
          scene.party.summoner.mp = 0;

          if (scene.party.activeMembers.length === 0) {
               scene.party.createInitialMembers(scene.dataManager);
          }

          // Ensure minion has full HP
          const minion = scene.party.activeMembers[0];
          minion.hp = minion.maxHp;
      });

      // Move (try multiple directions)
      const directions = ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'];
      for (const dir of directions) {
          const startPos = await page.evaluate(() => {
              const m = window.sceneManager.currentScene().map;
              return { x: m.playerX, y: m.playerY };
          });

          await page.keyboard.press(dir);
          await page.waitForTimeout(200);

          const endPos = await page.evaluate(() => {
              const m = window.sceneManager.currentScene().map;
              return { x: m.playerX, y: m.playerY };
          });

          if (startPos.x !== endPos.x || startPos.y !== endPos.y) {
              break;
          }
      }

      const minionHp = await page.evaluate(() => {
          const scene = window.sceneManager.currentScene();
          const minion = scene.party.activeMembers[0];
          return { current: minion.hp, max: minion.maxHp };
      });

      expect(minionHp.current).toBeLessThan(minionHp.max);
  });
});
