# Gameplay Analysis

## Systemic Projection

### Core Loop
The core gameplay loop revolves around three primary activities:

*   **Exploration:** The player navigates procedurally generated dungeon floors, encountering events, enemies, and treasures as defined in `maps.json`. The goal is to find the stairs to descend to the next level.
*   **Combat:** Turn-based combat against randomly encountered enemies. The player's party and the enemy party exchange blows until one side is defeated.
*   **Progression:** Winning battles yields gold and experience. Experience leads to leveling up, which increases stats and unlocks evolutions. Gold can be used to purchase items or recruit new creatures.

### Economic Scaling
*   **Gold:** The primary currency. Gold gain is tied to defeating enemies and is influenced by passives like "Gold Digger". It can be spent at shops or on recruitment events. This forms a simple but effective sink/source economy. As the game scales, the gold costs of items and recruitment will need to be balanced against the gold rewards from higher-level enemies.
*   **Items:** Currently, items are limited to drops and treasures. A fully scaled-up economy would require a more robust item system, including a wider variety of consumables, equipment, and perhaps crafting materials.

### Progression System
*   **Creature Leveling:** The `expGrowth` property in `actors.json` provides a solid foundation for varied creature progression. Creatures with low `expGrowth` will level up quickly, providing an early power boost, while those with high `expGrowth` will be more of a long-term investment. This is a good source of strategic depth.
*   **Party Composition:** The player's party is a collection of recruited creatures. The `isRecruitable` flag and the recruitment events on each map suggest a "gotta catch 'em all" mechanic. The strategic depth will come from building a party with complementary skills, passives, and elemental affinities.
*   **Evolutions:** The evolution system is a powerful long-term progression goal. It provides a significant power spike and a strong incentive to invest in specific creatures.

## Depth vs. Complexity Audit

This section evaluates the potential for strategic depth versus unnecessary complexity.

### Emergent Interactions
The current system has several mechanics that could lead to interesting emergent strategies:

*   **Passive Stacking:** The `traits` system is a strong source of depth. Players could stack `GOLD_DIGGER` passives to create a "gold farming" party, or stack `PARAM_RATE` traits to create highly specialized "glass cannon" or "tank" creatures.
*   **The "Parasite" Passive:** This is a standout example of a mechanic that adds depth. It creates a risk/reward scenario, forcing the player to consider party positioning and whether the powerful "Parasite" creature is worth the health drain on its ally.
*   **Elemental System:** The multi-element system on actors allows for nuanced weaknesses and resistances. A creature with `["Green", "Green"]` could be designed to be exceptionally weak to fire, while a `["Green", "White"]` creature might only have a minor weakness. This adds a layer of strategy to party composition and target selection.

### Dominant Strategies
A few potential dominant strategies could emerge and may require careful balancing:

*   **Level Grinding:** As with most RPGs, simply grinding for levels is likely to be a dominant strategy. The `expGrowth` property helps to mitigate this by varying the investment required for each creature, but the core incentive remains. The game will need mechanics to encourage forward momentum, such as diminishing returns on lower floors.
*   **Status Effects:** The "Infernal Pact" skill grants "berserk," which could be extremely powerful. If the benefits of powerful status effects heavily outweigh their downsides or there are no effective counters, they can become a one-dimensional, dominant strategy.
*   **Recruitment Churn:** If the cost of recruiting new creatures is low, the optimal strategy might be to constantly replace party members with higher-level creatures found on deeper floors, rather than investing in the long-term growth of an existing team. This would devalue the evolution system.

## Constraint Optimization

The engine's apparent limitations can be reframed as intentional design choices that enhance the player experience:

*   **Minimalist UI:** The retro, Windows 3.1-inspired UI is not a limitation, but a feature. It creates a unique, nostalgic aesthetic and focuses the player on core gameplay mechanics rather than flashy visuals. This embraces a "gameplay-first" philosophy.
*   **Procedural Maps:** The lack of fixed, hand-crafted map layouts is a strength. It ensures high replayability and forces players to adapt to a new challenge on every run, fitting perfectly with a roguelike design.
*   **Ambiguous Narrative:** The sparse narrative context allows for emergent storytelling. The player's journey, the creatures they recruit, and the challenges they overcome become the story, written by their own actions.

## Feature Overhaul Specification

This section proposes a concrete overhaul to deepen the gameplay and add long-term engagement.

### Removed Mechanics
The current feature set is lean and effective. There are no mechanics that add complexity without corresponding depth. The design philosophy should be to maintain this lean approach. **Recommendation:** Do not add mechanics that do not directly support the core loop of exploration, combat, and progression. For example, avoid overly complex crafting systems or social simulation features that would dilute the core experience.

### New Mechanics
*   **Formal Equipment System:** While item drops exist, a formal equipment system with defined slots (e.g., Weapon, Armor, Accessory) would be a natural extension of the progression system. This would create another layer of strategic choice and a satisfying power curve.
*   **Creature Synergy:** Introduce bonuses for specific party compositions. For example, having three "undead" creatures in the party might grant them all a "lifesteal" trait. This would encourage strategic party building and experimentation.
*   **Shrine System Expansion:** The "shrine" events in `maps.json` are an opportunity for interesting, run-altering choices. These could be expanded to offer powerful temporary boons, risky trade-offs (e.g., "sacrifice 5 max HP for a permanent +1 attack"), or even unique story vignettes.

### Meta-Game Structure
To enhance long-term replayability, a meta-game structure is essential.

*   **The Hub:** The "Town of Stillnight" should serve as a persistent hub between runs.
*   **Meta-Currency:** Upon death or victory, players should be awarded a meta-currency (e.g., "Echoes") based on their performance (floors cleared, enemies defeated).
*   **Permanent Unlocks:** In the hub, players can spend "Echoes" to:
    *   Unlock new creatures that can then be found and recruited in the dungeon.
    *   Purchase permanent upgrades, such as a small boost to starting gold or a higher chance of finding rare items.
    *   Unlock new starting parties, offering different strategic approaches from the very beginning of a run.

This structure provides a sense of permanent progression that makes each run, even failed ones, feel meaningful.
