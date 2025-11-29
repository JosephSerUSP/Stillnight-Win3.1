
from playwright.sync_api import sync_playwright

def get_console_logs(page):
    page.on('console', lambda msg: print(f'CONSOLE: {msg.text}'))
    page.goto('http://localhost:8080')
    page.wait_for_timeout(2000)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    try:
        get_console_logs(page)
    finally:
        browser.close()
