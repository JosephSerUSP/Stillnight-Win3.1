# Architecture Assessment & Proposal

## 1. Executive Summary

The current engine architecture functions but suffers from significant coupling and rigidity. While it successfully implements basic turn-based combat, it lacks the flexibility required by the `doc/gameDesign.md` document. The core issue is the monolithic nature of `BattleManager` and the hardcoded parameter logic in `Game_Battler`.

This document proposes a radical rewrite centered on introducing a `Game_Action` class to decouple "what happens" from "who controls the flow", and a generalized Parameter/Trait system for `Game_Battler` to support the dynamic nature of the game design.

---

## 2. Architecture Assessment

### 2.1. Integrity
The current codebase is functional. The separation between `objects` (data/state) and `managers` (logic) is present but blurred in execution.
*   **Strengths**: The `data/traits.js` system is a good start for data-driven effects. `EffectProcessor` attempts to centralize immediate changes.
*   **Weaknesses**: Logic is scattered. `BattleManager` knows too much about specific game rules (damage formulas, crit logic). `Game_Battler` has hardcoded getters that limit extensibility.

### 2.2. Flaws

#### Structural Flaws (Critical)
1.  **Missing `Game_Action` Class**: Actions are currently ad-hoc objects (`{type, target, skillId}`) created and consumed inside `BattleManager`. There is no encapsulation of an action's lifecycle (cost, valid targets, execution, animation).
2.  **Monolithic `BattleManager`**: `BattleManager.js` handles turn flow, AI, *and* the minute details of execution (`_executeSkill`, `_executeAttack`). It acts as a "God Class" for combat.
3.  **Hardcoded Battler Parameters**: `Game_Battler.js` has explicit getters for `atk`, `maxHp`, `asp`. Adding a new parameter (e.g., "Magic Attack" or "Dexterity") requires modifying the class definition, violating the Open/Closed principle.

#### Major Flaws (Significant)
1.  **Split Effect Logic**: Immediate effects are handled by `EffectProcessor`, while passive/triggered effects are handled by `EffectManager` and `TRAIT_DEFINITIONS`. This split makes it difficult to have unified logic (e.g., a "Burn" state that deals immediate damage *and* damage over time).
2.  **Rigid Targeting**: `BattleManager.getValidTargets` contains hardcoded logic for "smart targeting" and side determination. This belongs in the Action logic.
3.  **Trait Application**: The `traits` getter in `Game_Battler` reconstructs the entire trait list on every access, which could be a performance bottleneck, and the `getPassiveValue` method is an ad-hoc wrapper around this system.

#### Minor Flaws
1.  **String-Based Keys**: Effect keys (`hp`, `recruit_egg`) are magic strings scattered across `EffectProcessor` and data files.
2.  **Inconsistent Context**: Some methods pass `battlerContext`, others pass `battler` and `index` separately.

---

## 3. Comparison with `gameDesign.md`

The Design Document (`doc/gameDesign.md`) emphasizes **extreme flexibility**:
> "Effects should be flexible. I should be able to cover novel effects without hardcoding them."
> "Traits should be flexible. I should be able to cover novel traits without needing to hardcode them."

**Discrepancies:**
*   **Dynamic Descriptions**: The design asks for dynamic descriptions (e.g., "Increases ATK by 5"). The current system has `TRAIT_DEFINITIONS` which helps, but the `Game_Battler` doesn't natively expose a way to query "all modifiers for ATK" easily for UI generation without manual iteration.
*   **Complex Actions**: The design mentions "Potion Rain" (condition: have item, cost: consume item, effect: party heal). The current `BattleManager` cannot handle complex costs or conditional availability dynamically. It assumes skills cost MP and Items cost 1 item.
*   **Unified "Effects"**: The design treats "learning a skill", "changing elements", and "healing HP" as the same class of "Effects". The current code treats them differently (Progression system vs EffectProcessor).

---

## 4. The Proposal: Radical Rewrite

We propose a full rewrite of the battle system to align with the "Everything is an Object/Effect" philosophy.

### 4.1. Core Concept: `Game_Action`
We will introduce `src/objects/action.js`. This class will encapsulate a specific battle maneuver.

**Responsibilities:**
*   **Context**: Holds `subject` (user), `item` (Skill/Item data), and potential `targets`.
*   **Validity**: `canUse()` checks costs (MP, TP, Item count) and conditions (Row, State, HP threshold).
*   **Targeting**: `makeTargets()` determines valid targets based on scope, handling selection logic.
*   **Application**: `apply(target)` executes the effects on a specific target.
*   **Prediction**: `evaluate()` returns expected damage/healing for AI scoring.

