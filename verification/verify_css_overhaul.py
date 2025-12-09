from playwright.sync_api import sync_playwright
import time

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # 1. Load Game
    page.goto('http://127.0.0.1:8000/?test=true')
    page.wait_for_selector('#desktop-window')
    time.sleep(1)

    # Check colors
    bg_color = page.evaluate("window.getComputedStyle(document.body).backgroundColor")
    print(f"Body background color: {bg_color}")

    # Check overflow
    overflow = page.evaluate("window.getComputedStyle(document.getElementById('game-container')).overflow")
    print(f"Game container overflow: {overflow}")

    # 2. Screenshot Desktop
    page.screenshot(path='verification/screenshot_desktop.png')
    print("Desktop screenshot taken.")

    # 3. Open Inventory
    page.evaluate("window.sceneManager.currentScene().openInventory()")
    time.sleep(1)
    page.screenshot(path='verification/screenshot_inventory.png')
    print("Inventory screenshot taken.")

    page.evaluate("window.windowManager.pop()")
    time.sleep(1)

    # 4. Start Battle
    page.evaluate("window.sceneManager.currentScene().startBattle(0, 0)")
    page.wait_for_selector('.terminal', timeout=5000)
    time.sleep(1)
    page.screenshot(path='verification/screenshot_battle.png')
    print("Battle screenshot taken.")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
