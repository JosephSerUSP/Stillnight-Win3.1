from playwright.sync_api import sync_playwright
import time

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Capture logs
    page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))
    page.on("pageerror", lambda err: print(f"PAGE ERROR: {err}"))

    try:
        page.goto('http://127.0.0.1:8000/?test=true')
        # Wait a bit
        time.sleep(3)

        # Check elements
        frame = page.query_selector('.window-frame')
        if frame:
            print("Found .window-frame")
            box = frame.bounding_box()
            print(f"Frame Box: {box}")
            vis = page.evaluate("window.getComputedStyle(document.querySelector('.window-frame')).visibility")
            display = page.evaluate("window.getComputedStyle(document.querySelector('.window-frame')).display")
            print(f"Frame visibility: {vis}, display: {display}")
        else:
            print("ERROR: .window-frame not found")

        container = page.query_selector('#game-container')
        if container:
            print("Found #game-container")
            box = container.bounding_box()
            print(f"Container Box: {box}")
        else:
            print("ERROR: #game-container not found")

        # Screenshot
        page.screenshot(path='verification/debug_screenshot.png')

    except Exception as e:
        print(f"Script Error: {e}")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
