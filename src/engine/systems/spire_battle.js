import { BattleState } from "../session/battle_state.js";
import { EffectSystem } from "../rules/effects.js";
import { ProgressionSystem } from "./progression.js";
import { randInt } from "../../core/utils.js";

/**
 * System for the Spire of the Summoner Deckbuilding Battle Logic.
 */
export class SpireBattleSystem {
  constructor() {
    this.drawAmount = 5;
  }

  /**
   * Initializes a new battle state.
   */
  createSession(participants, options = {}) {
    const state = new BattleState(participants);
    state.tileX = options.tileX || 0;
    state.tileY = options.tileY || 0;
    state.isSneakAttack = !!options.isSneakAttack;

    // Initialize Deck from Summoner's inventory/deck property
    // Fallback to empty if not configured yet
    const summoner = state.participants.party.summoner;
    if (summoner && summoner.deck) {
        state.deck = [...summoner.deck];
    } else {
        // Fallback for mocks
        state.deck = [];
    }

    this._shuffleDeck(state);
    return state;
  }

  /**
   * Shuffles the discard pile into the deck, or just shuffles the deck.
   */
  _shuffleDeck(state) {
      if (state.deck.length === 0 && state.discard.length > 0) {
          state.deck = [...state.discard];
          state.discard = [];
      }

      // Fisher-Yates shuffle
      for (let i = state.deck.length - 1; i > 0; i--) {
          const j = randInt(0, i);
          [state.deck[i], state.deck[j]] = [state.deck[j], state.deck[i]];
      }
  }

  /**
   * Starts the player's turn.
   * @param {BattleState} state
   */
  startPlayerTurn(state) {
      if (state.result) return;
      state.round++;
      state.phase = 'player_turn';

      // Refresh Mana
      state.mana = state.maxMana;

      // Draw Cards
      this.drawCards(state, this.drawAmount);
  }

  /**
   * Draws a specified number of cards.
   */
  drawCards(state, amount) {
      for (let i = 0; i < amount; i++) {
          if (state.deck.length === 0) {
              this._shuffleDeck(state);
              if (state.deck.length === 0) break; // Still empty, stop drawing
          }
          const card = state.deck.pop();
          if (card) {
              state.hand.push(card);
          }
      }
  }

  /**
   * Attempts to play a card from the hand.
   * @param {BattleState} state
   * @param {Object} card
   * @param {Object} target
   * @returns {Array} List of events.
   */
  playCard(state, card, target) {
      if (state.phase !== 'player_turn') return [];
      if (state.mana < card.cost) return [{ type: 'error', msg: 'Not enough mana!' }];

      // Remove from hand
      const cardIndex = state.hand.indexOf(card);
      if (cardIndex !== -1) {
          state.hand.splice(cardIndex, 1);
      } else {
          return []; // Card not in hand
      }

      state.mana -= card.cost;
      const events = [];

      // Announce
      events.push({ type: 'play_card', cardName: card.name, msg: `Summoner plays ${card.name}!` });

      if (card.type === 'summon') {
          // Play to board
          if (state.summons.length < 5) {
              // Create a battle instance of the summon
              const summonEntity = { ...card.monsterDef, hp: card.monsterDef.maxHp };
              state.summons.push(summonEntity);
              events.push({ type: 'summon_played', summon: summonEntity, msg: `Summoned ${summonEntity.name} to the board.` });
          } else {
               events.push({ type: 'error', msg: 'Board is full!' });
               // Refund if failed
               state.mana += card.cost;
               state.hand.push(card);
               return events;
          }
      } else if (card.type === 'spell') {
          // Execute spell effects
          this._executeCardEffects(state, card, target, events);
          state.discard.push(card);
      } else {
          // Command / Aura
          state.discard.push(card);
      }

      this._checkBattleEnd(state, events);
      return events;
  }

  _executeCardEffects(state, card, target, events) {
      if (!card.effects) return;
      const summoner = state.participants.party.summoner;

      card.effects.forEach((effect) => {
          const result = EffectSystem.apply(effect.type, effect.formula || effect.value, summoner, target, {
              progressionSystem: ProgressionSystem
          });

          if (result) {
              if (result.type === 'damage') {
                  result.msg = `  ${target.name} takes ${result.value} damage.`;
              } else if (result.type === 'heal') {
                  result.msg = `  ${target.name} heals ${result.value} HP.`;
              }
              events.push(result);
          }
      });
  }

  /**
   * Ends the player's turn and discards hand.
   */
  endPlayerTurn(state) {
      if (state.result) return [];

      const events = [{ type: 'turn_end', msg: 'Player turn ends.' }];

      // Discard Hand
      while(state.hand.length > 0) {
          state.discard.push(state.hand.pop());
      }

      state.phase = 'enemy_turn';

      // Generate Turn Queue for enemies
      const enemies = state.participants.enemies || [];
      state.turnQueue = enemies.filter(e => e.hp > 0).map(e => ({
          battler: e,
          isEnemy: true,
          action: this._generateEnemyIntent(state, e)
      }));

      return events;
  }

  /**
   * Executes the next enemy action in the queue.
   */
  executeNextEnemyAction(state) {
       if (state.phase !== 'enemy_turn' || state.result) return [];
       const events = [];

       const current = state.turnQueue.shift();
       if (!current) {
           // Enemy turn over
           events.push({ type: 'phase_change', msg: 'Enemy turn ends.' });
           this.startPlayerTurn(state);
           return events;
       }

       const enemy = current.battler;
       if (enemy.hp <= 0) return this.executeNextEnemyAction(state); // Skip dead

       events.push({ type: 'enemy_action', enemy: enemy, msg: `${enemy.name} acts!` });

       // Resolve Intent
       // For now, simple attack on Summoner or random Summon
       let target = state.participants.party.summoner;
       if (state.summons.length > 0) {
           target = state.summons[randInt(0, state.summons.length - 1)]; // simplified targeting
       }

       if (target) {
            const dmg = 5; // Placeholder
            target.hp = Math.max(0, target.hp - dmg);
            events.push({ type: 'damage', target: target, value: dmg, msg: `  ${target.name} takes ${dmg} damage.` });
       }

       // Remove dead summons
       state.summons = state.summons.filter(s => s.hp > 0);

       this._checkBattleEnd(state, events);
       return events;
  }

  _generateEnemyIntent(state, enemy) {
      // In a full implementation, this would look up enemy skills and pick one
      return { type: 'attack', value: 5 };
  }

  _checkBattleEnd(state, events) {
    const enemies = state.participants.enemies || [];
    const summoner = state.participants.party.summoner;

    // In this new paradigm, Summoner HP is the loss condition
    const summonerAlive = summoner ? summoner.hp > 0 : true;
    const anyEnemyAlive = enemies.some((e) => e.hp > 0);

    if (!summonerAlive) {
        state.result = { outcome: 'defeat' };
        events.push({ type: "end", result: "defeat", msg: "The Summoner has fallen!" });
    } else if (!anyEnemyAlive) {
        state.result = { outcome: 'victory' };
        events.push({ type: "end", result: "victory", msg: "Victory!" });
    }
  }
}
