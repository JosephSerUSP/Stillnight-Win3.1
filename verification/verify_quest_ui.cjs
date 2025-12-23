const { chromium } = require('playwright');
const path = require('path');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    try {
        await page.goto('http://localhost:8080/?test=true');
        // Wait for DataManager to be exposed and loaded
        await page.waitForFunction(() => window.dataManager && window.dataManager.loaded);

        // Inject Quest
        await page.evaluate(() => {
            const quest = window.dataManager.quests.silent_shipment;
            // Force portrait just in case (though it should be in data now)
            // But we modified the file, so reloading the page should load the new JSON.
            // window.dataManager.quests.silent_shipment.portrait = 'NPC_Geraldo'; // Verify the fix loaded

            // Show Window_Quest
            const win = new window.Window_Quest();

            // In the app, HUDManager has the windowLayer. We don't have HUDManager exposed directly usually,
            // but Scene_Map has it.
            // If we are on Scene_Map, we can access it.
            // But wait, the test page loads Scene_Boot -> Scene_Map.
            // Let's assume Scene_Map is active.

            const scene = window.sceneManager.currentScene();
            if (scene.hudManager) {
                 scene.hudManager.windowLayer.addChild(win);
            } else {
                 // Fallback if not on map (unlikely) or hudManager not exposed
                 // But wait, verify_quest_ui just needs to render it.
                 document.body.appendChild(win.element); // Quick hack for visual verification if layer not available
            }

            win.show({ quest, status: 'new', npcName: 'Gate Guard' });
        });

        await page.waitForTimeout(500); // Wait for render
        await page.screenshot({ path: 'verification/quest_popup.png' });
        console.log('Quest Popup screenshot captured.');

        // Test Quest Log
        await page.evaluate(() => {
            // Close popup
            const popups = document.querySelectorAll('#quest-window');
            popups.forEach(p => p.remove());

            // Add quest to active

            // Open Log
            const log = new window.Window_QuestLog();
            const scene = window.sceneManager.currentScene();
            if (scene.hudManager) {
                 scene.hudManager.windowLayer.addChild(log);
            } else {
                 document.body.appendChild(log.element);
            }

            log.setup({ active: [window.dataManager.quests.silent_shipment], completed: [] });
            log.open();
            log.select(0);
        });

        await page.waitForTimeout(500);
        await page.screenshot({ path: 'verification/quest_log.png' });
        console.log('Quest Log screenshot captured.');

    } catch (e) {
        console.error(e);
    } finally {
        await browser.close();
    }
})();
