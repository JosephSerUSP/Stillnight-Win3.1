# Window Finetuning Guide

This guide details how to customize and finetune the positioning and layout of various windows in the game, with a focus on the battle UI.

## Overview

The game's UI is built using a custom window system located in `src/windows/`. Most windows inherit from `Window_Base` and use `UI.build` for constructing their internal DOM structure.

Positions are generally handled in two ways:
1.  **Window Placement:** Defined in the constructor of each window class (e.g., `super('center', 'center', width, height)`).
2.  **Internal Layout:** Defined within the `refresh` or render methods of the window, often using absolute positioning or flexbox.

## Battle Window (`Window_Battle`)

The Battle Window displays the combat interface, including enemy and party battlers.

### Repositioning Battlers

Battler positions are no longer hardcoded in `src/windows/battle.js`. They are now controlled by a configuration file: `src/windows/layout_config.js`.

To adjust battler positions, edit `src/windows/layout_config.js`:

```javascript
export const LayoutConfig = {
    battle: {
        enemy: {
            startX: 20,    // X coordinate for the first enemy
            startY: 30,    // Y coordinate for the first enemy
            spacingX: 220, // Horizontal spacing between enemies
            spacingY: 40,  // Vertical spacing between enemies
            columns: 2     // Number of columns before wrapping
        },
        party: {
            startX: 20,    // X coordinate for the first party member
            startY: 140,   // Y coordinate for the first party member
            spacingX: 220, // Horizontal spacing between party members
            spacingY: 40,  // Vertical spacing between party members
            columns: 2     // Number of columns before wrapping
        }
    }
    // ...
};
```

### Adjusting the Battle Window Size

To change the size or position of the main battle window itself, modify the constructor in `src/windows/battle.js`:

```javascript
// Change 528 (width) and 360 (height) to desired values
super('center', 'center', 528, 360, { title: "Battle – Stillnight" });
```

## Finetuning Other Windows

For other windows, you will typically need to modify their specific class files in `src/windows/`.

### General Window Positioning

Most windows use `Window_Base`'s constructor:
`super(x, y, width, height, options)`

*   **x, y:** Can be a number (pixels) or `'center'` to center on screen.
*   **width, height:** Dimensions in pixels. Use `'auto'` for height to fit content.

### Specific Window Examples

#### Inventory Window (`src/windows/inventory.js`)
*   **Size:** Controlled in `constructor`. Default: `400x300`.
*   **Layout:** Uses a flex column structure. To change the ratio of the list vs the tab bar, adjust the flex properties in the `structure` object in the constructor.

#### Formation Window (`src/windows/formation.js`)
*   **Size:** Default `300x480`.
*   **Grid Layout:** The member slots are arranged using CSS Grid (`display: grid`).
    *   To change columns: Modify `this.gridEl.style.gridTemplateColumns`.
    *   To change gap: Modify `this.gridEl.style.gap`.

#### Victory Window (`src/windows/battle.js`)
*   **Size:** Default `320x240`.
*   **Content:** Text is wrapped in a panel. You can adjust padding in the `structure` object.

## UI Builder (`src/windows/builder.js`)

The `UI` helper class abstracts DOM creation. When modifying layouts, you will often see objects like:

```javascript
{
    type: 'flex',
    props: { ... },
    children: [ ... ]
}
```

*   **type:** 'flex', 'panel', 'label', 'button', etc.
*   **props:** CSS classes, styles, and event listeners.
*   **children:** Nested elements.

Modify the `style` props in these structures to finetune padding, margins, alignment, and colors without needing global CSS changes.
