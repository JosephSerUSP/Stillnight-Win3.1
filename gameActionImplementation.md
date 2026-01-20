# Game Action Implementation

## Status Note
**Partially Deprecated / Bifurcated**: Currently, the `BattleSystem` (`src/engine/systems/battle.js`) implements a parallel execution pipeline (`executeAction` -> `_executeSkill`/`_executeItem`) that bypasses `Game_Action.apply`.
*   `Game_Action` is currently used primarily for **Item application in `Scene_Map`** and as a data container for planned actions.
*   Future refactoring aims to unify these pipelines so `BattleSystem` uses `Game_Action` execution logic directly.

## Overview
This document outlines the implementation of the `Game_Action` class, which serves as the core "Effect Object" wrapper for battle actions (Skills, Attacks, and Items) in the unified "Effect & Trait" system.

## Design Choices

### 1. Encapsulation of Execution Logic
The execution logic for battle actions has been moved into the `Game_Action` class and the `EffectSystem`.
*   **Reasoning**: This adheres to object-oriented principles, grouping behavior (execution) with data (the action definition), while delegating pure state changes to the `EffectSystem`.
*   **Benefit**: `BattleSystem` now focuses on flow control (turn order, win/loss), while `Game_Action` handles the "how" of an action.

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
The `BattleSystem` instantiates `Game_Action` objects to represent planned moves.

```javascript
const action = new Game_Action(battler);
action.setSkill(skillId, dataManager);
// or
action.setAttack();
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
