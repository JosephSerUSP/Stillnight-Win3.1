export function selectInventoryItem(item) {
    let tooltipText = item.description;
    let effectsText = "";
    const effects = [];
    if (item.effects) {
         item.effects.forEach(e => {
             const val = e.formula || e.value;
             if (e.type === 'hp') effects.push(`Restores ${val} HP`);
             if (e.type === 'maxHp') effects.push(`Max HP +${val}`);
             if (e.type === 'xp') effects.push(`Grants ${val} XP`);
             if (e.type === 'recruit_egg') effects.push(`Recruits Unit`);
         });
    }
    if (item.traits) {
         item.traits.forEach(t => {
             if (t.code === 'PARAM_PLUS') {
                 if (t.dataId === 'atk') effects.push(`Damage +${t.value}`);
                 if (t.dataId === 'maxHp') effects.push(`Max HP +${t.value}`);
             }
         });
    }
    if (item.damageBonus) effects.push(`Damage +${item.damageBonus}`);

    if (effects.length > 0) effectsText = effects.join(", ");
    if (effectsText) tooltipText += `<br/><span class="text-functional" style="font-size: 0.9em;">${effectsText}</span>`;

    return {
        id: item.id,
        name: item.name,
        type: item.type,
        description: item.description,
        tooltip: tooltipText,

        // Pass specific props needed for interactions if not covered by 'source'
        // But usually source is enough for game logic.
        source: item
    };
}

export function selectInventory(party) {
    if (!party || !party.inventory) return [];
    return party.inventory.map(selectInventoryItem);
}
