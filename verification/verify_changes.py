from playwright.sync_api import sync_playwright

def verify_dungeon_entry_and_stairs():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # Listen for console logs
        page.on("console", lambda msg: print(f"Browser Console: {msg.text}"))

        # Navigate
        print("Navigating...")
        page.goto("http://localhost:8080/?test=true")

        # Wait for game to load
        print("Waiting for game container...")
        try:
            page.wait_for_selector(".window-frame", timeout=10000)
        except:
             print("Failed to find window-frame.")
             return

        # Initialize Data Manager if not already
        print("Initializing game state...")
        page.wait_for_timeout(2000)

        # Inject Guild Pass and Debug Graphs
        print("Injecting Guild Pass and Debugging...")
        page.evaluate("""
            if (window.sceneManager && window.sceneManager.currentScene().party) {
                window.sceneManager.currentScene().party.storyFlags['intro_seen'] = true;
                if (!window.sceneManager.currentScene().party.inventory.find(i => i.id === 'guild_pass')) {
                     window.sceneManager.currentScene().party.inventory.push({id: 'guild_pass', name: 'Guild Pass'});
                }
            }
        """)

        # Trigger Gate Guard
        print("Triggering Gate Guard...")
        page.evaluate("""
            const scene = window.sceneManager.currentScene();
            // Fire and forget
            void scene.interpreter.execute({ type: 'NPC_DIALOGUE', id: 'npc_gate_guard' });
        """)

        page.wait_for_timeout(1000)

        # Handle "Guild Pass verified" text
        if page.is_visible("text=Guild Pass verified"):
            if page.is_visible("text=Continue"):
                 page.click("text=Continue")
                 page.wait_for_timeout(500)

        # Click "Enter Dungeon"
        print("Selecting Enter Dungeon...")
        try:
            page.click("text=Enter Dungeon", timeout=2000)
        except:
            print("Could not find Enter Dungeon button.")
            return

        page.wait_for_timeout(500)

        # Click "Yes"
        print("Selecting Yes...")
        try:
             page.click("text=Yes", timeout=2000)
        except:
             print("Could not find Yes button.")
             return

        # Wait for dungeon load
        print("Waiting for dungeon floor...")
        page.wait_for_timeout(3000)

        # Check for Stairs Up
        print("Checking for Stairs Up...")
        stairs_debug = page.evaluate("""
            () => {
                const scene = window.sceneManager.currentScene();
                if (!scene.map.floors) return 'No Floors';
                const floor = scene.map.floors[scene.map.floorIndex];
                const s = floor.events.find(e => e.id === 'stairs_up');
                if (!s) return 'No Stairs Up Event';
                return {
                    x: s.x,
                    y: s.y,
                    id: s.id
                };
            }
        """)
        print(f"Stairs Up Debug: {stairs_debug}")

        if isinstance(stairs_debug, dict):
             # Execute
             print("Executing Stairs Up event...")
             page.evaluate("""
                 const scene = window.sceneManager.currentScene();
                 const floor = scene.map.floors[scene.map.floorIndex];
                 const s = floor.events.find(e => e.id === 'stairs_up');
                 if (s.scripts && s.scripts.onEnter) {
                     void scene.interpreter.executeSequence(s.scripts.onEnter, s);
                 }
             """)

             page.wait_for_timeout(1000)
             page.screenshot(path="verification/4_stairs_prompt.png")

             # Check for "Ascend Stairs" prompt
             if page.is_visible("text=Ascend Stairs"):
                  print("SUCCESS: Ascend Stairs prompt visible.")
             else:
                  print("FAILURE: Ascend Stairs prompt NOT visible.")
        else:
             print("FAILURE: Stairs Up NOT found on Floor 1!")

        browser.close()

if __name__ == "__main__":
    verify_dungeon_entry_and_stairs()
