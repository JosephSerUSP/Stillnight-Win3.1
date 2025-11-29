
from playwright.sync_api import sync_playwright

def verify_theme(page):
    # Go to the app
    page.goto('http://localhost:8080')

    # Wait for the game to load
    page.wait_for_selector('#game-container')

    # 1. Original Theme Screenshot
    page.screenshot(path='verification/theme_original.png')

    # 2. Switch Theme (Night)
    page.click('#btn-theme')
    page.wait_for_timeout(500) # Wait for potential transition
    page.screenshot(path='verification/theme_night.png')

    # 3. Switch Theme (High Contrast)
    page.click('#btn-theme')
    page.wait_for_timeout(500)
    page.screenshot(path='verification/theme_high_contrast.png')

    # 4. Verify specific color variable application (e.g. check background color)
    # This is a bit tricky to assert on computed styles via Python easily without more logic,
    # but the screenshots will be the main verification.

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    try:
        verify_theme(page)
    finally:
        browser.close()
