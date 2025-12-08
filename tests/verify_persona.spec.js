import { test, expect } from '@playwright/test';

test('Persona Campaign Verification', async ({ page }) => {
  page.on('console', msg => console.log(`[Browser] ${msg.text()}`));
  await page.goto('http://localhost:8080/?test=true');

  await page.waitForSelector('text=New Run', { timeout: 10000 });
  await page.click('button:has-text("New Run")');
  await page.waitForTimeout(1000);

  // Jump to Mikage High School (Map 7) and teleport next to Philemon, clearing enemies
  await page.evaluate(() => {
    const scene = window.sceneManager.currentScene();
    scene.map.floorIndex = 7;
    const f = scene.map.floors[7];
    // Keep only Philemon (now ID recruit, so look for coordinates)
    f.events = f.events.filter(e => e.x === 9 && e.y === 5);
    // Teleport to (8, 5)
    scene.map.playerX = 8;
    scene.map.playerY = 5;
    scene.map.revealCurrentFloor();
    scene.updateAll();
  });
  await page.waitForTimeout(1000);

  const bodyText = await page.textContent('body');
  expect(bodyText).toContain("Mikage High School");

  // Move right once to interact (bump)
  await page.keyboard.press('ArrowRight');

  // Wait for Philemon dialogue
  await page.waitForSelector('text=Philemon', { timeout: 5000 });

  await page.click('button:has-text("Yes")');
  await page.waitForTimeout(500);

  const hasPersona = await page.evaluate(() => {
    const scene = window.sceneManager.currentScene();
    return scene.party.inventory.some(i => i.id === 'persona_seimen_kongou');
  });
  expect(hasPersona).toBeTruthy();

  await page.waitForSelector('text=Awaken, Seimen Kongou');
  await page.click('button:has-text("Farewell")');
  await page.waitForTimeout(500);

  await page.click('button:has-text("Inventory")');
  await page.waitForTimeout(500);

  await page.click('div:has-text("Seimen Kongou")');
  await page.click('button:has-text("Equip")');
  await page.click('.party-member-card');
  await page.click('button:has-text("Confirm")');
  await page.waitForTimeout(500);

  const isEquipped = await page.evaluate(() => {
     const scene = window.sceneManager.currentScene();
     const hero = scene.party.members[0];
     return hero.personaItem && hero.personaItem.id === 'persona_seimen_kongou';
  });
  expect(isEquipped).toBeTruthy();

  const hasSkill = await page.evaluate(() => {
     const scene = window.sceneManager.currentScene();
     const hero = scene.party.members[0];
     return hero.effectiveSkills.includes('agi');
  });
  expect(hasSkill).toBeTruthy();
});
