# ARCHITECTURE_PROPOSAL.md

## 1. Assessment of Current Architecture

### Overview
The current codebase relies on a monolithic `BattleManager` to handle the intricacies of combat, coupled with a `Game_Battler` class that mixes state management with data access. While functional for basic mechanics, this architecture shows significant strain when scaled against the flexibility requirements outlined in `doc/gameDesign.md`.

### Integrity & Flaws

**1. Structural Flaw: The "God Class" BattleManager**
*   **Observation:** `BattleManager` is responsible for turn flow, AI decision making, target selection logic (`getValidTargets`), and the minute details of action execution (`_executeAttack`, `_executeSkill`).
*   **Severity:** **High**.
*   **Impact:** This violates the Single Responsibility Principle. Adding new mechanics (e.g., items, guarding, counter-attacks) requires modifying this central file, increasing the risk of regressions. The logic for "what an action does" is decoupled from the action itself.

**2. Structural Flaw: Lack of Action Abstraction (`Game_Action`)**
*   **Observation:** The concept of an "Action" exists only as a transient object literal `{ type, sourceContext, target, skillId }` created within `BattleManager`.
*   **Severity:** **Critical**.
*   **Impact:** There is no uniform interface for performing an action. "Attacks" and "Skills" are treated as fundamentally different pipelines (`_executeAttack` vs `_executeSkill`). This makes it impossible to treat "Attack" as just "Skill #1", leading to code duplication (e.g., damage variance logic, critical hit logic).

**3. Minor Flaw: Dispersed Effect Logic**
*   **Observation:** Effect logic is scattered. `EffectProcessor` handles immediate skill effects. `traits.js` handles passive/triggered effects. `BattleManager` hardcodes attack damage and critical hits.
*   **Severity:** Medium.
*   **Impact:** Implementing a trait like "Life Steal" is difficult because it works differently for Attacks (hardcoded in BattleManager) versus Skills (handled via `hp_drain` effect in EffectProcessor).

**4. Minor Flaw: UI/Logic Coupling**
*   **Observation:** The logic layer (Managers) generates specific UI event messages ("X attacks Y!").
*   **Severity:** Low.
*   **Impact:** The simulation logic is coupled with presentation, making it harder to change the UI or run headless simulations for testing.

### Comparison to `doc/gameDesign.md`

*   **Design Goal:** "Actions apply Effects to targets. They can be: Skills, Items, Spells."
*   **Current Reality:** Only Skills apply Effects via the `EffectProcessor`. Items are not yet fully integrated into the battle loop in the same way. Attacks are special-cased.
*   **Design Goal:** "Effects should be flexible... I should be able to cover novel effects without hardcoding them."
*   **Current Reality:** `EffectProcessor` is a good start, but `BattleManager`'s hardcoding of the Attack action limits this flexibility for the most common action in the game.

---

## 2. Radical Rewrite Proposal

### Core Philosophy
**"Everything is an Action."**
Whether a unit attacks, uses a skill, uses an item, or guards, the engine should treat these as instances of a unified `Game_Action` class. The `BattleManager` should not know *how* to attack; it should only know how to ask a battler to execute its current action.

### Proposed Architecture

#### A. Introduce `Game_Action` (`src/objects/action.js`)
This class encapsulates the execution logic of a battle action.

*   **Responsibilities:**
    *   Holds the **Subject** (who), the **Item** (Skill/Item data), and the **Target** (who is affected).
    *   **Validity:** `isValid()` checks if the action can be performed (costs, valid targets).
    *   **Application:** `apply(target)` executes the action on a specific target.
    *   **Calculations:** Encapsulates formulas for hit rate, critical rate, and damage/healing.

#### B. Introduce `Game_ActionResult` (`src/objects/action_result.js` or inner class)
A data container attached to `Game_Battler` (`battler.result`) that accumulates the outcome of an action.

*   **Properties:** `used`, `missed`, `evaded`, `critical`, `hpDamage`, `mpDamage`, `addedStates`, `removedStates`.
*   **Benefit:** Decouples logic from UI. The `BattleManager` executes the action, the `Result` is populated, and the UI layer reads the `Result` to play animations and log messages.

#### C. Refactor `Game_Battler`
*   **New Methods:**
    *   `clearResult()`: Resets the result object.
    *   `currentAction()`: Returns the action currently being executed/planned.
    *   `actions()`: Returns a list of valid `Game_Action`s (replacing the simple skill list).
*   **Cleanup:** Remove `onTurnStart` logic if it can be handled by the Manager, or strictly limit it to state updates.

#### D. Refactor `BattleManager`
*   **Streamlined Flow:**
    1.  **Phase: Input:** Ask player/AI for an action.
    2.  **Phase: Turn:** Sort battlers by speed.
    3.  **Phase: Action:**
        *   `action = subject.currentAction()`
        *   `targets = action.makeTargets()`
        *   `targets.forEach(target => action.apply(target))`
        *   `displayAction(subject, targets)`
*   **Removed:** `_executeAttack`, `_executeSkill`. The manager no longer calculates damage.

### Integration with `gameDesign.md`

This architecture directly supports the design document's requirements:
*   **Unified Effects:** Since "Attack" will just be `Game_Action` (Skill #1), it will use the same Effect system as everything else.
*   **Complex Traits:** Traits like "Mug" (steal gold on damage) can be implemented as hooks within `Game_Action.apply()`, checking the `subject`'s traits.
*   **Items:** `Game_Action` handles Items naturally by setting the `item` property to an Item data object instead of a Skill data object.

### Implementation Roadmap

1.  **Create `src/objects/action.js`**: Implement the `Game_Action` class.
    *   Implement `makeTargets()`, `testApply()`, `apply()`.
    *   Implement `executeDamage()`, `executeHeal()`.
2.  **Update `Game_Battler`**: Add `result` property (instance of `Game_ActionResult`) and `action` management.
3.  **Rewrite `BattleManager`**:
    *   Replace the `executeAction` giant switch statement with `action.apply()`.
    *   Replace `getAIAction` to return a `Game_Action` instance.
4.  **Refactor `EffectProcessor`**: Ensure `Game_Action` utilizes it for the "Effects" part of skills/items.

### Example Code Snippet (Game_Action)

```javascript
class Game_Action {
    constructor(subject) {
        this.subject = subject;
        this.item = null; // Skill or Item data
        this._targetIndex = -1;
    }

    apply(target) {
        const result = target.result;
        this.subject.result.used = true;
        result.clear();

        if (Math.random() >= this.itemHit(target)) {
            result.missed = true;
            return;
        }

        if (Math.random() < this.itemEva(target)) {
            result.evaded = true;
            return;
        }

        // Apply Effects (Damage, States, etc.)
        // This unifies Attack and Skills
        this.item.effects.forEach(effect => {
            this.applyEffect(effect, target);
        });

        // Apply Global Hooks (e.g., "Mug")
        this.applyGlobalTraits(target);
    }
}
```

This rewrite ensures the engine is robust, testable, and capable of supporting the deep mechanics envisioned.
