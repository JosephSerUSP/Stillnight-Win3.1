# Architectural Analysis & Strategic Plan

**Date:** 2024-05-22
**Project:** Stillnight Refactor
**Author:** Jules (AI Agent)

## 1. Executive Summary

The Stillnight project is in a transitional state between a prototype and a scalable architecture. While the foundational concepts of `SceneManager`, `WindowManager`, and data-driven design are present, the implementation suffers from significant technical debt. The primary issue is the persistence of a "God Class" (`Scene_Map`) that centralizes too much responsibility, coupled with inconsistent separation of concerns between Logic and View layers.

The current codebase functions, but it is brittle ("Frankenstein") and difficult to extend ("Spaghetti"). To achieve the goal of a robust, RPG Maker-like engine, a strict refactoring plan is required to decouple the Game Loop from the UI and to fully implement a data-driven Effect system.

## 2. Deep Architectural Analysis

### 2.1. The "God Class" Problem: `Scene_Map`
`Scene_Map` (~1000 lines) is the most critical bottleneck. It violates the Single Responsibility Principle by managing:
-   **Game Logic:** Movement, Event Execution, Trap logic, Recruit logic.
-   **UI Construction:** It manually injects the main game layout (Sidebar, Grid, HUD) via `innerHTML` in `createUI`.
-   **Sub-System Management:** It acts as an ad-hoc manager for Inventory (`useItem`), Party Formation (`onFormationDrag`), and Inspection (`openInspect`).

**Impact:** Adding any new feature (e.g., a Quest system) requires modifying this massive file, increasing the risk of regression.

### 2.2. UI/Logic Coupling
The strict separation of "Logic" (Objects/Managers) and "View" (Windows) described in `design.md` is not fully realized.
-   **Direct DOM Manipulation:** `Scene_Battle` bypasses the `Window` abstraction to directly animate specific DOM elements (e.g., `#battler-enemy-0`) for HP gauges and effects. This makes the UI code rigid and hard to theme.
-   **Hybrid UI Paradigms:** The project mixes `Window_Base` classes (good) with raw HTML injection in `Scene_Map` (bad). This creates "Frankenstein" UI where some parts are managed by `WindowManager` (z-indexing, focus) and others are static DOM elements.

### 2.3. Manager Layer Inconsistencies
-   **`BattleManager`:** While it handles the turn loop, it relies on unsafe `eval()` calls for skill formulas, passing raw strings like `a.level`. It also contains hardcoded logic for specific passive effects (e.g., `PARASITE`), defeating the purpose of a data-driven Trait system.
-   **`Game_Battler`:** This class is "anemic." It acts mostly as a data bag. Logic for attacking, healing, or applying effects is scattered across `BattleManager`, `Scene_Map`, and `Window_Inventory`.

### 2.4. Missing Functionality
-   **Item Drops:** The memory indicates `Scene_Battle` should support item drops from `actors.json`, but this logic is missing from both the code (`Scene_Battle.js`) and the data (`actors.json`).
-   **Event System:** The event system is primitive. `Scene_Map` executes actions via a large `switch` statement, which is not scalable.

## 3. Codebase Critique: "Frankenstein" & "Spaghetti"

-   **Frankenstein Code:**
    -   **`Scene_Map.createUI`:** Injects a massive HTML string into `#game-container`. This is a relic of the prototype phase and conflicts with the `WindowLayer` architecture.
    -   **`Window_Battle` Construction:** Manually creating DOM elements and appending them, then having `Scene_Battle` search for them by ID.

-   **Spaghetti Code:**
    -   **`Scene_Map.executeAction`:** A switch statement that handles everything from `BATTLE` to `HEAL_PARTY`. This should be delegated to an `ActionInterpreter` or individual handler classes.
    -   **Formation Logic:** Drag-and-drop logic for party formation resides directly in `Scene_Map`, listening to events on elements created by `Window_Formation`.

## 4. Strategic Improvement Plan

To move forward, we must execute a phased refactor.

### Phase 1: Decouple `Scene_Map` (The Great Split)
**Goal:** Reduce `Scene_Map` to purely handling Map Traversal and Tile Interaction.
1.  **Extract Layout:** Create a `Scene_HUD` or `LayoutManager` to handle the static side panels and "Card" UI. `Scene_Map` should only render the grid.
2.  **Extract Systems:**
    -   Move Formation logic to `Window_Formation` (it should handle its own drag-and-drop).
    -   Move Inventory logic to `Window_Inventory` or a `Game_Inventory` controller.
    -   Move Inspection logic to `Window_Inspect`.
3.  **Refactor Events:** Create a `Game_Interpreter` class that takes an event action and executes it. `Scene_Map` should just call `this.interpreter.execute(action)`.

### Phase 2: Refactor Battle System
**Goal:** Create a safe, testable, and fully data-driven battle engine.
1.  **Remove `eval()`:** Implement a simple Math Parser or a standardized `Effect` object system (e.g., `{ type: 'damage', value: 'a.atk * 1.5' }`).
2.  **Centralize Effects:** Move hardcoded passives (`PARASITE`, `HRG`) into a `TraitSystem` or `EffectManager`. `BattleManager` should emit events (`onTurnStart`, `onAction`) that traits subscribe to.
3.  **Animate via API:** `Scene_Battle` should call methods on `Window_Battle` (e.g., `window.playAnimation(targetIndex, 'flash')`) instead of touching the DOM directly.

### Phase 3: Data Integrity & Features
1.  **Implement Item Drops:** Add `drops` array to `actors.json` and implement the logic in `BattleManager.processVictory`.
2.  **Standardize Data:** Ensure all game objects (`Game_Actor`, `Game_Item`, `Game_Enemy`) inherit from a common `Game_Object` base to standardize ID and Name handling.

### Phase 4: UI Standardization
1.  **Theme Manager:** Extract hardcoded colors and styles into CSS variables or a `ThemeManager`.
2.  **Component Library:** Standardize `createInteractiveLabel` and `createElementIcon` into a proper UI Component class to ensure consistent rendering across all Windows.

## 5. Conclusion
The Stillnight project has the potential to be a great engine. The `WindowLayer` and data separation are good first steps. However, the legacy `Scene_Map` implementation is holding back scalability. By strictly enforcing the separation of Logic (Managers) and View (Windows) and breaking down the God Class, we can create a codebase that is a joy to work with.
