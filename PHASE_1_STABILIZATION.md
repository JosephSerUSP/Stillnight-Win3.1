# Phase 1: Architectural Stabilization

**Objective:** Stabilize the codebase by eliminating the "God Class" anti-pattern in `Scene_Map` and unifying the UI architecture under a single, declarative paradigm.

## 1. UI Unification (The "No-Imperative" Rule)

### The Problem
Currently, the codebase mixes `document.createElement` (imperative) with `UI.build` (declarative). This creates confusion, code duplication, and makes refactoring the base window logic difficult.

### The Standard
All UI generation must be **Declarative**.
*   **Banned:** `document.createElement`, `appendChild`, `classList.add` (during construction).
*   **Mandated:** `UI.build(parent, structure)` from `src/windows/builder.js`.

### Execution Plan
1.  **Refactor `Window_Base`**:
    *   Rewrite the constructor to use `UI.build` for creating the Overlay, Frame, Header, Content, and Footer.
    *   Convert `makeDraggable` from a method that attaches raw listeners to a `Component` behavior or a cleaner composition utility.
2.  **Refactor Legacy Windows**:
    *   Identify any windows still using manual DOM manipulation (e.g., `Window_Desktop` internals).
    *   Convert them to return a JSON-like structure passed to `UI.build`.
3.  **Standardize Components**:
    *   Move all common UI patterns (Draggable, Close Button, Modal Overlay) into `src/windows/components.js` as reusable functional components.

## 2. Breaking the God Class (`Scene_Map`)

### The Problem
`Scene_Map` currently handles:
*   Rendering (View)
*   Input (Controller)
*   Game Logic (Model: Movement, Collision, Death)

### The Standard
`Scene_Map` must only be a **Controller/View Orchestrator**. It should bind input to logic and logic to view, but contain **zero** game rules.

### Execution Plan
1.  **Create `ExplorationEngine` (or `MapLogic`)**:
    *   **Location:** `src/managers/exploration.js`
    *   **Responsibilities:**
        *   Validating movement (Walls, Bounds).
        *   Handling collision checks (Events, Traps).
        *   Updating `Game_Map` state (Player X/Y, Visited flags).
        *   Returning distinct *Events* or *Results* (e.g., `{ type: 'MOVED', x: 10, y: 10 }`, `{ type: 'BLOCKED', reason: 'wall' }`).
2.  **Refactor `Scene_Map`**:
    *   Remove `movePlayer`, `onTileClick` *logic*.
    *   Replace with calls to `this.explorationEngine.tryMove(dx, dy)`.
    *   Switch on the result to update the UI (e.g., `if (result.type === 'MOVED') this.hud.updateGrid()`).
3.  **Extract Permadeath Logic**:
    *   Move `checkPermadeath` to `Game_Party` or a `DeathManager`.
    *   The Scene should only query `party.isDefeated()` or listen for a `DEATH` signal.

## 3. Strict Restrictions for Phase 1

*   **No Direct DOM Access in Scenes:** Scenes must never touch `document.getElementById` or manipulate `innerHTML`. They must interact strictly through `Window` instances.
*   **No Mixed UI Patterns:** A file must not contain both `UI.build` and `document.createElement`.
*   **No Game Rules in Scenes:** If it involves math (XP calculation, Damage, Coordinates), it belongs in a Manager or Model, not a Scene.
