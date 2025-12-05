# Engine Refactoring Plan

## 1. Executive Summary

**Objective**: Transition the game engine from a rigid, hardcoded Object-Oriented architecture to a flexible, data-driven system.
**Goal**: Achieve "maximum flexibility" as defined in the Game Design document. This means enabling "novel effects," "dynamic descriptions," and new game mechanics (like the Summoner system) primarily through data configuration, minimizing the need for core code modifications.

## 2. Architecture Assessment

### 2.1. Structural Flaws (Critical)
The current architecture exhibits high rigidity, making the desired extensibility impossible without refactoring.

*   **Rigid Effect Processing**: `EffectProcessor.js` relies on a hardcoded `switch` statement for effect types (`hp`, `maxHp`, `xp`). Adding a new effect type requires modifying this core file, directly violating the requirement to "cover novel effects without hardcoding".
*   **Hardcoded Stats**: `Game_Battler.js` defines stats (`atk`, `def`, `maxHp`, `asp`) as explicit class properties and getters. Adding a new stat (e.g., `wisdom`, `stamina`) requires modifying the class schema and logic.
*   **Coupled Trait Logic**: `TRAIT_DEFINITIONS` in `data/traits.js` mixes data definitions with JavaScript execution logic (functions). This prevents traits from being purely data-driven (JSON) and complicates modding or external content loading.

### 2.2. Minor Flaws
*   **Inconsistent Aggregation**: Logic for aggregating traits is split between `Game_Battler` (for stat modifiers) and `EffectManager` (for triggers).
*   **Missing Mechanics**: The "Summoner" mechanics (MP drain, penalties) are currently absent, though the architecture limits their easy implementation.

## 3. Proposed Architecture

We will move towards a **Generic Attribute & Effect System** (an Entity-Component-System "Lite" approach).

### 3.1. Generic Attribute System
Instead of hardcoded fields (`this.atk`), entities will possess an `AttributeManager`.

*   **Structure**:
    *   **`AttributeManager`**: Holds a map of `Attribute` objects.
    *   **`Attribute`**: Manages the state of a single statistic.
        *   `base`: The base value.
        *   `modifiers`: A list of active modifiers (flat or percentage).
        *   `current`: The calculated final value.
        *   `min`/`max`: Clamping bounds.
*   **Usage**:
    *   `battler.attributes.get('atk')` replaces `battler.atk`.
    *   `battler.attributes.addModifier('atk', { value: 10, type: 'flat', source: 'sword' })`.
*   **Benefits**: New stats (e.g., `movement_cost`, `vision_range`) can be added by simply initializing them in data, with no code changes to `Game_Battler`.

### 3.2. Generic Effect Registry
We will replace the switch statement with a registration pattern.

*   **Structure**:
    *   **`EffectRegistry`**: A singleton mapping `EffectKey` -> `EffectHandler`.
    *   **`EffectHandler`**: A function signature `(target, value, context) => Result`.
*   **Usage**:
    *   Core effects (`DAMAGE`, `HEAL`, `ADD_STATE`) are registered at startup.
    *   New effects can be registered via plugins or setup scripts.
    *   `EffectProcessor` simply looks up the handler: `EffectRegistry.execute(effectKey, ...)`.

### 3.3. Data-Driven Traits
Traits will be defined purely as data objects that describe *what* they do, not *how*.

*   **Definition**:
    ```json
    {
      "code": "MIGHTY_SWING",
      "triggers": [
        { "type": "ON_ATTACK", "effect": { "key": "damage_boost", "value": 0.2 } }
      ],
      "modifiers": [
        { "stat": "atk", "value": 5, "type": "flat" }
      ]
    }
    ```
*   **Interpretation**: The `AttributeManager` and `EffectManager` will consume these data definitions directly.

## 4. Implementation Phases

### Phase 1: Core Systems (Foundation)
**Goal**: Build the generic systems without touching existing game code yet.

1.  **Implement `AttributeManager` & `Attribute`**:
    *   Support base values, flat/percent modifiers, and bounds.
    *   Implement dirty-checking/caching for performance.
2.  **Implement `EffectRegistry`**:
    *   Create the registry class and the interface for handlers.
    *   Port 2-3 core effects (`hp_heal`, `hp_damage`) as registered handlers.
3.  **Testing**:
    *   **Action**: Write comprehensive **Unit Tests** for `AttributeManager` (stacking rules, edge cases) and `EffectRegistry`.
    *   **Success Condition**: 100% test coverage on the new generic classes.

### Phase 2: Battler Refactoring (Data Migration)
**Goal**: Switch `Game_Battler` to use the new `AttributeManager`.

1.  **Integrate AttributeManager**:
    *   Add `this.attributes = new AttributeManager()` to `Game_Battler`.
    *   Initialize standard stats (`atk`, `def`, `maxHp`) into the manager during construction.
2.  **Refactor Getters**:
    *   Change `get atk()` to return `this.attributes.get('atk')`. This maintains API compatibility for external calls temporarily.
3.  **Refactor Trait Aggregation**:
    *   Update `Game_Battler` to push trait modifiers into the `AttributeManager` instead of filtering them in getters.
4.  **Testing**:
    *   **Action**: Run existing Playwright tests.
    *   **Success Condition**: The game runs identically to before; tests pass.

### Phase 3: Effect & Trait Modernization
**Goal**: Remove the hardcoded switch statements and logic files.

1.  **Port EffectProcessor**:
    *   Rewrite `EffectProcessor.apply` to delegate to `EffectRegistry`.
    *   Register all remaining effects (`xp`, `recruit_egg`, etc.).
2.  **Data-fy Traits**:
    *   Convert `TRAIT_DEFINITIONS` to a pure data structure (or a structure that references registered handlers).
    *   Update `EffectManager` to interpret these data triggers.
3.  **Testing**:
    *   **Action**: Manual verification of complex traits (e.g., `HRG` regeneration).
    *   **Success Condition**: Traits function correctly; descriptions are generated dynamically from the data definitions.

### Phase 4: Future-Proofing (Verification)
**Goal**: Verify that new features can be added purely via data/configuration.

1.  **Summoner Data Definition**:
    *   Define a 'Summoner' attribute set (including `mp`, `steps_taken`).
    *   Create a "mock" trait `MP_DRAIN_STEP` using the new system.
2.  **Complex Action POC**:
    *   Define a "Potion Rain" effect using a composite effect definition (e.g., `ChainEffect`).
3.  **Testing**:
    *   **Action**: Write a new test case that defines a *novel* stat and effect at runtime and verifies they work.
    *   **Success Condition**: The new test passes without modifying `Game_Battler.js` or `EffectProcessor.js`.

## 5. Testing Strategy

*   **New Unit Tests**: Heavy focus on `tests/unit/` (to be created) for the generic managers.
    *   *AttributeManager*: Verify correct math for (Base + Flat) * Rate.
    *   *EffectRegistry*: Verify handler registration and context passing.
*   **Integration Tests**: Use existing Playwright tests (`tests/`) to ensure no regression in gameplay logic.
*   **Proof-of-Concept Test**: A specific test in Phase 4 that acts as the "Acceptance Test" for the refactor's goal (extensibility).
