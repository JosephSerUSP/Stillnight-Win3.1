# Gameplay and Engine Analysis v2

## 1. Current State Analysis: Stillnight Engine

This analysis breaks down the current capabilities and gameplay loop of the engine as of the latest build.

### Core Objectives

The player's primary objective is to descend through a series of procedurally generated dungeon floors. This is supported by several secondary objectives that form the core gameplay loop:

*   **Creature Collection & Evolution:** The central long-term goal. Players recruit creatures, level them up through combat, and evolve them into more powerful forms. This system provides a compelling reason to engage with combat beyond simple progression.
*   **Resource Management:** Players accumulate Gold by defeating enemies and finding treasures. This Gold is used to purchase items and potentially trigger certain events, creating a simple economic loop.
*   **Team Building & Synergies:** The engine supports a 4-member active party with a 2x2 formation. Players are encouraged to experiment with creature placement (front vs. back row) and combine creatures with synergistic passive abilities (e.g., `PARASITE`, `REAR_GUARD`) to create effective teams.

### Current Meta (Dominant Strategies)

Based on the existing mechanics, several dominant strategies have emerged:

*   **Formation Specialization:** The 2x2 grid naturally leads to a "tank in front, damage/support in back" meta. Creatures with high HP or defensive passives are placed in slots 0 and 2, while fragile allies occupy slots 1 and 3.
*   **Passive-Centric Builds:** Key passives can define a party's effectiveness. `POST_BATTLE_HEAL` greatly reduces downtime, while `INITIATIVE` and `REAR_GUARD` are crucial for controlling the start of combat. A significant portion of the game's strategy revolves around finding and utilizing creatures with these powerful passives.
*   **XP Funneling:** To accelerate evolution, players can intentionally use a smaller party or allow weaker members to be defeated. This concentrates the XP gained from battle onto a single "carry" creature.
*   **Economic Optimization:** Creatures with the `GOLD_DIGGER` passive are highly valuable, as they accelerate the primary resource gain and allow for faster access to powerful items from the shop.

### Analysis of "Fun" Factor

The engine is currently most engaging in the following areas:

*   **Discovery and Exploration:** The procedural generation and fog-of-war systems create a genuine sense of exploration and surprise. Each new floor is a mystery, and the moments of finding a rare event or the stairs to the next level are rewarding.
*   **Long-Term Progression:** The evolution system is a powerful motivator. The process of nurturing a weak, common creature into a rare, powerful final form is a highly satisfying gameplay arc that encourages long-term investment.
*   **Tactical Team Building:** The joy of theory-crafting is strong. Players can spend significant time in the menus, finding clever passive synergies and building a well-oiled team that can overcome challenges efficiently.

### Where the Engine is Lacking

The current implementation has several significant weaknesses that limit its strategic depth and long-term appeal:

*   **Lack of Player Agency in Combat:** Combat is almost entirely automated. Once a battle begins, the player's only strategic choice is to "Resolve Round" or "Flee". All actions are chosen and executed by the creatures automatically. This makes combat feel passive and removes turn-by-turn tactical decision-making.
*   **Repetitive Core Loop:** The gameplay loop, while functional, is highly repetitive: move one tile, trigger a random battle, resolve it automatically, repeat. The lack of meaningful interaction during the exploration and combat phases can lead to monotony.
*   **Detached Player Role:** The player is an omniscient, invisible commander with no in-game presence. This limits immersion and prevents the implementation of mechanics that directly involve a player character, such as skills, equipment, or stats that are independent of the creature party.
*   **Shallow Resource Management:** The primary resource, Gold, has limited use. More importantly, there is no strategic resource that governs the *pace* of exploration. A player can theoretically grind on a single floor indefinitely without penalty, which removes a layer of tension and strategic planning.

## 2. New Mechanic Proposal: The Player Character

To address the current design's shortcomings, a new core mechanic is proposed: the introduction of a non-combatant **Player Character (PC)**.

### Concept Overview

The PC is the player's avatar in the game world. They do not directly participate in combat but instead act as the party's commander. On the party's turn, the PC is the one who takes action.

