# Architecture Assessment & Rewrite Proposal

## 1. Executive Summary

This document assesses the current state of the game engine architecture and proposes a radical rewrite to align with the flexible design goals outlined in `doc/gameDesign.md`.

**Current Status:** The engine functions for basic gameplay but suffers from significant architectural rigidity. It relies on hardcoded logic, switch statements for effects, and tight coupling between the `BattleManager`, `EffectProcessor`, and `Game_Battler`.

**Critical Flaws:**
1.  **Missing Abstractions:** The `Game_Action` class, crucial for decoupling action logic from the battle flow, is missing (contrary to architectural documentation/memory).
2.  **Rigidity:** Adding new effects or traits requires modifying multiple core files (`EffectProcessor`, `Game_Battler`, `BattleManager`).
3.  **Data Coupling:** Game logic (formulas, damage calculations) is embedded in the Manager layer rather than the Object layer.

**Proposal:** A full rewrite of the Battle and Object layers to implement a **Command-based Action System** and a **Generic Trait/Effect System**. This will allow for the "novel effects without hardcoding" requirement specified in the design document.

---

## 2. Structural Assessment

### 2.1. Structural Integrity & Flaws

| Severity | Component | Issue | Impact |
| :--- | :--- | :--- | :--- |
| **Critical** | `BattleManager` | **God Class Anti-Pattern:** Handles turn order, AI, *and* specific execution logic for skills/attacks. | Hard to test, hard to extend. Violates Single Responsibility Principle. |
| **Critical** | `EffectProcessor` | **Rigid Switch Statement:** Effects are hardcoded in a giant switch. | Impossible to add effects via data/plugins without code changes. Violates Open/Closed Principle. |
| **Major** | `Game_Battler` | **Hardcoded Parameters:** `atk`, `def`, etc. are explicit getters. | Cannot easily add new stats (e.g., `mat`, `mdf` are missing) or custom parameters. |
| **Major** | `Game_Action` | **Missing Class:** Action logic does not exist as an object. | Action data (targets, speed, cost) is scattered in `BattleManager` local variables. |
| **Moderate** | `Data Layer` | **Missing Dynamic Descriptions:** No system to generate descriptions from traits automatically. | Descriptions must be manually written, leading to potential sync errors with actual effects. |
| **Minor** | `Scene_Battle` | **Logic Leakage:** Some display logic assumes specific event types hardcoded in `BattleManager`. | UI is tightly coupled to the specific implementation of battle events. |

### 2.2. Comparison with `doc/gameDesign.md`

| Feature | Design Document Requirement | Current Implementation | Status |
| :--- | :--- | :--- | :--- |
| **Effects** | Flexible, cover novel effects without hardcoding. | Hardcoded in `EffectProcessor.js`. | ❌ FAILED |
| **Traits** | Modify characteristics, trigger effects (`hit`, `eva`, `cri`, etc.). | Partially implemented via `Game_Battler` getters and hardcoded `TRAIT_DEFINITIONS`. | ⚠️ PARTIAL |
| **Objects** | `Passives`, `Equipment`, `States` as Trait Objects. | Implemented, but trait aggregation is rigid. | ✅ PASS |
| **Actions** | `Skills`, `Spells`, `Items` as Action Objects with `asp`, `ele`, `cnd`. | No `Game_Action` class. `asp` calc is in `BattleManager`. | ❌ FAILED |
| **Stats** | `mHp`, `mpd`, `atk`, `mat`, `def`, `mdf`, `mxa`, `mxp`. | Only `maxHp`, `atk`, `asp` exist. Missing magic/defense stats. | ❌ FAILED |
| **Descriptions** | Dynamic generation based on traits/effects. | Not implemented. | ❌ FAILED |

---

## 3. Radical Rewrite Proposal

### 3.1. Core Philosophy
**"Everything is an Object, Every Effect is a Command."**

The new architecture will move logic out of Managers and into Objects. Managers should only coordinate state transitions.

