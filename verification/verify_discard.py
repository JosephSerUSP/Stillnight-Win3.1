from playwright.sync_api import sync_playwright

def verify_discard_confirmation():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the game with test mode enabled
        page.goto("http://localhost:8080/?test=true")

        # Wait for the scene to load properly
        page.wait_for_function("window.sceneManager && window.sceneManager.currentScene() && window.sceneManager.currentScene().constructor.name === 'Scene_Map'")

        # Inject an item to discard
        page.evaluate("""
            const scene = window.sceneManager.currentScene();
            scene.party.inventory.length = 0;
            const item = {
                name: "Screenshot Rock",
                id: "rock",
                type: "consumable",
                description: "For testing.",
                cost: 0
            };
            scene.party.inventory.push(item);
            scene.updateAll();
        """)

        # Open Inventory
        page.click("button:has-text('Inventory')")

        # Click Discard
        # We need to find the specific discard button for our item
        # Since we cleared inventory, it should be the only item
        discard_btn = page.locator("button[data-action='discard']").first
        discard_btn.click()

        # Wait for confirmation window
        confirm_window = page.locator("#confirm-window")
        confirm_window.wait_for(state="visible")

        # Take screenshot
        page.screenshot(path="verification/discard_confirmation.png")

        browser.close()

if __name__ == "__main__":
    verify_discard_confirmation()
