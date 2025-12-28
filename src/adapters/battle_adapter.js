// src/adapters/battle_adapter.js
// BattleSystem is used in constructor params via dependency injection from Scene_Battle?
// Actually the code imports it but only uses it in JSDoc or implicit typing?
// No, it uses 'this.system' which is passed in.
// Wait, the file imports BattleSystem but doesn't use it directly in the code body.
// It assumes `battleSystem` passed to constructor is an instance of it.
// Removing the import to satisfy lint.

/**
 * Wraps BattleSystem to look like BattleManager for legacy compatibility.
 */
export class BattleAdapter {
  constructor(party, battleSystem) {
    this.party = party;
    this.system = battleSystem;

    // Legacy properties
    this.enemies = [];
    this.tileX = 0;
    this.tileY = 0;
    this.isSneakAttack = false;
    this.round = 0;
    this.isBattleFinished = false;
    this.isVictoryPending = false;
    this.turnQueue = [];

    this.state = null;
  }

  setup(enemies, tileX, tileY, isSneakAttack = false) {
    this.enemies = enemies;
    this.tileX = tileX;
    this.tileY = tileY;
    this.isSneakAttack = isSneakAttack;
    this.round = 0;
    this.isBattleFinished = false;
    this.isVictoryPending = false;

    // Create Engine Session
    this.state = this.system.createSession({
      party: this.party,
      enemies: this.enemies
    }, { tileX, tileY, isSneakAttack });

    // Sync adapter props with state
    this._sync();
  }

  planRound(isFirstStrike = false) {
    this.system.planRound(this.state, isFirstStrike);
    this._sync();
  }

  getPlannedAction(battler) {
      return this.system.getPlannedAction(this.state, battler);
  }

  getNextBattler() {
    const ctx = this.system.getNextBattler(this.state);
    this._sync();
    return ctx;
  }

  startTurn(battlerContext) {
    const { battler, isEnemy } = battlerContext;

    // Determine Allies and Opponents
    const allies = isEnemy ? this.enemies : this.party.activeMembers;
    const opponents = isEnemy ? this.party.activeMembers : this.enemies;

    // Fallback for DataManager (assumed global for legacy code compatibility inside battler logic)
    const dm = window.dataManager || {};

    return battler.onTurnStart(allies, opponents, dm);
  }

  executeAction(action) {
    const events = this.system.executeAction(this.state, action);
    this._sync();
    return events;
  }

  _sync() {
    this.round = this.state.round;
    this.turnQueue = this.state.turnQueue;
    if (this.state.result) {
      this.isBattleFinished = true;
      if (this.state.result.outcome === 'victory') {
        this.isVictoryPending = true;
      }
    }
  }
}
