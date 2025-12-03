# COMPARATIVE ANALYSIS: Stillnight Engine

This document analyzes the current state of the Stillnight Engine by comparing it to two foundational pillars of dark RPG design: **Diablo 1** and **Shin Megami Tensei (SMT)**. By juxtaposing the engine against these titles, we isolate its unique "Industrial Necromancy" identity and identify missing structural elements.

---

## 1. Comparison: Diablo 1 (1996)
*Archetype: The Descent into Hell*

### The Shared DNA
*   **The Descent Loop**: Like *Diablo*, Stillnight is structured around a singular, vertical descent. The "Town" is a safe harbor, and the goal is strictly "Down."
*   **Atmosphere of Isolation**: The random-walk map generation mirrors *Diablo's* procedural catacombs—cramped, chaotic, and inherently hostile.
*   **Consumable Resources**: The reliance on limited gold and consumable items (HP Tonics) creates attrition, similar to *Diablo's* potion belt management.

### The Divergence (Missing Links)
*   **Loot Lust**: *Diablo's* core hook is the "Slot Machine" aspect of randomized loot. Stillnight currently uses static equipment defined in `items.json`.
    *   *Critique*: Without randomized affixes (e.g., "Rusty Sword of Leeching"), the "Treasure" events in Stillnight lack dopamine. Finding a duplicate "Silver Blade" is boring; finding a "Silver Blade of the Eagle" is exciting.
*   **Real-Time Tension**: *Diablo* is frantic. Stillnight is turn-based.
    *   *Critique*: The tension in Stillnight must come from *strategic* inevitability (running out of resources) rather than *reflexive* panic. Currently, the lack of resource scarcity (infinite skills) undermines this.

---

## 2. Comparison: Shin Megami Tensei (Series)
*Archetype: Demon Negotiation & Fusion*

### The Shared DNA
*   **The Disposable Army**: SMT views demons as ammunition. Stillnight’s `RECRUIT` and `PARASITE` mechanics align perfectly with this. Units are tools, not friends.
*   **Elemental Hard Counters**: The 1.5x / 0.75x damage matrix in Stillnight is a simplified version of SMT’s "Press Turn" logic (Exploiting weakness = Victory).
*   **Negotiation**: The "Recruit" event mirrors SMT’s demon conversation, albeit simplified to a gold transaction.

### The Divergence (Missing Links)
*   **Fusion vs. Evolution**: SMT uses *Fusion* (combining two to make a new one) to keep low-level units relevant. Stillnight uses *Evolution* (Pokémon-style linear growth).
    *   *Critique*: Linear evolution creates a "Starter Pokémon" problem—players get attached to their first unit. Fusion forces players to *kill* their darlings to progress, which fits the "Industrial Necromancy" theme far better.
*   **The Magnetite Economy**: SMT restricts powerful parties by draining "Magnetite" every step. Stillnight has no maintenance cost.
    *   *Critique*: Without a maintenance cost (`CP` or `Mag`), there is no pressure to "finish" a floor quickly. Players can grind indefinitely near a recovery point.

---

## 3. Conclusions: The Identity Crisis

The Stillnight Engine currently sits in an uncanny valley between these two giants:

1.  **It lacks the Loot Depth of Diablo**: Exploration rewards are static and dull.
2.  **It lacks the Sacrificial Utility of SMT**: Evolution encourages hoarding/attachment, while the narrative theme encourages disposal.

**The "Industrial Necromancy" identity (Disposable Heroes) is fighting against the Mechanics (Linear Leveling & Static Loot).** To succeed, the engine must commit to **Attrition** and **Mutation**.

---

## 4. Propositions: The "Chimera" Overhaul

To harmonize the engine, we propose importing specific mechanics from both inspirations to reinforce the "Disposable Tool" theme.

### Proposition A: The "Scrap" Loot System (From Diablo)
Instead of finding static "Iron Swords," players should find **Components** or **Mutagens**.
*   **Mechanic**: Equipment is not bought; it is *grown* or *grafted* onto creatures.
*   **Effect**: Finding a "Razor Shard" allows you to permanently upgrade a unit's ATK but lowers its Def. This makes "Loot" feel like "Fuel" for your army.

### Proposition B: Sacrificial Fusion (From SMT)
Replace or Augment the "Evolution" system with **Grafting**.
*   **Mechanic**: Sacrifice Unit A to transfer 50% of its XP and one Trait to Unit B.
*   **Effect**: This solves the "Party Management" friction. Instead of hoarding 20 weak units in the Reserve, you "feed" them to your leaders.
*   **Narrative**: "I don't fire you; I recycle you."

### Proposition C: The "Entropy" Clock (The Anti-Grind)
Introduce a "Dread" or "Corruption" meter that ticks up with every turn taken.
*   **Mechanic**: At high Dread, enemies evolve into "Elites" (Diablo) and Recruitment costs triple (SMT).
*   **Effect**: Forces the player to descend. You cannot stay safe. The dungeon is waking up.

---

## 5. Implementation Roadmap (Immediate)

1.  **Implement `Grafting` (Fusion Lite)**:
    *   Add a `Window_Graft` where players select a `Source` (destroyed) and `Target` (buffed).
    *   Transfer: `Target.xp += Source.totalXp * 0.5`.
2.  **Randomize Loot Generation**:
    *   Modify `DataManager` to generate items with random traits (`PARAM_PLUS`) on the fly.
    *   Rename "Iron Sword" to generated names like "Jagged Iron Sword".
3.  **Add Maintenance Cost**:
    *   Implement `Party.consumption`: Every step costs `ActiveMemberCount * FloorDepth` gold/resource.
