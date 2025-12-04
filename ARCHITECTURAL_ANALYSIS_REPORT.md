# Architectural Analysis Report

**Date:** 2025-02-19
**Subject:** Deep Architectural Overview & Flaws Analysis

## 1. Executive Summary

The **Stillnight Engine** demonstrates a clear attempt at a modular, scene-based architecture common in RPG development (similar to RPG Maker's structure). It successfully separates high-level concerns into **Scenes**, **Windows**, **Managers**, and **Objects**.

However, the codebase currently suffers from a significant **"Schism of Pattern"** in its UI layer and a **"God Class"** anti-pattern in its core exploration scene. While the data-driven design (Traits, Effects) is robust, the wiring between systems (especially Scene-to-UI and Logic-to-View) exhibits tight coupling that hinders scalability and testability.

## 2. Critical Architectural Flaws (Priority 1)

### 2.1. The UI Architecture Schism (Imperative vs. Declarative)
**Flaw:** The codebase is split between two fundamentally different ways of building UI.
*   **Legacy/Imperative:** `Window_Base` and older windows use `document.createElement`, manual DOM appending, and direct style manipulation.
*   **Modern/Declarative:** `Window_Shop` and `Window_Inspect` use a newer `UI.build` helper (imported from `src/windows/builder.js`) that constructs DOM trees from JSON-like structures.

**Impact:**
*   **Maintenance Nightmare:** Developers must mentally switch contexts between two different paradigms.
*   **Inconsistency:** `Window_Base` creates the skeleton imperatively, while subclasses fill it declaratively.
*   **Fragility:** The declarative components often rely on the imperative shell behaving in specific ways (e.g., `this.content` being available).

**Evidence:**
*   `src/windows/base.js`: Uses `document.createElement` for overlay and event listeners.
*   `src/windows/shop.js`: Uses `UI.build` but then accesses elements via fragile index lookups (e.g., `shopBody.children[0].children[0]`).

### 2.2. The `Scene_Map` God Class
**Flaw:** `Scene_Map` violates the Single Responsibility Principle (SRP) by managing too many domains:
*   **State:** Maps, Party, Inventory.
*   **Logic:** Movement, Collisions, Permadeath checks, Leveling logging.
*   **Presentation:** Directly instantiates and manages `Window_Desktop`.
*   **Input:** Delegates input, but also handles specific key logic.
*   **Orchestration:** Manages transitions to Battle and Shop.

**Impact:**
*   **Testing Difficulty:** Testing `Scene_Map` requires mocking the entire universe (DOM, Data, Sound, Windows).
*   **Refactoring Risk:** Changing one aspect (e.g., how movement works) risks breaking unrelated features (e.g., UI updates).

**Evidence:**
*   `src/scenes/map.js` is over-reliant on `this.hud` (the view) to drive game logic.
*   Methods like `checkPermadeath` contain business logic that belongs in `Game_Party` or a `DeathManager`.

## 3. Major Structural Issues (Priority 2)

### 3.1. Logic Leakage in `Game_Interpreter`
**Flaw:** The `Game_Interpreter` class, which should handle abstract event execution, is intimately aware of `Scene_Map`'s implementation details.
*   It calls `this.scene.logMessage()`.
*   It calls `this.scene.updateAll()`.
*   It directly manipulates `this.scene.hudManager`.

**Violation:** Dependency Inversion Principle. The Interpreter should emit events or call a generic interface, not specific methods of a concrete Scene class.

### 3.2. Fragile DOM Coupling in Windows
**Flaw:** Even when using the declarative builder, windows often rely on the exact DOM structure.
*   **Example:** `Window_Shop` defines a flex structure and then retrieves buttons via `shopBody.children[0].children[0]`.
*   **Issue:** If a designer adds a wrapper `div` for styling, the code breaks.

### 3.3. Incomplete Decoupling of `BattleManager`
**Flaw:** While better than `Scene_Map`, `BattleManager` still mixes concerns.
*   It plays sounds (`SoundManager.play`) directly within logic loops.
*   It constructs UI message strings (e.g., "Critical Hit!") inside the logic layer instead of returning data that the UI renders.

## 4. Minor & Code Quality Issues (Priority 3)

### 4.1. `src/core/utils.js` Cohesion
**Flaw:** The utils file is a "junk drawer." It contains:
*   Pure Math (`randInt`, `probabilisticRound`).
*   Data Logic (`getPrimaryElements`).
*   **View Logic** (`elementToAscii`, `getIconStyle`).
**Fix:** View logic should move to `src/windows/utils.js` or `src/core/graphics.js`.

### 4.2. Hardcoded Data Loading
**Flaw:** `DataManager` lists files explicitly (`data/actors.json`, `data/items.json`).
**Issue:** Adding a new data type requires modifying the manager class code. A configuration-based loader would be more flexible.

### 4.3. Global State for Testing
**Flaw:** `src/main.js` exposes almost everything to `window` when `test=true`.
**Issue:** While useful for Playwright, it encourages "testing implementation details" rather than behavior, making tests brittle to refactoring.

## 5. Recommendations

### Phase 1: Architectural Stabilization
1.  **Unify UI Generation:** Deprecate imperative DOM creation. Refactor `Window_Base` to use `UI.build` exclusively. Move `makeDraggable` to a Composition pattern (e.g., `Component_Draggable`).
2.  **Extract `MapLogic`:** Move movement, collision, and interaction logic out of `Scene_Map` into a `MapManager` or `ExplorationEngine`. `Scene_Map` should only listen for changes and update the view.

### Phase 2: Decoupling
3.  **Event Bus / Observer:** Implement a simple Event Bus.
    *   Instead of `Interpreter` calling `scene.logMessage`, it emits `Events.LOG_MESSAGE`.
    *   `Scene_Map` subscribes to this event.
4.  **Refactor `Game_Interpreter`:** Pass a strictly defined `Context` object to the interpreter, not the entire `Scene` instance.

### Phase 3: Modernization
5.  **View Components:** Refactor `Window_Shop` and others to use named references (e.g., `refs: { btnBuy: ... }`) in the builder instead of array indices.
6.  **Pure Logic Battle:** Strip `BattleManager` of strings and sounds. It should return a purely semantic "Turn Result" object. The `Scene_Battle` should interpret that result to play sounds and show text.
