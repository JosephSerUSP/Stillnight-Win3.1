from playwright.sync_api import sync_playwright
import time

def verify_smt(page):
    page.goto("http://localhost:8000/?test=true")

    # Wait for Scene_Map and Floor Generation
    page.wait_for_function("""
        window.sceneManager &&
        window.sceneManager.currentScene() &&
        window.sceneManager.currentScene().constructor.name === 'Scene_Map' &&
        window.sceneManager.currentScene().map &&
        window.sceneManager.currentScene().map.floors &&
        window.sceneManager.currentScene().map.floors.length > 0
    """)

    # Trigger Battle
    page.evaluate("""
        const scene = window.sceneManager.currentScene();
        scene.startBattle({ id: 'pixie' });
    """)

    # Wait for Talk Button
    page.wait_for_selector("button:has-text('Talk')")

    # Take screenshot
    page.screenshot(path="verification/verify_smt.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            verify_smt(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
