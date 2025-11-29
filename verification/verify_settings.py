
from playwright.sync_api import sync_playwright

def verify_settings_window(page):
    # Go to the app
    page.goto('http://localhost:8080')

    # Wait for the game to load
    page.wait_for_selector('#game-container')

    # 1. Click Settings Button
    page.click('#btn-settings')
    page.wait_for_selector('#options-window')

    # 2. Screenshot Settings Window
    page.screenshot(path='verification/settings_window.png')

    # 3. Change Theme to Night
    page.select_option('#options-window select', 'night')
    page.wait_for_timeout(500)
    page.screenshot(path='verification/settings_theme_night.png')

    # 4. Change Theme to High Contrast
    page.select_option('#options-window select', 'high-contrast')
    page.wait_for_timeout(500)
    page.screenshot(path='verification/settings_theme_high_contrast.png')

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    try:
        verify_settings_window(page)
    finally:
        browser.close()
