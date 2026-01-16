# Game Action Implementation

## Overview
This document outlines the implementation of the `Game_Action` class and the current status of the action execution pipeline.

**Status**: *Partial / Technical Debt*
The codebase currently implements two parallel pipelines for executing actions:
1.  **Scene_Map**: Uses `Game_Action` for item usage.
2.  **Scene_Battle**: Uses internal `BattleSystem` logic (`_executeSkill`, `_executeItem`) for combat actions.

Both pipelines share the unified `EffectSystem` for applying the final state changes (Damage, Healing, Status).

## Design Choices & Implementation

### 1. Game_Action (Scene_Map)
The `Game_Action` class serves as an "Effect Object" wrapper for item usage during exploration.
*   **Encapsulation**: It groups the action data (Item ID) with the execution logic.
*   **Flow**:
    ```javascript
    const action = new Game_Action(party);
    action.setItem(item, dataManager);
    const events = action.apply(target, dataManager);
    ```
*   **Under the Hood**: `apply()` delegates to `EffectSystem.apply()`.

### 2. BattleSystem (Scene_Battle)
In combat, `BattleSystem` currently handles action resolution directly, bypassing `Game_Action`.
*   **Reasoning (Legacy)**: The `BattleSystem` was refactored to be a pure logic system (`src/engine/systems/battle.js`) and currently iterates over skill/item effects manually to apply combat-specific logic (e.g., Element Multipliers, Boosts) before calling `EffectSystem`.
*   **Flow**:
    1.  `BattleSystem.executeAction(state, actionPlan)`
    2.  Calculates multipliers (Element advantage, etc.)
    3.  Iterates `skill.effects` or `item.effects`
    4.  Calls `EffectSystem.apply(effect.type, ...)`

### 3. Unified Effect System
Regardless of the pipeline, all state mutations occur via `EffectSystem` (`src/engine/rules/effects.js`).
*   **Benefit**: Ensures that damage calculation formulas, healing logic, and status application are consistent across the game, even if the "wrapper" (Game_Action vs BattleSystem) differs.

## Future Refactor Goal
The long-term goal is to unify these pipelines. The logic within `BattleSystem` (Element multipliers, targeting) should ideally be encapsulated within a robust `ActionSystem` or an enhanced `Game_Action` that `BattleSystem` utilizes, eliminating the code duplication.