### 3.2. New Architecture Components

#### 3.2.1. The `Game_Action` Class (New)
**Location:** `src/objects/action.js`
**Responsibility:** Encapsulates *everything* about a specific action attempt.

```javascript
class Game_Action {
    constructor(subject) {
        this.subject = subject; // Game_Battler
        this.item = null;       // Data object (Skill/Item)
        this.targetIndex = -1;
    }

    setSkill(skillId) { ... }
    setItem(itemId) { ... }

    // Core Logic moved here
    makeTargets() { ... } // Returns Array<Game_Battler>
    calcSpeed() { ... }   // Returns number

    // execution
    apply(target) {
        // Creates a Game_ActionResult
    }
}
```

#### 3.2.2. Generic Trait System
**Location:** `src/objects/trait_set.js` (attached to Battlers)
**Concept:** Instead of hardcoded getters, use a normalized Trait pipeline.

*   **Traits** are simple data objects: `{ code: "PARAM_PLUS", dataId: "atk", value: 10 }`.
*   **Game_Battler** uses a generic `param(id)` method.

```javascript
// Game_Battler
param(paramId) {
    let value = this.paramBase(paramId);
    // Apply TRAIT_PARAM_PLUS
    value += this.traitsSum(TRAIT_PARAM_PLUS, paramId);
    // Apply TRAIT_PARAM_RATE
    value *= this.traitsPi(TRAIT_PARAM_RATE, paramId);
    return value;
}
```
*   **Benefit:** We can add `mat`, `mdf`, or even `luck` just by adding them to the data files, without changing code.

#### 3.2.3. Command-Pattern Effect System
**Location:** `src/managers/effect_registry.js`
**Concept:** Replace the switch statement with a registration system.

```javascript
// EffectRegistry
const effects = {};

register("hp_damage", (action, target, value) => {
    // Logic
});

register("add_state", (action, target, stateId) => {
    // Logic
});

// Usage in Action
EffectRegistry.invoke(effect.code, action, target, effect.value);
```

#### 3.2.4. Refactored `BattleManager`
**Location:** `src/managers/battle.js`
**Responsibility:** State Machine only.

*   **Phase 1:** Input (Fill `Game_Action` for each battler).
*   **Phase 2:** Turn Order (Sort `Game_Action` objects by speed).
*   **Phase 3:** Execution (Call `action.apply(target)`).
*   `BattleManager` no longer calculates damage or handles explicit targeting logic.

### 3.3. Implementation Roadmap

1.  **Phase 1: Foundation**
    *   Create `Game_Action` class.
    *   Implement `Game_ActionResult` to standardize event reporting.
    *   Create `EffectRegistry`.

2.  **Phase 2: Battler Refactor**
    *   Rewrite `Game_Battler` to use the generic `param(id)` system.
    *   Implement the missing stats (`mat`, `def`, `mdf`).
    *   Migrate existing `atk`/`maxHp` logic to the new system.

3.  **Phase 3: Battle Manager Decoupling**
    *   Refactor `BattleManager` to use `Game_Action`.
    *   Move AI logic into `Game_Action` or a dedicated `Game_AI` class.

4.  **Phase 4: Cleanup & UI**
    *   Update `Scene_Battle` to consume `Game_ActionResult`.
    *   Implement dynamic description generation using the new Trait structure.

### 3.4. Testing Strategy
*   **Unit Tests:** Create specific tests for `Game_Action` to ensure speed and damage calculations are correct in isolation.
*   **Integration Tests:** Verify that `BattleManager` correctly sorts and executes a queue of actions.
*   **Mocking:** Mock `DataManager` and `SoundManager` for pure logic tests.

## 4. Conclusion

The proposed rewrite addresses the critical architectural flaws by enforcing separation of concerns. By adopting `Game_Action` and a generic Effect system, the engine will meet the design requirement of flexibility and extensibility, allowing for complex, novel mechanics without codebase surgery.
