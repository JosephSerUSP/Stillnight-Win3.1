import { evaluateFormula, probabilisticRound, random } from "../../core/utils.js";

/**
 * Registry and executor for immediate action effects.
 *
 * Each effect definition owns execution, static description, and optional
 * target-specific preview so authored effect strings cannot drift across
 * separate runtime/UI vocabularies.
 */
export class EffectSystem {
    static definitions = {};

    /**
     * @param {string} key
     * @param {{
     *   apply: Function,
     *   describe: Function,
     *   preview?: Function
     * }} definition
     */
    static register(key, definition) {
        if (!definition || typeof definition.apply !== 'function') {
            throw new TypeError(`Effect '${key}' requires an apply handler.`);
        }
        if (typeof definition.describe !== 'function') {
            throw new TypeError(`Effect '${key}' requires a description handler.`);
        }
        this.definitions[key] = definition;
    }

    static alias(aliasKey, targetKey) {
        const definition = this.definitions[targetKey];
        if (!definition) throw new Error(`Cannot alias unknown effect '${targetKey}'.`);
        this.definitions[aliasKey] = definition;
    }

    static has(key) {
        return !!this.definitions[key];
    }

    static getRegisteredKeys() {
        return Object.keys(this.definitions).sort();
    }

    static apply(key, value, source, target, context = {}) {
        const definition = this.definitions[key];
        if (!definition) {
            console.warn(`Unknown effect key: ${key}`);
            return null;
        }
        return definition.apply(value, source, target, context);
    }

    static getDescription(key, value, context = {}) {
        const definition = this.definitions[key];
        if (!definition) return `${key}: ${this._displayValue(value)}`;
        return definition.describe(value, context);
    }

    static getPreview(key, value, target, source, context = {}) {
        const definition = this.definitions[key];
        if (!definition) return `${key}: ${this._displayValue(value)}`;
        if (definition.preview) {
            return definition.preview(value, target, source, context);
        }
        return definition.describe(value, context);
    }

    /** Normalizes an authored effect object into the value consumed by handlers. */
    static valueFromAuthoredEffect(effect) {
        if (!effect) return undefined;
        if (effect.type === 'add_status') {
            return { id: effect.status, chance: effect.chance };
        }
        return effect.formula ?? effect.value;
    }

    static _evaluate(value, target, source) {
        if (typeof value === 'string') {
            return Math.round(evaluateFormula(value, source || {}, target));
        }
        return value;
    }

    static _displayValue(value) {
        if (value && typeof value === 'object') return value.name || value.id || JSON.stringify(value);
        return String(value);
    }
}

function learnedId(value) {
    return value && typeof value === 'object' ? value.id : value;
}

function resolvePassive(value, context) {
    if (value && typeof value === 'object') return value;
    const id = learnedId(value);
    if (context.resolvePassive) return context.resolvePassive(id);
    if (context.passives) return context.passives[id] || null;
    return null;
}

function resolveName(value, collection) {
    const id = learnedId(value);
    if (!id) return 'Unknown';
    const resolved = collection && collection[id];
    return resolved?.name || value?.name || id;
}

EffectSystem.register('hp_heal', {
    apply: (val, source, target, context) => {
        let base = EffectSystem._evaluate(val, target, source);
        if (context.boost) base *= context.boost;
        let value = probabilisticRound(base);
        if (value < 1) value = 1;

        const oldHp = target.hp;
        target.hp = Math.min(target.maxHp, target.hp + value);
        return { type: 'heal', value: target.hp - oldHp, target };
    },
    describe: (val) => `Restores ${val} HP`,
    preview: (val, target, source) => {
        if (!target) return `Restores ${val} HP`;
        const value = EffectSystem._evaluate(val, target, source);
        const newHp = Math.min(target.maxHp, target.hp + value);
        return newHp !== target.hp
            ? `HP: ${target.hp}/${target.maxHp} -> ${newHp}/${target.maxHp}`
            : null;
    }
});
EffectSystem.alias('hp', 'hp_heal');

EffectSystem.register('mp_heal', {
    apply: (val, source, target, context) => {
        let base = EffectSystem._evaluate(val, target, source);
        if (context.boost) base *= context.boost;
        let value = probabilisticRound(base);
        if (value < 1) value = 1;

        const oldMp = target.mp || 0;
        const maxMp = target.maxMp || 0;
        target.mp = Math.min(maxMp, oldMp + value);
        return { type: 'mp_heal', value: target.mp - oldMp, target };
    },
    describe: (val) => `Restores ${val} MP`,
    preview: (val, target, source) => {
        if (!target) return `Restores ${val} MP`;
        const value = EffectSystem._evaluate(val, target, source);
        const oldMp = target.mp || 0;
        const maxMp = target.maxMp || 0;
        const newMp = Math.min(maxMp, oldMp + value);
        return newMp !== oldMp ? `MP: ${oldMp}/${maxMp} -> ${newMp}/${maxMp}` : null;
    }
});

