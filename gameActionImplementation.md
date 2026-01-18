# Game Action Implementation

## Overview
This document outlines the implementation of the `Game_Action` class. Originally designed as the core "Effect Object" wrapper for all actions, it now primarily serves **Map and Menu item usage** (e.g., using a Potion from the inventory screen).

**Note:** The `BattleSystem` utilizes an internal, optimized pipeline (`BattleSystem._executeSkill`, etc.) and does **not** use `Game_Action` instances for combat resolution.

## Design Choices

### 1. Scope & Usage
`Game_Action` encapsulates the logic for using Items and Skills outside of the main combat loop.
*   **Menu Usage**: When a player selects "Use" on an item in the inventory, a `Game_Action` is instantiated to apply the effects.
*   **Battle Divergence**: For architectural and performance reasons, `BattleSystem` manages its own action execution logic directly using `EffectSystem`, bypassing `Game_Action`.

### 2. Properties
`Game_Action` implements standard properties for action resolution:
*   `speed`: Calculated getter (legacy support for turn order simulation).
*   `ele` (Element): Handled internally during execution.

### 3. Unified Element Multiplier Logic
Like the Battle System, `Game_Action` respects elemental affinities.
*   **Logic**: Checks against the target's element table to apply standard multipliers (1.5x for Weakness, 0.75x for Resistance) and "Same Element Bonus" for the user.

### 4. Target Selection
Target selection logic (`makeTargets`) is available to determine valid targets (Self, Ally, Enemy) based on the item/skill scope.

## Usage

### Map/Menu Context
The UI or `Scene_Map` instantiates `Game_Action` to apply an item:

```javascript
const action = new Game_Action(party);
action.setItem(itemData, dataManager);
const events = action.apply(target, dataManager);
// Process events (e.g., show healing animation)
```

### Internal Flow
Internally, `apply` delegates specific effects (like `damage`, `heal`, `add_status`) to the `EffectSystem`:

```javascript
// Inside Game_Action._applyItem
EffectSystem.apply(effectKey, effectValue, battler, target, context);
```
