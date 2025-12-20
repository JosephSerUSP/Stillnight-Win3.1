from playwright.sync_api import sync_playwright

def verify_npc_window():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:3000/?test=true")
        page.wait_for_selector("body")
        page.wait_for_timeout(3000)

        result = page.evaluate("""() => {
            const sm = window.sceneManager;
            if (!sm) return { error: "No sceneManager" };
            const scene = sm.currentScene();
            if (!scene) return { error: "No current scene", type: typeof scene };

            if (!scene.hudManager) return { error: "No hudManager", scene: scene.constructor.name };

            const win = scene.hudManager.eventWindow;
            if (!win) return { error: "No eventWindow", scene: scene.constructor.name };

            win.show({
                title: "Yukio",
                description: "Efficiency is key.",
                layout: "visual_novel",
                portrait: "NPC_Yukio",
                style: "terminal",
                choices: [{ label: "Leave" }]
            });

            if (scene.windowManager) scene.windowManager.push(win);

            return {
                success: true,
                scene: scene.constructor.name,
                windowId: win.element.id
            };
        }""")

        print("Debug Result:", result)
        page.wait_for_timeout(1000)
        page.screenshot(path="verification/npc_verification.png")
        browser.close()

if __name__ == "__main__":
    verify_npc_window()
