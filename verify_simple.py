from playwright.sync_api import sync_playwright
import time

def verify_simple(page):
    print("Navigating...")
    page.goto("http://localhost:8082/index.html?test=true")

    print("Waiting for game container...")
    try:
        page.wait_for_selector("#game-container", timeout=5000)
        print("Game container found.")
    except:
        print("Game container NOT found.")
        page.screenshot(path="/home/jules/verification/simple_fail.png")
        return

    print("Waiting 2s...")
    time.sleep(2)

    print("Taking screenshot...")
    page.screenshot(path="/home/jules/verification/simple_load.png")
    print("Done.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_simple(page)
        finally:
            browser.close()
