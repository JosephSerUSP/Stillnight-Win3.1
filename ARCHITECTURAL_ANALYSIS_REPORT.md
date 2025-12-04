# Architectural Analysis Report

## Executive Summary
The "Stillnight" codebase demonstrates a transition from a legacy imperative style to a modern modular architecture. However, this transition is incomplete, resulting in a "split personality" system. While the directory structure is clean (Scenes, Managers, Windows, Objects), the *logic distribution* within these files suffers from severe coupling and responsibility violations.

The most critical structural flaw is the **`Scene_Map`** class, which acts as a "God Class" controlling almost every aspect of the game's exploration phase, preventing effective testing and scalability. Additionally, the **`BattleManager`** violates the Open/Closed Principle by hardcoding skill logic, making the combat system rigid and difficult to extend.

## 1. Critical Structural Flaws (The Roots)

### 1.1. The `Scene_Map` Monolith
**Severity:** Critical
**Location:** `src/scenes/scenes.js`

*   **Violation:** Single Responsibility Principle (SRP).
*   **Analysis:** `Scene_Map` is not just a Scene; it is an Input Controller, a UI Manager, a Game State Machine, and an Event Router.
    *   **Input Handling:** It directly listens to keyboard events (`onKeyDown`) and maps them to movement logic.
    *   **UI Orchestration:** It manually instantiates and manages the lifecycle of 12 different windows (`inventoryWindow`, `formationWindow`, etc.), regardless of whether they are active.
    *   **Game Logic:** It implements core mechanics like `movePlayer`, `checkPermadeath`, and `executeEvolution`.
*   **Impact:**
    *   **Untestable:** You cannot test map logic without instantiating the entire UI and DOM.
    *   **Rigid:** Adding a new feature (e.g., a Quest Log) requires modifying this central file, increasing the risk of regressions.

### 1.2. `BattleManager` Logic Leakage
**Severity:** Critical
**Location:** `src/managers/index.js`

*   **Violation:** Open/Closed Principle (OCP) & Separation of Concerns.
*   **Analysis:** The `BattleManager` mixes high-level flow control with low-level implementation details.
    *   **Hardcoded Effects:** The `_executeSkill` method contains explicit `if/else` blocks for every effect type (`hp_damage`, `hp_heal`, `hp_drain`). Adding a new effect type requires modifying the core manager.
    *   **View Coupling:** The manager constructs UI message strings (`msg`) and calls `SoundManager.play()` directly. It knows too much about *how* the battle is presented, not just *what* happened.
*   **Impact:** The battle system cannot be easily extended with new mechanics (e.g., Plugins) without altering core files.

## 2. Core Object Responsibility Violations (The Trunk)

### 2.1. `Game_Battler`: The Overloaded Model
**Severity:** High
**Location:** `src/objects/objects.js`

*   **Violation:** Separation of Data and Logic.
*   **Analysis:** `Game_Battler` is a "fat model" that handles concerns that belong in Managers or Views.
    *   **View State:** It stores `prevHp` solely for the purpose of UI animation. This is a display concern leaking into the data model.
    *   **Business Logic:** It handles XP curves (`xpNeeded`), Leveling (`gainXp`), and Evolution checks (`checkEvolution`). This logic belongs in a `ProgressionManager` or specific Strategy classes.
*   **Impact:** The Model is not a "Plain Old Data" object, making it heavy to serialize/deserialize (e.g., for saving games) and complex to mock.

### 2.2. `Game_Map`: The Rules-Aware Container
**Severity:** Medium
**Location:** `src/objects/objects.js`

*   **Violation:** SRP (Cohesion).
*   **Analysis:** The `generateFloor` method is responsible for procedural generation, but it also enforces specific Game Rules.
    *   **Rule Leakage:** It calculates Initiative, Sneak Attack chances, and checks for specific Traits (`REAR_GUARD`) during map generation.
*   **Impact:** The map generator is coupled to the Combat System's rules. Changing how Initiative works requires editing the Map Generator.

## 3. Systemic Inconsistencies (The Branches)

### 3.1. The UI Schism: Imperative vs. Declarative
**Severity:** Medium
**Location:** `src/windows/`

*   **Issue:** The codebase is split between two conflicting UI paradigms.
    1.  **Legacy Imperative:** `Window_Base` and `Scene_Map` use `document.createElement` and manual DOM manipulation.
    2.  **Modern Declarative:** `UI.build` (`src/windows/builder.js`) offers a component-based approach.
*   **Analysis:** New features like `Window_Inspect` use the new system, while core windows like `Window_Inventory` rely on the old one.
*   **Impact:** Inconsistent code style, duplicated logic, and increased cognitive load for developers who must switch contexts between "building DOM nodes" and "declaring components."

### 3.2. Effect Handling Dichotomy
**Severity:** Medium
**Location:** `src/managers/`

*   **Issue:** There are two separate systems for handling game effects.
    1.  **`EffectManager`:** Handles Passive Traits (`turnStart` triggers).
    2.  **`BattleManager`:** Handles Active Skill Effects (hardcoded).
*   **Impact:** This split makes it impossible to create a unified "Effect" definition that works for both Passives and Skills (e.g., a "Heal" effect that can be a passive regen OR a spell).

## 4. Project Structure & Dependency Analysis

### 4.1. Tight View-Controller Coupling
**Location:** `src/scenes/scenes.js` -> `src/windows/battle.js`

*   **Issue:** `Scene_Battle` is intimately aware of `Window_Battle`'s internal DOM structure.
*   **Evidence:** The Scene calls `animateBattler`, which toggles specific CSS classes (`blink`, `shake`) on elements retrieved via `getBattlerElement`.
*   **Correction:** The Scene should update the *State* (e.g., `battler.isFlashing = true`) and the Window should reactively render that state.

### 4.2. Base Class "Anemia" vs "Bloat"
*   **`Scene_Base` (Anemic):** It does almost nothing. It could standardized Input routing or Window management, but currently, `Scene_Map` re-implements everything.
*   **`Window_Base` (Bloated Implementation):** It hardcodes the HTML structure (Header, Content, Footer) in the constructor, making it difficult to create windows that don't fit this exact mold (like HUD overlays) without awkward overrides (`embedded: true`).

## 5. Strategic Recommendations

1.  **Refactor `Scene_Map` into Sub-Managers:**
    *   Create `InputController` to handle keyboard mapping.
    *   Create `HUDManager` to manage the lifecycle of the 12 UI windows.
    *   `Scene_Map` should only coordinate the high-level flow.

2.  **Unify Effect Logic:**
    *   Refactor `BattleManager` to delegate skill effects to `EffectProcessor` (or `EffectManager`), removing the hardcoded `if (type === 'hp_damage')` blocks.

3.  **Standardize UI:**
    *   Deprecate direct `document.createElement` usage in Windows.
    *   Refactor `Window_Base` to use `UI.build` internally for its structure.

4.  **Purify the Data Model:**
    *   Remove `prevHp` from `Game_Battler`. Move animation state tracking to the `Window_Battle` or a generic `ViewProxy`.
    *   Extract Leveling/Evolution logic into a `ProgressionSystem` static class.
