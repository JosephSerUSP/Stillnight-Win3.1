from playwright.sync_api import sync_playwright

def verify_tooltips():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Use debug query param to expose globals for test manipulation if needed
        # But we can just play the game.
        page = browser.new_page(viewport={"width": 1280, "height": 720})

        # 1. Load Game
        page.goto("http://localhost:3000/?test=true")
        page.wait_for_selector("#game-container", state="visible")

        # Wait for game to initialize
        page.wait_for_timeout(2000)

        # 2. Start New Game
        # Click 'Game' menu
        page.click(".menu-toggle:has-text('Game')")
        # Click 'New Game'
        page.click("#menu-item-new-game")

        # Wait for intro or map
        page.wait_for_timeout(1000)

        # 3. Verify Summoner Equipment Tooltip
        # Hover over the summoner's equipment in the party panel (bottom right usually or via 'F')
        # By default, party panel is visible on desktop.
        # Find Summoner Slot (last one)
        summoner_slot = page.locator(".commander-slot")
        if summoner_slot.count() > 0:
            print("Found Summoner Slot")
            # Find the interactive label inside
            item_label = summoner_slot.locator(".interactive-label")
            if item_label.count() > 0:
                print("Found Equipment Label")
                item_label.first.hover()
                page.wait_for_timeout(500)
                page.screenshot(path="verification/summoner_tooltip.png")
            else:
                print("No equipment label found (maybe unequipped?)")

        # 4. Verify Quest Tooltip
        # We need to trigger a quest offer or open quest log.
        # Let's open Quest Log (Q)
        page.keyboard.press("q")
        page.wait_for_selector("#quest-log-window", state="visible")
        page.screenshot(path="verification/quest_log.png")

        # 5. Battle Log Verification
        # Harder to script quickly without finding an enemy.
        # We can try to use exposed globals to log a fake message.
        page.evaluate("""
            if (window.sceneManager.currentScene().logMessage) {
                // Mock a rich log message via Window_Battle if we were in battle,
                // but we are in Map.
                // Map log uses Window_LogPanel.
                // Let's verify Window_LogPanel supports HTML.

                const span = document.createElement('span');
                span.style.color = 'red';
                span.textContent = 'Rich Text Test';
                window.sceneManager.currentScene().logMessage(span);
            }
        """)
        page.wait_for_timeout(500)
        page.screenshot(path="verification/map_log.png")

        browser.close()

if __name__ == "__main__":
    verify_tooltips()