EffectSystem.register('maxHp', {
    apply: (val, source, target) => {
        const value = EffectSystem._evaluate(val, target, source);
        target.maxHp += value;
        target.hp += value;
        return { type: 'maxHp', value, target };
    },
    describe: (val) => `Max HP +${val}`,
    preview: (val, target, source) => {
        if (!target) return `Max HP +${val}`;
        const value = EffectSystem._evaluate(val, target, source);
        return `Max HP: ${target.maxHp} -> ${target.maxHp + value}`;
    }
});

EffectSystem.register('hp_damage', {
    apply: (val, source, target, context) => {
        let base = EffectSystem._evaluate(val, target, source);
        if (context.boost) base *= context.boost;
        let value = probabilisticRound(base);
        if (value < 1) value = 1;

        const oldHp = target.hp;
        target.hp = Math.max(0, target.hp - value);
        return { type: 'damage', value: oldHp - target.hp, target };
    },
    describe: (val) => `Deals ${val} damage`,
    preview: (val, target, source) => `Damage: ${EffectSystem._evaluate(val, target, source)}`
});

EffectSystem.register('add_status', {
    apply: (val, _source, target, context) => {
        const statusId = typeof val === 'object' ? val.id : val;
        const chance = ((typeof val === 'object' ? val.chance : 1) ?? 1) * (context.boost || 1);
        if (random() < chance) {
            target.addState(statusId);
            return { type: 'status', status: statusId, target };
        }
        return null;
    },
    describe: (val) => {
        const id = typeof val === 'object' ? val.id : val;
        const chance = typeof val === 'object' ? val.chance : null;
        return chance === undefined || chance === null || chance >= 1
            ? `Adds State: ${id}`
            : `${Math.round(chance * 100)}% chance to add ${id}`;
    }
});

EffectSystem.register('remove_status', {
    apply: (val, _source, target) => {
        const statusId = learnedId(val);
        if (!target || typeof target.removeState !== 'function') return null;
        const hadState = typeof target.isStateAffected === 'function'
            ? target.isStateAffected(statusId)
            : target.states?.some(state => (state.id || state) === statusId);
        if (!hadState) return null;
        target.removeState(statusId);
        return { type: 'status_remove', status: statusId, target };
    },
    describe: (val) => `Removes State: ${learnedId(val)}`,
    preview: (val, target) => {
        const statusId = learnedId(val);
        if (!target || typeof target.isStateAffected !== 'function') return `Removes State: ${statusId}`;
        return target.isStateAffected(statusId) ? `Removes State: ${statusId}` : null;
    }
});

EffectSystem.register('hp_drain', {
    apply: (val, source, target, context) => {
        let base = EffectSystem._evaluate(val, target, source);
        if (context.boost) base *= context.boost;
        let value = probabilisticRound(base);
        if (value < 1) value = 1;

        const hpBeforeTarget = target.hp;
        target.hp = Math.max(0, target.hp - value);
        const damageDealt = hpBeforeTarget - target.hp;
        const hpBeforeSource = source.hp;
        source.hp = Math.min(source.maxHp, source.hp + damageDealt);

        return {
            type: 'hp_drain', value: damageDealt, target, source,
            hpBeforeTarget, hpAfterTarget: target.hp,
            hpBeforeSource, hpAfterSource: source.hp
        };
    },
    describe: (val) => `Drains ${val} HP`,
    preview: (val, target, source) => `Drains: ${EffectSystem._evaluate(val, target, source)}`
});

EffectSystem.register('xp', {
    apply: (val, source, target, context = {}) => {
        const value = EffectSystem._evaluate(val, target, source);
        const progression = context.progressionSystem;
        if (progression && typeof progression.gainXp === 'function') {
            const result = progression.gainXp(target, value);
            return { type: 'xp', value, result, target };
        }
        const applyXp = context.applyXp;
        if (applyXp && typeof applyXp === 'function') {
            const result = applyXp(target, value);
            return { type: 'xp', value, result, target };
        }
        return { type: 'xp', value, target, pending: true };
    },
    describe: (val) => `Grants ${val} XP`
});

EffectSystem.register('recruit_egg', {
    apply: (val, _source, target) => ({ type: 'recruit_egg', value: val, target }),
    describe: () => 'Recruits a monster'
});

