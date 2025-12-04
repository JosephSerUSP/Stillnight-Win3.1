# Architectural Analysis Report: Stillnight Engine

## 1. Executive Summary

The Stillnight Engine is designed with a clear architectural vision, as outlined in the `README.md`: a data-driven, scene-based structure with a strict separation of concerns between game logic (Objects), UI presentation (Windows), and application flow (Scenes). This foundation is sound and aligns with modern software engineering principles.

However, the current implementation deviates significantly from this vision in critical areas. A deep analysis of the codebase reveals several architectural flaws that undermine the engine's modularity, maintainability, and scalability. The most significant issues are:

-   **Monolithic Files**: Key components, particularly `src/scenes/scenes.js` and `src/objects/objects.js`, aggregate numerous, unrelated classes into single files, making navigation and maintenance difficult.
-   **God Objects**: The `Scene_Map` class has evolved into a "god object," accumulating responsibilities far beyond scene management, including UI instantiation, event handling, and core game logic.
-   **Tight Coupling**: There is a high degree of coupling between the Scene layer and the Window layer. Scenes are directly responsible for creating, managing, and handling events for UI windows, violating the intended separation of concerns.

This report provides a detailed breakdown of these architectural flaws, analyzes their impact on the codebase, and proposes a set of actionable recommendations to refactor the engine back toward its intended state of a clean, scalable, and maintainable architecture.

## 2. Analysis of Core Components

### 2.1. `src/scenes/scenes.js` - The Monolithic Scene File

This file serves as a container for all scene-related classes, including `Scene_Base`, `Scene_Boot`, `Scene_Battle`, `Scene_Shop`, and `Scene_Map`.

-   **Problem**: Housing multiple, distinct classes in a single file violates the Single Responsibility Principle at the file level. It makes the file difficult to navigate, increases the cognitive load on developers, and creates a bottleneck for version control, where changes to any scene class result in conflicts in the same file.
-   **Impact**: Reduced maintainability and scalability. Adding a new scene or modifying an existing one requires changing a large, unwieldy file.

### 2.2. `src/objects/objects.js` - The Monolithic Game Object File

Similar to `scenes.js`, this file contains the definitions for all core game data structures: `Game_Base`, `Game_Battler`, `Game_Party`, `Game_Event`, and `Game_Map`.

-   **Problem**: These classes represent distinct entities with complex logic. Bundling them together obscures the data model and makes it difficult to work on individual components without affecting others. For example, `Game_Battler` alone is a substantial class that warrants its own module.
-   **Impact**: Poor code organization and difficulty in isolating components for testing or refactoring.

### 2.3. `Scene_Map` - The God Object

The `Scene_Map` class has become the central hub for the entire application, far exceeding the responsibilities of a typical scene.

-   **Problem**: `Scene_Map` is responsible for:
    -   **UI Instantiation**: The constructor of `Scene_Map` directly instantiates nearly every UI window used in the game (e.g., `Window_Inventory`, `Window_Formation`, `Window_Inspect`). This couples the scene directly to the UI implementation.
    -   **Global State Management**: It manages the main application state (`this.runActive`) and acts as a broker for sub-scenes like `Scene_Battle` and `Scene_Shop`.
    -   **Core Game Logic**: It contains a significant amount of logic for player actions, inventory management, and event execution that could be delegated to more specialized classes or managers.
    -   **Event Handling**: It serves as the primary dispatcher for both keyboard and click events, further cementing its role as a central controller.
-   **Impact**: This centralization makes `Scene_Map` extremely brittle and difficult to modify. Changes to UI, inventory, or party logic all require modifications to this single, massive class. It also renders the `WindowManager` largely redundant, as `Scene_Map` bypasses it for direct window management.

## 3. Identified Architectural Anti-Patterns

The issues identified in the core components are manifestations of well-known architectural anti-patterns that conflict with the engine's stated design goals.

-   **God Object**: `Scene_Map` is a classic example of a God Object. It knows too much and does too much, making it the gravitational center of the application. This violates the Single Responsibility Principle and creates a maintenance bottleneck.

-   **Monolithic Files (aka "Kitchen Sink" Files)**: The practice of grouping multiple, unrelated classes into a single file (`scenes.js`, `objects.js`) is a direct contradiction of the modularity principle. Each class should reside in its own file, promoting clarity and ease of maintenance.

-   **Tight Coupling**: The direct instantiation and management of `Window` objects within `Scene_Map` creates a tight coupling between the application logic and the presentation layer. This makes it difficult to change the UI without impacting the core game logic, and vice-versa. The `WindowManager` was intended to mitigate this, but its role has been usurped by `Scene_Map`.

## 4. Actionable Recommendations

To align the codebase with its intended architecture, the following refactoring steps are recommended, in order of priority:

### Priority 1: Dismantle Monolithic Files

-   **Action**: Create a dedicated subdirectory for each major component and move the corresponding classes into their own files.
    -   `src/scenes/` -> `src/scenes/Scene_Map.js`, `src/scenes/Scene_Battle.js`, etc.
    -   `src/objects/` -> `src/objects/Game_Battler.js`, `src/objects/Game_Party.js`, etc.
-   **Benefit**: Immediately improves code organization, reduces merge conflicts, and makes the codebase easier to navigate and maintain.

### Priority 2: Refactor `Scene_Map` and Empower `WindowManager`

-   **Action**: Systematically move responsibilities out of `Scene_Map`.
    1.  **Decouple UI Instantiation**: Move all `Window` instantiation out of `Scene_Map` and into a dedicated UI management layer, potentially a `UIManager` or by fully empowering the existing `WindowManager`. The `WindowManager` should be responsible for creating, caching, and providing access to windows.
    2.  **Delegate Game Logic**: Extract business logic (e.g., inventory actions, party management) from `Scene_Map` into the relevant `Game_` objects (`Game_Party`, `Game_Battler`).
    3.  **Centralize Input Handling**: Consolidate input handling in `main.js` to delegate events to the `WindowManager` first, and then to the active `Scene`, as originally intended.
-   **Benefit**: Restores the Single Responsibility Principle, making `Scene_Map` a true scene controller. Decouples the UI from game logic, allowing them to evolve independently.

### Priority 3: Introduce a Service Layer for Global State

-   **Action**: Instead of passing managers and the entire `Game_Party` object through scene constructors, introduce a global context or service locator to provide access to shared instances like `$party`, `$map`, and `$data`.
-   **Benefit**: Reduces constructor complexity and further decouples scenes from the specifics of the application's global state, making them more reusable and easier to test.

## 5. Conclusion

The Stillnight Engine is built on a solid conceptual foundation, but the implementation has drifted from its intended architectural principles. By addressing the issues of monolithic files, god objects, and tight coupling, the engine can be significantly improved.

The recommended refactoring path is designed to be incremental, starting with low-risk organizational changes and progressing to more impactful structural improvements. Executing these recommendations will lead to a more modular, maintainable, and scalable codebase that is better aligned with its original design goals and easier for developers to extend in the future.
