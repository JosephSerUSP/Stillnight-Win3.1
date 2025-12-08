from playwright.sync_api import sync_playwright

def verify_battle_ui(page):
    page.goto("http://localhost:8000/?test=true")
    page.wait_for_selector("#mode-label", timeout=10000)
    page.wait_for_function('document.getElementById("mode-label").textContent === "Exploration"')

    # Start Battle via console
    page.evaluate("""
        const mapScene = window.sceneManager.currentScene();
        const party = mapScene.party;
        const windowLayer = mapScene.windowLayer;
        const sharedWindows = mapScene.getSharedWindows();

        // Setup enemies
        const enemyData = window.dataManager.actors.find(a => a.id === 'sinscale') || window.dataManager.actors[0];
        const enemies = [new window.Game_Battler(enemyData, 1, true)];

        const battleScene = new window.Scene_Battle(
            window.dataManager,
            window.sceneManager,
            window.windowManager,
            party,
            new window.BattleManager(party, window.dataManager),
            windowLayer,
            mapScene.map,
            0, 0,
            sharedWindows,
            'sinscale',
            false, false
        );

        window.sceneManager.push(battleScene);
        battleScene.start();
    """)

    # Wait for battle UI
    page.wait_for_selector(".window-title:text-is('Command')", timeout=5000)
    page.wait_for_selector(".turn-order-bar", timeout=5000)

    page.screenshot(path="/home/jules/verification/battle_ctb.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            verify_battle_ui(page)
        finally:
            browser.close()
