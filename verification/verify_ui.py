
from playwright.sync_api import sync_playwright

def verify_ui(page):
    page.goto('http://localhost:8000/?test=true')
    page.wait_for_selector('#game-container')
    page.wait_for_selector('.menu-bar')

    # Open Menu
    page.click('text=Run')
    page.wait_for_selector('text=New Run', state='visible')
    page.screenshot(path='verification/menu_open.png')

    # Click Teleport
    page.click('text=Teleport')

    # Wait for any window frame to appear on top
    # We can check for the title specifically
    try:
        page.wait_for_selector('text=Select Floor', state='visible', timeout=5000)
    except:
        print('Timeout waiting for Select Floor title')
        page.screenshot(path='verification/teleport_fail.png')
        raise

    page.screenshot(path='verification/teleport_popup.png')

if __name__ == '__main__':
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_ui(page)
        finally:
            browser.close()
