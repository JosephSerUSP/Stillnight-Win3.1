# Game Action Implementation

## Overview
This document outlines the implementation of the `Game_Action` class.

> **Architecture Note**: Currently, this class is primarily used for **Item Usage outside of combat** (in `Scene_Map` via the Menu). The `BattleSystem` uses a parallel execution pipeline (`BattleSystem.executeAction`) that delegates directly to `EffectSystem` and `ProgressionSystem`.

## Design Choices

### 1. Encapsulation of Execution Logic (Map Context)
For non-combat interactions (like using a Potion from the inventory menu), the execution logic is encapsulated in `Game_Action` and the `EffectSystem`.
*   **Reasoning**: This adheres to object-oriented principles, grouping behavior (execution) with data (the action definition), while delegating pure state changes to the `EffectSystem`.

### 2. Properties
`Game_Action` implements standard action properties:
*   `speed`: Calculated getter (Legacy use for `BattleSystem` mocks).
*   `ele` (Element): Handled internally during execution.

### 3. Unified Element Multiplier Logic
The elemental damage multiplier logic resides in `Game_Action`.
*   **Note**: `BattleSystem` implements its own version of this logic in `_elementMultiplier` and `_executeSkill`.

### 4. Target Selection
Target selection logic (`makeTargets`) is part of `Game_Action`.

## Usage (Scene_Map / Menu)

The `Window_ItemList` or `Scene_Map` instantiates `Game_Action` objects to use items.

```javascript
const action = new Game_Action(subject);
action.setItem(item, dataManager);
```

Execution is triggered via:
```javascript
const events = action.apply(target, dataManager);
```

Internally, `apply` delegates specific effects (like `damage`, `heal`, `add_status`) to the `EffectSystem`:

```javascript
// Inside Game_Action._applyItem
EffectSystem.apply(effectKey, effectValue, battler, target, context);
```

## Usage (BattleSystem - Parallel Pipeline)

The `BattleSystem` **does not** use `Game_Action.apply`. Instead, it uses a functional approach:

```javascript
// src/engine/systems/battle.js
executeAction(state, action) {
    // ...
    if (action.skillId) {
         this._executeSkill(state, action, events);
    }
    // ...
}
```

This separation is a known area of technical debt (Duplicate Logic), but ensures that Battle logic remains pure and detached from legacy object instantiation.
