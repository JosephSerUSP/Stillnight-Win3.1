# Stillnight Engine

A retro Windows 3.1-style RPG engine built with modern JavaScript.

## Overview

The **Stillnight Engine** is a single-page RPG engine featuring a unique aesthetic inspired by Windows 3.1. It is built using vanilla JavaScript (ES modules) and does not rely on heavy frontend frameworks. The architecture is designed to be scalable and data-driven, similar to engines like RPG Maker MZ.

### Key Features
- **Scene-Based Architecture**: Separation of concerns between Map, Battle, Shop, and Menu states.
- **Dynamic Window System**: Programmatic generation of UI windows with a focus on modularity.
- **Data-Driven Gameplay**: Skills, items, and actors are defined in JSON/JS data files. Formulas are safely evaluated at runtime.
- **Retro Aesthetic**: Custom CSS and ASCII/pixel art styling.

## File Structure

```
.
├── core.js           # Core utility functions (Math, Random, Formula Evaluation)
├── main.js           # Entry point, initializes the game
├── managers.js       # Game logic managers (SceneManager, BattleManager, SoundManager)
├── objects.js        # Game objects (Game_Battler, Game_Map, Game_Party)
├── scenes.js         # Scene classes (Scene_Map, Scene_Battle) and Game_Interpreter
├── windows.js        # UI Window classes, WindowLayer, and HUD management
├── tooltip.js        # Tooltip system
├── sprites.js        # Sprite handling (legacy)
├── data/             # Game data (JSON and JS files)
├── assets/           # Images and other static assets
└── tests/            # Playwright tests
```

## Setup

1.  **Install Dependencies**:
    ```bash
    npm install
    ```
2.  **Install Playwright Browsers** (for testing):
    ```bash
    npx playwright install
    npx playwright install-deps
    ```

## Usage

### Running the Game
To run the game locally, you need to serve the files using a web server. Python's built-in HTTP server is a quick way to do this:

```bash
python -m http.server 8080
```

Then, open your browser and navigate to `http://localhost:8080`.

### Running Tests
The project uses [Playwright](https://playwright.dev/) for testing. The configuration (`playwright.config.js`) handles starting the web server automatically.

To run all tests:
```bash
npm test
```

## Architecture

The engine follows a scene-based state machine pattern managed by `SceneManager`. The UI is handled by `WindowManager`, which manages a stack of `Window_Base` instances.

### Core Systems

*   **Scenes**: Handle the game loop for specific states (e.g., `Scene_Map`, `Scene_Battle`).
    *   `Scene_Map` delegates UI to `Window_HUD` and event logic to `Game_Interpreter`.
    *   `Scene_Battle` manages the combat loop via `BattleManager` and the view via `Window_Battle`.
*   **Windows**: Handle the display and user interaction. They are completely decoupled from the HTML file and generate their own DOM.
    *   `Window_HUD`: Manages the static desktop interface (sidebar, grid).
    *   `WindowLayer`: Handles z-indexing and modality for floating windows.
*   **Managers**: Static classes that handle global logic.
    *   `BattleManager`: Handles turn resolution using a granular phase system.
    *   `DataManager`: Loads and caches all JSON assets.
*   **Game Objects**: Classes that represent game entities (e.g., `Game_Battler` for characters).
    *   `Game_Battler`: Encapsulates stats, state updates, and passive effect logic (`onTurnStart`).

### Data & Formulas

The engine uses a robust, data-driven approach for skills and effects.
*   **Formulas**: Skill effects use string formulas (e.g., `"a.atk * 4 - b.def * 2"`) which are safely evaluated at runtime using `evaluateFormula` in `core.js`.
*   **Drops**: Enemy item drops are defined in `data/actors.json` and processed by `Scene_Battle`.

## Documentation

The codebase is fully documented with JSDoc. You can inspect the source files for detailed descriptions of classes and methods.