*   **PC Combat Actions:** Instead of creatures acting on their own, the PC chooses one action per turn from a set of command abilities. These include:
    *   **Use Item:** Use a consumable from the party's shared inventory on a creature.
    *   **Swap Formation:** Swap the positions of two creatures in the 2x2 grid. This single action consumes the PC's turn.
*   **PC Stats & Gear:** The PC has their own unique stats (e.g., Vigor, Intellect, Scavenging) and can equip PC-specific gear (e.g., Lanterns, Compasses, Scanners). These do not provide direct combat power but instead offer passive bonuses to the party or affect dungeon exploration.
*   **Core Exploration Resource ("Energy"):** The PC has a special resource that is consumed with every action taken on the map (e.g., moving, breaking a wall). The amount of Energy drained is based on a calculation involving the PC's stats and the "upkeep cost" of the current creature party. This resource can only be replenished by returning to a safe hub (town).

## 3. Revised Gameplay Flow & Implementation

### Impact on Gameplay

This new mechanic would drastically reshape the core gameplay loop:

*   **Deliberate, High-Stakes Exploration:** The "Energy" resource transforms dungeon crawling into a strategic expedition. Every step has a cost, forcing the player to make meaningful choices about which paths to explore and when to cut their losses and return to town. This introduces a "push-your-luck" element that was previously missing.
*   **Active, Tactical Combat:** By giving the player direct control over the party's actions each turn, combat becomes an active and engaging puzzle. Do you use your turn to heal a weakened tank, or reposition your damage dealer for a better elemental matchup? These choices make battles far more compelling.
*   **A New Layer of Progression:** The PC's stats and gear become a new, parallel progression path. Players must now balance upgrading their creatures with upgrading their own character to enable deeper, more efficient dungeon runs.
*   **Meaningful Downtime:** Returning to town is no longer just an optional convenience; it's a critical part of the gameplay loop required to replenish Energy. This creates a natural and satisfying rhythm of "Expedition -> Downtime -> Preparation."

### Implementation Solutions

Two potential paths for implementation are outlined below.

#### Solution A: Minimal Core Refactor

This approach integrates the new mechanic with the fewest changes to the existing engine architecture.

1.  **PC Data:** Create a new `Game_Player` class in `src/objects/objects.js` to manage PC stats and the Energy resource.
2.  **Energy System:** Add an `energy` property to `Game_Player` and display it in the HUD. In `Scene_Map.prototype.onTileClick`, after a valid move, call a method to drain Energy. If Energy reaches zero, trigger a "return to town" event.
3.  **Combat Refactor:**
    *   In `Scene_Battle`, prevent creatures from acting automatically.
    *   Add "Use Item" and "Swap Formation" buttons to `Window_Battle`.
    *   When the player clicks an action button, execute it, consume the player's turn, and then trigger the enemy AI's turn.

#### Solution B: Deep, Data-Driven Integration

This approach refactors core systems to make the new mechanic more robust and scalable.

1.  **PC as an "Actor":** Refactor the `BattleManager` to treat the `Game_Player` as the primary actor for the player's side. The PC's "turn" involves selecting a command that may or may not involve the creatures directly.
2.  **PC "Skills":** Represent PC commands like "Use Item" and "Swap" as actual skills in `data/skills.js`. This allows for easy expansion, such as adding a "Scan Enemy" or "Rally Party" command later.
3.  **Data-Driven Energy Costs:** Add a `cost` property to each creature in `data/actors.json`. The `drainEnergy` method would then calculate the cost per step by summing the `cost` of all active creatures, which is then modified by the PC's stats and gear. This creates a direct, transparent link between party composition and exploration endurance.
4.  **Unified Trait System:** Extend the existing `traits` system to the PC and their equipment. PC gear could grant traits like `{ "code": "PARTY_PASSIVE_BONUS", "dataId": "SEE_TRAPS", "value": 5 }`, which would dynamically grant a passive ability to all members of the party, creating a rich new layer of strategic customization.
