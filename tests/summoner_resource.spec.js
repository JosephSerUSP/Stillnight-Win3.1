import { test, expect } from '@playwright/test';

test('Summoner exhaustion escalates in runtime and authored MP recovery clears it immediately', async ({ page }) => {
  await page.goto('/?test=true');
  await page.waitForFunction(() =>
    window.sceneManager &&
    window.sceneManager.currentScene() &&
    window.sceneManager.currentScene().constructor.name === 'Scene_Map'
  );

  const result = await page.evaluate(() => {
    const scene = window.sceneManager.currentScene();
    const party = scene.party;
    const summoner = party.summoner;
    const creature = party.activeMembers.find(member => member.role !== 'Summoner');
    const ale = scene.dataManager.items.find(item => item.id === 'ale_mug');

    summoner.mp = 0;
    summoner.exhaustion = 0;
    creature.hp = creature.maxHp;
    creature.states = [];

    const levelOneEvents = party.onStep(false);
    const hpAfterLevelOne = creature.hp;
    const levelTwoEvents = party.onStep(false);
    const hpAfterLevelTwo = creature.hp;

    party.inventory.push(ale);
    scene.useItem(ale, summoner);

    return {
      levelOne: levelOneEvents.find(event => event.type === 'exhaustion_start')?.level,
      levelTwo: levelTwoEvents.find(event => event.type === 'exhaustion_increase')?.level,
      firstDamage: creature.maxHp - hpAfterLevelOne,
      secondDamage: hpAfterLevelOne - hpAfterLevelTwo,
      mpAfterRecovery: summoner.mp,
      exhaustionAfterRecovery: summoner.exhaustion,
      weakenedAfterRecovery: creature.isStateAffected('weakened'),
    };
  });

  expect(result.levelOne).toBe(1);
  expect(result.levelTwo).toBe(2);
  expect(result.secondDamage).toBeGreaterThan(result.firstDamage);
  expect(result.mpAfterRecovery).toBeGreaterThan(0);
  expect(result.exhaustionAfterRecovery).toBe(0);
  expect(result.weakenedAfterRecovery).toBe(false);
});

test('battle Formation and Flee dispatch through the direct Summoner cost contract', async ({ page }) => {
  await page.goto('/?test=true');
  await page.waitForFunction(() =>
    window.sceneManager &&
    window.sceneManager.currentScene() &&
    window.sceneManager.currentScene().constructor.name === 'Scene_Map'
  );

  await page.evaluate(() => {
    window.ConfigManager.windowAnimations = false;
    window.sceneManager.currentScene().startBattle(0, 0);
  });
  await page.waitForFunction(() =>
    window.sceneManager.currentScene() &&
    window.sceneManager.currentScene().constructor.name === 'Scene_Battle'
  );

  await page.evaluate(() => {
    const battle = window.sceneManager.currentScene();
    battle.party.summoner.mp = 10;
    battle.party.summoner.exhaustion = 0;
    battle.onFormationClick();
    battle.formationWindow.onSlotClick(null, 0);
    battle.formationWindow.onSlotClick(null, 1);
    battle.confirmWindow.btnOk.click();
  });

  await page.waitForFunction(() => window.sceneManager.currentScene().party.summoner.mp === 9);

  const result = await page.evaluate(async () => {
    const battle = window.sceneManager.currentScene();
    const map = window.sceneManager.previous();
    map.getFleeChance = () => 0;
    await battle.attemptFlee();
    return {
      scene: window.sceneManager.currentScene().constructor.name,
      mp: battle.party.summoner.mp,
      formationUsed: battle.actionTakenThisTurn,
    };
  });

  expect(result.scene).toBe('Scene_Battle');
  expect(result.mp).toBe(8);
  expect(result.formationUsed).toBe(true);
});
