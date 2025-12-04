# Architectural Analysis Report

## 1. Executive Summary
The "Stillnight" codebase is currently in a transitional state. While the documentation (`ARCHITECTURE.md`) outlines a clean, modular, scene-based MVC architecture, the implementation reveals significant technical debt in the form of monolithic files, "God Classes", and a fractured UI paradigm. These issues create high cognitive load for developers and increase the risk of regressions during maintenance.

## 2. Structural Flaws (Grave Severity)
*These flaws represent fundamental violations of modularity and the Single Responsibility Principle (SRP).*

### 2.1. Monolithic Modules
*   **`src/scenes/scenes.js`**: This single file exports `Scene_Boot`, `Scene_Battle`, `Scene_Shop`, and `Scene_Map`. It is over 1000 lines long.
    *   **Impact**: Any change to specific scene logic (e.g., Shop calculations) requires modifying this shared file, increasing merge conflicts. It obscures the boundaries between different game states.
*   **`src/managers/index.js`**: Functions as both an aggregator and a definition file for `DataManager`, `SoundManager`, `BattleManager`, `SceneManager`, `ThemeManager`, and `ConfigManager`.
    *   **Impact**: `BattleManager` (~300 lines) and `SoundManager` (~200 lines) are complex subsystems that should exist in dedicated files (`src/managers/battle.js`, `src/managers/audio.js`).

### 2.2. The `Scene_Map` God Class
`Scene_Map` (defined in `scenes.js`) violates the Separation of Concerns principle by aggregating responsibilities that belong to specialized managers:
*   **Responsibilities**:
    *   **Input Handling**: Directly processes movement and interaction keys.
    *   **UI Management**: Acts as a facade for `Window_Desktop` and `HUDManager`.
    *   **Game Loop**: Manages the `runActive` state and turn flow.
    *   **Audio**: Manages background music transitions.
    *   **Routing**: Handles transitions to Battle and Shop scenes.
*   **Impact**: This class is tightly coupled to almost every system in the game, making it fragile and difficult to test in isolation.

## 3. Architectural Deficiencies (Major Severity)
*These flaws affect the scalability of the application and the consistency of the codebase.*

### 3.1. UI Framework Schism (Imperative vs. Declarative)
The project exhibits a split personality in its UI implementation:
*   **Legacy (Imperative)**: `Window_Base` relies on manual `document.createElement` and DOM manipulation for parts of its lifecycle (e.g., `addButton`).
*   **Modern (Declarative)**: `UI.build` (in `src/windows/builder.js`) offers a React-like structure for creating components.
*   **The Problem**: New windows like `Window_Battle` use `UI.build` for initial layout but revert to `innerHTML` or imperative queries (`getHpElement`) for updates. This leads to inconsistent code and potential XSS vulnerabilities or rendering bugs.

### 3.2. Logic Leakage (View Logic in Controller)
*   **`Scene_Battle`**: This controller class contains significant View logic. Methods like `animateBattlerName`, `animateBattleHpGauge`, and `playAnimation` directly manipulate DOM elements belonging to `Window_Battle`.
    *   **Principle Violation**: The View (`Window_Battle`) should be responsible for how it animates its state changes. The Controller (`Scene_Battle`) should only direct the View to update.

### 3.3. Tight Coupling
*   **Scene <-> Window**: Scenes instantiate specific concrete Window classes and attach event listeners directly to their internal buttons (e.g., `this.battleWindow.btnRound.addEventListener` in `Scene_Battle`).
    *   **Impact**: This violates the Law of Demeter. Scenes depend on the internal implementation details of Windows.

## 4. Code Quality & Consistency (Minor Severity)

### 4.1. Inconsistent Data Access
*   `Game_Battler` imports `data/passives.js` and `data/states.js` directly via ES modules, bypassing the `DataManager` instance used by the rest of the app.
*   **Risk**: This creates two sources of truth for data loading and makes it impossible to mock data effectively during tests.

### 4.2. Scattered Input Handling
*   Global listener in `src/main.js`.
*   `InputController` for `Scene_Map`.
*   Direct constructor listeners in `Scene_Battle`.
*   **Result**: No single source of truth for input flow, making it hard to implement features like "Pause" or "Rebind Keys" globally.

## 5. Alignment with Documentation
The `ARCHITECTURE.md` describes an idealized state that does not exist:
*   **Claim**: "`Scene_Map` transitions away from monolithic God Classes".
    *   **Reality**: `Scene_Map` remains a monolithic God Class.
*   **Claim**: "`BattleManager`... delegates specific mechanics".
    *   **Reality**: `BattleManager` contains hardcoded action logic (e.g., `_executeAttack`) mixed with delegation.

## 6. Recommendations
1.  **Refactor Monoliths**: Split `scenes.js` and `managers/index.js` into individual files immediately.
2.  **Standardize UI**: Deprecate imperative DOM calls in favor of `UI.build`. Move animation logic into Window classes.
3.  **Decouple Scenes**: Use an event-driven or callback-based interface for Window interactions (e.g., `window.onAction(cb)`).
4.  **Centralize Data**: Ensure `Game_Battler` receives data dependencies via injection or `DataManager`, not static imports.
