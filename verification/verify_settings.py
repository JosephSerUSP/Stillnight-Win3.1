
from playwright.sync_api import sync_playwright

def verify_settings(page):
    page.goto('http://localhost:8000/?test=true')
    page.wait_for_selector('#game-container')
    page.wait_for_selector('.menu-bar')

    page.click('text=Settings')
    page.wait_for_selector('text=General', state='visible')
    page.click('text=General')

    try:
        page.wait_for_selector('.window-header >> text=Options', state='visible', timeout=5000)
    except:
        page.screenshot(path='verification/settings_fail.png')
        raise

    page.screenshot(path='verification/settings_window.png')

if __name__ == '__main__':
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_settings(page)
        finally:
            browser.close()
