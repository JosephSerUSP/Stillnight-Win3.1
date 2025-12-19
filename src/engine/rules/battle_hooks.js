export const BattleHooks = {
  // This object will eventually hold the injection points for:
  // - AI logic
  // - Effect calculations
  // - Turn order logic
  // Allowing us to swap "rulesets" easily.
  getAI: null,
  calcDamage: null,
};
