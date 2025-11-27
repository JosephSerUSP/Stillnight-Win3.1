
/**
 * @file data/animations.js
 * @description Defines data-driven animations for the battle system.
 */

export const animations = {
  // The kaomoji flow animation requested by the user
  healing_sparkle: {
    type: "text_flow_liquid",
    sequence: "⋆｡°✩", // The characters to flow
    duration: 1000,
    interval: 50,
    color: "#aaffaa", // Light green/sparkly
    targetPart: "hp_gauge", // Where to play it
  },
  damage_shake: {
    type: "shake",
    duration: 500,
  },
  attack_flash: {
    type: "flash",
    duration: 200,
    color: "#ffffff"
  }
};
