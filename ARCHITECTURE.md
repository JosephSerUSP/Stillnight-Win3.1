# Stillnight Architecture

## 1. Overview
The "Stillnight" codebase follows a modular, scene-based architecture designed for maintainability and separation of concerns. It transitions away from monolithic "God Classes" (like the legacy `Scene_Map`) towards specialized Managers and a clean Model-View-Controller (MVC) separation.

## 2. Directory Structure
*   `src/managers/`: Core logic controllers and systems.
*   `src/objects/`: Game data models and entities.
*   `src/scenes/`: High-level game states (Title, Map, Battle).
*   `src/windows/`: UI components and window logic.
*   `src/core/`: Low-level utilities and constants.

## 3. Core Systems (Managers)

### 3.1. Infrastructure
*   **`SceneManager`**: Handles the game loop and scene stack (push/pop).
*   **`DataManager`**: Loads static JSON data and dynamic assets.
*   **`WindowManager`**: Manages the global UI stack (z-indexing, focus, modal handling).
*   **`ConfigManager`**: Persists user settings (Volume, Auto-Battle).

### 3.2. Gameplay Logic
*   **`BattleManager`**: Orchestrates turn-based combat flow. It delegates specific mechanics to specialized sub-systems.
*   **`EffectProcessor`**: A stateless strategy for applying immediate effects (Damage, Healing, Status) from Items and Skills.
*   **`ProgressionSystem`**: A static library handling Experience, Leveling, and Evolution rules. It acts on `Game_Battler` instances.
*   **`EncounterManager`**: Determines battle initialization logic, including Initiative rolls and Sneak Attack calculations.
*   **`EffectManager`**: Handles passive trait triggers (e.g., `turnStart` regen).

### 3.3. Scene Controllers
*   **`InputController`**: Maps raw keyboard events to high-level scene actions (Movement, Menu toggle).
*   **`HUDManager`**: Manages the lifecycle and instantiation of UI windows for the Exploration scene, decoupling the View from the Scene logic.

## 4. Data Models (Objects)
The `src/objects/` directory contains the core entities. `objects.js` serves as an aggregator.

*   **`Game_Base`**: Abstract base class with common properties (`id`, `name`, `hp`, `level`).
*   **`Game_Battler`**: Represents actors and enemies. It is a "thin model" that stores state (`hp`, `xp`, `equipment`) but delegates complex logic to `ProgressionSystem` or `EffectProcessor`.
*   **`Game_Party`**: Manages the collection of battlers (`slots`), inventory, and gold.
*   **`Game_Map`**: Handles procedural generation logic (`generateFloor`) and state.
*   **`Game_Event`**: Represents interactive map entities (Enemies, Chests, NPCs).

## 5. UI System
The UI uses a custom "Windows 3.1" style system built on the DOM.

### 5.1. Window_Base
The base class for all windows. It uses a **Declarative Builder** (`UI.build`) to construct its DOM structure (Header, Content, Footer), ensuring consistency and reducing boilerplate `document.createElement` calls.

### 5.2. View State Separation
To prevent "View State Leakage" into Data Models, animation-specific state (like `prevHp` for gauge tweening) is stored within the UI components (e.g., `Window_PartyPanel` uses a `WeakMap` to track previous values) rather than on `Game_Battler`.

## 6. Key Workflows

### 6.1. Battle Flow
1.  **Encounter**: `Game_Map` encounters an event. `EncounterManager` determines Initiative/Sneak Attack.
2.  **Start**: `Scene_Map` pushes `Scene_Battle`.
3.  **Round**: `BattleManager` sorts the turn queue based on Speed (`asp`).
4.  **Action**: `BattleManager` executes actions. Effect mechanics (Damage, etc.) are delegated to `EffectProcessor`.
5.  **Result**: `EffectProcessor` returns deltas (e.g., damage dealt). `BattleManager` packages these into Events for `Window_Battle` to animate.

### 6.2. Evolution Flow
1.  **Check**: `Window_Inspect` queries `ProgressionSystem.getEvolutionStatus` for the selected member.
2.  **Preview**: If available, `Scene_Map` opens `Window_Evolution`.
3.  **Execution**: Upon confirmation, `Scene_Map` modifies the party via `Game_Party` methods.

### 6.3. Map Interaction
1.  **Input**: User presses a key. `InputController` processes it.
2.  **Logic**: `Scene_Map` calls `movePlayer`.
3.  **Event**: If a tile has an event, `Game_Interpreter` executes it (accessing UI via `HUDManager`).
