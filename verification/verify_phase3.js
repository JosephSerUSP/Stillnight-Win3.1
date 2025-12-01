const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
      // Go to the app
      await page.goto('http://127.0.0.1:8080/?test=true');

      // Wait for data load and initial render
      await page.waitForSelector('#exploration-grid', { state: 'visible' });

      // Check if grid has tiles
      const tiles = await page.locator('.tile').count();
      console.log(`Tiles found: ${tiles}`);

      if (tiles === 0) {
          // Maybe click New Run
          await page.click('#btn-new-run');
          await page.waitForTimeout(1000);
      }

      await page.waitForSelector('.tile');

      // Take screenshot of the desktop
      await page.screenshot({ path: 'verification/phase3_grid.png' });
      console.log("Screenshot saved to verification/phase3_grid.png");

  } catch (e) {
      console.error(e);
      process.exit(1);
  } finally {
      await browser.close();
  }
})();
