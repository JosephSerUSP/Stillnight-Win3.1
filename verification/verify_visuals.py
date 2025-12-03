from playwright.sync_api import sync_playwright

def verify_visuals():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            page.goto("http://localhost:8080?test=true")
        except:
            print("Failed to connect to localhost:8080")
            browser.close()
            return

        page.wait_for_selector("#game-container")

        # Wait until Scene_Map is active and party is ready
        page.wait_for_function("""
            () => window.sceneManager &&
                  window.sceneManager.currentScene() &&
                  window.sceneManager.currentScene().constructor.name === 'Scene_Map' &&
                  window.sceneManager.currentScene().party
        """)

        setup_script = """
        () => {
            const scene = window.sceneManager.currentScene();

            // 1. Ensure Pixie is in party (Sense trait)
            const pixieData = window.dataManager.actors.find(a => a.id === 'pixie');
            const member = window.Game_Battler.create(pixieData, 1);

            scene.party.slots.fill(null);
            scene.party.slots[0] = member;
            scene.updateParty();

            // 2. Create a Breakable Wall event at (1, 1) relative to player
            const map = scene.map;
            const px = map.playerX;
            const py = map.playerY;
            const f = map.floors[map.floorIndex];

            // Wall at x+1 (East)
            const wx = px + 1;
            const wy = py;

            f.tiles[wy][wx] = '#';
            f.visited[wy][wx] = true;

            // Add event
            const wallEvent = new window.Game_Event(wx, wy, {
                type: 'WALL',
                symbol: 'W',
                actions: [{ type: 'BREAKABLE_WALL' }]
            });
            f.events.push(wallEvent);

            // 3. Create a Moving Enemy at (x-1, y) (West)
            const ex = px - 1;
            const ey = py;

            f.tiles[ey][ex] = '.';
            f.visited[ey][ex] = false; // Fog of war

            const enemyEvent = new window.Game_Event(ex, ey, {
                type: 'enemy',
                id: 'enemy',
                behavior: 'chase',
                symbol: '?' // Should be overwritten by updateGrid
            });
            f.events.push(enemyEvent);

            // Trigger update
            scene.updateGrid();
        }
        """

        page.evaluate(setup_script)

        page.wait_for_timeout(500)

        grid = page.locator(".exploration-grid")
        if grid.is_visible():
            grid.screenshot(path="verification/visual_check.png")
            print("Screenshot taken: verification/visual_check.png")

        browser.close()

if __name__ == "__main__":
    verify_visuals()
