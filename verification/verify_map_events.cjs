
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 1. Navigate to the game with test mode
  await page.goto('http://localhost:3000/?test=true');
  await page.waitForLoadState('networkidle');

  // Wait for game to initialize
  await page.waitForTimeout(1000);

  // 2. Start New Run to get to a map
  await page.click('.menu-toggle:has-text("Run")');
  await page.click('#menu-item-new-run');
  await page.waitForSelector('#confirm-window', { state: 'visible' });
  await page.click('#confirm-window button:has-text("OK")');
  await page.waitForTimeout(1000);

  // 3. Inject a test event at the player's position (or adjacent)
  await page.evaluate(() => {
    const scene = window.sceneManager.currentScene();
    const map = scene.map;
    const px = map.playerX;
    const py = map.playerY;
    const floor = map.state.floors[map.state.floorIndex];

    // Test default passability for 'npc' type (without explicit isObstacle)
    const mockEvent = {
        x: px + 1,
        y: py,
        symbol: 'Ω',
        cssClass: 'test-event-class',
        type: 'npc',
        // isObstacle is OMITTED to test default
        hidden: false,
        scripts: {
            onEnter: [{ type: 'LOG', text: 'Stepped on Omega!' }]
        }
    };

    if (!floor.events) floor.events = [];
    floor.events.push(mockEvent);

    scene.updateGrid();
  });

  // 4. Move player to the right (onto the other event)
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(500);

  // 5. Take screenshot after move
  await page.screenshot({ path: 'verification/step3_default_npc.png' });

  await browser.close();
})();