EffectSystem.register('learnAction', {
    apply: (val, _source, target, context = {}) => {
        const actionId = learnedId(val);
        if (!target || !Array.isArray(target.skills) || !actionId) {
            return { type: 'learn_action', ok: false, reason: 'invalid_target', actionId, target };
        }
        if (target.skills.some(skill => learnedId(skill) === actionId)) {
            return { type: 'learn_action', ok: false, reason: 'known', actionId, target };
        }
        if (context.skills && !context.skills[actionId]) {
            return { type: 'learn_action', ok: false, reason: 'unknown_action', actionId, target };
        }
        const capacity = Number.isFinite(target.mxa) ? target.mxa : 4;
        if (target.skills.length >= capacity) {
            return { type: 'learn_action', ok: false, reason: 'capacity', actionId, capacity, target };
        }
        target.skills.push(actionId);
        return { type: 'learn_action', ok: true, actionId, target };
    },
    describe: (val, context) => `Learn action: ${resolveName(val, context.skills)}`,
    preview: (val, target, _source, context) => {
        const actionId = learnedId(val);
        const name = resolveName(val, context.skills);
        if (!target) return `Learn action: ${name}`;
        if (target.skills?.some(skill => learnedId(skill) === actionId)) return `${name}: already known`;
        const capacity = Number.isFinite(target.mxa) ? target.mxa : 4;
        if ((target.skills?.length || 0) >= capacity) return `${name}: action slots full (${capacity}/${capacity})`;
        return `Learn action: ${name} (${(target.skills?.length || 0) + 1}/${capacity})`;
    }
});

EffectSystem.register('learnPassive', {
    apply: (val, _source, target, context = {}) => {
        const passiveId = learnedId(val);
        if (!target || !Array.isArray(target.passives) || !passiveId) {
            return { type: 'learn_passive', ok: false, reason: 'invalid_target', passiveId, target };
        }
        if (target.passives.some(passive => learnedId(passive) === passiveId)) {
            return { type: 'learn_passive', ok: false, reason: 'known', passiveId, target };
        }
        const capacity = Number.isFinite(target.mxp) ? target.mxp : 2;
        if (target.passives.length >= capacity) {
            return { type: 'learn_passive', ok: false, reason: 'capacity', passiveId, capacity, target };
        }
        const passive = resolvePassive(val, context);
        if (!passive) {
            return { type: 'learn_passive', ok: false, reason: 'unknown_passive', passiveId, target };
        }
        target.passives.push(passive);
        return { type: 'learn_passive', ok: true, passiveId, passive, target };
    },
    describe: (val, context) => `Learn passive: ${resolveName(val, context.passives)}`,
    preview: (val, target, _source, context) => {
        const passiveId = learnedId(val);
        const name = resolveName(val, context.passives);
        if (!target) return `Learn passive: ${name}`;
        if (target.passives?.some(passive => learnedId(passive) === passiveId)) return `${name}: already known`;
        const capacity = Number.isFinite(target.mxp) ? target.mxp : 2;
        if ((target.passives?.length || 0) >= capacity) return `${name}: passive slots full (${capacity}/${capacity})`;
        return `Learn passive: ${name} (${(target.passives?.length || 0) + 1}/${capacity})`;
    }
});

EffectSystem.register('elementAdd', {
    apply: (val, _source, target) => {
        const element = learnedId(val);
        if (!target || !element) return { type: 'element_add', ok: false, reason: 'invalid_target', element, target };
        if (!Array.isArray(target._baseElements)) target._baseElements = [];
        const before = target._baseElements.slice();
        target._baseElements.push(element);
        return { type: 'element_add', ok: true, element, before, after: target._baseElements.slice(), target };
    },
    describe: (val) => `Adds element: ${learnedId(val)}`,
    preview: (val, target) => target
        ? `Elements: ${(target.elements || []).join(', ') || '—'} -> ${[...(target.elements || []), learnedId(val)].join(', ')}`
        : `Adds element: ${learnedId(val)}`
});

EffectSystem.register('elementChange', {
    apply: (val, _source, target) => {
        const element = learnedId(val);
        if (!target || !element) return { type: 'element_change', ok: false, reason: 'invalid_target', element, target };
        if (!Array.isArray(target._baseElements)) target._baseElements = [];
        const before = target._baseElements.slice();
        target._baseElements = before.length > 0 ? before.map(() => element) : [element];
        return { type: 'element_change', ok: true, element, before, after: target._baseElements.slice(), target };
    },
    describe: (val) => `Changes elements to: ${learnedId(val)}`,
    preview: (val, target) => {
        const element = learnedId(val);
        if (!target) return `Changes elements to: ${element}`;
        const before = target.elements || [];
        const after = before.length > 0 ? before.map(() => element) : [element];
        return `Elements: ${before.join(', ') || '—'} -> ${after.join(', ')}`;
    }
});
