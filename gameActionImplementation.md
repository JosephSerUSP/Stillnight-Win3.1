# Game Action Implementation

## Overview
This document outlines the implementation of the `Game_Action` class, which serves as the core "Effect Object" wrapper for battle actions (Skills, Attacks, and potentially Items) in the unified "Effect & Trait" system.

## Design Choices

### 1. Encapsulation of Execution Logic
The execution logic for battle actions, previously residing in `BattleManager` (specifically `_executeSkill`, `_executeAttack`, `getValidTargets`, and `elementMultiplier`), has been moved into the `Game_Action` class.
*   **Reasoning**: This adheres to object-oriented principles, grouping behavior (execution) with data (the action definition). It improves the scalability of `BattleManager` by delegating complex logic to the action itself.
*   **Benefit**: `BattleManager` now focuses on flow control (turn order, win/loss), while `Game_Action` handles the "how" of an action.

### 2. Properties
`Game_Action` implements the properties defined in `gameDesign.md`:
*   `asp` (Action Speed): Calculated via the `speed` getter, combining the subject's speed and the item/skill's speed modifier.
*   `ele` (Element): Handled internally during execution. For skills, the element is retrieved from the skill data. For attacks, it uses the battler's innate elements.
*   `cnd` (Condition): Reserved for future implementation (validity checks).

### 3. Unified Element Multiplier Logic
The elemental damage multiplier logic has been migrated from `BattleManager` to `Game_Action`.
*   **Improvement**: Previously, skills might not have fully utilized the target's elemental weaknesses/resistances in the same way basic attacks did (or relied on ad-hoc logic). The new implementation ensures that if a skill has an element, it checks against the target's element table to apply standard multipliers (1.5x for Weakness, 0.75x for Resistance), in addition to the "Same Element Bonus" for the user.

### 4. Target Selection
Target selection logic (`makeTargets`) is now part of `Game_Action`.
*   **Reasoning**: The scope of an action (Self, Enemy, Ally) is intrinsic to the action itself.

## Usage
The `BattleManager` now instantiates `Game_Action` objects instead of plain object literals.
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
