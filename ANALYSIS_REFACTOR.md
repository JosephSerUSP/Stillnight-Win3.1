# Codebase Analysis & Refactoring Plan

## 1. Code Quality Assessment

### 1.1. Identified "God Classes"
A "God Class" is a class that knows too much or does too much, becoming a central point of failure and maintenance nightmare.

*   **`Scene_Map` (`scenes.js`)**:
    *   **Responsibilities**: It handles the game loop, user input (movement), UI management (instantiating and managing 10+ windows), event delegation, inventory logic, and even game rules (Sacrifice, Permadeath).
    *   **Violation**: Massive violation of the **Single Responsibility Principle (SRP)**. It acts as a Mediator, Controller, and View Manager simultaneously.
    *   **Impact**: Modifying any core mechanic (e.g., how Inventory works) requires modifying `Scene_Map`, increasing the risk of regression in unrelated areas (e.g., Movement).

*   **`Game_Battler` (`objects.js`)**:
    *   **Responsibilities**: Stats container, Leveling logic, State management, *and* specific implementation of passive effects (`HRG`, `PARASITE`).
    *   **Violation**: Violation of **Open/Closed Principle (OCP)**. Adding a new passive effect requires modifying the `onTurnStart` method of this core class.
    *   **Impact**: The class grows indefinitely as more content is added.

*   **`BattleManager` (`managers.js`)**:
    *   **Responsibilities**: Turn order, Action execution, AI logic, Victory/Defeat checks.
    *   **Violation**: The `executeAction` and `getAIAction` methods contain hardcoded logic for specific skills and effect types. This violates **OCP**.
    *   **Impact**: Battle logic is brittle and hard to extend without touching the core loop.

### 1.2. Architectural Violations
*   **Window_HUD Anomaly**: `Window_HUD` in `windows.js` is not a true `Window_Base` subclass. It manually manipulates the global DOM (`#game-container`), breaking the encapsulation of the `WindowManager`.
*   **Coupled Interpreters**: `Game_Interpreter` is defined inside `scenes.js` and tightly coupled to `Scene_Map`. It should be a standalone module.
*   **Hardcoded Data Logic**: `Game_Battler` and `BattleManager` contain hardcoded checks for specific IDs (e.g., `passive.code === 'HRG'`). This logic belongs in a data-driven `EffectSystem`.

## 2. Refactoring Plan

This plan prioritizes decoupling logic from the God Classes and establishing a true data-driven architecture.

### Phase 1: Modularization of Logic (High Priority)
1.  **Extract `Game_Interpreter`**:
    *   Move `Game_Interpreter` from `scenes.js` to a new file `interpreter.js` (or `managers.js` / `logic.js`).
    *   Decouple it from `Scene_Map` by passing a context object interface rather than the entire scene instance.

2.  **Extract `EffectSystem`**:
    *   Create a new system (e.g., `EffectManager` in `managers.js` or `effects.js`) to handle passive/active effects.
    *   **Refactor**: Move `HRG`, `PARASITE`, `POST_BATTLE_HEAL` logic out of `Game_Battler` and `Scene_Battle`.
    *   **Goal**: `Game_Battler.onTurnStart` should iterate over traits and ask the `EffectManager` to execute them, without knowing *what* they do.

### Phase 2: Scene_Map Decongestion (Medium Priority)
1.  **UI Controller Separation**:
    *   Move the creation and management of auxiliary windows (`Window_Inventory`, `Window_Formation`, etc.) out of `Scene_Map` and into a `MapUIManager` or similar helper class.
    *   `Scene_Map` should focus on the Game Loop and Player Input.

2.  **Input Handling**:
    *   Create a centralized `InputController` (or expand `WindowManager` input handling) to map keys to Actions, rather than having raw `switch(e.key)` in `Scene_Map`.

### Phase 3: Window System Standardization (Low Priority)
1.  **Refactor `Window_HUD`**:
    *   Convert `Window_HUD` into `Window_Desktop` (extending `Window_Base`).
    *   It should render the background and static elements as a "Root Window" at the bottom of the stack.

2.  **Standardize `Window_Selectable`**:
    *   Ensure all list-based windows (`Window_Inventory`, `Window_Shop`) strictly follow a standardized API for selection and event handling.

## 3. Immediate Action Items
*   [ ] Extract `Game_Interpreter` to `interpreter.js`.
*   [ ] Create `EffectManager` to handle `Game_Battler` passives.
*   [ ] Refactor `BattleManager.executeAction` to use a handler registry instead of `if/else` chains.
