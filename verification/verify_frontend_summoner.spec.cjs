
const { test, expect } = require('@playwright/test');

test('verify battle UI and summoner targeting', async ({ page }) => {
  // 1. Go to the page (with test mode)
  await page.goto('http://localhost:8080/?test=true');

  // 2. Wait for game to load
  await page.waitForSelector('#game-container');
  // Wait for DataManager
  await page.waitForFunction(() => window.dataManager && window.dataManager.loaded);

  await page.evaluate(() => {
      // Manual Injection of Party
      window.sceneManager.party = new window.Game_Party();
      // Initialize mocks if needed, or rely on defaults
      const party = window.sceneManager.party;

      // Ensure Summoner exists
      if (!party.summoner) {
          const summonerData = window.dataManager.actors.find(a => a.id === 'summoner');
          const summoner = window.Game_Battler.create(summonerData, 1);
          party.slots[4] = summoner;
      }

      // Add a party member
      const pixieData = window.dataManager.actors.find(a => a.id === 'pixie');
      party.slots[0] = window.Game_Battler.create(pixieData, 1);

      // Mock Enemy
      const goblinData = window.dataManager.actors.find(a => a.id === 'imp');
      const enemies = [window.Game_Battler.create(goblinData, 1)];

      // Push Battle Scene
      const battleScene = new window.Scene_Battle(
          window.dataManager,
          window.sceneManager,
          window.windowManager,
          party,
          null,
          window.sceneManager.windowLayer,
          { floors: [{ depth: 1 }], floorIndex: 0, revealAroundPlayer: () => {} },
          0, 0,
          {
              formation: new window.Window_Formation(),
              inventory: new window.Window_Inventory(),
              partySelect: new window.Window_PartySelect(),
              confirmEffect: new window.Window_ConfirmEffect(),
              confirm: new window.Window_Confirm(),
              equipItemSelect: new window.Window_EquipItemSelect()
          }
      );

      // Mock Previous Scene context for HUD
      window.sceneManager._stack.push({ hud: { setMode: () => {} }, getContext: () => ({}), updateParty: () => {} });

      window.sceneManager.push(battleScene);
      battleScene.start();
  });

  // 4. Verify UI Elements
  // Wait for battle window
  await page.waitForSelector('#battler-summoner');

  // Take screenshot
  await page.screenshot({ path: 'verification/battle_summoner.png' });

  // 5. Verify Summoner HP Element
  const summonerHp = await page.textContent('#battler-summoner .battler-hp');
  console.log('Summoner HP Text:', summonerHp);
  expect(summonerHp).not.toBe('');
});
