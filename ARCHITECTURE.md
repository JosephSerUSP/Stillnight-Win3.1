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
-   **Scene_Map**: Handles exploration, tile interactions, and the main game loop. Acts as the central hub for exploration gameplay.
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
    -   Uses a relative coordinate system `(x, y)` relative to the `#game-container`.
-   **WindowLayer**: A DOM container appended to `#game-container` that holds all window elements, ensuring correct z-indexing.
-   **Window_HUD**: Manages the static "desktop" UI elements (Status bars, Navigation).

### 2.3. The Manager Layer (`managers.js`)
Static or Singleton classes that handle global logic.
-   **SceneManager**: Manages the scene stack.
-   **BattleManager**: Handles the granular turn-based combat logic (Start Round -> Get Next Battler -> Execute Action).
-   **DataManager**: Asynchronously loads JSON data from `data/`.
-   **SoundManager**: Handles audio playback.
-   **ThemeManager**: Manages CSS variables for dynamic theming (Original, Night, High Contrast).

### 2.4. The Data Layer (`data/`)
The engine is data-driven.
-   **JSON Files**: `actors.json`, `items.json`, `maps.json`, `enemies.json` define content.
-   **JS Files**: `skills.js`, `passives.js`, `states.js` define complex logic (formulas, effects).
-   **Traits System**: Entities (Actors, Items, States) possess "Traits" (e.g., `PARAM_PLUS`, `HRG`) that are aggregated to determine stats and behaviors.

## 3. Key Design Patterns

### 3.1. Observer Pattern (Refactoring Target)
Ideally, game objects should emit events (e.g., `onTurnStart`) that traits subscribe to, rather than hardcoding checks. Currently, `BattleManager` iterates through known traits to apply effects.

### 3.2. Command Pattern (Battle Actions)
Battle actions are encapsulated as objects (e.g., `{ type: 'SKILL', skillId: 'fireball', targetIndex: 1 }`). This allows `BattleManager` to queue and execute actions uniformly.

### 3.3. Factory Pattern
-   **Game_Battler**: Instantiated based on data ID.
-   **Window Creation**: Windows are often instantiated by Scenes on demand.

## 4. Technical Specifications

### 4.1. Coordinate System
Windows use a coordinate system relative to the main game container (`.win-window`).
-   `(0, 0)` is the top-left of the game container.
-   Windows are positioned absolutely within the container.

### 4.2. DOM Structure
The `index.html` is a minimal container.
```html
<div id="game-container" class="win-window">
    <!-- Scene Content (e.g., Canvas/Grid) -->
    <!-- WindowLayer (Appended by WindowManager) -->
</div>
```

### 4.3. CSS Architecture
-   **Generalist Classes**: Use `.gauge` instead of `.hp-bar`.
-   **Data-Driven Styling**: Colors and dimensions are passed via JS or CSS variables (`var(--content-bg)`), not hardcoded in CSS classes.
-   **Atomic Utility Classes**: Use `.text-danger`, `.text-functional` for text formatting.

## 5. Refactoring Roadmap (Status: Ongoing)

### Phase 1: The Window System (In Progress)
-   Standardized "Close" behavior via `onUserClose`.
-   **TODO**: Split the monolithic `windows.js` file into modular files.
-   **TODO**: Refactor `Window_HUD` to be more modular.

### Phase 2: Logic Extraction (Ongoing)
-   Extracted battle logic from `Scene_Map` to `BattleManager`.
-   Implemented `Game_Interpreter` for map events.
-   **TODO**: Move `onTurnStart` logic from `Game_Battler` to a data-driven system.

### Phase 3: Scene Segregation (Completed)
-   Split `Scene_Map` into `Scene_Map`, `Scene_Battle`, `Scene_Shop`.

### Phase 4: Data-Driven Trait System (Ongoing)
-   Standardize `traits` array across all data objects.
-   Remove remaining hardcoded effect checks in `BattleManager` and `Game_Battler`.
