import { EffectSystem } from "../rules/effects.js";
import { Registry } from "../data/registry.js";
import { SummonerResourceSystem } from "./summoner_resource.js";

const SUPPORTED_TARGETS = new Set(['self', 'ally-any', 'ally-all', 'ally-dead']);

/**
 * Owns Summoner spell legality, targeting, effect execution, and MP payment.
 * Presentation may list/select spells and targets, but it does not decide
 * whether a cast is legal or mutate battle state directly.
 */
export class SummonerSpellSystem {
  static getSpell(spellId) {
    const spells = Registry.get('spells') || {};
    return typeof spellId === 'object' ? spellId : spells[spellId] || null;
  }

  static getOptions(party) {
    const spells = Object.values(Registry.get('spells') || {});
    return spells.map((spell) => {
      const availability = this.getAvailability(party, spell);
      return {
        spell,
        available: availability.ok,
        reason: availability.reason || null,
        validTargets: availability.targets || [],
      };
    });
  }

  static getAvailability(party, spellOrId) {
    const spell = this.getSpell(spellOrId);
    const summoner = party?.summoner;
    if (!spell) return { ok: false, reason: 'unknown_spell', targets: [] };
    if (!summoner) return { ok: false, reason: 'no_summoner', targets: [] };
    if (!SUPPORTED_TARGETS.has(spell.target)) {
      return { ok: false, reason: 'unsupported_target', targets: [] };
    }

    const cost = this.getCost(spell);
    if (summoner.mp < cost) {
      return { ok: false, reason: 'insufficient_mp', targets: [] };
    }

    const targets = this.getValidTargets(party, spell);
    if (targets.length === 0) {
      return { ok: false, reason: 'no_valid_targets', targets: [] };
    }

    return { ok: true, spell, cost, targets };
  }

  static validateCast(party, spellOrId, target = null) {
    const availability = this.getAvailability(party, spellOrId);
    if (!availability.ok) return availability;

    const { spell, cost, targets } = availability;
    if (spell.target === 'ally-any' || spell.target === 'ally-dead') {
      if (!target) return { ok: false, reason: 'target_required', spell, cost, targets };
      if (!targets.includes(target)) {
        return { ok: false, reason: 'invalid_target', spell, cost, targets };
      }
      return { ok: true, spell, cost, targets: [target] };
    }

    if (spell.target === 'self') {
      return { ok: true, spell, cost, targets };
    }

    return { ok: true, spell, cost, targets };
  }

  static getCost(spellOrId) {
    const spell = this.getSpell(spellOrId);
    return Math.max(0, Number(spell?.mpCost) || 0);
  }

  static getValidTargets(party, spellOrId) {
    const spell = this.getSpell(spellOrId);
    if (!spell || !party?.summoner) return [];

    let candidates;
    switch (spell.target) {
      case 'self':
        candidates = [party.summoner];
        break;
      case 'ally-dead':
        candidates = (party.activeMembers || []).filter(member => member && member.hp <= 0);
        break;
      case 'ally-any':
      case 'ally-all':
        candidates = (party.activeMembers || []).filter(member => member && member.hp > 0);
        break;
      default:
        return [];
    }

    return candidates.filter(target => this._hasApplicableEffect(spell, target));
  }

  static cast(party, spellOrId, target = null) {
    const validation = this.validateCast(party, spellOrId, target);
    if (!validation.ok) {
      return {
        ...validation,
        events: [{
          type: 'spell_failed',
          reason: validation.reason,
          spell: validation.spell || this.getSpell(spellOrId),
          msg: this.failureMessage(validation.reason),
        }],
      };
    }

    const { spell, cost, targets } = validation;
    const summoner = party.summoner;
    const events = [{
      type: 'spell_cast',
      spell,
      battler: summoner,
      targets,
      msg: `${summoner.name} casts ${spell.name}.`,
    }];

    for (const spellTarget of targets) {
      for (const effect of spell.effects || []) {
        const hpBefore = spellTarget.hp;
        const mpBefore = spellTarget.mp;
        const value = EffectSystem.valueFromAuthoredEffect(effect);
        const result = EffectSystem.apply(effect.type, value, summoner, spellTarget, {
          skills: Registry.get('skills'),
          passives: Registry.get('passives'),
        });
        if (!result) continue;

        if (!result.battler) result.battler = summoner;
        if (result.type === 'heal') {
          result.hpBefore = hpBefore;
          result.hpAfter = spellTarget.hp;
          result.msg = `  ${spellTarget.name} recovers ${result.value} HP.`;
        } else if (result.type === 'mp_heal') {
          result.mpBefore = mpBefore;
          result.mpAfter = spellTarget.mp;
          result.msg = `  ${spellTarget.name} recovers ${result.value} MP.`;
        } else if (result.type === 'status') {
          result.msg = `  ${spellTarget.name} gains ${result.status}.`;
        } else if (!result.msg) {
          result.msg = `  ${EffectSystem.getDescription(effect.type, value, {
            skills: Registry.get('skills'),
            passives: Registry.get('passives'),
          })}`;
        }
        events.push(result);
      }
    }

    events.push(...SummonerResourceSystem.consumeDirectAction(party, 'spell', cost));
    return { ok: true, spell, cost, targets, events };
  }

  static failureMessage(reason) {
    switch (reason) {
      case 'insufficient_mp': return 'Not enough Commander MP.';
      case 'no_valid_targets': return 'No valid targets for that spell.';
      case 'target_required': return 'Choose a target.';
      case 'invalid_target': return 'That target cannot receive this spell.';
      case 'unsupported_target': return 'That spell target scope is not supported.';
      case 'no_summoner': return 'No Summoner is available.';
      default: return 'That spell cannot be cast.';
    }
  }

  static _hasApplicableEffect(spell, target) {
    const effects = spell.effects || [];
    if (effects.length === 0) return false;

    return effects.some((effect) => {
      switch (effect.type) {
        case 'hp_heal':
        case 'hp':
          return target.hp > 0 && target.hp < target.maxHp;
        case 'mp_heal':
          return (target.mp || 0) < (target.maxMp || 0);
        case 'add_status':
          return typeof target.isStateAffected !== 'function' || !target.isStateAffected(effect.status);
        case 'remove_status':
          return typeof target.isStateAffected === 'function' && target.isStateAffected(effect.value || effect.status);
        default:
          return true;
      }
    });
  }
}
