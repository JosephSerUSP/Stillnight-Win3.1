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
        format: (value) => `${value > 0 ? '+' : ''}${Math.round(value * 100)}%`,
        trigger: 'turnStart',
        execute: (value, battler, context) => {
            const amount = Math.floor(battler.maxHp * value);
            if (amount <= 0) return null;

            const hpBefore = battler.hp;
            battler.hp = Math.min(battler.maxHp, battler.hp + amount);

            return {
                type: 'heal',
                battler: battler,
                target: battler,
                value: amount,
                hpBefore: hpBefore,
                hpAfter: battler.hp,
                msg: `${battler.name} regenerates ${amount} HP.`,
                animation: 'healing_sparkle'
            };
        }
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
        format: (value) => `Heals neighbors ${value} HP`,
        trigger: 'turnStart',
        execute: (value, battler, context) => {
            const { allies } = context;
            if (!allies || value <= 0) return null;

            const myIndex = allies.indexOf(battler);
            if (myIndex === -1) return null;

            // Heal neighbor (Front <-> Front, Back <-> Back in same column)
            const targetIndex = myIndex % 2 === 0 ? myIndex + 1 : myIndex - 1;

            if (targetIndex < 0 || targetIndex >= allies.length) return null;

            const target = allies[targetIndex];
            if (!target || target.hp <= 0) return null;

            const healAmount = value;

            const hpBeforeTarget = target.hp;
            target.hp = Math.min(target.maxHp, target.hp + healAmount);

            if (target.hp === hpBeforeTarget) return null; // No effective heal

            return {
                type: 'heal',
                battler: battler,
                target: target,
                value: healAmount,
                hpBefore: hpBeforeTarget,
                hpAfter: target.hp,
                msg: `[Passive] ${battler.name} heals ${target.name} for ${healAmount} HP via Symbiosis.`,
                animation: 'healing_sparkle'
            };
        }
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
        format: (value) => `Drains ${value} HP from ally`,
        trigger: 'turnStart',
        execute: (value, battler, context) => {
            const { allies } = context;
            if (!allies || value <= 0) return null;

            const myIndex = allies.indexOf(battler);
            if (myIndex === -1) return null;

            // Drain from neighbor (Front <-> Front, Back <-> Back in same column)
            const targetIndex = myIndex % 2 === 0 ? myIndex + 1 : myIndex - 1;

            if (targetIndex < 0 || targetIndex >= allies.length) return null;

            const target = allies[targetIndex];
            if (!target || target.hp <= 0) return null;

            const parasiteDrain = value;

            const hpBeforeTarget = target.hp;
            const hpBeforeSource = battler.hp;

            target.hp = Math.max(0, target.hp - parasiteDrain);
            battler.hp = Math.min(battler.maxHp, battler.hp + parasiteDrain);

            return {
                type: 'passive_drain',
                source: battler,
                target: target,
                value: parasiteDrain,
                hpBeforeTarget: hpBeforeTarget,
                hpAfterTarget: target.hp,
                hpBeforeSource: hpBeforeSource,
                hpAfterSource: battler.hp,
                msg: `[Passive] ${battler.name} drains ${parasiteDrain} HP from ${target.name}.`
            };
        }
    },
    'XP_RATE': {
        combine: 'multiply',
        label: () => "XP Rate",
        format: (value) => `x${Math.round(value * 100)}%`
    },
    'LEARN_SKILL': {
        label: (dataId) => "Learn Skill",
        format: (value, dataId) => `${dataId}`
    }
};
