from playwright.sync_api import sync_playwright

def verify_title_screen():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Capture console messages
        page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))
        page.on("pageerror", lambda exc: print(f"PAGE ERROR: {exc}"))

        # Navigate to the game
        print("Navigating to http://localhost:8080")
        page.goto("http://localhost:8080")

        # Wait a bit to see if anything happens
        page.wait_for_timeout(2000)

        print("Checking for Title Screen...")
        # Check if we can find the text
        if page.is_visible("text=Welcome to Stillnight!"):
            print("Title screen found!")
        else:
            print("Title screen NOT found.")
            # Take a screenshot for debugging
            page.screenshot(path="verification/debug_fail.png")

        # Wait for the Title Screen to appear
        try:
            page.wait_for_selector("text=Welcome to Stillnight!", timeout=5000)
            page.wait_for_selector("button:has-text('Start Game')", timeout=5000)

            # Take a screenshot of the Title Screen
            page.screenshot(path="verification/title_screen.png")
            print("Screenshot saved to verification/title_screen.png")

            # Click Start Game and wait for Map Scene
            print("Clicking Start Game...")
            page.click("button:has-text('Start Game')")

            # Wait for map elements
            page.wait_for_selector("text=Exploration", timeout=5000)

            # Take a screenshot of the Map Scene
            page.screenshot(path="verification/map_screen.png")
            print("Screenshot saved to verification/map_screen.png")

        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="verification/error_state.png")

        browser.close()

if __name__ == "__main__":
    verify_title_screen()
