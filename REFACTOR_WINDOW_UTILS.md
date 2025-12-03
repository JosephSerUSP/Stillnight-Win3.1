# Refactoring Plan: Window System Utilities

## 1. Assessment
The current architecture relies heavily on importing utility functions into individual window files to perform basic UI tasks. For example, developers must import `elementToIconId` (a low-level data converter) and `createIcon` (a UI generator) separately.

**Issues with the current approach:**
*   **Import Clutter**: Window files are cluttered with imports for basic UI primitives (`createIcon`, `createLabel`, `renderElements`).
*   **Abstraction Leakage**: Low-level helpers like `elementToIconId` are exposed to the UI layer, requiring developers to manually handle data conversion before rendering.
*   **Boilerplate**: Repetitive code for creating and appending standard elements.
*   **Unused Imports**: As noted with `elementToIconId`, developers often import helpers they *think* they need, but then use a higher-level wrapper or abandon the logic, leaving unused references.

## 2. Recommendation
We should move commonly used UI construction functions directly into `Window_Base`. This turns `Window_Base` into a more comprehensive UI framework, allowing child windows to access these tools via `this.` context without explicit imports.

Low-level data converters (like `elementToIconId`) should be encapsulated within these new `Window_Base` methods where possible, removing the need for child windows to import them directly.

## 3. Functions to Integrate
The following functions should be integrated into `Window_Base`. They will likely wrap the functional components from `src/windows/components.js`.

| Original Function (utils.js/core) | New Method on `Window_Base` | Role |
| :--- | :--- | :--- |
| `createIcon(iconId)` | `this.createIcon(iconId, parent?)` | Basic Icon rendering. |
| `createGauge(options)` | `this.createGauge(options, parent?)` | HP/XP Bars. |
| `createToggleSwitch(...)` | `this.createToggleSwitch(...)` | Settings UI. |
| `renderElements(elements)` | `this.drawElementIcons(elements, parent?)` | Renders a list/grid of elemental icons. Encapsulates `elementToIconId`. |
| `createInteractiveLabel(data, type)` | `this.drawInteractiveItem(data, parent?)` | Renders clickable items/skills with tooltips. |

### Similar Functions identified for migration
*   **`elementToIconId`**: Should remain in `src/core/utils.js` but be used *internally* by `this.drawElementIcons`. Child windows should rarely need to call this directly.
*   **`getIconStyle`**: Implementation detail of `Component_Icon`. Should not be exposed.
*   **`createBattlerNameLabel`**: A candidate for `this.drawBattlerName(battler, parent?)`.
*   **`evaluateFormula`**: Should **not** be moved. It is core game logic, not UI.

## 4. Refactoring Plan

### Phase 1: Extend Window_Base
Modify `src/windows/base.js` to import the necessary components from `src/windows/components.js` and `src/core/utils.js` (for internal use).

```javascript
// src/windows/base.js
import { Component_Icon, Component_Gauge, Component_ElementIcon } from "./components.js";

export class Window_Base {
    // ... existing code ...

    /**
     * Creates and appends an icon.
     */
    createIcon(iconId, options = {}) {
        return Component_Icon(options.parent || this.content, { iconId, ...options });
    }

    /**
     * Draws elemental icons, handling conversion internally.
     */
    drawElementIcons(elements, options = {}) {
        return Component_ElementIcon(options.parent || this.content, { elements, ...options });
    }

    // ... other methods
}
```

### Phase 2: Update Child Windows
Iterate through existing windows (e.g., `Window_Inspect`, `Window_Shop`) and replace imports with method calls.

**Before:**
```javascript
import { createIcon, elementToIconId } from './utils.js';
// ...
const iconId = elementToIconId(this.data.element);
createIcon(iconId, { className: 'my-icon' });
```

**After:**
```javascript
// No imports needed
this.drawElementIcons([this.data.element]);
// or
this.createIcon(this.data.iconId);
```

### Phase 3: Cleanup
1.  Remove now-redundant wrappers from `src/windows/utils.js` (or keep them as backward-compatible aliases marked `@deprecated`).
2.  Remove unused imports from all window files.

## 5. Conclusion
This refactor streamlines the codebase by centralizing UI logic within the base class, reducing the cognitive load on developers and preventing "unused import" errors by hiding low-level implementation details.
