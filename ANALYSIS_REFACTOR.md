# Window System Analysis & Refactor Proposal

## Overview
This document assesses the current DOM-based window system in `Stillnight` and compares it to the Canvas-based system found in RPG Maker MZ. The goal is to identify architectural improvements while maintaining the project's unique "Windows 3.1" aesthetic and DOM-based accessibility.

## Comparison: Stillnight (DOM) vs. RPG Maker MZ (Canvas)

### 1. Rendering Architecture
*   **RPG Maker MZ**: Uses a `WindowLayer` (PIXI container) that manages multiple `Window` objects. Each window renders its frame (skin) and content (bitmap) onto a canvas. This allows for pixel-perfect scaling (9-slice) and high-performance scrolling of large lists, but makes text rendering and layout management (wrapping, alignment) complex and manual.
*   **Stillnight**: Uses standard HTML DOM elements (`div`, `span`, `flexbox`).
    *   **Pros**: Superior text rendering (crisp at any scale), native scrolling (`overflow: auto`), easy layout management via CSS (Flex/Grid), and accessibility.
    *   **Cons**: Heavier DOM manipulation can cause reflows if not batched. Visual effects (like window opening animations or per-pixel transitions) are harder to coordinate than on a single canvas.

### 2. Class Hierarchy
*   **RPG Maker MZ**:
    *   `Window_Base`: Handles skin, padding, tone.
    *   `Window_Selectable`: Handles cursor movement, scrolling, and input processing.
    *   `Window_Command`: specialized Selectable for text commands.
    *   **Strict Inheritance**: All windows inherit from these bases.
*   **Stillnight**:
    *   `Window_Base`: Provides the frame, header, and footer structure.
    *   `Window_HUD`: **Anomaly**. It is a manager class that manipulates the static `#game-container` rather than being a true `Window` instance.
    *   `Window_Selectable`: Partially implemented/implied via `Window_Inventory` logic but not fully standardized.

### 3. Interaction Model
*   **RPG Maker MZ**: Uses a virtual "Cursor" object (a blinking rectangle) that moves between indices. Input (Arrow keys) directly manipulates this index.
*   **Stillnight**: Relies on a mix of CSS `:hover` states and JavaScript selection (e.g., in `Window_Formation` and `Window_Inventory`).
    *   **Gap**: The lack of a unified "Cursor" state means keyboard navigation requires re-implementing selection logic for each specific window type.

## Areas for Improvement

### 1. Unification of Window_HUD
The `Window_HUD` currently manually constructs the game container. It should be refactored to either:
*   Inherit from `Window_Base` (representing the "Desktop" or "Main Window").
*   Use `Window_Base` components for its sub-panels (Party Panel, Log Panel) to ensure they share the same styling, drag, and closure logic (if applicable) as popup windows.

### 2. Event Delegation for Lists
Currently, `Window_Inventory` and `Window_Shop` attach individual `click` listeners to every item row.
*   **Improvement**: Adopt the **Event Delegation** pattern. Attach a single listener to the list container (`this.listEl`) and intercept events using `e.target.closest('[data-index]')`.
*   **Benefit**: Reduces memory usage and DOM complexity, especially as inventory grows. Matches MZ's approach where the Window handles the input for the entire content area.

### 3. Standardized `Window_Selectable`
Create a robust `Window_Selectable` class (extending `Window_Base`) that:
*   Maintains an `_index` (cursor position).
*   Handles `ArrowUp` / `ArrowDown` to change the index.
*   Updates a visual `.selected` CSS class on the corresponding DOM element.
*   Ensures the selected element is scrolled into view (`element.scrollIntoView()`).
*   **Usage**: `Window_Inventory`, `Window_Shop`, and `Window_Formation` should all inherit from this to provide uniform keyboard/mouse navigation.

### 4. Generic `Window_Command`
Currently, buttons are added manually via `addButton`.
*   **Improvement**: Create a `Window_Command` class that accepts a list of `{ name: string, callback: function }` objects.
*   **Benefit**: Simplifies the creation of menus (Settings, Title Screen, Choice Dialogs) and decouples the layout from the logic.

### 5. Decoupling Logic from View
Some windows (e.g., `Window_Inspect`) contain logic buttons like "Sacrifice" or "Evolve".
*   **Refactor**: Windows should be strictly "View" components. They should expose events (or accept callbacks) for actions, but the *decision* to show a button (e.g., "Can this unit evolve?") should be determined by the Scene before passing data to the Window.
*   **Goal**: `Window.setup(data, callbacks)` pattern.

### 6. CSS Architecture for Layout
The `style.css` contains hardcoded grid sizes (e.g., `.exploration-grid` width).
*   **Improvement**: Move dynamic dimensions to CSS variables (set by JS) or fully calculate them in JS (`Window_HUD`). This prevents desync between `Game_Map` logic (grid size) and CSS presentation.

## Plan Summary
1.  **Refactor `Window_HUD`** components to use `Window_Base` structure where appropriate.
2.  **Implement `Window_Selectable`** with event delegation and keyboard support.
3.  **Refactor Lists** (Inventory/Shop) to use `Window_Selectable`.
4.  **Externalize Grid Dimensions**: Inject CSS variables for map width/height based on `Game_Map` constants.
