# Phase 2: Decoupling & Event Driven Architecture

**Objective:** Sever the tight coupling between Game Logic (Interpreters, Managers) and Presentation (Scenes, Windows) using an Event Bus and Context Injection.

## 1. The Event Bus System

### The Problem
`Game_Interpreter` and `BattleManager` directly call methods on `Scene_Map` and `Scene_Battle` (e.g., `scene.logMessage()`). This creates a circular dependency and makes testing logic impossible without instantiating a full UI scene.

### The Standard
Logic modules must be **Blind** to the View. They should emit signals that the View listens to.

### Execution Plan
1.  **Create `EventBus`**:
    *   **Location:** `src/core/events.js`
    *   **API:** `emit(event, payload)`, `on(event, handler)`, `off(event, handler)`.
    *   **Events Enum:** Define standard events: `LOG_MESSAGE`, `PLAY_SOUND`, `UPDATE_HUD`, `SHOW_DIALOG`.
2.  **Refactor Managers**:
    *   Replace `scene.logMessage("...")` with `EventBus.emit('LOG_MESSAGE', "...")`.
    *   Replace `SoundManager.play` calls inside logic loops with `EventBus.emit('PLAY_SOUND', '...')`.
3.  **Refactor Scenes**:
    *   `Scene_Map` subscribes to `LOG_MESSAGE` and updates `Window_Log`.
    *   `Scene_Battle` subscribes to `BATTLE_EVENT` and triggers animations.

## 2. Context Injection for Interpreter

### The Problem
`Game_Interpreter` constructor takes `scene` as an argument. It "knows" that `scene` has a `windowManager`, a `hudManager`, etc. This violates the Dependency Inversion Principle.

### The Standard
Depend on Abstractions, not Concretions.

### Execution Plan
1.  **Define `InterpreterContext` Interface**:
    *   A simple object or class that defines *only* what the interpreter needs (e.g., `showDialog(config)`, `startBattle(x, y)`).
2.  **Refactor `Game_Interpreter`**:
    *   Accept `context` instead of `scene`.
    *   All calls to `this.scene.*` must be mapped to `this.context.*`.
3.  **Adapter Pattern in Scene**:
    *   `Scene_Map` creates an adapter object that implements `InterpreterContext` and passes *that* to the interpreter, keeping the Scene instance private.

## 3. Strict Restrictions for Phase 2

*   **Logic Classes cannot import Scenes:** `src/managers/*` must never import from `src/scenes/*`.
*   **No "God Objects" in Constructors:** Do not pass `this` (the Scene) into helper classes. Pass specific delegates or config objects.
*   **One-Way Data Flow:** Data flows down (Manager -> Event -> Scene -> Window). It should never flow up via direct method calls (Window -> Scene -> Manager -> Scene).
