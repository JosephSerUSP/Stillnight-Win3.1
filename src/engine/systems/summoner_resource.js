const DEFAULT_CREATURE_MPD = 1;
const MOVEMENT_OVERHEAD = 1;
const DEFAULT_DIRECT_ACTION_COST = 1;
const DAMAGE_PER_EXHAUSTION_LEVEL = 0.05;
const MAX_DAMAGE_RATE = 0.5;

/**
 * Owns the shared Summoner MP / exhaustion pressure used by exploration and
 * battle. The Summoner stores the persistent exhaustion counter; weakened
 * state and damage are consequences derived by this system.
 */
export class SummonerResourceSystem {
    static getMovementCost(party) {
        if (!party?.summoner) return 0;
        const creatures = this._activeCreatures(party);
        return MOVEMENT_OVERHEAD + creatures.reduce((sum, battler) => sum + this.getCreatureActionCost(battler), 0);
    }

    static getCreatureActionCost(battler) {
        if (!battler || battler.role === 'Summoner') return 0;
        const value = Number(battler.mpd);
        return Number.isFinite(value) ? Math.max(0, value) : DEFAULT_CREATURE_MPD;
    }

    static getDirectActionCost(_kind) {
        return DEFAULT_DIRECT_ACTION_COST;
    }

    static consumeMovement(party, { safe = false } = {}) {
        if (safe) return this.recover(party, 'safe');
        return this.consume(party, {
            kind: 'movement',
            cost: this.getMovementCost(party),
        });
    }

    static consumeCreatureAction(party, battler) {
        if (!party?.summoner || !battler || battler.isEnemy || battler.role === 'Summoner') return [];
        return this.consume(party, {
            kind: 'creature_action',
            cost: this.getCreatureActionCost(battler),
            actor: battler,
        });
    }

    static consumeDirectAction(party, kind, explicitCost = null) {
        const cost = explicitCost === null ? this.getDirectActionCost(kind) : Math.max(0, Number(explicitCost) || 0);
        return this.consume(party, { kind: `summoner_${kind}`, cost, actor: party?.summoner });
    }

    static consume(party, { kind = 'action', cost = 0, actor = null } = {}) {
        const summoner = party?.summoner;
        if (!summoner) return [];

        // Any positive MP means exhaustion has already been relieved. This also
        // makes MP-restoring effects self-heal the pressure state on the next
        // paid action even if they were invoked through a generic effect path.
        const events = this.recoverIfPossible(party, 'mp_restored');
        const normalizedCost = Math.max(0, Number(cost) || 0);
        if (normalizedCost <= 0) return events;

        const mpBefore = Math.max(0, Number(summoner.mp) || 0);
        summoner.mp = Math.max(0, mpBefore - normalizedCost);
        events.push({
            type: 'summoner_mp_loss',
            kind,
            actor,
            cost: normalizedCost,
            mpBefore,
            mpAfter: summoner.mp,
            msg: `Commander MP -${Math.min(normalizedCost, mpBefore)} (${summoner.mp}/${summoner.maxMp}).`,
        });

        if (summoner.mp > 0) return events;

        const previousLevel = this.getExhaustionLevel(party);
        const level = previousLevel + 1;
        summoner.exhaustion = level;
        events.push({
            type: previousLevel === 0 ? 'exhaustion_start' : 'exhaustion_increase',
            kind,
            level,
            previousLevel,
            msg: previousLevel === 0
                ? 'The Commander is exhausted. The creatures weaken.'
                : `Exhaustion deepens to ${level}.`,
        });

        const damageRate = Math.min(MAX_DAMAGE_RATE, DAMAGE_PER_EXHAUSTION_LEVEL * level);
        for (const member of this._activeCreatures(party)) {
            if (typeof member.addState === 'function' && !member.isStateAffected('weakened')) {
                member.addState('weakened');
                events.push({
                    type: 'state_add',
                    target: member,
                    status: 'weakened',
                    level,
                    msg: `${member.name} is weakened!`,
                });
            }

            const hpBefore = member.hp;
            const damage = Math.max(1, Math.floor(member.maxHp * damageRate));
            member.hp = Math.max(0, member.hp - damage);
            events.push({
                type: 'exhaustion_damage',
                target: member,
                value: hpBefore - member.hp,
                hpBefore,
                hpAfter: member.hp,
                level,
                rate: damageRate,
                msg: `${member.name} loses ${hpBefore - member.hp} HP to exhaustion.`,
            });
        }

        return events;
    }

    static getExhaustionLevel(party) {
        return Math.max(0, Number(party?.summoner?.exhaustion) || 0);
    }

    static recoverIfPossible(party, reason = 'mp_restored') {
        const summoner = party?.summoner;
        if (!summoner || summoner.mp <= 0 || this.getExhaustionLevel(party) <= 0) return [];
        return this.recover(party, reason);
    }

    static recover(party, reason = 'recovery') {
        const summoner = party?.summoner;
        if (!summoner) return [];

        const previousLevel = this.getExhaustionLevel(party);
        summoner.exhaustion = 0;
        const events = [];

        for (const member of this._activeCreatures(party)) {
            if (typeof member.isStateAffected === 'function' && member.isStateAffected('weakened')) {
                member.removeState('weakened');
                events.push({
                    type: 'state_remove',
                    target: member,
                    status: 'weakened',
                    reason,
                    msg: `${member.name} recovered strength.`,
                });
            }
        }

        if (previousLevel > 0) {
            events.unshift({
                type: 'exhaustion_recovered',
                previousLevel,
                reason,
                msg: 'The Commander recovers from exhaustion.',
            });
        }
        return events;
    }

    static _activeCreatures(party) {
        return (party?.activeMembers || []).filter(member => member && member.role !== 'Summoner' && member.hp > 0);
    }
}

export const SummonerResourceRules = Object.freeze({
    movementOverhead: MOVEMENT_OVERHEAD,
    defaultCreatureMpd: DEFAULT_CREATURE_MPD,
    defaultDirectActionCost: DEFAULT_DIRECT_ACTION_COST,
    damagePerExhaustionLevel: DAMAGE_PER_EXHAUSTION_LEVEL,
    maxDamageRate: MAX_DAMAGE_RATE,
});
