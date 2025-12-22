from playwright.sync_api import sync_playwright

def verify_layout():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            # Navigate to the game (assuming port 8000 based on standard conventions or I can check logs)
            # The npm start command usually runs a server. I'll try 8000 or 8080.
            # I'll check lsof or assume 8000 for now.
            page.goto("http://localhost:8000/?test=true")

            # Wait for the game container to be visible
            page.wait_for_selector("#game-container")

            # Wait for desktop layout to initialize
            page.wait_for_selector(".desktop-main")

            # Wait a bit for everything to settle
            page.wait_for_timeout(2000)

            # Take a screenshot of the entire desktop
            page.screenshot(path="verification/layout_fix.png")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_layout()
