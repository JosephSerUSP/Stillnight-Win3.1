# Stillnight – Design Document

## Architecture Overview

Stillnight uses a scene-based architecture managed by a `SceneManager`. The game flow is handled by pushing and popping scenes onto a stack.

### Core Systems

*   **SceneManager**: Static class responsible for managing the scene stack. Handles scene transitions, updates `window.scene` for testing, and manages the lifecycle (create, start, stop, pause, resume) of scenes.
*   **DataManager**: Loads and manages static game data (actors, items, floors, etc.).
*   **SoundManager**: Handles audio playback.
*   **BattleManager**: Handles the turn-based battle logic (damage calculation, event generation).

### Scenes

*   **Scene_Base**: Base class for all scenes. Manages the `WindowLayer` and basic lifecycle methods.
*   **Scene_Map**: The main exploration scene. Handles player movement, interactions (stairs, shrines, chests), and manages the UI for the map. Pushes `Scene_Battle` or `Scene_Shop` when encounters occur.
*   **Scene_Battle**: Handles the battle interface and flow. Uses `BattleManager` to resolve rounds.
*   **Scene_Shop**: Handles the shop interface and purchasing logic.

### Phases

#### Phase I: Prototype (Completed)
*   Basic grid-based movement.
*   Initial UI layout (Windows 3.1 style).
*   Data loading structure.

#### Phase II: Monolithic Gameplay (Completed)
*   Implemented Battle, Shop, and Event systems directly within `Scene_Map`.
*   Functional turn-based combat and inventory management.

#### Phase III: Refactoring & Scene Stack (Completed)
*   Implemented `SceneManager` to decouple game states.
*   Extracted `Scene_Battle` and `Scene_Shop` into separate files.
*   Refactored `Scene_Map` to use the scene stack.
*   Improved code organization and maintainability.

## Assessment

The transition to Phase III has successfully decoupled the battle and shop logic from the map exploration. This makes the codebase significantly easier to extend (e.g., adding new scene types like a Main Menu or Game Over screen) and test. The `Scene_Map` class is now focused solely on exploration logic.