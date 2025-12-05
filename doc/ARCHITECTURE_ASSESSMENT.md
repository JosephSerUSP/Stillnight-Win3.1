# Architecture Assessment and Rewrite Proposal

## Assessment of Current Architecture

### Integrity
The current engine functions correctly within its current scope. It separates concerns between data containers (`Game_Battler`), flow managers (`BattleManager`), and logic processors (`EffectProcessor`). The data-driven approach for definitions (JSON/JS files) is a strong foundation.

### Flaws (Ranked)

1.  **Structural: Hardcoded Logic (Critical)**
    -   `EffectProcessor` relies on a rigid `switch` statement for effect types (`hp`, `damage`, etc.). Adding a new effect type requires modifying the core processor logic.
    -   `Game_Battler` uses hardcoded getters for stats (`atk`, `def`, `maxHp`), manually filtering and reducing traits inside each getter. Adding a new stat (e.g., `magicAtk`) requires modifying the `Game_Battler` class.
    -   This violates the Open/Closed Principle and the design document's goal of "flexible effects".

2.  **Structural: Scattered Trait Logic (Major)**
    -   Trait application logic is distributed across multiple locations:
        -   Stats in `Game_Battler`.
        -   Triggers in `EffectManager`.
        -   Specific mechanics (Crit, Evasion) in `BattleManager` or implicitly in `utils.js`.
    -   This makes it difficult to understand the full impact of a trait or add new types of modifiers.

3.  **Major: Limited Extensibility**
    -   Implementing complex mechanics (e.g., "Status that skips a turn" or "Action that costs HP instead of MP") requires deep changes in flow managers (`BattleManager`) rather than just defining a new Effect or Trait.

### Comparison to Design Document
`doc/gameDesign.md` emphasizes flexibility: "Effects should be flexible... I should be able to cover novel effects without hardcoding them." The current implementation directly contradicts this by hardcoding effect keys and stat formulas.

## Radical Rewrite Proposal

To align with the design goals and fix structural flaws, I propose a transition to a fully data-driven **Generic Attribute & Effect System**.

### Core Components

1.  **`AttributeSystem` (New)**
    -   A generic container for numerical stats and values.
    -   Manages Base Values, Modifiers (Flat/Rate), and Final Value calculation.
    -   Replaces hardcoded `atk`, `def`, etc., in `Game_Battler`.
    -   Allows adding any arbitrary stat (e.g., `battler.attributes.get('sanity')`) without code changes.

2.  **`EffectRegistry` (New)**
    -   A centralized registry mapping Effect Keys to Handler Functions.
    -   `EffectRegistry.register('damage', (payload, source, target) => { ... })`
    -   Replaces the switch statement in `EffectProcessor`.
    -   Enables plugins or data files to define new effects dynamically.

3.  **Refactored `Game_Battler`**
    -   Becomes a thin wrapper around `AttributeSystem`.
    -   `refreshStats()` method aggregates traits from all sources (Passives, Equipment, States) and populates the `AttributeSystem`.

4.  **Refactored `EffectProcessor`**
    -   Acts as a facade for `EffectRegistry`, maintaining backward compatibility while delegating logic to the dynamic registry.

### Benefits
-   **Leaner:** Removes duplicated logic for stat calculation.
-   **Flexible:** New stats and effects can be added by registering them, without touching core classes.
-   ** robust:** Centralizes math and logic, reducing bugs in edge cases (like order of operations).
