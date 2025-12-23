from playwright.sync_api import sync_playwright

def verify_gate_guard_quest():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # Load game with test query to expose internals
        page.goto("http://localhost:8080/?test=true")

        # Wait for game to load
        page.wait_for_selector("#game-container")

        # Wait for data manager to be ready
        page.wait_for_function("window.dataManager && window.dataManager.loaded")

        # Inject quest data verification script
        # We want to verify that Window_Quest renders a portrait when triggered.
        # Since we can't easily walk to the guard in a test, we will verify the class logic
        # by manually invoking the window via the console/evaluate.

        print("Verifying Window_Quest portrait rendering...")

        page.evaluate("""() => {
            const questData = {
                quest: {
                    name: "Test Quest",
                    description: "A test quest.",
                    portrait: "NPC_Geraldo",
                    rewards: { gold: 100 }
                },
                npcName: "Gate Guard",
                status: 'inactive'
            };

            // Access the quest window from HUD manager
            // Assuming window.sceneManager.currentScene().hudManager.questWindow exists
            const hud = window.sceneManager.currentScene().hudManager;
            if (hud && hud.questWindow) {
                hud.questWindow.show(questData);
                window.testQuestWindow = hud.questWindow; // Keep ref
            } else {
                console.error("HUD or QuestWindow not found");
            }
        }""")

        # Take screenshot of the Quest Window
        # We need to wait a moment for image loading (if any)
        page.wait_for_timeout(1000)

        # Screenshot the quest window specifically
        # It has ID 'quest-window' usually, or we can target by class
        # Window_Quest has id 'quest-window' in constructor options
        element = page.locator("#quest-window")
        if element.is_visible():
            element.screenshot(path="verification/quest_window_portrait.png")
            print("Screenshot saved: verification/quest_window_portrait.png")
        else:
            print("Quest window not visible.")
            # Fallback full page
            page.screenshot(path="verification/full_page_debug.png")

        # Now verify Window_QuestLog portrait
        print("Verifying Window_QuestLog portrait rendering...")
        page.evaluate("""() => {
            window.testQuestWindow.close(); // Close quest window first

            const questLog = window.sceneManager.currentScene().hudManager.questLogWindow;
            if (questLog) {
                const quest = {
                    name: "Test Quest Log",
                    description: "Log description.",
                    portrait: "NPC_Alicia",
                    giver: "Alicia",
                    rewards: { gold: 50 }
                };
                questLog.setup({ active: [quest], completed: [] });
                questLog.show();
                questLog.renderDetails(quest); // Force detail render
            }
        }""")

        page.wait_for_timeout(1000)

        element_log = page.locator("#quest-log-window")
        if element_log.is_visible():
            element_log.screenshot(path="verification/quest_log_portrait.png")
            print("Screenshot saved: verification/quest_log_portrait.png")

        browser.close()

if __name__ == "__main__":
    verify_gate_guard_quest()
