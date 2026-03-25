# Spire of the Summoner: Reimagining the Battle System

This document outlines the architectural changes required to transform the current JRPG turn-based system into a **Roguelike Deckbuilding Summoner** game, heavily inspired by *Magic: The Gathering (MTG)* and *Slay the Spire (StS)*.

## 1. Core Concepts

*   **The Summoner as the Player Character:** The Summoner is no longer an inactive commander; they are the primary entity with an HP pool. If the Summoner's HP drops to 0, the run is over.
*   **The Deck:** Skills, Items, and Monsters are consolidated into a unified `Card` schema. The player's party is replaced by a Deck of Cards.
*   **Mana Economy:** The player receives a set amount of Mana (Energy) each turn to play cards.
*   **Phases:** Combat replaces the speed-based initiative queue with structured `Player` and `Enemy` phases.
*   **Intents:** Enemies telegraph their next move before the Player's turn, allowing for predictive, defensive play.

## 2. Card Types

The Deck contains three primary types of cards:
1.  **Summons (Monsters):** Played onto the **Board** (Summon Zone) up to a maximum limit (e.g., 3 or 5 slots). They persist across turns, have their own HP/Attack, and can be used to block incoming attacks directed at the Summoner. When a Summon's HP reaches 0, it is sent to the Discard pile (or Exiled).
2.  **Spells:** One-time effects (e.g., "Deal 10 Fire Damage," "Heal a Summon for 15 HP," "Draw 2 cards") that cost Mana, resolve immediately, and go to the Discard pile.
3.  **Commands (Auras/Enchantments):** Played onto active Summons to grant them buffs, debuffs, or special traits.

## 3. The Battlefield

*   **Summoner Zone:** Contains the Summoner's HP, current Mana, Deck, Hand, and Discard pile.
*   **Summon Zone (The Board):** Contains active Summons played from the hand.
*   **Enemy Zone:** Contains the opposing enemies and their visible Intents.

## 4. Turn Flow

### Player Turn
1.  **Draw Phase:** Draw up to 5 cards from the Deck.
2.  **Mana Refresh:** Reset Mana to base amount (e.g., 3).
3.  **Action Phase:**
    *   Play cards from the hand (spending Mana).
    *   Command active Summons to attack enemies.
    *   Exhaust (tap) active Summons to block incoming enemy Intents.
4.  **End Phase (Discard):** All unplayed cards in the hand are moved to the Discard pile.

### Enemy Turn
1.  **Intent Execution:** Enemies execute their telegraphed intents (attacking the Summoner, applying debuffs, buffing themselves). If a Summon is blocking, damage is redirected to the Summon.
2.  **Intent Generation:** Enemies generate and display their Intent for the *next* turn.

## 5. Required Architecture Changes

### Session State (`src/engine/session/battle_state.js`)
*   Add `mana`, `maxMana`.
*   Add arrays for `deck`, `hand`, `discard`, and `exhaust`.
*   Add `summons` array for active monsters on the board.
*   Refactor `turnQueue` to manage strict phases (`player_turn`, `enemy_turn`).
*   Store telegraphed intents for enemies.

### Battle System (`src/engine/systems/spire_battle.js`)
*   Replace `planRound` with `startPlayerTurn` (Draw, Mana Refresh).
*   Add `playCard(state, cardId, target)` which deducts mana and applies the card's effects via `EffectSystem`.
*   Add `endPlayerTurn(state)` which discards the hand and triggers the Enemy turn.
*   Replace speed sorting with `executeEnemyTurn(state)` which resolves all intents.

### Data Schema
*   Merge `Registry.skills` and `Registry.items` into a new `Cards` registry.
*   Cards will require fields like `cost`, `type` (`summon`, `spell`, `command`), and an array of `effects`.

### Progression & Drafting
*   Replace standard XP gain with a Roguelike drafting system: After a battle, the player chooses 1 of 3 random cards to add to their deck.
*   Evolution changes from level-based to a "Campfire Upgrade" mechanic, permanently replacing a monster card with its evolved form.

## 6. Implementation Path
This design will be implemented in stages, starting with modifying the `BattleState` and creating a basic `SpireBattleSystem` to handle the core loop of drawing cards, spending mana, and structured turns.
