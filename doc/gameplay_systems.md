# Deep Dive: Gameplay Systems

This document provides a detailed, technical breakdown of the core gameplay systems and formulas used in the Stillnight Engine.

---

## 1. Damage Calculation Formula

The damage formula is designed to be straightforward while allowing for strategic depth through stats and elemental modifiers.

### Formula Breakdown

The core formula is:
`Total Damage = Base Damage * Elemental Multiplier * (1 + Critical Hit Bonus)`

**1. Base Damage Calculation:**
`Base Damage = (Attacker's ATK * Skill Power) / (Target's DEF * 2)`

*   **Attacker's ATK:** The `attack` stat of the attacking creature.
*   **Skill Power:** A multiplier defined in `data/skills.js` for the specific skill being used. A standard physical attack has a power of `1.0`.
*   **Target's DEF:** The `defense` stat of the defending creature.

**2. Elemental Multiplier:**
The elemental multiplier is determined by comparing the `element` of the skill used against the `elements` of the target creature. The mappings are defined in `data/elements.json`.

*   **Effective:** 2.0x multiplier (e.g., Fire skill vs. Ice creature)
*   **Ineffective:** 0.5x multiplier (e.g., Fire skill vs. Water creature)
*   **Immune:** 0.0x multiplier (e.g., Earth skill vs. Flying creature)
*   **Neutral:** 1.0x multiplier (all other cases)

**3. Critical Hit Bonus:**
A critical hit is calculated based on the attacker's `luck` stat.
`Crit Chance (%) = Attacker's LUK / 2`

*   If a critical hit occurs, a `+50%` bonus damage is applied (`Critical Hit Bonus = 0.5`). Otherwise, it is `0`.

---

## 2. Stat Growth System

Creature stats increase upon leveling up. The growth pattern is determined by the creature's `expGrowth` and `paramGrowth` properties in `data/actors.json`.

*   **Experience to Next Level:** `(Current Level * expGrowth) ^ 1.1`
    *   A higher `expGrowth` value means the creature requires more XP to level up, indicating slower progression.
*   **Stat Gain on Level Up:**
    `New Stat = Old Stat + (paramGrowth * (Stat Base / 10))`
    *   `paramGrowth`: A multiplier (e.g., 1.0 for balanced, 1.2 for fast, 0.8 for slow).
    *   `Stat Base`: The creature's base stat at Level 1. This ensures that creatures with higher base stats gain more from leveling up.

---

## 3. Procedural Map Generation

Map generation uses a simplified cellular automata algorithm to create cave-like structures. The logic is primarily handled in `src/objects/objects.js` within the `Game_Map.prototype.generateFloor` method.

**Process:**
1.  **Initialization:** The map is filled with a random distribution of wall and floor tiles, based on a `fillProbability` (typically ~45% walls).
2.  **Simulation Passes (x5):** The algorithm runs through several passes. In each pass, a tile's state is determined by its neighbors:
    *   If a wall tile has `4` or more floor neighbors, it becomes a floor tile.
    *   If a floor tile has `5` or more wall neighbors, it becomes a wall tile.
3.  **Connectivity Check:** A flood-fill algorithm is run from the center to identify the largest contiguous cavern. All smaller, disconnected caverns are filled in with walls.
4.  **Stair Placement:** The 'Up' stairs (`U`) are placed at a random, accessible location near the center. The 'Down' stairs (`D`) are placed at the furthest accessible point from the 'Up' stairs to encourage exploration.
5.  **Event & Enemy Placement:** Events (`E`) and enemy encounters (`X`) are scattered randomly on accessible floor tiles, ensuring they are not placed on the stairs or the player's starting position.

---

## 4. Item & Skill Effect Processing

Effects from items and skills are handled by the `Game_Interpreter` in `src/managers/interpreter.js`. Each skill or item has an `effects` array in its data definition (`data/skills.js`, `data/items.json`).

**Example Effect Object:**
```json
{ "code": "ADD_STATE", "dataId": 5, "chance": 1.0 }
```

**Processing Steps:**
1.  **Trigger:** A skill or item is used on a target.
2.  **Check Chance:** The `chance` property is checked. If a random roll (0.0 to 1.0) is higher than the chance, the effect does not apply.
3.  **Execute Code:** The `Game_Interpreter` uses a `switch` statement on the `code` property to determine the action.
    *   `"ADD_STATE"`: Applies the state with the matching `dataId` (e.g., 'Poison') to the target.
    *   `"HEAL_HP"`: Restores HP to the target. The amount is specified in a `value` property.
    *   `"DAMAGE_MP"`: Reduces the target's MP.
    *   `"BUFF_STAT"`: Increases a specific stat (defined by `dataId`) on the target for a set number of turns.
4.  **Queue Animation:** The corresponding animation (`animationId` from the skill/item data) is pushed to the `BattleManager`'s animation queue to be played.
