from playwright.sync_api import sync_playwright
import time

def verify_battle_ui():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:8081/?test=true")

        # Wait for data load
        page.wait_for_function("window.dataManager && window.dataManager.items")

        # Setup Battle via evaluate
        page.evaluate("""
            const { BattleManager, Game_Battler, Game_Party, Window_Battle } = window;
            const dataManager = window.dataManager;

            const party = new Game_Party();
            const hero = new Game_Battler({ name: "Hero", maxHp: 100, level: 1 });
            hero.hp = 100;
            party.addMember(hero);

            const enemy = new Game_Battler({ name: "Slime", maxHp: 10, level: 1 }, 1, true);

            const bm = new BattleManager(party, dataManager);
            bm.setup([enemy], 0, 0);

            // Create Window manually to inspect it
            const win = new Window_Battle();
            win.refresh(bm.enemies, party.slots.slice(0,4));
            document.body.innerHTML = ""; // Clear existing UI
            document.body.appendChild(win.element);
            win.element.style.position = 'absolute';
            win.element.style.top = '0';
            win.element.style.left = '0';

            window.testWin = win;
            window.testHero = hero;
            window.testBm = bm;
            window.testParty = party;
        """)

        # Take initial screenshot
        page.screenshot(path="verification/battle_ui_initial.png")

        # Trigger animation
        page.evaluate("""
            window.testWin.animateBattleHpGauge(window.testHero, 100, 50, window.testBm.enemies, window.testParty.slots.slice(0,4));
        """)

        # Wait for animation to finish (approx 500ms)
        time.sleep(1)

        # Verify text content via Python assertion before screenshot (optional but good)
        text = page.evaluate("""
            const span = document.getElementById('battler-party-0');
            span ? span.parentElement.textContent : "Not Found";
        """)
        print(f"Hero Text: {text}")
        if "(HP 50/100)" not in text:
            print("FAILED: Text did not update!")
        else:
            print("SUCCESS: Text updated.")

        page.screenshot(path="verification/battle_ui_updated.png")

        browser.close()

if __name__ == "__main__":
    verify_battle_ui()
