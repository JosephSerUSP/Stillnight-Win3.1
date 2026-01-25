# Game Action Implementation

## Overview
This document outlines the implementation of the `Game_Action` class, which serves as the core "Effect Object" wrapper for battle actions (Skills, Attacks, and Items) in the unified "Effect & Trait" system.

## Design Choices

### 1. Dual Execution Pipelines
The system employs two distinct pipelines for executing actions, both leveraging the unified `EffectSystem`:

*   **BattleSystem Pipeline**: Used during combat (Scene_Battle). `BattleSystem` executes logic directly (via `_executeSkill`/`_executeItem`) for tighter control over the battle log and event sequencing.
*   **Game_Action Pipeline**: Used for Map interactions (Scene_Map) and external calls. `Game_Action` encapsulates the execution logic in an object-oriented wrapper.

*   **Reasoning**: This separation allows `BattleSystem` to be optimized for the complex state machine of combat, while `Game_Action` provides a portable "Action Object" for general use (e.g., using a Potion from the Pause Menu).

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

### 1. Standard Usage (Map / Scripts)
For non-combat usage, instantiate and apply `Game_Action` directly:

```javascript
const action = new Game_Action(battler);
action.setItem(itemId, dataManager);
const events = action.apply(target, dataManager);
// events = [{ type: 'heal', value: 50, ... }]
```

### 2. Combat Usage (BattleSystem)
In `Scene_Battle`, actions are typically defined as plain data or `Game_Action` instances, but executed via the system:

```javascript
// BattleSystem internally calls:
this._executeSkill(state, action, events);
// Which delegates to:
EffectSystem.apply(effectKey, effectValue, battler, target, context);
```

```javascript
// Inside Game_Action._applySkill
EffectSystem.apply(effectKey, effectValue, battler, target, context);
```
