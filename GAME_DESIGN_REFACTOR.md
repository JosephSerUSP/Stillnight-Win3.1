# Game Design Refactor & Architecture Proposal

## 1. Executive Summary

The current engine implements the core RPG loop but suffers from architectural rigidity that limits the flexibility described in `gameDesign.md`. While the basic turn structure and trait aggregation exist, the implementation relies heavily on hardcoded logic within `BattleManager` and `Game_Battler`. This coupling makes it difficult to introduce new parameters, complex action effects, or the intended Summoner exploration mechanics without modifying core classes.

This document proposes a refactor to align the codebase with the data-driven design goals, focusing on three key areas: a generic parameter system, an encapsulated action system, and an event-driven exploration model.

## 2. Architectural Assessment

### 2.1. Structural Flaws (Major)

1.  **Missing `Game_Action` Abstraction**:
    *   **Current State**: `BattleManager` handles action execution directly via `_executeAttack` and `_executeSkill`. It manually calculates damage, checks scope, and generates events.
    *   **Problem**: This violates the Single Responsibility Principle. Adding new action types (e.g., Items, conditional skills) requires modifying the Manager.
    *   **Impact**: Limits the ability to create "Complex Actions" (e.g., Potion Rain) defined in the design doc.

2.  **Hardcoded Parameter Logic**:
    *   **Current State**: `Game_Battler` defines stats via explicit getters (`get atk()`, `get maxHp()`).
    *   **Problem**: The codebase must be modified to add new stats. It does not strictly distinguish between additive (EVA) and multiplicative (TGR) traits in a standardized way.
    *   **Impact**: Violates the requirement for flexible `param`, `xparam`, and `sparam` definitions.

3.  **Missing Summoner Integration**:
    *   **Current State**: `ExplorationEngine` handles movement and collisions but operates in isolation. There is no mechanism for the "Summoner" entity to react to movement (e.g., MP drain).
    *   **Impact**: The core resource management loop of the game (MP vs. Exploration) is missing.

### 2.2. Minor Weaknesses

1.  **Trait Definition Mixing**: `data/traits.js` currently mixes UI formatting logic (string generation) with game logic (`execute` callbacks). This makes the data layer impure and harder to serialize/test.
2.  **Hardcoded Element Handling**: Elemental affinities are handled via explicit `filter` checks in `Game_Battler`, rather than a generic trait handler.

---

## 3. Refactor Proposal

### 3.1. The Parameter Model (`param`, `xparam`, `sparam`)

We will replace the hardcoded getters in `Game_Battler` with a generic, ID-based system. This allows any parameter to be defined in data without code changes.

**Concepts:**
*   **Param (Base Parameters)**: Integer values (e.g., `atk`, `def`, `maxHp`). Formula: `(Base + Plus) * Rate`.
*   **XParam (Extra Parameters)**: Floating point probabilities (e.g., `hit`, `eva`, `cri`). Formula: `Sum(Traits)`. Default 0.0.
*   **SParam (Special Parameters)**: Multiplicative rates (e.g., `tgr` (target rate), `mdr` (magic damage rate)). Formula: `Product(Traits)`. Default 1.0.

**Proposed Interface (`src/objects/battler.js`):**

```javascript
class Game_Battler extends Game_Base {
    /**
     * generic parameter access
     */
    param(paramId) {
        const base = this.paramBase(paramId); // Derived from actor data/level
        const plus = this.traitsSum('PARAM_PLUS', paramId);
        const rate = this.traitsPi('PARAM_RATE', paramId);
        return Math.floor((base + plus) * rate);
    }

    xparam(xparamId) {
        return this.traitsSum(xparamId.toUpperCase()); // e.g., 'EVA', 'HIT'
    }

    sparam(sparamId) {
        return this.traitsPi(sparamId.toUpperCase()); // e.g., 'TGR', 'MDR'
    }
}
```

*Note: `elementChange` and `elementAdd` will remain as special trait codes handled by specific helper methods (`elementRate(elementId)`), as they do not fit the numeric scalar model.*

### 3.2. The Action System (`Game_Action`)

