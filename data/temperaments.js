import { randInt } from "../src/core/utils.js";

export const Temperaments = {
    balanced: {
        name: "Balanced",
        description: "Uses skills and attacks with moderate frequency.",
        evaluate: (action, context, dataManager) => {
            const { battler, myTeam, opposingTeam } = context;

            // 60% chance for skill
            const skillId = (battler.skills && battler.skills.length && Math.random() < 0.6)
                ? battler.skills[randInt(0, battler.skills.length - 1)]
                : null;

            if (skillId) {
                action.setSkill(skillId, dataManager);
                const targets = action.makeTargets(myTeam, opposingTeam);
                if (targets.length === 0) return null;

                // Smart Heal logic
                const skill = dataManager.skills[skillId];
                let target = targets[randInt(0, targets.length - 1)];

                 if (skill.target.includes('ally') && skill.effects.some(e => e.type === 'hp_heal')) {
                      // Target lowest HP %
                      target = targets.reduce((prev, curr) => (curr.hp / curr.maxHp) < (prev.hp / prev.maxHp) ? curr : prev);
                 }

                 action.target = target;
            } else {
                action.setAttack();
                const targets = action.makeTargets(myTeam, opposingTeam);
                if (targets.length === 0) return null;
                action.target = targets[randInt(0, targets.length - 1)];
            }
            return action;
        }
    },
    ruthless: {
        name: "Ruthless",
        description: "Prioritizes enemies with the lowest HP.",
        evaluate: (action, context, dataManager) => {
             const { battler, myTeam, opposingTeam } = context;

             const skillId = (battler.skills && battler.skills.length && Math.random() < 0.6)
                ? battler.skills[randInt(0, battler.skills.length - 1)]
                : null;

             if (skillId) {
                 action.setSkill(skillId, dataManager);
             } else {
                 action.setAttack();
             }

             const targets = action.makeTargets(myTeam, opposingTeam);
             if (targets.length === 0) return null;

             // Target lowest HP (absolute)
             action.target = targets.reduce((prev, curr) => curr.hp < prev.hp ? curr : prev);

             return action;
        }
    },
    titan_hunter: {
        name: "Titan Hunter",
        description: "Focuses attacks on the strongest enemy.",
        evaluate: (action, context, dataManager) => {
             const { battler, myTeam, opposingTeam } = context;

             const skillId = (battler.skills && battler.skills.length && Math.random() < 0.6)
                ? battler.skills[randInt(0, battler.skills.length - 1)]
                : null;

             if (skillId) {
                 action.setSkill(skillId, dataManager);
             } else {
                 action.setAttack();
             }

             const targets = action.makeTargets(myTeam, opposingTeam);
             if (targets.length === 0) return null;

             // Target highest HP
             action.target = targets.reduce((prev, curr) => curr.hp > prev.hp ? curr : prev);

             return action;
        }
    },
    desperate: {
        name: "Desperate",
        description: "Becomes more dangerous as health fails.",
        evaluate: (action, context, dataManager) => {
             const { battler, myTeam, opposingTeam } = context;

             const isLowHp = (battler.hp / battler.maxHp) < 0.5;
             const skillChance = isLowHp ? 0.9 : 0.3;

             const skillId = (battler.skills && battler.skills.length && Math.random() < skillChance)
                ? battler.skills[randInt(0, battler.skills.length - 1)]
                : null;

             if (skillId) {
                 action.setSkill(skillId, dataManager);
             } else {
                 action.setAttack();
             }

             const targets = action.makeTargets(myTeam, opposingTeam);
             if (targets.length === 0) return null;
             action.target = targets[randInt(0, targets.length - 1)];

             return action;
        }
    }
};
