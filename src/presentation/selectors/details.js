import { ProgressionSystem } from "../../managers/progression.js";
import { evaluateFormula } from "../../core/utils.js";

export function selectBattlerDetails(battler, context, dataManager) {
    if (!battler) return null;

    const inventory = context.inventory || [];
    const floorDepth = context.floorDepth || 1;
    const gold = context.gold || 0;

    const evoStatus = ProgressionSystem.getEvolutionStatus(battler, inventory, floorDepth, gold);
    const xpNeeded = ProgressionSystem.xpNeeded(battler.level, battler.expGrowth);
    const xpPercent = xpNeeded > 0 ? ((battler.xp || 0) / xpNeeded) * 100 : 0;

    // Skills with resolved descriptions
    const skills = (battler.skills || []).map(sId => {
        const skill = dataManager.skills[sId];
        if (!skill) return { id: sId, name: sId };

        let effectsText = "";
        if (skill.effects && skill.effects.length > 0) {
            const descriptions = [];
            skill.effects.forEach(eff => {
                 if (eff.type === 'hp_damage') {
                     const val = Math.round(evaluateFormula(eff.formula, battler));
                     descriptions.push(`Deals ~${val} Damage`);
                 } else if (eff.type === 'hp_heal') {
                     const val = Math.round(evaluateFormula(eff.formula, battler));
                     descriptions.push(`Heals ~${val} HP`);
                 } else if (eff.type === 'add_status') {
                     const chance = Math.round((eff.chance || 1) * 100);
                     descriptions.push(`${chance}% chance to add ${eff.status}`);
                 }
            });
            if (descriptions.length > 0) {
                effectsText = descriptions.join(", ");
            }
        }

        let tooltipText = skill.description;
        if (effectsText) {
            tooltipText += `<br/><span style="color:#478174; font-size: 0.9em;">${effectsText}</span>`;
        }

        return {
            ...skill,
            tooltip: tooltipText
        };
    });

    // Passives
    const passives = (battler.passives || []).map(pData => {
           const code = pData.code || pData.id;
           let def = null;
           if (dataManager && dataManager.passives) {
               def = Object.values(dataManager.passives).find(p => p.id === code || p.code === code);
           }
           if (!def) def = pData;
           return def;
    });

    return {
        source: battler, // For callbacks
        name: battler.name,
        level: battler.level,
        role: battler.role,
        hp: battler.hp,
        maxHp: battler.maxHp,
        mp: battler.mp,
        maxMp: battler.maxMp,

        // Stats
        atk: battler.atk,
        def: battler.def,
        mat: battler.mat,
        mdf: battler.mdf,
        agi: battler.agi,
        luk: battler.luk,

        xp: battler.xp,
        xpNeeded,
        xpPercent,
        elements: battler.elements,
        spriteKey: battler.spriteKey,
        equipmentItem: battler.equipmentItem ? {
            name: battler.equipmentItem.name,
            icon: battler.equipmentItem.icon,
            description: battler.equipmentItem.description,
            traits: battler.equipmentItem.traits
        } : null,
        baseEquipment: battler.baseEquipment,
        flavor: battler.flavor,

        skills,
        passives,

        evolutionStatus: evoStatus.status,
        evolutionData: evoStatus.evolution,

        sacrificeValue: battler.level * (battler.hp + battler.maxHp)
    };
}
