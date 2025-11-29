
from playwright.sync_api import sync_playwright

def debug_settings(page):
    page.goto('http://localhost:8080')
    page.wait_for_selector('#game-container')
    print(page.content())

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    try:
        debug_settings(page)
    finally:
        browser.close()
