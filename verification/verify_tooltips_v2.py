from playwright.sync_api import sync_playwright

def verify_tooltips():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 720})

        # 1. Load Game
        page.goto("http://localhost:3000/?test=true")
        page.wait_for_selector("#game-container", state="visible")
        page.wait_for_timeout(2000)

        # 2. Start New Game
        page.click(".menu-toggle:has-text('Game')")
        page.click("#menu-item-new-game")
        page.wait_for_timeout(1000)

        # 3. Verify Map Log supports HTML (for Battle Log parity)
        # We inject a span into the log
        page.evaluate("""
            const span = document.createElement('span');
            span.style.color = 'red';
            span.style.fontWeight = 'bold';
            span.textContent = 'Rich Text Test';
            window.sceneManager.currentScene().logMessage(span);
        """)
        page.wait_for_timeout(500)
        page.screenshot(path="verification/map_log.png")
        print("Captured map_log.png with rich text")

        # 4. Open Quest Log via Menu
        page.click(".menu-toggle:has-text('Party')")
        page.click("#menu-item-quests")
        page.wait_for_selector("#quest-log-window", state="visible")

        # 5. Inject a fake quest with item rewards to verify rendering
        page.evaluate("""
            const win = window.sceneManager.currentScene().windowLayer.children.find(w => w.element.id === 'quest-log-window');
            if (win) {
                const fakeQuest = {
                    name: 'Tooltip Verification Quest',
                    description: 'Verify item rendering.',
                    rewards: {
                        gold: 500,
                        items: [{ id: 'potion', name: 'Test Potion', icon: 173, qty: 5 }]
                    }
                };
                win.questData = { active: [fakeQuest], completed: [] };
                win.switchTab('active');
            }
        """)
        page.wait_for_timeout(500)
        page.screenshot(path="verification/quest_log_rich.png")
        print("Captured quest_log_rich.png with fake quest reward")

        browser.close()

if __name__ == "__main__":
    verify_tooltips()