**Constructor:**
```javascript
new Game_Action(subject, forceData = null)
```

### 4.2. Refactoring `Game_Battler` (`src/objects/battler.js`)
We will replace hardcoded getters with a generalized Parameter System.

**Key Changes:**
*   **`param(paramId)`**: A single method to calculate any parameter. It starts with a base value and iterates over all `traits` looking for modifiers to `paramId`.
    *   *Benefit*: Adding a new parameter requires 0 code changes in `Game_Battler`.
*   **`xparam(xparamId)`**: For "Ex-parameters" like Hit Rate, Crit Rate, Evasion.
*   **`sparam(sparamId)`**: For "Special-parameters" like Target Rate, aggro.
*   **Trait Objects**: `Game_Battler` will have a method `traitObjects()` that returns `[actor, class, weapon, armor, ...states, ...passives]`. This standardizes where traits come from.

### 4.3. Streamlining `BattleManager` (`src/managers/battle.js`)
`BattleManager` will be reduced to a **Flow Controller**.

**New Flow:**
1.  **Turn Start**: Iterate battlers, process "Turn Start" traits (via `Game_Action` if necessary).
2.  **Action Selection**: Ask player or AI for a `Game_Action`.
3.  **Action Execution**:
    ```javascript
    const action = currentBattler.currentAction();
    if (action.isValid()) {
        const targets = action.makeTargets();
        targets.forEach(target => action.apply(target));
        this.processEvents(action.getEvents()); // Animation/Log
    }
    ```
4.  **Turn End**: Process "Turn End" traits.

It will **no longer** calculate damage or determine targets.

### 4.4. Unified Effect System
We will merge `EffectProcessor` logic into `Game_Action` and a refined `EffectManager`.
*   **Game_Action** handles "Active Effects" (Damage, Heal, Add State) invoked by using an item/skill.
*   **Game_Battler** handles "Passive Effects" (Param Plus, Element Rate) via the `param()` method.
*   **Triggers**: Traits that trigger effects (like "Counter Attack" or "Heal on Turn Start") will generate a `Game_Action` to be executed.

### 4.5. Design Discussion: Parameter Architecture
The distinction between `param` (Base Parameters), `xparam` (Ex-Parameters), and `sparam` (Special Parameters) is deliberate.

**Arguments In Favor (Segregation):**
1.  **Origin of Base Values**: `param`s (e.g., HP, ATK) typically derive their base value from Actor/Class/Level curves. `xparam`s (e.g., Hit Rate, Crit) default to 0%. `sparam`s (e.g., Target Rate, Pharmacology) default to 100%. Segregating them clarifies the source of the "Base" value before traits are applied.
2.  **Mathematical Models**: Core parameters generally use an `(Base + Plus) * Rate` model to scale integers. Ex-parameters typically use an additive `Base + Plus` model (stacking percentages). Special parameters typically use a multiplicative `Base * Rate` model. Hardcoding these flows prevents configuration errors where a "Crit Rate" trait accidentally multiplies a base 0.
3.  **Convention**: This pattern mirrors established RPG development frameworks, easing the transition for designers familiar with standard JRPG architecture.

**Arguments Against (Unification):**
1.  **API Redundancy**: Having three methods increases the API surface area. A single `stat(id)` method would be cleaner.
2.  **Rigidity**: A unified system driven purely by metadata (e.g., `traits.js` defining if a stat is additive or multiplicative) offers more flexibility. For instance, if a designer wants "Hit Rate" to be halved by a Blind state, a rigid `xparam` (additive) system makes this difficult, whereas a unified system could handle it via configuration.

**Conclusion:**
We will **maintain the distinction** in the method signatures to ensure clarity of default values and mathematical behavior, which are distinct enough to warrant separation. However, the internal implementation should share a common trait aggregation logic.

---

## 5. Implementation Steps

1.  **Create `src/objects/action.js`**: Implement the base `Game_Action` class.
2.  **Refactor `Game_Battler`**:
    *   Implement `traitObjects()` iterator.
    *   Implement `param(id)`, `xparam(id)`, `sparam(id)`.
    *   Rewrite `atk`, `def`, `mhp` as wrappers calling `param()`.
3.  **Rewrite `BattleManager`**:
    *   Strip `executeAction`, `_executeSkill`, `_executeAttack`.
    *   Replace with `action.apply()`.
4.  **Update Data**: Ensure `traits.js` aligns with the new parameter naming convention.

This architecture provides the "Deep Planning Mode" foundation required for complex mechanics like "Potion Rain" or custom growth systems.
