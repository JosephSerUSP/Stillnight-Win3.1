# Architectural Documentation

**Project:** Stillnight Engine
**Version:** 2.1.0 (Refactoring Phase)

## 1. Executive Summary

The **Stillnight Engine** is a retro Windows 3.1-style RPG engine built with modern vanilla JavaScript. It is transitioning from a monolithic prototype to a scalable, data-driven architecture inspired by engines like RPG Maker MZ.

The core design philosophy separates the **Logic Layer** (Game Objects, Managers) from the **View Layer** (Windows, DOM) using a scene-based state machine.

## 2. Core Architecture

### 2.1. The Scene System (`scenes.js`)
The engine uses a stack-based Scene Manager (`SceneManager`).
-   **Scene_Base**: Abstract base class. Handles lifecycle (`create`, `start`, `update`, `stop`) and holds a `WindowManager`.
-   **Scene_Boot**: Preloads assets and data before launching the game.
-   **Scene_Map**: Handles exploration, tile interactions, and the main game loop. **(Currently a God Class candidate - see Refactor Plan)**
-   **Scene_Battle**: Dedicated combat state.
-   **Scene_Shop**: Dedicated shopping interface.

### 2.2. The Window System (`windows.js`)
UI is composed of modular `Window` classes that generate their own DOM structure.
-   **WindowManager**: Manages a stack of active windows.
    -   **Input Focus**: Only the top window receives input.
    -   **Modal Logic**: Windows below the top are visually dimmed and non-interactive.
-   **Window_Base**: The parent class for all UI windows.
    -   Generates the standard "window frame" (Title bar, close button).
    -   Handles drag-and-drop functionality.
-   **WindowLayer**: A DOM container appended to `#game-container` that holds all window elements.

### 2.3. The Manager Layer (`managers.js`)
Static or Singleton classes that handle global logic.
-   **SceneManager**: Manages the scene stack.
-   **BattleManager**: Handles the granular turn-based combat logic.
-   **DataManager**: Asynchronously loads JSON data from `data/`.
-   **SoundManager**: Handles audio playback.
-   **ThemeManager**: Manages CSS variables for dynamic theming.

### 2.4. The Logic Layer (`objects.js`, `core.js`)
-   **Game_Battler**: Represents an entity (Actor/Enemy) with stats and traits.
-   **Game_Map**: Procedural generation and floor management.
-   **Game_Party**: Inventory and Party management.
-   **Game_Interpreter**: (To be extracted) Handles event execution logic.

## 3. Key Design Patterns

### 3.1. Traits System
Entities (Actors, Items, States) possess "Traits" (e.g., `PARAM_PLUS`, `HRG`) that are aggregated to determine stats and behaviors.
*   **Goal**: Move from hardcoded checks in `Game_Battler` to a generic `EffectManager`.

### 3.2. Command Pattern (Battle Actions)
Battle actions are encapsulated as objects (e.g., `{ type: 'SKILL', skillId: 'fireball', targetIndex: 1 }`). This allows `BattleManager` to queue and execute actions uniformly.

## 4. Technical Specifications

### 4.1. Coordinate System
Windows use a coordinate system relative to the main game container (`.win-window`).
-   `(0, 0)` is the top-left of the game container.
-   Windows are positioned absolutely within the container.

### 4.2. CSS Architecture
-   **Data-Driven Styling**: Colors and dimensions are passed via JS or CSS variables (`var(--content-bg)`).
-   **Atomic Utility Classes**: Use `.text-danger`, `.text-functional` for text formatting.

## 5. Refactoring Status

See `ANALYSIS_REFACTOR.md` for the detailed assessment and roadmap.

### Key Goals:
1.  **Decompose God Classes**: Break down `Scene_Map` and `Game_Battler`.
2.  **Enforce OCP**: Replace `if/else` chains in `BattleManager` with a Strategy/Handler pattern.
3.  **Standardize UI**: Bring `Window_HUD` into the standard Window inheritance hierarchy.
