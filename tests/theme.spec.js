const { test, expect } = require('@playwright/test');

test.describe('Theme System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?test=true');
    await page.waitForFunction(() => window.ThemeManager);
  });

  test('Themes cycle correctly', async ({ page }) => {
    // Initial state: original
    let themeClass = await page.evaluate(() => document.body.className);
    expect(themeClass).toBe('theme-original');

    // Click theme button
    await page.click('#btn-theme-toggle');
    themeClass = await page.evaluate(() => document.body.className);
    expect(themeClass).toBe('theme-night');

    // Click again
    await page.click('#btn-theme-toggle');
    themeClass = await page.evaluate(() => document.body.className);
    expect(themeClass).toBe('theme-high-contrast');

    // Click again -> back to original
    await page.click('#btn-theme-toggle');
    themeClass = await page.evaluate(() => document.body.className);
    expect(themeClass).toBe('theme-original');
  });

  test('Gauge colors change with theme', async ({ page }) => {
      // Start a run to populate party and gauges
      await page.click('#btn-new-run');
      await page.waitForSelector('.party-slot');

      // Helper to get gauge color
      const getGaugeColor = async () => {
          return await page.evaluate(() => {
              const fill = document.querySelector('.gauge-fill');
              return window.getComputedStyle(fill).backgroundColor;
          });
      };

      // Original Theme: Green (#00a000 -> rgb(0, 160, 0))
      // But we used CSS variable var(--gauge-fill).
      // Computed style should return the resolved color.

      // Force repaint/check
      let color = await getGaugeColor();
      // Expect something close to green.
      // Note: browsers might return rgb().
      expect(color).toBe('rgb(0, 160, 0)');

      // Switch to Night
      await page.click('#btn-theme-toggle');
      color = await getGaugeColor();
      // Night: #00ff00 -> rgb(0, 255, 0)
      expect(color).toBe('rgb(0, 255, 0)');

      // Switch to High Contrast
      await page.click('#btn-theme-toggle');
      color = await getGaugeColor();
      // HC: #ffffff -> rgb(255, 255, 255)
      expect(color).toBe('rgb(255, 255, 255)');
  });
});
