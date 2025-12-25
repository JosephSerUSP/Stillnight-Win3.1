from playwright.sync_api import sync_playwright

def verify_traits(page):
    # Add test=true to expose globals
    page.goto("http://localhost:3000/?test=true")

    # Wait for the game to load and sceneManager to be available
    page.wait_for_selector("#game-container")
    page.wait_for_function("window.sceneManager !== undefined")

    page.wait_for_function("""
        window.sceneManager.currentScene() &&
        window.sceneManager.currentScene().session &&
        window.sceneManager.currentScene().session.party
    """)

    # Inject a script to check traits via the new TraitRules (which is used by Game_Battler)
    result = page.evaluate("""() => {
        const session = window.sceneManager.currentScene().session;
        const party = session.party;
        if (!party) return "No party";

        // Debug active members
        const activeMembers = party.activeMembers;
        const membersInfo = activeMembers.map(m => m ? m.name : "null");

        // Find summoner by role 'Summoner' or check slots
        const summoner = activeMembers.find(m => m && m.role === 'Summoner');

        if (!summoner) return { error: "No summoner found", members: membersInfo };

        return {
            hp: summoner.hp,
            maxHp: summoner.maxHp,
            atk: summoner.atk,
            traits: summoner.traits.length,
            name: summoner.name
        };
    }""")

    print(f"Summoner Stats: {result}")

    # Take a screenshot
    page.screenshot(path="verification/traits_check.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            verify_traits(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
