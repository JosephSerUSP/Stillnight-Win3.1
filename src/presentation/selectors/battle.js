import { ProgressionSystem } from "../../managers/progression.js";

// Helper: Calculate XP Percent
function calculateXpPercent(level, expGrowth, currentXp) {
    const xpNeeded = ProgressionSystem.xpNeeded(level, expGrowth);
    if (!xpNeeded) return 0; // Max level or invalid
    return Math.min(100, Math.max(0, ((currentXp || 0) / xpNeeded) * 100));
}

export function selectBattlerView(battler, index, type, partyInstance, battleManager) {
    if (!battler || battler.hidden) return null;

    const isEnemy = type === 'enemy';
    const isSummoner = type === 'summoner';

    // Evolution Status
    let evoStatus = 'NONE';
    if (!isEnemy && partyInstance) {
         const status = ProgressionSystem.getEvolutionStatus(battler, partyInstance.inventory || [], 1, partyInstance.gold || 0);
         evoStatus = status.status;
    }

    // Action Preview
    let actionPreview = null;
    if (!isSummoner && battleManager) {
         const planned = battleManager.getPlannedAction(battler);
         if (planned && planned.target) {
            const isActorEnemy = isEnemy;
            const isTargetEnemy = battleManager.enemies.includes(planned.target);

            // Create a minimal view for the target (just what's needed for the label)
            const targetView = {
                name: planned.target.name,
                level: planned.target.level,
                elements: planned.target.elements,
            };

            const actionName = planned.item ? planned.item.name : (planned.skillId || 'Action');

            actionPreview = {
                actionName: actionName,
                target: targetView,
                isOppositeTeam: (isActorEnemy !== isTargetEnemy)
            };
         }
    }

    return {
        id: isEnemy ? `battler-enemy-${index}` : (isSummoner ? 'battler-summoner' : `battler-party-${index}`),
        // Basic Stats
        name: battler.name,
        level: battler.level,
        hp: battler.hp,
        maxHp: battler.maxHp,
        mp: battler.mp,
        maxMp: battler.maxMp,
        xp: battler.xp,
        expGrowth: battler.expGrowth,
        xpPercent: calculateXpPercent(battler.level, battler.expGrowth, battler.xp),

        // Visuals
        spriteKey: battler.spriteKey,
        elements: battler.elements,

        // Equipment (for tooltip/display)
        equipmentItem: battler.equipmentItem ? { name: battler.equipmentItem.name, description: battler.equipmentItem.description } : null,

        // Meta
        role: battler.role,
        evolutionStatus: evoStatus,
        actionPreview: actionPreview,

        // Source reference (Opaque to the View, used for linking back to Logic if needed)
        source: battler,

        // Layout context
        index,
        type,
        isEnemy,
        isSummoner
    };
}

export function selectBattleScreen(party, enemies, battleManager) {
    const enemyViews = enemies.map((e, i) => selectBattlerView(e, i, 'enemy', null, battleManager)); // Keep nulls to preserve indices? No, Window_Battle expects compact array for enemies usually.
    // Wait, Window_Battle logic: `battlers.forEach((e, idx) => render(e, idx, 'enemy'));`
    // If I pass [null, view], idx 0 is null. idx 1 is view.
    // Position for view is calculated based on idx 1.
    // This assumes the original enemies array had a gap?
    // Usually enemies array is packed. But if an enemy is dead/hidden?
    // If selectBattlerView returns null for hidden enemy, and we keep it as null in array:
    // Window_Battle skips it. Position for next enemy uses higher index. Correct.

    // Party members (0-3)
    const partyViewsFull = party.slots.slice(0, 4).map((p, i) => {
        if (!p) return null;
        return selectBattlerView(p, i, 'party', party, battleManager);
    });

    const summonerView = party.slots[4] ? selectBattlerView(party.slots[4], 4, 'summoner', party, battleManager) : null;

    return {
        enemies: enemyViews,
        party: partyViewsFull,
        summoner: summonerView
    };
}
