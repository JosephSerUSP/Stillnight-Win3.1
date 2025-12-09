export const temperaments = {
  KIND: {
    name: "Kind",
    description: "Prioritizes healing wounded allies.",
    rules: [
      {
        condition: { type: "ally_hp_below", value: 0.5 },
        action: { type: "use_skill", tag: "heal", target: "lowest_hp_ally" }
      },
      {
        condition: { type: "always" },
        action: { type: "attack", target: "random_enemy" }
      }
    ]
  },
  RUTHLESS: {
    name: "Ruthless",
    description: "Mercilessly targets the weakest enemy.",
    rules: [
      {
        condition: { type: "always" },
        action: { type: "attack_or_skill", tag: "damage", target: "lowest_hp_enemy" }
      }
    ]
  },
  PROTECTIVE: {
    name: "Protective",
    description: "Guards allies and targets high threats.",
    rules: [
      {
        condition: { type: "ally_hp_below", value: 0.6 },
        action: { type: "use_skill", tag: "heal", target: "lowest_hp_ally" }
      },
      {
        condition: { type: "always" },
        action: { type: "attack_or_skill", tag: "damage", target: "highest_atk_enemy" }
      }
    ]
  },
  LAZY: {
    name: "Lazy",
    description: "Often refuses to act.",
    rules: [
      {
        condition: { type: "chance", value: 0.3 },
        action: { type: "wait" }
      },
      {
        condition: { type: "always" },
        action: { type: "attack", target: "random_enemy" }
      }
    ]
  },
  FREE: {
    name: "Free",
    description: "Acts completely at random.",
    rules: [
      {
        condition: { type: "always" },
        action: { type: "random_action", target: "random" }
      }
    ]
  },
  VENGEFUL: {
    name: "Vengeful",
    description: "Focuses on the strongest opponent.",
    rules: [
      {
        condition: { type: "always" },
        action: { type: "attack_or_skill", tag: "damage", target: "highest_hp_enemy" }
      }
    ]
  },
  CAUTIOUS: {
    name: "Cautious",
    description: "Prioritizes self-preservation.",
    rules: [
      {
        condition: { type: "self_hp_below", value: 0.5 },
        action: { type: "use_skill", tag: "heal", target: "self" }
      },
      {
        condition: { type: "always" },
        action: { type: "attack_or_skill", tag: "damage", target: "lowest_atk_enemy" }
      }
    ]
  },
  PROUD: {
    name: "Proud",
    description: "Seeks to defeat the mightiest foe.",
    rules: [
      {
        condition: { type: "always" },
        action: { type: "attack_or_skill", tag: "damage", target: "highest_maxhp_enemy" }
      }
    ]
  },
  STRATEGIC: {
    name: "Strategic",
    description: "Prefers applying status effects.",
    rules: [
      {
        condition: { type: "always" },
        action: { type: "use_skill", tag: "debuff", target: "random_enemy" }
      },
      {
        condition: { type: "always" },
        action: { type: "attack", target: "random_enemy" }
      }
    ]
  },
  WILD: {
    name: "Wild",
    description: "Unleashes the most powerful skills.",
    rules: [
      {
        condition: { type: "always" },
        action: { type: "use_skill", tag: "high_cost", target: "random_enemy" }
      }
    ]
  }
};
