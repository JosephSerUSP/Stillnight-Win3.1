const { chromium } = require('playwright');
const path = require('path');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    try {
        await page.goto('http://localhost:8080/?test=true');

        // Wait for game to load
        await page.waitForSelector('#game-container');
        await page.waitForTimeout(2000); // Give it time to init

        await page.screenshot({ path: 'verification/debug_initial.png' });
        console.log("Captured initial state.");

        // Check if New Run button exists or if we are already in game
        // Scene_Boot might load from localStorage or just show New Run.
        // If ?test=true, it might behave differently depending on main.js logic?
        // No, Scene_Boot logic is: check save, else show menu.

        // Try to click New Run if visible
        const newRunBtn = page.locator('button:has-text("Start New Run")');
        if (await newRunBtn.isVisible()) {
             console.log("Clicking New Run...");
             await newRunBtn.click();
             await page.waitForTimeout(1000);
        } else {
             console.log("New Run button not found. Maybe already in game?");
        }

        await page.screenshot({ path: 'verification/debug_after_click.png' });

        // Wait for Map to load
        await page.waitForSelector('.tile-player', { timeout: 10000 });
        console.log("Map loaded.");

        console.log("Starting Battle Transition...");

        // Execute script to trigger battle
        await page.evaluate(() => {
             const scene = window.sceneManager.currentScene();
             if (scene && scene.startBattle) {
                 scene.startBattle(0, 0); // Trigger battle immediately
             } else {
                 console.error("Current scene does not have startBattle method:", scene);
             }
        });

        // Wait a bit for the Swirl/Fade effect (it takes 1s total, black at 0.5s)
        await page.waitForTimeout(600);

        // Screenshot 1: Transition Mid-point (Should be dark/fading)
        await page.screenshot({ path: 'verification/transition_mid.png' });
        console.log("Screenshot 1 captured.");

        // Wait for Battle Intro (Cut-in) start
        await page.waitForTimeout(1500);

        // Screenshot 2: Battle Intro Cut-in
        await page.screenshot({ path: 'verification/transition_intro.png' });
        console.log("Screenshot 2 captured.");

        // Wait for Intro finish
        await page.waitForTimeout(3000);

        // Screenshot 3: Battle Start (UI Visible)
        await page.screenshot({ path: 'verification/battle_start.png' });
        console.log("Screenshot 3 captured.");

    } catch (e) {
        console.error(e);
        await page.screenshot({ path: 'verification/debug_error.png' });
    } finally {
        await browser.close();
    }
})();
