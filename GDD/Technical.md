# Technical Details

## 1. Game Engine

-   **Engine:** The Stillnight Engine is a custom-built, single-page application engine using modern, vanilla JavaScript (ES modules).
-   **Dependencies:** The engine has minimal dependencies, primarily relying on `npm` for development and `Playwright` for testing. It does not use any heavy frontend frameworks like React or Vue.
-   **Browser Support:** The engine is designed to run in modern web browsers that support ES modules.

## 2. Software Architecture

The engine follows a data-driven and scene-based architecture, with a clear separation of concerns.

-   **Scene Manager:** A stack-based scene manager (`SceneManager`) handles the main game loop and transitions between different game states (e.g., `Scene_Map`, `Scene_Battle`).
-   **Window System:** The UI is composed of a system of windows, with a base `Window_Base` class that provides common functionality. All UI elements are created and managed programmatically.
-   **Data-Driven Design:** Game content, including actors, items, skills, and events, is defined in external JSON and JavaScript files. This makes the game easy to modify and expand.
-   **Managers:** A collection of singleton managers (`DataManager`, `BattleManager`, `SoundManager`, etc.) handle global systems and state.

## 3. File Structure

```
.
├── src/
│   ├── core/         # Core utility functions and singletons
│   ├── managers/     # Global managers (Scene, Battle, Sound, Theme, Interpreter)
│   ├── objects/      # Game logic classes (Battler, Map, Party)
│   ├── scenes/       # Scene implementations (Map, Battle, Shop)
│   ├── windows/      # UI Window classes
│   └── main.js       # Application entry point
├── data/             # Game content (JSON/JS)
├── assets/           # Images, icons, and audio
└── tests/            # Playwright test suite
```

## 4. Implementation Plan

-   **Development Language:** JavaScript (ES modules)
-   **Styling:** CSS3, with a focus on custom properties for theming.
-   **Testing:** End-to-end and logic testing with Playwright.
-   **Version Control:** Git

## 5. Modding Support

The data-driven architecture of the engine makes it highly moddable. Modders can easily add or modify game content by editing the JSON and JavaScript files in the `data` directory. Future development could include tools to make this process even easier.
