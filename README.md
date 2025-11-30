# Stillnight Engine

A retro Windows 3.1-style RPG engine built with modern vanilla JavaScript.

## Overview

The **Stillnight Engine** is a single-page RPG engine featuring a unique aesthetic inspired by Windows 3.1. It is built using ES modules and does not rely on heavy frontend frameworks. The architecture is designed to be scalable and data-driven, separating game logic from the UI presentation layer.

## Key Features

-   **Scene-Based Architecture**: Strict separation of game states (Map, Battle, Shop, Menu) managed by a stack-based `SceneManager`.
-   **Dynamic Window System**: Programmatic generation of UI windows (`Window_Base`) with a focus on modularity and interactivity.
-   **Data-Driven Gameplay**: Skills, items, actors, and events are defined in JSON/JS data files, leveraging a flexible Traits system.
-   **Retro Aesthetic**: Custom CSS variables and pixel-art assets create a cohesive Windows 3.1 look and feel.
-   **Granular Battle System**: A turn-based combat system managed by `BattleManager`, supporting complex action sequences and event-driven animations.

## File Structure

```
.
├── core.js           # Core utility functions (RNG, Math)
├── main.js           # Application entry point
├── managers.js       # Global managers (Scene, Battle, Sound, Theme, Fusion)
├── objects.js        # Game logic classes (Game_Battler, Game_Map, Game_Party)
├── scenes.js         # Scene implementations (Map, Battle, Shop)
├── windows.js        # UI Window classes
├── sprites.js        # Sprite handling and rendering
├── tooltip.js        # Global tooltip system
├── data/             # Game content (JSON/JS)
├── assets/           # Images, icons, and audio
└── tests/            # Playwright test suite
```

## Setup & Installation

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Install Playwright Browsers** (Required for testing):
    ```bash
    npx playwright install
    npx playwright install-deps
    ```

## Usage

### Running the Game
To run the game locally, serve the files using a web server. Python's built-in HTTP server is recommended:

```bash
python -m http.server 8080
```

Then, navigate to `http://localhost:8080` in your web browser.

### Running Tests
The project uses **Playwright** for end-to-end and logic testing.

To run the full test suite:
```bash
npm test
```

#### Testing Options
-   **Debug Mode**: `npx playwright test --debug`
-   **UI Mode**: `npx playwright test --ui`

#### Testing Philosophy
Tests act as **scaffolding**. They prioritize verifying core math (XP curves, Damage formulas) and game rules over rigid structural assertions. If a refactor changes class names but preserves logic, update the test to match.

## Architecture

For a deep dive into the engine's design, please refer to [ARCHITECTURE.md](ARCHITECTURE.md).

-   **Scenes**: Handle the high-level game loop and state transitions.
-   **Windows**: Handle all UI rendering and user interaction. They are decoupled from the HTML file.
-   **Managers**: Static singletons that handle global systems (Audio, Themes, Data).
-   **Game Objects**: Data-rich classes representing entities (Battlers, Maps).

## Documentation

The codebase is fully documented with JSDoc. Inspect the source files for detailed descriptions of classes, methods, and parameters.
