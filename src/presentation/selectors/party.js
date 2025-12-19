import { ProgressionSystem } from "../../engine/systems/progression.js";

// Helper: Calculate XP Percent
function calculateXpPercent(level, expGrowth, currentXp) {
    const xpNeeded = ProgressionSystem.xpNeeded(level, expGrowth);
    if (!xpNeeded) return 0; // Max level or invalid
    return Math.min(100, Math.max(0, ((currentXp || 0) / xpNeeded) * 100));
}

export function selectPartyMemberView(battler, index, context = {}) {
    if (!battler) return null;

    // Evolution Status
    // Context should contain inventory, floorDepth, gold
    const statusObj = ProgressionSystem.getEvolutionStatus(
        battler,
        context.inventory || [],
        context.floorDepth || 1,
        context.gold || 0
    );

    return {
        // ID & Basic info
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
        role: battler.role,

        // Equipment
        equipmentItem: battler.equipmentItem ? {
            name: battler.equipmentItem.name,
            icon: battler.equipmentItem.icon,
            description: battler.equipmentItem.description,
            traits: battler.equipmentItem.traits
        } : null,

        // Computed
        evolutionStatus: statusObj.status,

        // Passives/Skills (if needed for tooltip, but usually handled by dataManager lookup in utils currently)
        // ideally we would map them here too, but utils.renderCreatureInfo does heavy lifting.
        // For the party slot, we mainly need name, hp, xp, evolution.

        // Source for linking back (e.g. for click handlers that expect the object)
        // Note: The UI handlers in Scene_Map often expect the Game_Battler object.
        // We pass it as 'source'.
        source: battler,

        index
    };
}

export function selectPartyHUD(party, context = {}) {
    const slots = party.slots.map((member, index) => {
        return selectPartyMemberView(member, index, context);
    });

    return {
        slots: slots,
        gold: party.gold
    };
}
