import { test, expect } from '@playwright/test';

test.describe('Campaign data integrity', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/?test=true');
        await page.waitForFunction(() =>
            window.dataManager?.actors &&
            window.dataManager?.items &&
            window.dataManager?.maps &&
            window.dataManager?.events
        );
    });

    test('all map creature, recruit, treasure, and event references resolve', async ({ page }) => {
        const missing = await page.evaluate(() => {
            const data = window.dataManager;
            const actors = new Set(data.actors.map(actor => actor.id));
            const items = new Set(data.items.map(item => item.id));
            const events = new Set(data.events.map(event => event.id));
            const result = [];

            for (const map of data.maps) {
                for (const encounter of map.encounters || []) {
                    if (!actors.has(encounter.id)) result.push(`${map.title}:actor:${encounter.id}`);
                }
                for (const recruit of map.recruits || []) {
                    if (!actors.has(recruit)) result.push(`${map.title}:recruit:${recruit}`);
                }
                for (const treasure of map.treasures || []) {
                    if (!items.has(treasure)) result.push(`${map.title}:item:${treasure}`);
                }
                for (const event of map.events || []) {
                    if (!events.has(event.id)) result.push(`${map.title}:event:${event.id}`);
                    for (const encounter of event.encounters || []) {
                        if (!actors.has(encounter.id)) result.push(`${map.title}:event-actor:${encounter.id}`);
                    }
                }
            }
            return result;
        });

        expect(missing).toEqual([]);
    });

    test('all creature skills and evolutions resolve', async ({ page }) => {
        const missing = await page.evaluate(() => {
            const data = window.dataManager;
            const actors = new Set(data.actors.map(actor => actor.id));
            const skills = new Set(Object.keys(data.skills));
            const result = [];

            for (const actor of data.actors) {
                for (const skill of actor.skills || []) {
                    if (!skills.has(skill)) result.push(`${actor.id}:skill:${skill}`);
                }
                for (const evolution of actor.evolutions || []) {
                    if (!actors.has(evolution.evolvesTo)) result.push(`${actor.id}:evolution:${evolution.evolvesTo}`);
                }
            }
            return result;
        });

        expect(missing).toEqual([]);
    });
});
