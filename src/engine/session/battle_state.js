export class BattleState {
  /**
   * @param {Object} participants - { party: Game_Party, enemies: Game_Battler[] }
   */
  constructor(participants) {
    this.participants = participants;
    this.round = 0;
    this.phase = 'init'; // 'init', 'input', 'action', 'victory', 'defeat'
    this.turnQueue = [];
    this.log = [];
    this.result = null; // { outcome: 'victory'|'defeat', rewards: {} }
    this.tileX = 0;
    this.tileY = 0;
    this.isSneakAttack = false;
  }
}
