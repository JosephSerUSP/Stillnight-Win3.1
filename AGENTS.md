# Instructions for Agents

This repository is currently undergoing a **fundamental refactor** to transition from a prototype to a scalable, data-driven architecture. Please adhere to the following guidelines when working on this codebase.

## 1. Project Context & Refactoring
*   **State**: The engine is moving from a monolithic structure to a modular, scene-based architecture.
*   **Goal**: Decouple logic from specific UI implementations. Move hardcoded data into JSON/JS files.
*   **Attitude**: Be "future-forward". When touching code, consider how it scales. If you see a hardcoded value, consider moving it to `data/`.

## 2. Testing Strategy
*   **Framework**: We use **Playwright** for all testing (unit and integration) to allow execution within the browser context.
*   **Philosophy**: Tests are **scaffolding**.
    *   Do not treat test files as immutable. If a class name changes or a method signature updates during refactoring, **update or discard the test**.
    *   **Focus on Logic**: Ensure the *math* (XP curves, Damage formulas) and *rules* (Turn order, Victory conditions) remain correct, even if the implementation details change.
*   **Technical Implementation**:
    *   To test internal classes (`Game_Battler`, `BattleManager`, etc.), the application exposes them to the global `window` object when the URL query parameter `?test=true` is present.
    *   **Always** navigate to `/?test=true` in your tests.
    *   **Always** wait for `window.dataManager` to be fully loaded (check `window.dataManager.actors`, etc.) before executing test logic.

## 3. Architecture Overview
*   **Managers**: `SceneManager`, `BattleManager`, `SoundManager` are generally static or singletons found in `managers.js`.
*   **Data**: Data is loaded asynchronously by `DataManager`. Do not assume data exists synchronously at startup.
*   **UI**: The UI is composed of `Window` classes (`windows.js`) managed by a `WindowManager`. Windows are DOM elements generated via JavaScript, not static HTML.

## 4. Coding Conventions
*   **Documentation**: All new classes and methods **must** have JSDoc comments.
*   **Async/Await**: Use modern async patterns over callbacks where possible, especially for data loading and scene transitions.
*   **Styles**: Append new styles to `style.css`.
