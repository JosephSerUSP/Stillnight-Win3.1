# GAMEPLAY ANALYSIS: THE STILLNIGHT ENGINE

## Current Mechanics

The repository defines a **Turn-Based Dungeon Crawler** with a focus on creature collection and resource management. The codebase is structured around a scene-based architecture (`Scene_Map`, `Scene_Battle`) driven by a central `DataManager`.

### Core Systems Identified

*   **Entity System (`Game_Battler`)**:
    *   **Stat Architecture**: Uses a flexible Trait system (`PARAM_PLUS`, `PARAM_RATE`) allowing for complex modifiers from Equipment, Passives, and States.
    *   **Progression**: Standard XP/Leveling curve. Unique "Evolution" mechanic triggered by meeting multi-variate conditions (Level, Item, Floor Depth, Gold).
    *   **Life Cycle**: Explicit "Permadeath" checks and "Recruit/Replace" logic imply units are expendable assets rather than permanent heroes.

*   **Battle System (`BattleManager`)**:
    *   **Flow**: Round-based queue system (Speed is not currently a factor; fixed order Party -> Enemy).
    *   **Positioning**: Rudimentary Row system (Front/Back) affecting damage output.
    *   **Elemental Logic**: A Matrix-based weakness/resistance system (1.5x / 0.75x multipliers).
    *   **AI**: Probabilistic behavior (60% Skill usage) with rudimentary targeting logic (smart healing).

*   **Exploration Engine (`Game_Map` & `Game_Event`)**:
    *   **Topology**: Procedural "Random Walk" generation creating organic, cave-like structures.
    *   **Interaction**: Event-based entities (Shops, Shrines, Traps, Recruiters) populated via data tables (`maps.json`).
    *   **Fog of War**: Tile-based visibility requiring exploration.

*   **Economy & Resource**:
    *   **Gold**: The primary gating resource for Recruitment and Shop purchases.
    *   **Inventory**: Shared party inventory. Items function as consumables or stat-boosting equipment.
    *   **Sacrifice/Replacement**: The recruitment logic explicitly handles "Party Full" states by forcing a replacement, reinforcing the "disposable unit" philosophy.

## Projected Narrative Potential

**Theme Proposal: "The Shepherd of the Abyss"**

The mechanics suggest a game not about saving the world, but about **spending lives to survive it**.
*   **Disposable Heroes**: The `RECRUIT` logic (pay gold to replace a member) and `PARASITE` traits (draining allies) imply a narrative where the protagonist is a commander or summoner who views creatures as tools.
*   **The Void**: The procedural "Random Walk" maps and "Descend" mechanics create a feeling of diving into an infinite, shifting chaos.
*   **Evolution as Mutation**: The requirement of specific items (like "Mystic Egg") and depth to evolve suggests creatures are being warped by the dungeon itself.

**Theme Proposal**: *Industrial Necromancy*. You are exploring the "Stillnight," a frozen void. To go deeper, you must capture local fauna, mutate them into weapons, and discard them when they break.

## Emergent Loops

*   **The Parasite Loop**: The `PARASITE` trait (drains neighbor HP) combined with `HRG` (Regen) creates a natural "Battery" strategy. You place a high-regen Tank next to a high-damage Parasite.
*   **Evolutionary Gambling**: Since Evolution requires Gold and Items, players must decide whether to spend resources upgrading a current unit or recruiting a higher-level monster from a deeper floor.
*   **Formation Tactics**: The Front/Back row damage modifiers encourage placing expendable tanks in the front and high-value glass cannons in the back.

## Systemic Frictions

### Clashes & Pain Points
*   **Party Management Clashes**: The game supports 24 party members but only 4 active slots. The UI (linear lists) will likely become unmanageable.
    *   *Friction*: Equipping 20 reserve members is tedious.
    *   *Conflict*: If Permadeath is frequent, re-equipping new units becomes a chore.
*   **Economic Deadlocks**: Recruitment costs Gold. Evolution costs Gold. Shops cost Gold. If a player runs out of Gold and their party wipes (Permadeath), they might enter a "Soft Lock" state where they cannot recruit strong enough units to progress.
*   **Tactical Shallowness**: The Battle System lacks a "Defend" or "Wait" option. Players have no way to stall for regeneration or manipulate turn order, making combat feel like a pure DPS race.

## Proposed Roadmap

**The "Flesh & Steel" Update**

To transition from "Prototype" to "Alpha," the engine needs to lean harder into its unique "Disposable Unit" identity and fix the management friction.

### 1. The "Barracks" System (UI Overhaul)
*   **Problem**: Managing 24 units is messy.
*   **Solution**: Create a dedicated `Window_Barracks`.
    *   **Grid View**: View reserve members as icons, not text lists.
    *   **Mass Equip**: Button to "Strip All Reserves" or "Auto-Equip Best".
    *   **Sorting**: Sort by Level, Element, Species.

### 2. Synergy Engine Expansion (Mechanics)
*   **Problem**: `PARASITE` is the only interaction.
*   **Solution**: Add "Pack Tactics".
    *   **Trait**: `BOND_ [Species]`: +Stats if adjacent to same species.
    *   **Trait**: `CATALYST`: Boosts elemental damage of neighbors.
    *   **Trait**: `MARTYR`: Takes damage in place of neighbors (perfect for the Parasite loop).

### 3. Tactical Depth (Battle System)
*   **Problem**: Combat is linear.
*   **Solution**:
    *   **Action**: `DEFEND` (Reduces damage, regenerates small MP/CP).
    *   **Action**: `SWAP` (Change position with ally/reserve as a turn action).
    *   **Speed Stat**: Implement an `agi` stat to determine turn order, breaking the static "Party -> Enemy" flow.

### 4. Environmental Interaction (Map)
*   **Problem**: Maps are just corridors.
*   **Solution**:
    *   **Hazards**: Lava/Poison tiles that require `HOVER` or specific Elemental traits to cross safely.
    *   **Destructibles**: Walls that can be broken by High-ATK units to reveal shortcuts.
