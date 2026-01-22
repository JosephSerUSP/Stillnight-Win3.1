# Game Action Implementation

## Overview
This document outlines the implementation of the `Game_Action` class, which serves as a wrapper for battle actions (Skills, Attacks, and Items) primarily for **UI-initiated actions** (like using an item from the menu) and legacy support.

**Important Note**: The core `BattleSystem` (used in `Scene_Battle`) has its own internal execution pipeline and **does not** use `Game_Action` for the main combat loop. `Game_Action` is currently maintained for:
1.  Item usage from `Scene_Map` or `Scene_Battle` inventory menus.
2.  Providing a consistent API for action properties where needed outside the pure battle system.

## Design Choices

### 1. Encapsulation of Execution Logic
The execution logic for battle actions is shared between `Game_Action` and `BattleSystem`, both delegating pure state changes to the `EffectSystem`.
*   **Reasoning**: This adheres to object-oriented principles, grouping behavior (execution) with data (the action definition), while delegating pure state changes to the `EffectSystem`.
*   **Benefit**: `BattleSystem` focuses on flow control (turn order, win/loss), while `Game_Action` handles the "how" of an action for single-use contexts.

### 2. Properties
`Game_Action` implements the properties defined in `gameDesign.md`:
*   `speed`: Calculated getter, combining the subject's speed (`asp`) and the item/skill's speed modifier.
*   `ele` (Element): Handled internally during execution. For skills, the element is retrieved from the skill data. For attacks, it uses the battler's innate elements.

### 3. Unified Element Multiplier Logic
The elemental damage multiplier logic resides in `Game_Action` (for Attacks) or is handled implicitly during `EffectSystem` resolution (for Skills).

### 4. Target Selection
Target selection logic (`makeTargets`) is part of `Game_Action`.
*   **Reasoning**: The scope of an action (Self, Enemy, Ally) is intrinsic to the action itself.

## Usage (UI / Legacy)

The `Game_Action` class is instantiated when a player selects an action from a menu (e.g., using a Potion).

```javascript
// Example: Using an item from the inventory
const action = new Game_Action(partyMember);
action.setItem(itemId, dataManager);
```

Execution is triggered via:
```javascript
const events = action.apply(target, dataManager);
```

Internally, `apply` delegates specific effects (like `damage`, `heal`, `add_status`) to the `EffectSystem`:

```javascript
// Inside Game_Action._applySkill
EffectSystem.apply(effectKey, effectValue, battler, target, context);
```
