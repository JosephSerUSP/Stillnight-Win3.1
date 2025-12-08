
export const gambitTargets = [
    { id: 'enemy_nearest', name: 'Enemy: Nearest', type: 'enemy', condition: 'nearest' },
    { id: 'enemy_lowest_hp', name: 'Enemy: Lowest HP', type: 'enemy', condition: 'lowest_hp' },
    { id: 'enemy_any', name: 'Enemy: Any', type: 'enemy', condition: 'any' },
    { id: 'ally_hp_50', name: 'Ally: HP < 50%', type: 'ally', condition: 'hp_below', value: 0.5 },
    { id: 'ally_any', name: 'Ally: Any', type: 'ally', condition: 'any' },
    { id: 'ally_status_blind', name: 'Ally: Blind', type: 'ally', condition: 'status', value: 'blind' },
    { id: 'ally_status_ko', name: 'Ally: KO', type: 'ally', condition: 'status', value: 'dead' }, // KO is dead in engine
    { id: 'self', name: 'Self', type: 'self', condition: 'always' },
    { id: 'self_hp_50', name: 'Self: HP < 50%', type: 'self', condition: 'hp_below', value: 0.5 }
];
