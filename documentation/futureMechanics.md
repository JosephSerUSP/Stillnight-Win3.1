--- START OF FILE documents/futureMechanics.md ---

# Proposed Game Mechanics

## Mechanic #1: The Sacrifice System

### Overview
**Sacrifice** allows the player to permanently remove units from their party to obtain special, semi-random rewards. This system turns obsolete or dead units into valuable resources (Gold, Items, or Skills).

### Core Rules
1.  **Eligibility:** Any unit in the party roster can be sacrificed.
2.  **Irreversibility:** Once a unit is sacrificed, it is permanently removed from the game.
3.  **Reward Scaling:** Rewards are determined by a lookup table based on the unit's **Effective Level**.

### Perished Units & Penalty Logic
Units that have perished (0 HP) at the end of a battle can still be sacrificed, but they incur a strictly calculated level penalty.

*   **Living Unit:** Effective Level = Current Level.
*   **Perished Unit:** Effective Level is calculated using the following formula:

$$
\text{Effective Level} = \lfloor((\text{Current Level} - 1) \times 0.7) + 1\rfloor
$$

### Reward Table (Draft)
Rewards are semi-random. Upon sacrifice, the system checks the unit's **Effective Level** against the table below to determine the payout.

| Effective Level | Reward Category | Outcome / Condition |
| :--- | :--- | :--- |
| **Lv. 1** | Consumable | **Potion** |
| **Lv. 1** | Currency | **25 Gold × Unit Level** *(Subject to penalty)* |
| **Lv. 3** | Loot Pool | Selection from **Generic Item Pool #3** |
| **Lv. 4** | Equipment / Item | **Potion** OR **Steel Blade** (Random chance) |
| **Lv. 5** | Currency | **200 Gold** OR **Random(12–100 Gold)** |
| **Lv. 9** | Conditional | If Party Gold ≥ 2000: **Midas Guard**<br>Else: **Potion** |
| **Lv. 15** | Skill Item | **Skill Book: WindBlade** |

--- END OF FILE documents/futureMechanics.md ---