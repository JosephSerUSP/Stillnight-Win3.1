# Game Action Implementation

## Overview
This document outlines the implementation of the `Game_Action` class. Originally designed as the core "Effect Object" wrapper for all actions, it is currently primarily used for **Exploration Item Usage** (in `Scene_Map`).

> **Note on Drift**: The `BattleSystem` (`src/engine/systems/battle.js`) currently implements its own parallel execution logic (`executeAction`) using plain data objects, largely bypassing `Game_Action`. This is a known area of technical debt (Logic Duplication).

## Design Choices

### 1. Encapsulation of Execution Logic
The execution logic for actions resides in the `Game_Action` class (for exploration) and the `EffectSystem`.
*   **Reasoning**: This adheres to object-oriented principles, grouping behavior (execution) with data (the action definition), while delegating pure state changes to the `EffectSystem`.
*   **Benefit**: Delegating to `EffectSystem` ensures consistent rules for damage/healing regardless of the pipeline (Combat vs Exploration).

### 2. Properties
`Game_Action` implements the properties defined in `gameDesign.md`:
*   `speed`: Calculated getter, combining the subject's speed (`asp`) and the item/skill's speed modifier.
*   `ele` (Element): Handled internally during execution. For skills, the element is retrieved from the skill data. For attacks, it uses the battler's innate elements.

### 3. Unified Element Multiplier Logic
The elemental damage multiplier logic resides in `Game_Action` (for Attacks) or is handled implicitly during `EffectSystem` resolution (for Skills).
*   **Improvement**: The implementation ensures that if a skill has an element, it checks against the target's element table to apply standard multipliers (1.5x for Weakness, 0.75x for Resistance), in addition to the "Same Element Bonus" for the user.

### 4. Target Selection
Target selection logic (`makeTargets`) is part of `Game_Action`.
*   **Reasoning**: The scope of an action (Self, Enemy, Ally) is intrinsic to the action itself.

## Usage

### Exploration (Scene_Map)
Used for applying items (potions, scrolls) outside of battle.

```javascript
const action = new Game_Action(party);
action.setItem(item, dataManager);
const events = action.apply(target, dataManager);
```

### Combat (BattleSystem)
*Currently, `BattleSystem` does NOT use `Game_Action.apply()`. Instead, it manually constructs events via `_executeSkill` and `_executeItem`.*

Internally, `apply` delegates specific effects (like `damage`, `heal`, `add_status`) to the `EffectSystem`:

```javascript
// Inside Game_Action._applySkill
EffectSystem.apply(effectKey, effectValue, battler, target, context);
```
