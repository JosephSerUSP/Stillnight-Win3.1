from playwright.sync_api import sync_playwright

def verify_tooltips():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 720})

        page.goto("http://localhost:3000/?test=true")
        page.wait_for_selector("#game-container", state="visible")
        page.wait_for_timeout(2000)

        # Force hide overlay to interact
        page.evaluate("document.querySelectorAll('.modal-overlay').forEach(e => e.style.display = 'none')")

        page.click(".menu-toggle:has-text('Game')")
        page.click("#menu-item-new-game")
        page.wait_for_timeout(1000)

        # 1. Map Log Rich Text
        page.evaluate("""
            const span = document.createElement('span');
            span.style.color = 'red';
            span.style.fontWeight = 'bold';
            span.textContent = 'Rich Text Test';
            window.sceneManager.currentScene().logMessage(span);
        """)
        page.wait_for_timeout(500)
        page.screenshot(path="verification/map_log.png")

        # 2. Quest Log
        # Force open via JS to avoid menu issues
        page.evaluate("""
            const win = new window.Window_QuestLog();
            window.sceneManager.windowManager.push(win);

            const fakeQuest = {
                name: 'Tooltip Verification Quest',
                description: 'Verify item rendering.',
                rewards: {
                    gold: 500,
                    items: [{ id: 'potion', name: 'Test Potion', icon: 173, qty: 5 }]
                }
            };
            win.setup({ active: [fakeQuest], completed: [] });
        """)
        page.wait_for_timeout(500)
        page.screenshot(path="verification/quest_log_rich.png")
        print("Captured images successfully")

        browser.close()

if __name__ == "__main__":
    verify_tooltips()
