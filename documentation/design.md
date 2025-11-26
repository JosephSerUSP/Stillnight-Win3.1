# Master Design Document

## 1. High-Level Architectural Analysis

### Current State

The project is a JavaScript-based RPG with a data-driven design. The core game logic is separated from the game data, which is stored in JSON files in the `data/` directory. However, the UI logic is tightly coupled with the game logic, making the codebase difficult to maintain and scale.

### Bottlenecks in Scalability

The primary bottleneck in the current architecture is the tight coupling between the `Scene_Map` class and the DOM. The `Scene_Map` class is responsible for handling game logic, rendering the UI, and managing user input. This makes it difficult to add new features or modify existing ones without breaking the game.

## 2. UI Architecture

### Current State

The UI is composed of a set of "windows," which are modal dialogs that are used to display information to the player and to handle user input. The windows are implemented as classes in `windows.js`, but they do not share a common base class. This has led to a number of issues, including:

- **Inconsistent behavior:** The windows do not have a consistent way of being opened, closed, or refreshed.
- **Brittle implementation:** The windows are tightly coupled to the DOM, which makes them difficult to test and maintain.
- **Lack of scalability:** It is difficult to add new windows to the game without modifying the core game logic.

### Proposed Architecture

To address these issues, we will transition to a strict inheritance model for the UI. We will create a `Window_Base` class that will handle the common lifecycle methods for all windows. The `Window_Base` class will be responsible for:

- Initializing the window
- Opening and closing the window
- Refreshing the window's content

All other windows will inherit from the `Window_Base` class. This will ensure that all windows have a consistent behavior and that they can be easily added to the game without modifying the core game logic.

## 3. Separation of Concerns

To improve the scalability and maintainability of the codebase, we will adopt a strict separation of concerns between the following components:

- **Scenes:** Scenes are responsible for managing the game flow and state logic. For example, the `Scene_Map` class is responsible for managing the map exploration, while the `Scene_Battle` class is responsible for managing the battle system.
- **Windows:** Windows are responsible for handling the UI and user input. For example, the `Window_Shop` class is responsible for displaying the shop interface, while the `Window_Battle` class is responsible for displaying the battle interface.
- **Game_Objects:** Game objects are responsible for handling the data and game logic. For example, the `Game_Actor` class is responsible for managing the player's party, while the `Game_Map` class is responsible for managing the game map.
- **Sprites:** Sprites are responsible for handling the visual representation of game objects. For example, the `Sprite_Actor` class is responsible for displaying the player's party on the screen.

## 4. Coupling and Hardcoding

### Coupling

The UI logic is tightly coupled with the gameplay data. For example, the `Scene_Map` class is responsible for both managing the game map and for rendering the map to the screen. This makes it difficult to change the way the map is rendered without also changing the way the map is managed.

### Hardcoding

There is a significant amount of hardcoded data in the codebase. For example, the `Scene_Map` class contains hardcoded logic for generating the game map. This makes it difficult to create new maps without modifying the core game logic.

## 5. Scalability

The current architecture is not scalable. It is difficult to add new features or to modify existing ones without breaking the game. To improve the scalability of the codebase, we will:

- **Decouple the UI logic from the game logic:** This will make it easier to change the way the game is rendered without also changing the way the game is played.
- **Extract the hardcoded data to JSON files:** This will make it easier to create new content for the game without modifying the core game logic.
- **Adopt a strict separation of concerns:** This will make it easier to add new features to the game without breaking existing ones.
