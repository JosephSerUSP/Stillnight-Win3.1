# Icon Refactor

## Analysis

The game's current icon rendering implementation presents several opportunities for improvement regarding code structure and maintainability:

1.  **Code Duplication**: The logic for setting `backgroundPosition` based on icon ID is repeated across multiple functions in `windows.js` (`createBattlerNameLabel`, `createElementIcon`, `createInteractiveLabel`) and duplicated again in `Scene_Map` within `scenes.js`.
2.  **Hardcoded Values**: The dependency on a specific 12x12 grid layout is implicit in `getIconStyle` (in `core.js`) and scattered across the codebase.
3.  **Shadowing and Inconsistency**: `Scene_Map` defines its own `createElementIcon` and `renderElements` methods, shadowing the utilities imported from `windows.js`. This violates the DRY (Don't Repeat Yourself) principle and risks inconsistent behavior.
4.  **Styling rigidity**: Adding visual effects (like the requested drop shadow) currently requires modifying multiple call sites or relying on broad CSS selectors.

## Plan

To address these issues and implement the requested feature, the following steps will be taken:

### 1. Centralize Icon Creation
A new helper function, `createIcon(iconId, options)`, will be added to `windows.js`. This function will serve as the single source of truth for generating icon DOM elements, encapsulating class assignment and background position logic.

### 2. Implement Dynamic Drop Shadow
The drop shadow effect will be implemented using the CSS `filter` property. This approach allows for a shadow that respects the alpha channel of the icon sprite, meeting the requirement to "draw the shadow as the same icon sprite... with its color changed".

**CSS Implementation**:
```css
.icon, .element-icon {
    /* ... existing styles ... */
    filter: drop-shadow(2px 2px 0px #4B4B4B);
}
```

### 3. Refactor Codebase
-   **`windows.js`**: `createBattlerNameLabel`, `createElementIcon`, and `createInteractiveLabel` will be refactored to use the new `createIcon` helper.
-   **`scenes.js`**: The redundant `createElementIcon` and `renderElements` methods in `Scene_Map` will be removed. Calls to these methods (e.g., in `formatSkillName`, `openRecruitEvent`, `openInspect`) will be updated to use the centralized functions imported from `windows.js`.

This refactor will result in a cleaner, more maintainable codebase where icon rendering logic is defined in one place and visual consistency is enforced via CSS.
