from playwright.sync_api import sync_playwright

def verify_inspect():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            page.goto('http://localhost:8080/?test=true')
            page.wait_for_load_state('networkidle')

            # Wait for game to initialize
            page.wait_for_function("() => window.sceneManager && window.sceneManager.currentScene()")

            # Using window.Window_Inspect requires it to be exported to window in test mode.
            # Memory says: "specific window classes (e.g. Window_Formation, Window_Shop, Window_Inventory, Window_Battle) to the global window object when the URL query parameter test=true is present."
            # Window_Inspect might NOT be exported.
            # I need to check src/main.js or src/windows/index.js to see what is exported.
            # Assuming it is NOT exported, I can trigger it via the game UI.
            # E.g. Click a party member in the party panel to open inspect?
            # Or assume it IS exported because I saw Window_Inspect used in the codebase.
            # Let's check src/main.js

            # If not exported, I can trigger it by:
            # 1. Opening the Inventory (if it has inspect)
            # 2. Or using the Party Panel (HUD) if clickable.

            # Let's try to see if Window_Inspect is in window.
            is_exported = page.evaluate("() => !!window.Window_Inspect")
            if not is_exported:
                print("Window_Inspect is not exported globally. Attempting to trigger via UI.")

                # Try to click on the first party slot in the HUD
                # .party-slot-0 should exist.
                page.click('.party-slot-0', force=True)

                # This should open Window_Inspect? Or Window_PartySelect?
                # Usually clicking a party slot opens Inspect or Status.
                # Let's assume it opens Inspect.
            else:
                 page.evaluate("""() => {
                    let party = null;
                    if (window.sceneManager.currentScene() && window.sceneManager.currentScene().party) {
                        party = window.sceneManager.currentScene().party;
                    } else {
                         const data = window.dataManager.actors['pixie'];
                         if (data) {
                            const battler = new window.Game_Battler(data, 1);
                            party = { members: [battler] };
                         }
                    }

                    const member = party && party.members[0];
                    if (member) {
                        member.skills = ['fireball', 'heal'];
                        member.passives = [{id: 'regen', name: 'Regen'}, {id: 'tough', name: 'Tough'}];
                        member.flavor = "A mysterious creature.";
                        member.equipmentItem = { name: "Wooden Sword" };

                        if (window.dataManager.skills) {
                            if (!window.dataManager.skills['fireball']) {
                                window.dataManager.skills['fireball'] = { name: 'Fireball', description: 'Deals damage' };
                                window.dataManager.skills['heal'] = { name: 'Heal', description: 'Heals HP' };
                            }
                        }

                        const win = new window.Window_Inspect();
                        window.windowManager.push(win);
                        win.setup(member, { floorDepth: 1, gold: 100 }, window.dataManager, {});
                    }
                }""")

            page.wait_for_selector('#inspect-window')
            page.screenshot(path='verification/inspect_window.png')
            print("Screenshot taken.")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_inspect()
