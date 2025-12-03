const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Load the game in test mode to expose global variables
  // We'll use the local http server started by playwright config usually, but here we can just use file:// if possible,
  // or more reliably, start a python server.
  // Since I don't know the exact port, I'll rely on the user instructions mentioning python -m http.server 8080.
  // I'll start the server in background.

  try {
    await page.goto('http://localhost:8080/?test=true');
    await page.waitForLoadState('networkidle');

    // Wait for game to initialize
    await page.waitForFunction(() => window.sceneManager && window.sceneManager.currentScene());

    // Inject code to open Window_Inspect for a party member
    await page.evaluate(() => {
        // Find a party member
        const member = window.windowManager.scene.party.members[0];
        if (member) {
            // Give them some skills and passives if they don't have them
            // We can cheat by modifying the dataManager if needed, or just assigning.
            member.skills = ['fireball', 'heal'];
            member.passives = [{id: 'regen', name: 'Regen'}, {id: 'tough', name: 'Tough'}];
            member.flavor = "A mysterious creature.";
            member.equipmentItem = { name: "Wooden Sword" };

            // Mock dataManager for skills if needed
            if (!window.dataManager.skills['fireball']) {
                window.dataManager.skills['fireball'] = { name: 'Fireball', description: 'Deals damage' };
                window.dataManager.skills['heal'] = { name: 'Heal', description: 'Heals HP' };
            }

            // Open inspect window
            const win = new window.Window_Inspect();
            window.windowManager.push(win);
            win.setup(member, { floorDepth: 1, gold: 100 }, window.dataManager, {});
        }
    });

    // Wait for window to appear
    await page.waitForSelector('#inspect-window');

    // Take screenshot
    await page.screenshot({ path: 'verification/inspect_window.png' });

    console.log("Screenshot taken.");

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await browser.close();
  }
})();
