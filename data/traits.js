/**
 * @file data/traits.js
 * @description Defines the definitions and formatting logic for game traits.
 * Used for tooltips and preview comparisons.
 */

export const TRAIT_DEFINITIONS = {
    'PARAM_PLUS': {
        label: (dataId) => {
            const paramNames = { maxHp: 'Max HP', atk: 'ATK', def: 'DEF', mat: 'MAT', mdf: 'MDF', agi: 'AGI', luk: 'LUK', asp: 'Action Speed' };
            return paramNames[dataId] || dataId;
        },
        format: (value) => value >= 0 ? `+${value}` : `${value}`
    },
    'PARAM_RATE': {
        combine: 'multiply',
        label: (dataId) => {
            const paramNames = { maxHp: 'Max HP', atk: 'ATK', def: 'DEF', mat: 'MAT', mdf: 'MDF', agi: 'AGI', luk: 'LUK', asp: 'Action Speed' };
            return paramNames[dataId] || dataId;
        },
        format: (value) => `x${Math.round(value * 100)}%`
    },
    'HRG': {
        label: () => "HP Regen",
        format: (value) => `${value > 0 ? '+' : ''}${Math.round(value * 100)}%`
    },
    'EVA': {
        label: () => "Evasion",
        format: (value) => `+${Math.round(value * 100)}%`
    },
    'CRI': {
        label: () => "Crit Rate",
        format: (value) => `+${Math.round(value * 100)}%`
    },
    'CEV': {
        label: () => "Crit Evasion",
        format: (value) => `+${Math.round(value * 100)}%`
    },
    'HIT': {
        label: () => "Hit Rate",
        format: (value) => `+${Math.round(value * 100)}%`
    },
    'TGR': {
        combine: 'multiply',
        label: () => "Target Rate",
        format: (value) => `x${Math.round(value * 100)}%`
    },
    'GRD': {
        combine: 'multiply',
        label: () => "Guard Effect",
        format: (value) => `${Math.round(value * 100)}%`
    },
    'REC': {
        combine: 'multiply',
        label: () => "Recovery Effect",
        format: (value) => `${Math.round(value * 100)}%`
    },
    'PHA': {
        combine: 'multiply',
        label: () => "Pharmacology",
        format: (value) => `${Math.round(value * 100)}%`
    },
    'MCV': {
        combine: 'multiply',
        label: () => "MP Cost",
        format: (value) => `${Math.round(value * 100)}%`
    },
    'TCR': {
        combine: 'multiply',
        label: () => "TP Charge",
        format: (value) => `${Math.round(value * 100)}%`
    },
    'PDR': {
        combine: 'multiply',
        label: () => "Phys Dmg Taken",
        format: (value) => `${Math.round(value * 100)}%`
    },
    'MDR': {
        combine: 'multiply',
        label: () => "Mag Dmg Taken",
        format: (value) => `${Math.round(value * 100)}%`
    },
    'FDR': {
        combine: 'multiply',
        label: () => "Floor Dmg",
        format: (value) => `${Math.round(value * 100)}%`
    },
    'EXR': {
        combine: 'multiply',
        label: () => "Exp Rate",
        format: (value) => `${Math.round(value * 100)}%`
    },
    'GDR': {
        combine: 'multiply',
        label: () => "Gold Rate",
        format: (value) => `${Math.round(value * 100)}%`
    },
    'RESTRICTION': {
        label: () => "Restriction",
        format: (value) => `${value}`
    },
    'ELEMENT_RATE': {
        combine: 'multiply',
        label: (dataId) => `${dataId} Dmg`,
        format: (value) => `x${Math.round(value * 100)}%`
    },
    'DEBUFF_RATE': {
        combine: 'multiply',
        label: (dataId) => `${dataId} Resist`,
        format: (value) => `${Math.round(value * 100)}%`
    },
    'STATE_RATE': {
        combine: 'multiply',
        label: (dataId) => `${dataId} Chance`,
        format: (value) => `${Math.round(value * 100)}%`
    },
    'STATE_RESIST': {
        label: (dataId) => `Immunity`,
        format: (value, dataId) => `${dataId}`
    },
    'ATTACK_ELEMENT': {
        label: () => "Attack Element",
        format: (value, dataId) => `${dataId}`
    },
    'ATTACK_STATE': {
        label: (dataId) => `Attack Effect`,
        format: (value, dataId) => `${dataId} ${Math.round(value * 100)}%`
    },
    'SLOT_TYPE': {
        label: () => "Slot Type",
        format: (value) => `${value}`
    },
    'ACTION_PLUS': {
        label: () => "Actions",
        format: (value) => `+${value}`
    },
    'SPECIAL_FLAG': {
        label: () => "Special",
        format: (value) => `${value}`
    },
    'COLLAPSE_TYPE': {
        label: () => "Collapse",
        format: (value) => `${value}`
    },
    'PARTY_ABILITY': {
        label: () => "Party Ability",
        format: (value) => `${value}`
    },
    'ON_PERMADEATH': {
        label: () => "On Death",
        format: (value) => "Revives once"
    },
    'SYMBIOSIS': {
        label: () => "Symbiosis",
        format: (value) => `Heals neighbors ${value} HP`
    },
    'SEE_WALLS': {
        label: () => "Vision",
        format: () => "Reveals breakable walls"
    },
    'SEE_TRAPS': {
        label: () => "Vision",
        format: () => "Reveals traps"
    },
    'INITIATIVE': {
        label: () => "Initiative",
        format: (value) => `+${Math.round(value * 100)}%`
    },
    'REAR_GUARD': {
        label: () => "Rear Guard",
        format: () => "Prevents sneak attacks"
    },
    'GOLD_DIGGER': {
        label: () => "Bonus Gold",
        format: (value) => `+${value}`
    },
    'POST_BATTLE_HEAL': {
        label: () => "Post-Battle Heal",
        format: (value) => `${value} HP`
    },
    'BATTLE_START_DAMAGE': {
        label: () => "Ambush Dmg",
        format: (value) => `${value}`
    },
    'MOVE_HEAL': {
        label: () => "Move Heal",
        format: (value) => `${value} HP`
    },
    'FLEE_CHANCE_BONUS': {
        label: () => "Flee Chance",
        format: (value) => `+${Math.round(value * 100)}%`
    },
    'ELEMENT_CHANGE': {
        label: () => "Element",
        format: (value, dataId) => `${dataId}`
    },
    'PARASITE': {
        label: () => "Parasite",
        format: (value) => `Drains ${value} HP from ally`
    },
    'XP_RATE': {
        combine: 'multiply',
        label: () => "XP Rate",
        format: (value) => `x${Math.round(value * 100)}%`
    }
};
