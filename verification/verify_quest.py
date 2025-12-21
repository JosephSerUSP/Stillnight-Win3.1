from playwright.sync_api import sync_playwright

def verify_npc_quest(page):
    page.goto("http://localhost:3000/?test=true")

    page.wait_for_selector("#game-container")

    # We use page.evaluate to trigger the Window_Quest directly.
    # We must ensure Window_Quest is attached to window object in src/presentation/windows/index.js if we want to call it.
    # But usually classes aren't exposed globally by default unless we did so in main.js or debug_tools.js

    # Check if Window_Quest is available. If not, we might need to import it or rely on exposed managers.
    # The 'windowManager' is exposed.
    # The 'Window_Quest' is exported from 'src/presentation/windows/index.js'.

    # Let's see if we can instantiate it.
    # If the app uses modules, we can't easily import inside console unless we use dynamic import.

    page.evaluate("""async () => {
        // Wait for data to load
        while (!window.dataManager || !window.dataManager.loaded) {
            await new Promise(r => setTimeout(r, 100));
        }

        // We need the class definition.
        // Since we can't import easily, let's assume we can trigger the 'QUEST_OFFER_UI' event if we had an adapter.

        // Alternatively, we can use the `createQuestWindow` approach if it existed.

        // Let's try to dynamically import the class in the browser context.
        const { Window_Quest } = await import('./src/presentation/windows/quest.js');

        const quest = window.dataManager.quests['quest_alicia_gift'];
        if (!quest) {
            console.error("Quest not found");
            return;
        }

        const win = new Window_Quest();
        win.showOffer(quest, () => console.log('Accepted'), () => console.log('Declined'));
        window.windowManager.push(win);
    }""")

    page.wait_for_timeout(1000)
    page.screenshot(path="verification/quest_popup.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            verify_npc_quest(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
