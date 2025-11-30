# Window System Analysis & Refactor Strategy

## 1. Assessment of Current Window System

### Current Architecture
The current system uses a DOM-based approach (`Window_Base` in `windows.js`) where windows are `div` elements with CSS styling to simulate a retro interface.
*   **Rendering**: HTML/CSS (DOM).
*   **Layout**: Flexbox and Grid.
*   **Styling**: CSS classes (`.window-frame`, `.panel`, `.win-window`) with CSS variables for theming.
*   **Input**: Global `WindowManager` handles stack-based input (Escape key), while individual windows attach click listeners to buttons/elements.

### Comparison with RPG Maker MZ (RMMZ)
RMMZ uses a Canvas/WebGL-based system (PIXI.js).
*   **Window Skin**: RMMZ uses a "Window Skin" image (9-slice scaling) to define borders, backgrounds, and selection cursors. The current system relies on CSS borders, which limits the ability to achieve a true "pixel-perfect" retro bezel or custom texture without complex CSS `border-image` rules.
*   **Cursor System**: RMMZ has a unified "cursor" (a flashing rectangle) that moves between selectable items. The current system relies on hover states (`:hover`) and individual buttons (`.win-btn`). This makes keyboard navigation (gamepad/arrow keys) difficult to implement consistently.
*   **Content Separation**: In RMMZ, `Window_Base` handles the "chrome" (frame, padding), and content is drawn to a separate layer. The current `Window_HUD` mixes "Window" logic with "Page Layout" logic, manually building the entire `#game-container` structure.
*   **Text Rendering**: RMMZ draws text to a bitmap, allowing for complex per-character animations and typewriter effects. The current system uses DOM text, which is accessible but harder to animate precisely (though `Scene_Battle` implements a workaround).

### Areas for Improvement
1.  **Decoupling Layout from Logic**: `Window_HUD` currently hardcodes the entire game screen layout. This should be data-driven or handled by a dedicated `Scene_Layout` manager, allowing windows to be independent widgets.
2.  **Unified Cursor/Selection**: Implement a standard `Window_Selectable` class (like RMMZ) that manages an index, handles arrow key input, and renders a cursor. This is superior to ad-hoc button listeners for scalability.
3.  **Visual "Skinning"**: Move away from complex CSS border hacks (box-shadows for bezels) to a 9-slice image system (using CSS `border-image` or a grid of divs) to allow for easier theming and a more authentic retro look.
4.  **Event/UI Separation**: `Game_Interpreter` currently pushes windows directly. In a cleaner architecture, the Interpreter should issue "requests" (e.g., `requestChoice`), and the active Scene should decide *how* to display that (in a window, a bubble, etc.).

## 2. Map Grid Misalignment Investigation

**Issue**: "All tiles are +3x and +21y from where they should be."

**Findings**:
The offset corresponds almost exactly to the standard "Window Chrome" dimensions defined in the CSS and `Window_Base` logic, even though the Map is rendered in `Window_HUD` (which is a custom layout).

*   **Y Offset (+21y)**: This matches the standard Window Header height.
    *   CSS `.window-header` height is **20px**.
    *   CSS `.panel` (which surrounds the grid in `Window_HUD`) has a **2px** border.
    *   **20px (Header) + ~1px (Border/Padding)** accounts for the ~21px visual shift if the user expects coordinates to start at the top of the container.
    *   In `Window_HUD`, the `exploration-frame` is placed inside `cardMain`. `cardMain` contains a `card-header` element (height ~20px) *before* the `exploration-frame`. This pushes the grid down by ~21px relative to the `cardMain` container.

*   **X Offset (+3x)**: This matches the container's border and padding.
    *   CSS `.panel` has `border: 2px solid`.
    *   CSS `.window-content` (or generic padding) is often **4px**, but `exploration-frame` specifically has `padding: 4px`.
    *   If the user expects the grid to be at (0,0) of the `cardMain` container:
        *   `cardMain` (Panel) Border: **2px**
        *   `cardMain` Padding: **4px**
        *   `exploration-frame` (Panel) Border: **2px**
        *   `exploration-frame` Padding: **4px**
        *   Total X offset is closer to **12px**.
    *   **However**, if the "3x" refers to the *visual border width* itself: The `.win-window` and `.panel` classes use `box-shadow` to simulate a 3D bezel.
        *   `border: 2px solid`
        *   `box-shadow: ... 0 0 0 3px ...`
        *   This creates a visual bezel of **3px**. If coordinate calculations assume a 0px border, the content will appear shifted by 3px.

**Conclusion**: The "misalignment" is due to the DOM nesting in `Window_HUD`. The map grid is content *flowing* inside a flex container (`cardMain`) that has a header and borders. Unlike an absolute-positioned canvas (common in RMMZ), the DOM elements adhere to the document flow, pushing the grid down and right by the size of headers, borders, and padding.

**Recommendation**:
If "pixel-perfect" absolute positioning is required:
1.  Remove `padding` from `exploration-frame`.
2.  Set `exploration-grid` to `position: absolute` within a `position: relative` container.
3.  Explicitly account for the Header height (21px) and Border (2-3px) in any mouse-to-grid coordinate math, OR remove the Header/Borders from the map container entirely.

## 3. Refactoring Roadmap

1.  **Standardize `Window_Selectable`**:
    *   Create a class extending `Window_Base` that handles an `index` and `cursor`.
    *   Refactor `Window_Inventory`, `Window_Shop`, and `Window_Formation` to inherit from this.

2.  **Abstract the HUD**:
    *   Break `Window_HUD` into smaller, independent windows (`Window_Map`, `Window_Status`, `Window_Log`) managed by the `Scene_Map`, rather than one monolithic manager building the DOM.

3.  **Fix Map Coordinate System**:
    *   Switch `.exploration-grid` to use a strict coordinate system (removing `gap` if necessary for easier math, or keeping it and updating the math).
    *   Ensure the container (`exploration-frame`) has no unexpected padding/margins.

4.  **Implement 9-Slice Window Skin**:
    *   Replace CSS borders with a JS function that generates a 3x3 grid of divs using `assets/system/window.png` (or similar) as background images. This aligns the visual style with the "Retro" goal and RMMZ standards.
