export class BattleState {
  /**
   * @param {Object} participants - { party: Game_Party, enemies: Game_Battler[] }
   */
  constructor(participants) {
    this.participants = participants;
    this.round = 0;
    this.phase = 'init'; // 'init', 'player_turn', 'enemy_turn', 'victory', 'defeat'
    this.turnQueue = []; // Used primarily for resolving multiple actions or enemy execution queue
    this.log = [];
    this.result = null; // { outcome: 'victory'|'defeat', rewards: {} }
    this.tileX = 0;
    this.tileY = 0;
    this.isSneakAttack = false;

    // Deckbuilding / Spire Mechanics
    this.mana = 3;
    this.maxMana = 3;
    this.deck = [];
    this.hand = [];
    this.discard = [];
    this.exhaust = []; // Removed from game
    this.summons = []; // Monsters on the board
  }
}