We will introduce a `Game_Action` class to encapsulate the logic of performing an action. `BattleManager` will delegate execution to instances of this class.

**Proposed Interface (`src/objects/action.js`):**

```javascript
class Game_Action {
    constructor(subject) {
        this.subject = subject;
        this._item = null; // The Skill or Item data object
        this._targetIndex = -1;
    }

    setSkill(skillId) { ... }
    setItem(itemId) { ... }

    /**
     * Validates if the action can be used (cost, conditions).
     */
    canUse() {
        return this.subject.canPayCost(this._item) && this.meetsCondition(this._item);
    }

    /**
     * Generates valid targets based on scope.
     */
    makeTargets() {
        // Logic moved from BattleManager.getValidTargets
        // Returns Array<Game_Battler>
    }

    /**
     * Executes the action against a specific target.
     * Returns an array of Result/Event objects.
     */
    apply(target) {
        const result = target.result(); // New Result object to track outcome
        const hit = this.checkHit(target);

        if (hit) {
            // Calculate Damage
            const damage = this.makeDamageValue(target);
            this.executeDamage(target, damage);

            // Apply Effects (States, Buffs)
            this.item().effects.forEach(effect => {
                this.applyItemEffect(target, effect);
            });
        }

        return result;
    }
}
```

**Benefits:**
*   Allows complex AI logic: `action.evaluate()`
*   Centralizes formula evaluation.
*   Decouples the Battle loop from the Action specifics.

### 3.3. Trait & Effect Separation (MVC)

We will separate the **Definition** (Data) from the **Execution** (Logic) and **Presentation** (UI).

1.  **Data (`data/traits.json`)**: purely descriptive.
    ```json
    {
        "HRG": { "name": "HP Regen", "type": "xparam" },
        "SYMBIOSIS": { "name": "Symbiosis", "trigger": "turnStart" }
    }
    ```

2.  **Logic (`src/managers/trait_manager.js`)**:
    ```javascript
    class TraitManager {
        static runTrigger(triggerId, battler) {
            battler.traits.forEach(trait => {
                if (trait.trigger === triggerId) {
                    this.executeTrait(trait, battler);
                }
            });
        }

        static executeTrait(trait, battler) {
            switch(trait.code) {
                case 'SYMBIOSIS':
                    // Symbiosis logic here
                    break;
            }
        }
    }
    ```

### 3.4. Summoner & Exploration Architecture

To support "Summoner MP Drain on Move" and other exploration hooks, we need an event-driven architecture for the `ExplorationEngine`.

**1. Exploration Events:**
The `ExplorationEngine` should extend a robust Event Emitter or use a central `Game_Temp` / `EventBus`.

```javascript
// src/managers/exploration.js
movePlayer(dx, dy) {
    // ... movement logic ...
    if (moved) {
        EventBus.emit('player_move', { x, y, terrain });
    }
}
```

**2. The Summoner Entity (`src/objects/summoner.js`):**
A distinct class representing the Player Character (Summoner), separate from the combat party.

```javascript
class Game_Summoner extends Game_Base {
    constructor() {
        super();
        this.mp = 100;
        // Listen to global events
        EventBus.on('player_move', this.onPlayerMove.bind(this));
    }

    onPlayerMove() {
        this.mp -= 1;
        if (this.mp <= 0) {
            this.applyExhaustionPenalty();
        }
    }

    applyExhaustionPenalty() {
        // Apply global state or trait to all party members
        $gameParty.addState('EXHAUSTION');
    }
}
```

## 4. Implementation Plan (Roadmap)

1.  **Phase 1: Core Objects**: Implement `Game_Action` and the new `Game_Battler` parameter system (`param`/`xparam`/`sparam`).
2.  **Phase 2: Data Migration**: Refactor `data/traits.js` into pure data and a `TraitManager`. Update all logic to use the new parameter methods.
3.  **Phase 3: Manager Cleanup**: Strip `BattleManager` of action logic, delegating to `Game_Action`.
4.  **Phase 4: Summoner Integration**: Implement the `EventBus`, `Game_Summoner` class, and hook up the MP drain mechanics.
