# Engine Architecture Assessment

## 1. Executive Summary

The current engine architecture follows a modular design with clear separation between Managers, Objects, and Scenes. However, the core systems handling **Effects** and **Battler Statistics** suffer from significant rigidity due to hardcoding. This architecture contradicts the design goals of flexibility and extensibility outlined in `gameDesign.md`. A comprehensive refactoring is required to decouple logic from data and enable the "novel effects" and "flexible traits" described in the design.

## 2. Structural Integrity & Flaws

The flaws are ranked below from **Structural** (Architecture-level issues) to **Minor** (Implementation details).

### A. Structural Flaws (Critical)

1.  **Hardcoded Effect Processing (`EffectProcessor`)**
    *   **Issue:** The `EffectProcessor` class relies on a monolithic `switch` statement to handle effect keys (e.g., `'hp'`, `'xp'`).
    *   **Impact:** Adding any new effect requires modifying the core engine code. This explicitly violates the "Open/Closed Principle" and the design goal: *"I should be able to cover novel effects without hardcoding them."*
    *   **Integrity Score:** Low. This is a bottleneck for scalability.

2.  **Rigid Battler Parameter System (`Game_Battler`)**
    *   **Issue:** `Game_Battler` uses explicit getter methods (e.g., `get atk()`, `get maxHp()`) that manually aggregate base stats and traits.
    *   **Impact:** Implementing new statistics (like `actionSpeed`, `mpDrain`, or custom attributes) requires modifying the `Game_Battler` class structure. It is impossible to add stats dynamically via data or mods.
    *   **Integrity Score:** Low. Tightly couples the Battler object to a fixed set of stats.

3.  **Missing "Summoner" Entity**
    *   **Issue:** The "Summoner" (Player Character) is not represented as a distinct entity with unique mechanics (MP drain, non-combatant status). The `Game_Party` manages generic `Game_Battler` objects.
    *   **Impact:** Core exploration loops described in the design (MP management, weakening party on 0 MP) are entirely missing.
    *   **Integrity Score:** N/A (Feature missing).

### B. Implementation Flaws (Moderate)

1.  **Static Trait Definitions (`TRAIT_DEFINITIONS`)**
    *   **Issue:** Traits are defined in a static constant object (`data/traits.js`).
    *   **Impact:** While better than hardcoding inside `Battler`, it still requires code changes to define new traits. A truly flexible system would allow loading trait definitions from external data files (JSON).

2.  **Action/Item/Skill Separation**
    *   **Issue:** There is no unified `Game_Action` class. Items and Skills are treated as raw data objects passed around.
    *   **Impact:** Reduces code reuse and consistency between using an Item and casting a Spell.

### C. Minor Flaws

1.  **Hardcoded Formulas:** Some formulas (like damage or heal) are embedded in the `EffectProcessor` switch cases rather than being delegatable to a math evaluator or scriptable object.

---

## 3. Comparison with `gameDesign.md`

| Feature | Design Requirement | Current Implementation | Discrepancy Analysis |
| :--- | :--- | :--- | :--- |
| **Flexibility** | *"Effects should be flexible. I should be able to cover novel effects without hardcoding them."* | Effects are hardcoded in `EffectProcessor` switch cases. | **Critical Failure.** The current implementation prevents novel effects without code modification. |
| **Leanliness** | implied by *"maximum flexibility and leanliness"* | Hardcoded getters and switch statements are bloated and repetitive. | **High.** Code duplication in getters and switch cases reduces leanliness. |
| **Summoner** | Non-combatant PC. Drains MP on move. 0 MP penalties. Separate equipment/skills. | No Summoner class. No MP drain logic. `Game_Party` is a flat list. | **Missing Feature.** The core resource management loop is absent. |
| **Traits** | *"Traits should be flexible... cover novel traits without needing to hardcode them."* | Traits are static in `data/traits.js`. Stats are hardcoded in `Battler`. | **Partial Failure.** Traits exist but are not fully dynamic. |
| **Actions** | Skills, Items, Spells. `actionSpeed` determines turn order. | `actionSpeed` exists in `Battler` but `Game_Action` logic is scattered. | **Rigid.** Needs unification. |

---

## 4. Proposed Refactoring Plan

To achieve the maximum flexibility and leanliness requested, I propose the following refactoring roadmap:

### Phase 1: Dynamic Effect Registry (Leanness & Flexibility)
**Goal:** Eliminate the `EffectProcessor` switch statement.

1.  Create `EffectRegistry`.
    *   A singleton or static class that maps `effectKey` (string) to `EffectHandler` (function/class).
2.  Refactor `EffectProcessor`.
    *   Change `.apply()` to look up the handler in `EffectRegistry` and execute it.
3.  Migration.
    *   Move all current effects (`hp`, `recruit_egg`, etc.) into standalone handlers registered at startup.

### Phase 2: Dynamic Parameter System (Flexibility)
**Goal:** Decouple `Game_Battler` from specific stats.

1.  Implement `getParam(paramId)` in `Game_Battler`.
    *   Logic: `(Base + Traits_Plus) * Traits_Rate`.
    *   This replaces explicit `get atk()`, `get maxHp()`.
2.  Data-Driven Base Stats.
    *   Ensure `actorData` provides base params via a generic map, not just specific fields.
3.  Update `TRAIT_DEFINITIONS`.
    *   Generalize `PARAM_PLUS` and `PARAM_RATE` to accept any `paramId` string.

### Phase 3: Summoner & Exploration Mechanics (Completeness)
**Goal:** Implement the missing game loop.

1.  Create `Game_Summoner` class.
    *   Tracks MP, Level, Exploration Skills.
    *   Not a `Game_Battler` (doesn't fight).
2.  Integrate into `Game_Party`.
    *   Party holds `summoner` instance + `members` (combatants).
3.  Update `ExplorationEngine`.
    *   On step: `summoner.mp -= drain`.
    *   On 0 MP: Apply "Weakness" state/debuff to party members.

### Phase 4: Unified Action System (Clean Code)
**Goal:** Standardize how actions work.

1.  Create `Game_Action` class.
    *   Wraps a Skill or Item.
    *   Handles cost payment (MP/Item), targeting, and effect application via `EffectRegistry`.

## 5. Conclusion

The current architecture is functional for a prototype but insufficient for the dynamic, data-driven design outlined in `gameDesign.md`. The proposed refactoring will shift the engine from a **Hardcoded Logic** model to a **Data-Driven/Registry** model, significantly improving flexibility and maintainability.
