from playwright.sync_api import sync_playwright

def verify_quest_and_event_ui():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1280, 'height': 720})

        print("Navigating to game...")
        page.goto("http://localhost:8080/?test=true")

        # Wait for sceneManager
        page.wait_for_function("() => window.sceneManager")

        # Check scene
        scene_name = page.evaluate("window.sceneManager.currentScene() ? window.sceneManager.currentScene().constructor.name : 'None'")
        print(f"Current Scene: {scene_name}")

        if scene_name == 'Scene_Boot' or scene_name == 'Scene_Title' or scene_name == 'None':
             print("Starting New Game...")
             page.evaluate("""
                 if (window.sceneManager.currentScene().startNewGame) {
                     window.sceneManager.currentScene().startNewGame();
                 }
             """)
             page.wait_for_timeout(2000)
             scene_name = page.evaluate("window.sceneManager.currentScene() ? window.sceneManager.currentScene().constructor.name : 'None'")
             print(f"Current Scene after action: {scene_name}")

        # Wait for hudManager
        print("Waiting for hudManager...")
        page.wait_for_function("() => window.sceneManager.currentScene() && window.sceneManager.currentScene().hudManager")

        # --- Test 1: Window_Event Sizing & Keyboard ---
        print("Testing Window_Event...")

        page.evaluate("""
            const scene = window.sceneManager.currentScene();
            const wm = window.sceneManager.windowManager || scene.windowManager; // Try both

            scene.hudManager.eventWindow.show({
                title: "Test Event",
                description: "This is a test description to verify window sizing and keyboard controls.",
                choices: [
                    { label: "Option 1", onClick: () => console.log('Opt 1') },
                    { label: "Option 2", onClick: () => console.log('Opt 2') },
                    { label: "Option 3", onClick: () => console.log('Opt 3') }
                ]
            });
            if (!wm.stack.includes(scene.hudManager.eventWindow)) {
                 wm.push(scene.hudManager.eventWindow);
            }
        """)

        page.wait_for_selector("#event-window", state="visible")
        page.wait_for_timeout(500)
        page.screenshot(path="verification/event_window_initial.png")

        # Test Keyboard Navigation: Down
        page.keyboard.press("ArrowDown")
        page.wait_for_timeout(200)
        page.screenshot(path="verification/event_window_down.png")

        # Close the window
        page.keyboard.press("Enter")
        page.wait_for_timeout(500)

        # Cleanup
        page.evaluate("""
             const scene = window.sceneManager.currentScene();
             const wm = window.sceneManager.windowManager || scene.windowManager;
             wm.close(scene.hudManager.eventWindow);
        """)
        page.wait_for_timeout(500)

        # --- Test 2: Window_Quest Visibility & Keyboard ---
        print("Testing Window_Quest...")

        page.evaluate("""
            const scene = window.sceneManager.currentScene();
            const wm = window.sceneManager.windowManager || scene.windowManager;

            scene.hudManager.questWindow.show({
                quest: {
                    id: "test_quest",
                    name: "Test Quest",
                    description: "A quest to verify the popup works.",
                    objectives: ["Do something"],
                    rewards: { gold: 100, items: [] }
                },
                status: "inactive",
                npcName: "Tester",
                onAccept: () => console.log("Accepted"),
                onDecline: () => console.log("Declined")
            });
            if (!wm.stack.includes(scene.hudManager.questWindow)) {
                 wm.push(scene.hudManager.questWindow);
            }
        """)

        page.wait_for_selector("#quest-window", state="visible")
        page.wait_for_timeout(500)
        page.screenshot(path="verification/quest_window.png")

        # Test Keyboard
        page.keyboard.press("ArrowLeft")
        page.wait_for_timeout(200)
        page.screenshot(path="verification/quest_window_left.png")

        print("Verification complete.")
        browser.close()

if __name__ == "__main__":
    verify_quest_and_event_ui()
