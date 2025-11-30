# Analysis and Refactoring Plan

## 1. Window System Assessment

### Current State
The current window system in `windows.js` is a DOM-based implementation inspired by the Windows 3.1 aesthetic.
*   **Architecture**: Windows are `div` elements managed by a `WindowManager`.
*   **Base Class**: `Window_Base` provides a standard frame (Header, Content, Footer) and drag-and-drop capability.
*   **Content Generation**: Subclasses (e.g., `Window_Inventory`, `Window_Shop`) manually construct their DOM content using `document.createElement`.
*   **Interaction**: Primarily mouse-driven (click handlers on buttons). Keyboard navigation is minimal (Escape to close).

### Comparison to RPG Maker MZ
RPG Maker MZ uses a Canvas/WebGL (PixiJS) based system, which offers distinct differences:

| Feature | RPG Maker MZ | Stillnight (Current) |
| :--- | :--- | :--- |
| **Rendering** | Canvas (PixiJS). High performance, pixel-perfect control. | DOM. Easier to style with CSS, accessible, but heavier DOM manipulation. |
| **Selection** | `Window_Selectable` class manages cursor, scrolling, and keyboard input (arrows/OK/Cancel) generically. | Manual button rows. No unified cursor system. `Window_Inventory` manually implements tab switching and list rendering. |
| **Layout** | `Window_Base` handles padding and "window skin" scaling. Content is drawn relative to a content rect. | Layout is CSS-driven (`flex`, `grid`). Layout logic is hardcoded in each window's constructor. |
| **Command** | `Window_Command` allows creating menus by simply providing a list of `{ name, symbol, callback }`. | No generic command window. Menus are manually built buttons. |

### Areas for Improvement
1.  **Generic Selection Logic (`Window_Selectable`)**:
    *   Implement a base class that handles rendering a list of items and managing the "active" index via keyboard (Arrow Keys).
    *   This would replace the manual loop in `Window_Inventory`, `Window_Shop`, and `Window_Formation`.
2.  **Data-Driven Command Windows**:
    *   Create a `Window_Command` that accepts a configuration object to generate menus. This reduces boilerplate code (e.g., `Window_Options` is close, but could be more generic).
3.  **Decoupled Layouts**:
    *   Move layout definitions (width, height, element positions) out of the constructor and into a configuration or static getter, allowing easier theming and adjustment.
4.  **Input Standardization**:
    *   The `WindowManager` currently only handles `Escape`. It should delegate directional input and "OK/Cancel" commands to the active window, enabling keyboard-only play.

## 2. Map Grid Misalignment Investigation

### Issue Description
The user reported that "all tiles are +3x and +21y from where they should be".

### Findings
The offsets correspond directly to the standard structural elements of the UI "windows" used in the game:
*   **+21y Offset**: Corresponds to the **Window Header** (~20px height) plus border/padding.
*   **+3x Offset**: Corresponds to the **Window Border** (~2px) plus internal padding or box-shadow (1px).

In `Window_HUD`, the `exploration-grid` is contained within:
1.  `.card-main` (a `.panel` with 2px border).
2.  A `.card-header` (approx 20px height).
3.  `.exploration-frame` (a `.panel` with 2px border + 4px padding).

**Conclusion**: The "misalignment" is not a bug in the grid rendering logic itself (which is a standard CSS Grid), but rather a **structural offset** caused by the UI container mimicking a window.
*   If the coordinate system (e.g., for mouse clicks or animations) assumes the grid starts at the top-left `(0,0)` of the *container*, it will be visually "off" by the header and border thickness.
*   However, since `onTileClick` uses the DOM element itself (`e.currentTarget`), interaction remains accurate. The "misalignment" is likely relevant if:
    *   External automated tests assume pixel coordinates relative to the window.
    *   Animations use absolute positioning relative to the container without accounting for the header.
    *   The user desires the grid to be flush with the container edges (removing the "window" look).

## 3. Refactoring Roadmap

### Phase 1: Grid & Layout Correction
1.  **Standardize Grid Container**: Ensure the `exploration-grid` container explicitly handles the header offset if absolute positioning is used.
2.  **CSS Variable Usage**: Define `--window-header-height` (20px) and `--window-border-width` (2px) in CSS and use them in calculations to avoid "magic number" offsets.

### Phase 2: Window System Core
1.  **Implement `Window_Selectable`**:
    *   Properties: `index`, `maxItems`, `cols`.
    *   Methods: `select(index)`, `cursorDown()`, `cursorUp()`, `processOk()`.
    *   Visuals: Render a "cursor" or highlight class on the active item.
2.  **Refactor Inventory/Shop**:
    *   Update `Window_Inventory` and `Window_Shop` to inherit from `Window_Selectable`.
    *   Replace manual button clicks with `processOk` handling.

### Phase 3: Input Manager
1.  **Centralize Input**: Update `WindowManager.handleInput` to pass directional events to the `topWindow` if it is a `Window_Selectable`.
