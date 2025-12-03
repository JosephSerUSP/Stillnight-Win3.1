# Deep Dive: Technical Architecture

This document provides a detailed, technical breakdown of the Stillnight Engine's software architecture.

---

## 1. Scene Manager (`SceneManager`)

The `SceneManager` is the backbone of the engine, controlling the game's flow and state. It operates as a stack-based finite state machine.

**Core Concepts:**
*   **Scene Stack:** The `_stack` property is an array of `Scene` objects. The scene at the top of the stack (`this._stack[this._stack.length - 1]`) is the currently active scene.
*   **`update()` Loop:** The `SceneManager` has a main `update()` method that is called by the `requestAnimationFrame` loop in `main.js`. This method calls the `update()` method of the active scene.

**State Transitions:**
*   `push(scene)`: Adds a new scene to the top of the stack (e.g., pushing `Scene_Battle` onto `Scene_Map`). This pauses the previous scene.
*   `pop()`: Removes the top scene from the stack, resuming the scene below it (e.g., returning to `Scene_Map` after a battle).
*   `goto(scene)`: Clears the entire stack and replaces it with a new scene (e.g., going to `Scene_Gameover`).

---

## 2. Data Flow (`DataManager`)

The `DataManager` is a static class responsible for loading all game data from the `/data` directory into memory at startup. This ensures that game data is globally accessible and efficiently managed.

**Process:**
1.  **Boot Sequence:** During the `Scene_Boot`, the `DataManager.loadDatabase()` method is called.
2.  **Asynchronous Loading:** It uses `fetch` to asynchronously load all `.json` and `.js` files from the `data` directory.
3.  **Global Variables:** The loaded data is stored in global variables (e.g., `$dataActors`, `$dataSkills`).
4.  **Access:** Game objects (like `Game_Actor`) and scenes access this data through these global variables. For example, `new Game_Actor($dataActors[1])` creates a new actor object using the data for actor ID 1.

This one-time load prevents file I/O during gameplay, ensuring smooth performance.

---

## 3. Window Rendering Lifecycle (`Window_Base`)

All UI elements are `Window` objects that inherit from `Window_Base`. This base class manages the window's lifecycle and rendering.

**Key Methods:**
1.  **`initialize(rect)`:** The constructor takes a `Rectangle` object defining its position and size. It creates the necessary DOM elements (`div` for the window frame, `div` for the content).
2.  **`refresh()`:** This is the core drawing method. It clears the window's content and calls other `draw` methods to render the UI. This method should be called whenever the data displayed in the window changes.
3.  **`drawText(text, x, y, maxWidth, align)`:** A utility method for drawing text within the window. It handles text alignment and formatting.
4.  **`update()`:** Called by the active scene's `update` loop. This is where the window can handle input and animations (e.g., a blinking cursor).
5.  **`open()` / `close()`:** These methods control the window's visibility and open/close animations.

---

## 4. Battle Manager (`BattleManager`)

The `BattleManager` is a static class that orchestrates the turn-based combat.

**Event Loop:**
1.  **`startBattle()`:** Called by `Scene_Map` when an encounter occurs. It sets up the troop, party, and the initial battle state.
2.  **`startTurn()`:** At the beginning of each turn, it determines the action order for all combatants based on their `agility`.
3.  **`processTurn()`:** This is the core of the event loop. It takes the next actor from the action order and either gets their input (if player-controlled) or determines their action (if AI-controlled).
4.  **`invokeAction(subject, target)`:** Executes the chosen action. It calculates the damage, applies effects, and queues the appropriate animation.
5.  **`endTurn()`:** After all actors have acted, this method checks for win/loss conditions. If the battle is ongoing, it calls `startTurn()` to begin the next turn.
6.  **`checkBattleEnd()`:** At the end of an action, this checks if all enemies or all party members are defeated. If so, it sets the stage for the battle to end and for control to be returned to `Scene_Map`.
