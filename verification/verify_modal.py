from playwright.sync_api import sync_playwright

def verify_modal():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        # Add ?test=true to expose globals
        page.goto("http://localhost:8080/?test=true")

        page.click("#btn-new-run")
        page.wait_for_selector("#game-container")

        # Open inspect window
        page.click(".party-slot[data-index='0']")
        page.wait_for_timeout(500)
        page.screenshot(path="verification/inspect_window.png")

        # Open modal confirm via scene
        page.evaluate("""
            const scene = window.sceneManager.currentScene();
            scene.confirmWindow.titleEl.textContent = "Test Modal";
            scene.confirmWindow.messageEl.textContent = "This should dim the background.";
            window.windowManager.openWindow(scene.confirmWindow, { modal: true });
        """)

        page.wait_for_timeout(500)
        page.screenshot(path="verification/modal_overlay.png")

        browser.close()

if __name__ == "__main__":
    verify_modal()
