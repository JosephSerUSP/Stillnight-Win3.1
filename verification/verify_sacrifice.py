from playwright.sync_api import sync_playwright

def verify_sacrifice_ui():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:8080/?test=true")

        # Wait for data load
        page.wait_for_function("() => window.dataManager && window.dataManager.actors")

        # New Run
        page.click("#btn-new-run")

        # Open Inspect
        page.click(".party-slot[data-index='0']")
        page.wait_for_selector("#inspect-window")

        # Take screenshot of the inspect window
        element = page.locator("#inspect-window")
        element.screenshot(path="verification/sacrifice_ui.png")

        browser.close()

if __name__ == "__main__":
    verify_sacrifice_ui()
