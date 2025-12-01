# Gameplay System Analysis & Deep Dive

This document contains a comprehensive analysis of the current state of *Stillnight*, focusing on systems, mechanics, interactions, and meta-strategies. It identifies critical opportunities for expansion, balancing, and bug fixing.

## 1. Executive Summary

*Stillnight* is a dungeon crawler with a solid foundation (procedural maps, turn-based combat, party management) but currently suffers from **disconnected data systems** and **mechanics that undermine their own complexity**.
The most critical findings are:
1.  **Broken Elemental System**: The data file `elements.json` uses different keys ("Light", "Dark") than the rest of the game ("White", "Black"), rendering elemental weaknesses/resistances non-functional.
2.  **Infinite Sustain**: Skills have no cost (MP/CP). Coupled with traits like `POST_BATTLE_HEAL` and free healing skills (`soothingMote`), the optimal strategy is to stall and heal indefinitely, removing attrition as a threat.
3.  **The Sacrifice Loop**: The economy allows for a loop where recruiting low-level units and sacrificing them is potentially more profitable than exploration, encouraging a "meat grinder" meta.

## 2. Core Systems Deep Dive

### 2.1. Battle System
**Mechanics:**
*   **Turn-Based**: Standard queue-based system.
*   **Formation**: 2x2 Grid (Front/Back).
    *   *Current Logic*: Front Row deals +1 Damage. Back Row deals -1 Damage.
    *   *Issue*: There is no defensive benefit to the Back Row. Enemy targeting is random (`randInt`). Thus, placing units in the Back Row is strictly suboptimal.
*   **Skills**: Defined in `data/skills.js`.
    *   *Issue*: **Skills are free.** There is no MP, CP, or Cooldown system implemented in `BattleManager` or `data/skills.js`. This flattens tactical decision-making to "Always use best skill".

**Elemental System Failure:**
*   `actors.json` uses: `Red`, `Green`, `Blue`, `White`, `Black`.
*   `elements.json` defines: `Light`, `Dark`, `Bone`, `Wind`, `Earth`, `Water`.
*   **Result**: `BattleManager.elementMultiplier` fails to find keys like "Red" in the elements object, defaulting all multipliers to `1.0`.

### 2.2. Progression & Evolution
**Mechanics:**
*   **XP**: Linear-ish curve. XP is gained on victory or via items.
*   **Evolution**: Manual trigger via `Window_Inspect`. Requires Level, Item, Floor, or Gold.
    *   *Logic*: Replaces the `Game_Battler` instance with a new one based on the evolved form's ID.
    *   *Impact*: **Skill Reset**. Since `Game_Battler` initializes skills from the actor data, evolving a unit wipes any unique state (like learned skills, if that system existed) and replaces it with the species default. Currently, this is fine as there is no "learning" system, but it limits future depth.

**Permadeath & Rebirth:**
*   **Death**: `hp <= 0` removes the unit permanently unless `ON_PERMADEATH` trait is present.
*   **Rebirth**: "Phoenix" style units lose 2 levels to revive.
    *   *Math*: Leveling up gains ~3 MaxHP. De-leveling loses ~3 MaxHP. The net result is neutral. This allows for "Rebirth Farming" without long-term stat decay, making these units effectively immortal if you can grind the XP back.

### 2.3. Economy & The "Meat Grinder"
**Loop:**
1.  **Recruit**: Find recruits (Imp, Skeleton) in dungeon.
2.  **Sacrifice**: Use `Window_Inspect` to sacrifice them.
    *   *Value*: `Level * (HP + MaxHP)`.
    *   *Example*: A generic Lv1 unit with 10 HP/10 MaxHP gives `1 * 20 = 20G`.
3.  **Shop**: Buy `HP Tonic` (10G).
    *   *Profit*: 10G per sacrifice (net).
    *   *Meta*: Recruiting trash mobs is a consistent income source, incentivizing a playstyle where you treat new recruits as currency rather than allies.

### 2.4. Map & Exploration
**Mechanics:**
*   **Fog of War**: Working as intended.
*   **Traps**: Hidden events revealed by `SEE_TRAPS` passive.
*   **Events**: Shrines offer risk/reward (HP for XP). With "Infinite Sustain" (free healing), the "pay HP" cost is negligible. You should *always* take the HP cost option because you can heal it back for free immediately after.

## 3. Emergent Gameplay Scenarios

### Scenario A: The Immortal Battery
*   **Setup**: 1 Healer (Pixie), 1 Tank.
*   **Strategy**: In every battle, kill all but one weak enemy. Have the Healer spam `soothingMote` (Free) until everyone is 100% HP.
*   **Result**: You start every battle at full health. Consumables (`HP Tonic`) become vendor trash to be sold for Gold.

### Scenario B: The Necro-Economy
*   **Setup**: Empty party slots.
*   **Action**: Enter Floor 1. Recruit everything.
*   **Action**: Sacrifice everything immediately.
*   **Result**: Infinite Gold generation with low risk. Use Gold to buy Equipment for the "Main" party.

### Scenario C: The Useless Backline
*   **Setup**: Putting a Squishy caster in the Back Row.
*   **Expectation**: They take less damage.
*   **Reality**: They take the same damage (random targeting) but deal 1 less damage.
*   **Meta**: Put everyone in the Front Row. Always.

## 4. Recommendations for Refactoring

### Phase 1: Critical Fixes
1.  **Fix Elements**: Rename keys in `data/elements.json` to match `Red`, `Green`, `Blue`, `White`, `Black`.
2.  **Add Skill Costs**:
    *   Add `cost` field to `data/skills.js`.
    *   Implement `mp` or `cp` (Consumption Points) on `Game_Battler`.
    *   Deduct cost in `BattleManager.executeAction`.
    *   Prevent usage if cost unmet.

### Phase 2: Balancing & Depth
3.  **Row Mechanics**:
    *   Implement **Melee/Ranged** tags for skills. Melee attacks against Back Row should have a penalty or be impossible unless Front Row is clear.
    *   Give Back Row a defense bonus (e.g., 20% less dmg taken).
4.  **Attrition**:
    *   If skills remain free, add a "Fatigue" system or limit "Stall" turns (e.g., enemies enrage).
    *   Or, make Healing skills cost `Magnetite` (a resource mentioned in memory but not seen in code) or consumable items.
5.  **Traits Expansion**:
    *   Add traits that synergize with rows (e.g., `Sniper`: +Dmg from Back Row).
    *   Add "On Evolution" traits to carry over bonuses.

### Phase 3: Content Expansion
6.  **Complex Enemies**: Enemies that target specific rows, or exploit elements.
7.  **Dynamic Shops**: Prices fluctuate or inventory changes based on floor depth.
8.  **Equipment Diversity**: Weapons that allow Melee attacks from Back Row (Spears).

## 5. Technical Debt Notes
*   **Code Duplication**: `Game_Battler` logic for stats is clean, but `BattleManager` has some hardcoded logic for rows/AI that could be moved to data.
*   **Test Coverage**: Tests need to cover the *interaction* of these systems (e.g., ensuring a Fire unit actually takes 1.5x damage from Water) to prevent regressions like the current Elemental bug.
