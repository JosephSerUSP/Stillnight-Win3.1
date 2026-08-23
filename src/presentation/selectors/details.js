import { ProgressionSystem } from "../../engine/systems/progression.js";
import { EffectAdapter } from "../../adapters/effect_adapter.js";

export function selectBattlerDetails(battler, context, dataManager) {
    if (!battler) return null;

    const inventory = context.inventory || [];
    const floorDepth = context.floorDepth || 1;
    const gold = context.gold || 0;

    const evoStatus = ProgressionSystem.getEvolutionStatus(battler, inventory, floorDepth, gold);
    const xpNeeded = ProgressionSystem.xpNeeded(battler.level, battler.expGrowth);
    const xpPercent = xpNeeded > 0 ? ((battler.xp || 0) / xpNeeded) * 100 : 0;

    const effectContext = {
        skills: dataManager?.skills,
        passives: dataManager?.passives,
        source: battler,
        target: battler,
    };

    const skills = (battler.skills || []).map(sId => {
        const skill = dataManager.skills[sId];
        if (!skill) return { id: sId, name: sId };

        const effectsText = (skill.effects || [])
            .map(effect => EffectAdapter.getDescriptionForEffect(effect, effectContext))
            .filter(Boolean)
            .join(", ");

        let tooltipText = skill.description;
        if (effectsText) {
            tooltipText += `<br/><span style="color:#478174; font-size: 0.9em;">${effectsText}</span>`;
        }

        return {
            ...skill,
            tooltip: tooltipText
        };
    });

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
        source: battler,
        name: battler.name,
        level: battler.level,
        role: battler.role,
        hp: battler.hp,
        maxHp: battler.maxHp,
        mp: battler.mp,
        maxMp: battler.maxMp,
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
