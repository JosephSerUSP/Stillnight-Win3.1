# Architectural Analysis Report

## Executive Summary
The codebase follows a traditional Object-Oriented structure common in game development (Scenes, Managers, Objects, Windows). However, it suffers from significant "God Class" anti-patterns, tight coupling between Logic and UI, and inconsistent architectural styles due to partial refactoring.

The most critical issue is the `Scene_Map` class, which acts as a monolithic controller for the entire exploration phase, managing everything from DOM construction to input handling and game state.

## 1. Structural Flaws (Grave)

### 1.1. The `Scene_Map` God Class
**Severity:** Critical
**Location:** `src/scenes/scenes.js`

*   **Violation:** Single Responsibility Principle (SRP).
*   **Analysis:** `Scene_Map` is responsible for:
    *   **State Management:** Holds `runActive`, `party`, `map` instances.
    *   **UI Orchestration:** Instantiates and manages *every* window (`inventoryWindow`, `recruitWindow`, `formationWindow`, etc.) regardless of whether they are currently needed.
    *   **Input Handling:** Directly listens to keyboard events and maps them to movement logic.
    *   **Game Logic:** Handles player movement, collision detection, and even specific event execution logic (`executeEvent`).
*   **Consequence:** The class is fragile, difficult to test (requires mocking the entire Window system), and hard to extend. Adding a new feature (e.g., a Quest system) would require modifying this already bloated file.

### 1.2. Logic Leakage in `BattleManager`
**Severity:** High
**Location:** `src/managers/index.js` (BattleManager)

*   **Violation:** Open/Closed Principle (OCP) and Separation of Concerns.
*   **Analysis:**
    *   **Hardcoded Effects:** The `_executeSkill` method contains hardcoded `if/else` blocks for every effect type (`hp_damage`, `hp_heal`, `hp_drain`). Adding a new effect requires modifying the core manager.
    *   **UI/Sound Coupling:** The manager directly calls `SoundManager.play()` and formats UI strings (`msg` properties in events). The "Manager" is doing "View" work.
*   **Consequence:** The battle system is rigid. Custom skills or new mechanics require invasive changes to the core engine rather than just data definitions or plugin-like extensions.

### 1.3. `Game_Battler` Responsibilities
**Severity:** High
**Location:** `src/objects/objects.js`

*   **Violation:** SRP / Separation of Concerns.
*   **Analysis:** `Game_Battler` handles:
    *   **Data:** Stats, traits.
    *   **Logic:** Leveling up (`gainXp`), evolution checks.
    *   **View State:** Stores `prevHp` explicitly for UI animation purposes.
    *   **Procedural Gen:** `growToLevel` and `create` factory contain logic for procedural scaling.
*   **Consequence:** The entity is overloaded. View-specific data (`prevHp`) should be in the View/Window, not the Domain Model.

## 2. Structural Flaws (Moderate)

### 2.1. Inconsistent UI Architecture
**Severity:** Medium
**Location:** `src/windows/`

*   **Issue:** The codebase is split between two UI paradigms:
    1.  **Imperative (Legacy):** `Window_Base` and `Scene_Map` manually create DOM elements (`document.createElement`), assign classes, and append them.
    2.  **Declarative (Modern):** `UI.build` (in `src/windows/builder.js`) allows for component-based construction.
*   **Analysis:** `Window_Inventory` and others seemingly still rely on the legacy approach (or a mix), leading to code duplication and inconsistency.
*   **Consequence:** New developers won't know which pattern to follow. The imperative code is verbose and error-prone.

### 2.2. Tight Coupling in Scenes
**Severity:** Medium
**Location:** `src/scenes/scenes.js`

*   **Issue:** `Scene_Battle` is tightly coupled to `Window_Battle`. It calls methods like `animateBattler` which directly manipulate DOM classes (`blink`, `shake`).
*   **Principle:** The Scene (Controller) should tell the Window (View) *what* to show, not *how* to animate specific CSS classes.

### 2.3. Global State & Singletons
**Severity:** Medium
**Location:** `src/managers/index.js`

*   **Issue:** `ConfigManager` and `SoundManager` are static classes or singletons.
*   **Consequence:** This makes unit testing difficult because state persists between tests unless explicitly reset. Dependencies are hidden (implicit global access) rather than injected.

## 3. Structural Flaws (Minor)

### 3.1. Hardcoded Data Imports
**Location:** `src/managers/index.js` (DataManager)

*   **Issue:** The code uses dynamic imports for `skills.js`, `passives.js`, etc., but the paths are hardcoded.
*   **Consequence:** Harder to swap out data sets for testing or modding.

### 3.2. Magic Numbers in Logic
**Location:** `src/objects/objects.js`

*   **Issue:** Formulas for XP (`level * 0.5 + 10`) and Damage are hardcoded within the class methods.
*   **Recommendation:** These should be moved to a `Formula` helper or defined in external data files to allow for balancing without code changes.

## Recommendations

1.  **Refactor `Scene_Map`:** Extract input handling to an `InputController` and UI management to a `HUDManager`. The Scene should only coordinate high-level state flow.
2.  **Implement `EffectProcessor`:** Move the `if (effect.type === ...)` logic out of `BattleManager` into a dedicated processor class or registry of handlers.
3.  **Standardize UI:** Aggressively refactor all Windows to use `UI.build`. Deprecate direct `document.createElement` usage in `Window` subclasses.
4.  **Decouple View from Model:** Remove `prevHp` from `Game_Battler`. The `Window_Battle` should track the "displayed HP" vs "actual HP" for animation purposes.
