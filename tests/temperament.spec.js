const { test, expect } = require('@playwright/test');

test('Temperament System - RUTHLESS targets lowest HP', async ({ page }) => {
    await page.goto('http://localhost:8000/?test=true');
    await page.waitForFunction(() => window.TemperamentSystem && window.Game_Battler);

    // Disable animations
    await page.evaluate(() => {
        window.ConfigManager.windowAnimations = false;
    });

    const result = await page.evaluate(() => {
        // Setup
        const battler = new window.Game_Battler({
            name: "Killer",
            level: 5,
            temperament: "RUTHLESS",
            skills: ["windBlade"], // damage skill
            role: "Attacker"
        }, 1, true);

        const weakEnemy = new window.Game_Battler({ name: "Weak", maxHp: 10 }, 1, false);
        weakEnemy.hp = 2;
        // ensure maxHp is set correctly if Game_Battler calculates it
        weakEnemy._baseMaxHp = 10;

        const strongEnemy = new window.Game_Battler({ name: "Strong", maxHp: 100 }, 1, false);
        strongEnemy.hp = 100;
        strongEnemy._baseMaxHp = 100;

        const mockParty = { activeMembers: [weakEnemy, strongEnemy] };
        const mockBattleManager = {
            party: mockParty,
            enemies: [battler],
            activeMembers: [weakEnemy, strongEnemy]
        };

        const action = window.TemperamentSystem.determineAction(battler, mockBattleManager);

        return {
            targetName: action.target.name,
            type: action.type
        };
    });

    expect(result.targetName).toBe('Weak');
});

test('Temperament System - KIND heals wounded ally', async ({ page }) => {
    await page.goto('http://localhost:8000/?test=true');
    await page.waitForFunction(() => window.TemperamentSystem && window.Game_Battler);

    // Disable animations
    await page.evaluate(() => {
        window.ConfigManager.windowAnimations = false;
    });

    const result = await page.evaluate(() => {
        const healer = new window.Game_Battler({
            name: "Healer",
            level: 5,
            temperament: "KIND",
            skills: ["soothingMote"], // heal skill
            role: "Healer"
        }, 1, false); // Ally

        const woundedAlly = new window.Game_Battler({ name: "Wounded", maxHp: 20 }, 1, false);
        woundedAlly.hp = 5;
        woundedAlly._baseMaxHp = 20;

        const healthyAlly = new window.Game_Battler({ name: "Healthy", maxHp: 20 }, 1, false);
        healthyAlly.hp = 20;
        healthyAlly._baseMaxHp = 20;

        const enemy = new window.Game_Battler({ name: "Enemy", maxHp: 20 }, 1, true);

        // Mock BattleManager for an Ally (party members are allies)
        const mockBattleManager = {
            party: { activeMembers: [healer, woundedAlly, healthyAlly] },
            enemies: [enemy]
        };

        const action = window.TemperamentSystem.determineAction(healer, mockBattleManager);

        return {
            targetName: action.target.name,
            skillId: action.skillId,
            type: action.type
        };
    });

    expect(result.type).toBe('skill');
    expect(result.skillId).toBe('soothingMote');
    expect(result.targetName).toBe('Wounded');
});
