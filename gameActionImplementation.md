# Game Action Implementation

> **DEPRECATED / PARTIAL DOCUMENTATION**
>
> **Note:** The `Game_Action` class is **no longer used** by the `BattleSystem` for combat execution. The Battle System uses its own internal execution pipeline (`BattleSystem.executeAction`) and plain data objects.
>
> `Game_Action` is currently retained primarily for **Item Usage in Exploration (Scene_Map)** and legacy support.

## Overview
This document outlines the implementation of the `Game_Action` class, which serves as a wrapper for **Map-based Item Actions**.

## Design Choices

### 1. Encapsulation of Execution Logic
`Game_Action` wraps item execution logic to interface with the `EffectSystem`.
*   **Reasoning**: This allows `Scene_Map` to execute items (potions, scrolls) using the same underlying `EffectSystem` rules as combat, without needing to instantiate a full Battle Session.

### 2. Properties
`Game_Action` implements properties to track the subject and the item being used:
*   `subject`: The battler (or party) using the item.
*   `item`: The item data object.

### 3. Usage (Scene_Map)

The `Scene_Map` (or `Scene_Item`) instantiates `Game_Action` objects to apply items.

```javascript
const action = new Game_Action(partyMember);
action.setItem(itemId, dataManager);
const events = action.apply(target, dataManager);
```

Internally, `apply` delegates to `_applyItem`, which calls `EffectSystem`:

```javascript
// Inside Game_Action._applyItem
EffectSystem.apply(effectKey, effectValue, item, target, context);
```

## Legacy Battle Documentation (Obsolete)

*The following section describes the legacy integration which has been superseded by `BattleSystem.executeAction`.*

### Unified Element Multiplier Logic
*Legacy Note:* The elemental damage multiplier logic resides in `Game_Action` (for Attacks) or is handled implicitly during `EffectSystem` resolution (for Skills).

### Target Selection
Target selection logic (`makeTargets`) is part of `Game_Action`.
