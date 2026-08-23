import { test, expect } from '@playwright/test';

test('authored consumable effects execute through the unified effect contract', async ({ page }) => {
  await page.goto('/?test=true');
  await page.waitForFunction(() =>
    window.sceneManager &&
    window.sceneManager.currentScene() &&
    window.sceneManager.currentScene().constructor.name === 'Scene_Map'
  );

  const result = await page.evaluate(async () => {
    const { EffectSystem } = await import('/src/engine/rules/effects.js');
    const scene = window.sceneManager.currentScene();
    const content = scene.dataManager;
    const summoner = scene.party.summoner;

    const ale = content.items.find(item => item.id === 'ale_mug');
    const wine = content.items.find(item => item.id === 'wine_glass');

    summoner.mp = 5;
    const aleEffect = ale.effects[0];
    const aleResult = EffectSystem.apply(
      aleEffect.type,
      EffectSystem.valueFromAuthoredEffect(aleEffect),
      ale,
      summoner
    );

    summoner.addState('weakened');
    const wineResults = wine.effects.map(effect => EffectSystem.apply(
      effect.type,
      EffectSystem.valueFromAuthoredEffect(effect),
      wine,
      summoner
    ));

    return {
      loaded: content.loaded,
      aleType: aleResult?.type,
      mp: summoner.mp,
      weakened: summoner.isStateAffected('weakened'),
      wineTypes: wineResults.filter(Boolean).map(event => event.type),
      registered: ['mp_heal', 'remove_status'].every(key => EffectSystem.has(key)),
    };
  });

  expect(result.loaded).toBe(true);
  expect(result.registered).toBe(true);
  expect(result.aleType).toBe('mp_heal');
  expect(result.mp).toBe(65);
  expect(result.weakened).toBe(false);
  expect(result.wineTypes).toEqual(['mp_heal', 'status_remove']);
});
