from playwright.sync_api import sync_playwright

def verify_npc_layout():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        page.on("console", lambda msg: print(f"Browser Console: {msg.text}"))

        print("Navigating...")
        page.goto("http://localhost:8080/?test=true")

        print("Waiting for game-container...")
        page.wait_for_selector("#game-container")

        # Wait a bit for Boot to finish
        page.wait_for_timeout(2000)

        print("Injecting test code...")
        result = page.evaluate("""() => {
            const scene = window.sceneManager.currentScene();
            if (!scene) return "No Scene";

            const sceneName = scene.constructor.name;
            if (sceneName !== 'Scene_Map') return `Current Scene: ${sceneName}`;

            if (!scene.interpreter) return "Scene_Map but No Interpreter";

            if (!scene.dataManager.npcs) return "No NPCs Data";
            if (!scene.dataManager.npcs['npc_alicia']) return "Alicia not found";

            scene.interpreter._openNpcEvent('npc_alicia');
            return "Event Triggered";
        }""")

        print(f"Injection Result: {result}")

        if result == "Event Triggered":
            print("Waiting for event window...")
            try:
                # Wait for VN layout specific element to confirm
                page.wait_for_selector(".vn-container", state="visible", timeout=5000)
                print("VN Container visible. Success.")
                page.screenshot(path="verification/npc_alicia_layout.png")
                return True
            except Exception as e:
                print(f"Wait failed: {e}")
                page.screenshot(path="verification/debug_fail.png")
        else:
             page.screenshot(path="verification/debug_fail_logic.png")

    return False

if __name__ == "__main__":
    verify_npc_layout()
