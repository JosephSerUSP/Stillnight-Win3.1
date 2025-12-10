
const { test, expect } = require('@playwright/test');

test('HP Gauge displays value and damage preview', async ({ page }) => {
    // 1. Go to game with test mode
    await page.goto('http://127.0.0.1:8080/?test=true');
    await page.waitForLoadState('networkidle');

    // 2. Setup Test Environment
    await page.evaluate(async () => {
        // Disable animations
        window.ConfigManager.windowAnimations = false;

        // Create mock battlers
        const hero = {
            name: "Hero",
            hp: 100,
            maxHp: 200,
            mp: 50,
            maxMp: 100,
            atk: 10,
            asp: 10,
            elements: [],
            getPassiveValue: () => 0,
            onTurnStart: () => [],
            hidden: false
        };
        const enemy = {
            name: "Slime",
            hp: 50,
            maxHp: 50,
            atk: 5,
            asp: 5,
            elements: [],
            getPassiveValue: () => 0,
            onTurnStart: () => [],
            hidden: false
        };

        // Initialize BattleManager
        const party = { slots: [hero, null, null, null], activeMembers: [hero], summoner: null };
        const dataManager = window.dataManager;
        window.battleManager = new window.BattleManager(party, dataManager);
        window.battleManager.setup([enemy], 0, 0);

        // Instantiate Window_Battle directly
        const win = new window.Window_Battle();
        document.body.appendChild(win.element);
        win.open();

        // Expose to window for subsequent evaluate blocks
        window.testBattleWindow = win;
        window.hero = hero;
        window.enemy = enemy;
        window.party = party;
    });

    // 3. Verify HP Text (Initial State)
    await page.evaluate(() => {
        const win = window.testBattleWindow;
        win.refresh(window.battleManager.enemies, window.party.slots.slice(0, 4), window.party, window.battleManager);
    });

    // Check Hero HP Text
    // Hero is at index 0 (party). ID: battler-party-0
    const hpText = await page.locator('#battler-party-0 .battler-hp').textContent();
    console.log('HP Text found:', hpText);
    expect(hpText).toContain('100/200');

    // 4. Setup Planned Action (Enemy attacking Hero) and Verify Preview
    await page.evaluate(() => {
        const hero = window.hero;
        const enemy = window.enemy;

        // Manually push to turnQueue
        const action = new window.Game_Action(enemy);
        action.setAttack();
        action.target = hero; // Target the hero

        window.battleManager.turnQueue = [
            { battler: enemy, action: action, totalSpeed: 10 }
        ];

        // Refresh UI
        window.testBattleWindow.refresh(window.battleManager.enemies, window.party.slots.slice(0, 4), window.party, window.battleManager);
    });

    // 5. Verify Preview in HP Gauge
    const hpTextWithPreview = await page.locator('#battler-party-0 .battler-hp').textContent();
    console.log('HP Text with preview:', hpTextWithPreview);

    // Check for '!' character in the gauge (indicates preview)
    expect(hpTextWithPreview).toContain('!');
    // It should still have the numbers
    expect(hpTextWithPreview).toContain('100/200');
});
