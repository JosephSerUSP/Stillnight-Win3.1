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

        # Check dimensions of the visible container
        element = page.locator(".location-art-container >> visible=true").first
        box = element.bounding_box()

        print(f"Location Art Container Size: {box['width']}x{box['height']}")

        # Check image source
        img = page.locator("#location-art >> visible=true").first
        src = img.get_attribute("src")
        print(f"Image Source: {src}")

        # Verify it contains locationArt and the correct file
        if "locationArt/TownAlencar.png" in src:
            print("SUCCESS: Town image source is correct.")
        else:
            print(f"FAILURE: Unexpected image source for Town: {src}")

        page.screenshot(path="verification/location_art_fixed.png")
        browser.close()

if __name__ == "__main__":
    verify_location_art()
