from playwright.sync_api import sync_playwright

def verify_themes():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:8080/?test=true")

        # Wait for data to load
        page.wait_for_function("window.dataManager && window.dataManager.maps")

        # 1. Capture Original Theme
        page.screenshot(path="verification/theme_original.png")
        print("Captured theme_original.png")

        # 2. Switch to Night Theme
        theme_btn = page.locator("#btn-theme-toggle")
        theme_btn.click()
        page.wait_for_timeout(200) # Give it a moment to repaint
        page.screenshot(path="verification/theme_night.png")
        print("Captured theme_night.png")

        # 3. Switch to High Contrast Theme
        theme_btn.click()
        page.wait_for_timeout(200)
        page.screenshot(path="verification/theme_high_contrast.png")
        print("Captured theme_high_contrast.png")

        browser.close()

if __name__ == "__main__":
    verify_themes()
