# CSS Architecture Refactor: Generalist & Data-Driven

## Assessment of Proposed Architecture

The goal is to transition from "Specialist" CSS classes (e.g., `.hp-bar`, `.xp-bar`) to "Generalist" CSS classes (e.g., `.gauge`) combined with data-driven customization via JavaScript.

### Verdict: **Worth Implementing**

### Structural Improvements & Principles

1.  **Logic-Driven Appearance**:
    - **Principle**: Behavior and appearance (gauge height, color, animation type) must be handled in JavaScript, not CSS.
    - **No Redundancy**: CSS should strictly handle structural layout (positioning, borders, overflow). We must avoid defining default colors or heights in CSS if they are also managed/overridden by JS. CSS classes should be "empty shells" configured by the application logic.

2.  **Standard Defaults**:
    - JavaScript components (e.g., `createGauge`) must guarantee robust standard defaults.
    - Callers should only specify overrides (e.g., "This specific gauge is green") rather than defining the entire style.

3.  **Scalability**:
    - Adding new mechanics (e.g., MP, Hunger) requires only JS configuration, not new CSS classes.

4.  **Consistency**:
    - Ensures all UI elements share the same fundamental building blocks, enforcing a unified visual language controlled by the engine.

---

## Candidates for Generalization

The following elements in `style.css` are currently overly specific and should be refactored:

### 1. Gauges
*   **Structure**: `.gauge` (CSS: border, overflow, layout).
*   **Appearance**: Color, Height, Fill %.
*   **Control**: `createGauge(options)` in JS. Defaults (e.g., height=6px, color=Green) are defined in the function parameters, not CSS.

### 2. Title Bars
*   **Structure**: `.window-header` (CSS: flex layout, padding).
*   **Appearance**: Background gradients, text colors.
*   **Control**: `Window_Base` logic determines the active/inactive state and applies styles accordingly.

### 3. Grid/List Items
*   **Structure**: `.list-item` (CSS: padding, cursor).
*   **Appearance**: Selection highlight colors, hover effects.
*   **Control**: JS handles selection state and applies generic utility classes or inline styles for specific status indications.

---

## Refactor Plan

### Phase 1: The Gauge System (Completed)

1.  **Update `style.css`**:
    - Defined `.gauge` and `.gauge-fill`.
    - Removed `.hp-bar`, `.hp-fill`, and all `.night-theme` overrides to scrap the legacy theming implementation.
2.  **Update `windows.js`**:
    - Implemented `createGauge(options)` with standard defaults (Height: 6px, Color: #00a000).
    - Refactored `Window_HUD` to use `createGauge`, moving the specific "HP Color" definition to the call site.

### Phase 2: Title Bars & Windows

1.  **Update `style.css`**:
    - Merge `.title-bar` and `.dialog-titlebar` into generic `.window-header`.
2.  **Update `Window_Base`**:
    - Update `constructor` to generate headers using the new class.
    - Ensure defaults (e.g., Active Window Blue) are applied via JS or standard utility classes, removing hardcoded gradients from CSS if possible (or keeping them as the standard "skin" while allowing overrides).

### Phase 3: Text Utility Classes

1.  **Update `style.css`**:
    - Create generic color classes or usage of CSS variables for text colors (e.g., `.text-danger`, `.text-highlight`).
2.  **Update JS**:
    - Replace semantic usage (e.g., `.tile-enemy`) with functional usage (e.g., `.text-danger`) in map generation and log outputs.

### Phase 4: Theme Functionality

1.  **Goal**: Re-implement theming (e.g., Night Mode) in a modular, data-driven way.
2.  **Strategy**:
    - Once UI components are fully controlled by JS, introduce a `ThemeManager` or configuration object.
    - UI components (`createGauge`, `Window_Base`) will query the active theme to determine their default colors/styles at runtime.
    - This allows for dynamic theme switching where the engine repaints or updates styles based on the current data, rather than relying on global CSS class cascades (`.night-theme .element`).
