from playwright.sync_api import sync_playwright, expect

def test_log_priority():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # 1. Arrange: Go to the game
        page.goto("http://localhost:8000/?test=true")

        # Wait for game to initialize
        page.wait_for_selector("#game-container")

        # Start new run
        page.click("#btn-new-run")

        # 2. Act: Trigger low priority message
        page.evaluate("""
            window.sceneManager.currentScene().logMessage("This is a low priority message", "low");
        """)

        # 3. Assert: Check visibility and opacity
        low_msg = page.locator(".log-message", has_text="This is a low priority message")
        expect(low_msg).to_be_visible()
        expect(low_msg).to_have_css("opacity", "0.5")

        # Trigger normal priority message
        page.evaluate("""
            window.sceneManager.currentScene().logMessage("This is a normal priority message");
        """)

        normal_msg = page.locator(".log-message", has_text="This is a normal priority message")
        expect(normal_msg).to_be_visible()
        expect(normal_msg).to_have_css("opacity", "1")

        # 4. Screenshot
        page.screenshot(path="/home/jules/verification/log_priority.png")

        browser.close()

if __name__ == "__main__":
    test_log_priority()
