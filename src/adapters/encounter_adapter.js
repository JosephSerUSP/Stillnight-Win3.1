import { Game_Battler } from "../objects/battler.js";
import { randInt, pickWeighted, random } from "../core/utils.js";
import { Registry } from "../engine/data/registry.js";

/**
 * Adapter to generate Game_Battler instances from encounter data.
 * Bridges the gap between pure Engine data and Legacy Game Objects.
 */
export class EncounterAdapter {
    /**
     * Generates a list of enemy battlers for a given floor/encounter.
     * @param {Object} mapFloor - The floor data object.
     * @param {Object|string} encounterData - Specific encounter ID or config.
     * @param {number} depth - Dungeon depth.
     * @param {import("../managers/data.js").DataManager} dataManager - Legacy DataManager (fallback).
     * @returns {Array<Game_Battler>} List of enemy instances.
     */
    static generateEnemies(mapFloor, encounterData, depth, dataManager) {
        const enemies = [];
        // Use Registry if available, else fallback to dataManager or empty
        const actors = Registry.get('actors') || (dataManager ? dataManager.actors : []);

        if (!actors || actors.length === 0) return [];

        // 1. Boss Encounter (Last Floor)
        // Check if mapFloor indicates end (this logic was in Scene_Battle)
        // We might need to pass an "isBoss" flag or similar, but for now we replicate the logic
        // if we can determine it's the last floor.
        // However, Scene_Battle logic was: if (this.map.floorIndex === this.map.floors.length - 1)
        // We don't have map object here, just floor.
        // So the caller should handle the "Boss" decision and pass a boss encounter ID.

        // Actually, let's keep the logic simple: verify encounterData.

        if (encounterData) {
            // Specific Encounter (Boss or Fixed)
            let encId = typeof encounterData === 'string' ? encounterData : encounterData.id;

            if (encId) {
                 const maxEnemies = 3; // Default cap
                 const enemyCount = (encounterData.count) ? encounterData.count : randInt(1, maxEnemies);
                 // Note: Scene_Battle logic for fixed encounter was:
                 // if (encId) { ... randInt(1, maxEnemies) ... }
                 // Wait, if I pass a BOSS ID, I don't want 1-3 bosses?
                 // Scene_Battle had explicit Boss logic separate from encounterData.

                 const tpl = actors.find(a => a.id === encId);
                 if (tpl) {
                     // If it's a boss (role='Boss'), just 1.
                     const count = (tpl.role === 'Boss') ? 1 : enemyCount;
                     for (let i = 0; i < count; i++) {
                         enemies.push(new Game_Battler(tpl, depth, true));
                     }
                 }
            } else if (Array.isArray(encounterData)) {
                encounterData.forEach(eConfig => {
                     const tpl = actors.find(a => a.id === eConfig.id);
                     if (tpl) enemies.push(new Game_Battler(tpl, depth, true));
                });
            }
        } else {
            // Random Encounter from Floor Table
            if (mapFloor.encounters && mapFloor.encounters.length > 0) {
                const maxEnemies = 3;
                // Scene_Battle used logic: if floorIndex === 0 ? 2 : 3.
                // We'll approximate or let caller handle count.
                const enemyCount = randInt(1, maxEnemies);
                for (let i = 0; i < enemyCount; i++) {
                    const encounter = pickWeighted(mapFloor.encounters);
                    if (encounter) {
                        const tpl = actors.find(a => a.id === encounter.id);
                        if (tpl) {
                            enemies.push(new Game_Battler(tpl, depth, true));
                        } else {
                            // Fallback
                            const randomTpl = actors[randInt(0, actors.length - 1)];
                             enemies.push(new Game_Battler(randomTpl, depth, true));
                        }
                    }
                }
            } else {
                // Fallback: Random from all actors
                const maxEnemies = 2;
                const enemyCount = randInt(1, maxEnemies);
                for (let i = 0; i < enemyCount; i++) {
                  const tpl = actors[randInt(0, actors.length - 1)];
                  enemies.push(new Game_Battler(tpl, depth, true));
                }
            }
        }

        return enemies;
    }

    /**
     * Creates a specific Boss instance (e.g. Eternal Warden).
     */
    static createBoss(depth, dataManager) {
        const actors = Registry.get('actors') || (dataManager ? dataManager.actors : []);
        const template = actors.find((a) => a.id === 'eternalWarden' || a.role === 'Boss');
        if (template) {
            return new Game_Battler(template, depth, true);
        }

        const bossHp = 40 + (depth - 3) * 5;
        return new Game_Battler({
            id: 'eternalWarden',
            name: "🌑 Eternal Warden",
            role: "Boss",
            maxHp: bossHp,
            elements: ["Black"],
            skills: ["shadowClaw", "infernalPact"],
            gold: 100,
            expGrowth: 10,
        }, depth, true);
    }
}
