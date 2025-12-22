from playwright.sync_api import sync_playwright
import time

def verify_location_art():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:8080")

        # Click Game -> New Game to ensure map is loaded
        page.locator(".menu-toggle", has_text="Game").click()
        page.locator("#menu-item-new-game").click()

        # Wait for "Town of Stillnight" to appear in the map title
        page.wait_for_selector("#map-title", state="visible")
        # Give it a moment for the update cycle
        page.wait_for_timeout(1000)

        page.screenshot(path="verification/location_art.png")
        browser.close()

if __name__ == "__main__":
    verify_location_art()
