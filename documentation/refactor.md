# Battle System Refactor

## Objective
Refactor the `BattleManager` and `Scene_Battle` to transition from a fully automated "resolve round" system to a granular, turn-based architecture. This will enable future implementation of player-controlled turns where input is required for specific actions.

## Current Architecture ("Resolve Battle")
*   **Monolithic Turn Processing**: `BattleManager.processTurn()` handles everything: selecting the next battler, applying start-of-turn passives, AI target selection, action execution, and victory checks.
*   **Batch Execution**: `Scene_Battle.resolveBattleRound()` calls `startRound()` and then loops `processTurn()` until the round is over, animating results sequentially. This prevents interruption for user input.

## New Architecture ("Command Phase")
The refactor decomposes the turn lifecycle into distinct phases managed by `BattleManager`.

### BattleManager
The manager will expose fine-grained methods to drive the state machine:
1.  **`startRound()`**: Initializes the turn queue (unchanged).
2.  **`getNextBattler()`**: Retrieves the next active participant from the queue, skipping dead units.
3.  **`startTurn(battler)`**: Processes start-of-turn effects (e.g., Passive Drains, DOTs) and returns events.
4.  **`getValidTargets(battler)`**: Returns list of valid targets (useful for UI).
5.  **`createAction(battler, type, target, options)`**: Factory method for action objects.
6.  **`executeAction(action)`**: Accepts an `Action` object, resolves it (damage, status), updates battle state (Victory/Defeat), and returns events.
7.  **`getAIAction(battler)`**: (Helper) Generates a default action (Attack/Skill) using existing AI logic.

### Scene_Battle
The scene will control the flow, allowing for the insertion of an input state:
1.  **Loop**:
    *   Call `manager.getNextBattler()`.
    *   Call `manager.startTurn(battler)` & animate events.
    *   **Decision Point**:
        *   *Current Implementation (Preserved)*: Call `manager.getAIAction(battler)`.
        *   *Future Implementation*: If `battler.isPlayerControlled`, await UI input to generate `Action`.
    *   Call `manager.executeAction(action)` & animate events.
    *   Check `manager.isBattleFinished`.

## Benefits
*   **Player Agency**: The "Decision Point" allows the UI to pause and wait for player input without rewriting the battle logic.
*   **Extensibility**: New action types (Item, Defend) can be added to `executeAction` easily.
*   **Separation of Concerns**: `BattleManager` handles logic/math, `Scene_Battle` handles flow/animation/input.
