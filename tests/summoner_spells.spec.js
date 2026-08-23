import { test, expect } from '@playwright/test';

async function enterBattle(page) {
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
}

test('Spell command exposes invalid/MP states and Cure resolves end-to-end', async ({ page }) => {
  await enterBattle(page);

  await page.evaluate(() => {
    const battle = window.sceneManager.currentScene();
    battle.party.summoner.mp = 0;
    battle.party.activeMembers.forEach(member => { member.hp = member.maxHp; });
    battle.renderBattleAscii();
  });

  const spellButton = page.getByRole('button', { name: 'Spell', exact: true });
  await expect(spellButton).toBeVisible();
  await spellButton.click();

  const spellWindow = page.locator('#spell-select-window');
  const cure = spellWindow.locator('[data-spell-id="cure"]');
  await expect(spellWindow).toBeVisible();
  await expect(cure).toBeDisabled();
  await expect(cure).toContainText('insufficient mp');

  await spellWindow.getByRole('button', { name: 'Cancel' }).click();

  await page.evaluate(() => {
    const battle = window.sceneManager.currentScene();
    battle.party.summoner.mp = 20;
    battle.party.activeMembers.forEach(member => { member.hp = member.maxHp; });
  });

  await spellButton.click();
  await expect(cure).toBeDisabled();
  await expect(cure).toContainText('no valid targets');
  await spellWindow.getByRole('button', { name: 'Cancel' }).click();

  const setup = await page.evaluate(() => {
    const battle = window.sceneManager.currentScene();
    const target = battle.party.slots[0];
    target.hp = Math.max(1, target.maxHp - 10);
    battle.party.summoner.mp = 20;
    battle.renderBattleAscii();
    return { hp: target.hp, maxHp: target.maxHp };
  });

  await spellButton.click();
  await expect(cure).toBeEnabled();
  await cure.click();

  const targetSlot = page.locator('#party-select-window [data-index="0"]');
  await expect(targetSlot).toBeVisible();
  await targetSlot.click();

  await page.waitForFunction(() => {
    const battle = window.sceneManager.currentScene();
    return battle.actionTakenThisTurn && battle.party.summoner.mp === 16;
  });

  const result = await page.evaluate(() => {
    const battle = window.sceneManager.currentScene();
    return {
      hp: battle.party.slots[0].hp,
      mp: battle.party.summoner.mp,
      actionTaken: battle.actionTakenThisTurn,
      log: battle.battleWindow.logEl.textContent,
    };
  });

  expect(result.hp).toBeGreaterThan(setup.hp);
  expect(result.hp).toBeLessThanOrEqual(setup.maxHp);
  expect(result.mp).toBe(16);
  expect(result.actionTaken).toBe(true);
  expect(result.log).toContain('casts Cure');
});

test('Protect is a non-healing Summoner spell and does not add a Summoner turn', async ({ page }) => {
  await enterBattle(page);

  await page.evaluate(() => {
    const battle = window.sceneManager.currentScene();
    battle.party.summoner.mp = 20;
    battle.party.slots[0].removeState('protect');
  });

  await page.getByRole('button', { name: 'Spell', exact: true }).click();
  const protect = page.locator('#spell-select-window [data-spell-id="protect"]');
  await expect(protect).toBeEnabled();
  await protect.click();

  const targetSlot = page.locator('#party-select-window [data-index="0"]');
  await expect(targetSlot).toBeVisible();
  await targetSlot.click();

  await page.waitForFunction(() => {
    const battle = window.sceneManager.currentScene();
    return battle.party.slots[0].isStateAffected('protect') && battle.party.summoner.mp === 15;
  });

  const result = await page.evaluate(() => {
    const battle = window.sceneManager.currentScene();
    return {
      protected: battle.party.slots[0].isStateAffected('protect'),
      mp: battle.party.summoner.mp,
      summonerQueued: battle.battleManager.turnQueue.some(entry => entry.battler?.role === 'Summoner'),
      actionTaken: battle.actionTakenThisTurn,
    };
  });

  expect(result.protected).toBe(true);
  expect(result.mp).toBe(15);
  expect(result.summonerQueued).toBe(false);
  expect(result.actionTaken).toBe(true);
});
