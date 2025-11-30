from playwright.sync_api import sync_playwright, expect

def verify_ui():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:8080")

        # Wait for game container
        page.wait_for_selector("#game-container")

        # Click New Run to ensure UI is active
        page.get_by_role("button", name="New Run").click()
        page.wait_for_timeout(500) # Wait for anims

        # Screenshot 1: Main HUD (checking tile size, location art, ? button)
        page.screenshot(path="verification_hud.png")
        print("HUD screenshot taken.")

        # Click Help button
        help_btn = page.locator("#btn-help")
        help_btn.click()

        # Wait for help window
        page.wait_for_selector("#help-window")
        page.wait_for_timeout(500)

        # Screenshot 2: Help Window
        page.screenshot(path="verification_help.png")
        print("Help Window screenshot taken.")

        browser.close()

if __name__ == "__main__":
    verify_ui()
