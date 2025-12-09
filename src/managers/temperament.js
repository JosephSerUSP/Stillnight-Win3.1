import { temperaments } from "../../data/temperaments.js";
import { randInt } from "../core/utils.js";
import { skills } from "../../data/skills.js";

export class TemperamentSystem {
    /**
     * Determines the best action for a battler based on their temperament.
     * @param {Object} battler - The acting battler.
     * @param {Object} battleManager - The BattleManager instance.
     * @returns {Object|null} - The chosen action configuration { type: 'skill'|'attack'|'wait', skillId: string, target: Object }
     */
    static determineAction(battler, battleManager) {
        const temperamentKey = battler.temperament || 'FREE';
        const temperament = temperaments[temperamentKey] || temperaments.FREE;

        const isEnemy = battler.isEnemy;
        const allies = isEnemy ? battleManager.enemies : battleManager.party.activeMembers;
        const enemies = isEnemy ? battleManager.party.activeMembers : battleManager.enemies;

        // Filter out dead participants
        const validAllies = allies.filter(a => a.hp > 0);
        const validEnemies = enemies.filter(e => e.hp > 0);

        for (const rule of temperament.rules) {
            if (this.evaluateCondition(rule.condition, battler, validAllies, validEnemies)) {
                const action = this.resolveAction(rule.action, battler, validAllies, validEnemies);
                if (action) return action;
            }
        }

        // Fallback if no rule matches or resolves
        return this.resolveAction({ type: 'random_action', target: 'random' }, battler, validAllies, validEnemies);
    }

    static evaluateCondition(condition, battler, allies, enemies) {
        switch (condition.type) {
            case 'always':
                return true;
            case 'chance':
                return Math.random() < condition.value;
            case 'ally_hp_below':
                return allies.some(a => a.hp / a.maxHp < condition.value);
            case 'self_hp_below':
                return (battler.hp / battler.maxHp) < condition.value;
            case 'enemy_hp_below':
                 return enemies.some(e => e.hp / e.maxHp < condition.value);
            default:
                return false;
        }
    }

    static resolveAction(actionRule, battler, allies, enemies) {
        let skillId = null;
        let target = null;
        let type = 'attack'; // default

        // 1. Select Skill if needed
        if (actionRule.type === 'wait') {
            return { type: 'wait', skillId: 'wait', target: battler };
        }

        if (actionRule.type === 'use_skill' || actionRule.type === 'attack_or_skill' || actionRule.type === 'random_action') {
             // Find applicable skills
             let candidateSkills = [];
             if (actionRule.type === 'random_action') {
                 candidateSkills = battler.skills; // All skills
             } else if (actionRule.tag) {
                 candidateSkills = this.getSkillsByTag(battler, actionRule.tag);
             }

             if (candidateSkills.length > 0) {
                 skillId = candidateSkills[randInt(0, candidateSkills.length - 1)];
                 type = 'skill';
             } else if (actionRule.type === 'use_skill') {
                 // Explicitly requested skill but none found -> Fail rule
                 return null;
             }
             // If 'attack_or_skill' and no skill found, we fall through to type='attack' (default)
        }

        // 2. Select Target
        let potentialTargets = enemies;
        if (type === 'skill' && skillId) {
            const skill = skills[skillId];
            if (skill) {
                if (skill.target === 'self') {
                    potentialTargets = [battler];
                } else if (skill.target.includes('ally')) {
                    potentialTargets = allies;
                } else {
                    potentialTargets = enemies;
                }
            }
        } else {
            // Basic Attack is always enemy
             potentialTargets = enemies;
        }

        // Filter out any potential targets that might have died or are invalid (though passed lists should be valid)
        potentialTargets = potentialTargets.filter(t => t.hp > 0);

        if (potentialTargets.length === 0) return null;

        // Apply target preference
        target = this.selectTarget(actionRule.target, potentialTargets);

        if (!target) return null;

        return { type, skillId, target };
    }

    static getSkillsByTag(battler, tag) {
        return battler.skills.filter(sId => {
            const skill = skills[sId];
            if (!skill) return false;
            switch (tag) {
                case 'heal':
                    return skill.effects.some(e => e.type === 'hp_heal');
                case 'damage':
                    return skill.effects.some(e => e.type === 'hp_damage' || e.type === 'hp_drain');
                case 'debuff':
                     return skill.effects.some(e => e.type === 'add_status') && skill.target.includes('enemy');
                case 'buff':
                     return skill.effects.some(e => e.type === 'add_status') && skill.target.includes('ally');
                case 'high_cost':
                     return skill.effects.some(e => e.type === 'hp_damage');
                default:
                    return false;
            }
        });
    }

    static selectTarget(targetRule, targets) {
        if (targets.length === 0) return null;
        if (targets.length === 1) return targets[0];

        switch (targetRule) {
            case 'lowest_hp_ally':
            case 'lowest_hp_enemy':
                 return targets.reduce((prev, curr) => (curr.hp / curr.maxHp) < (prev.hp / prev.maxHp) ? curr : prev);
            case 'highest_hp_enemy':
                 return targets.reduce((prev, curr) => (curr.hp / curr.maxHp) > (prev.hp / prev.maxHp) ? curr : prev);
            case 'highest_maxhp_enemy':
                 return targets.reduce((prev, curr) => curr.maxHp > prev.maxHp ? curr : prev);
            case 'highest_atk_enemy':
                 return targets.reduce((prev, curr) => curr.atk > prev.atk ? curr : prev);
            case 'lowest_atk_enemy':
                 return targets.reduce((prev, curr) => curr.atk < prev.atk ? curr : prev);
            case 'random':
            case 'random_enemy':
            default:
                 return targets[randInt(0, targets.length - 1)];
        }
    }
}
