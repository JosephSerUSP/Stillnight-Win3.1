# Item Refactor System: Design & Architecture

## Overview
The "Item Refactor" system allows players to enhance equipment by fusing items together. This system adds depth to the loot economy, making duplicate drops valuable and allowing players to customize their builds by transferring specific traits (like "HP Regen" or "Crit Chance") between items.

This document outlines the architectural changes required to support this feature and proposes three different gameplay implementations.

## Architectural Requirements

### 1. From Shared References to Unique Instances
**Current State:**
The game currently treats items as immutable references to objects defined in `data/items.json`. If the player possesses two "Silver Blades", the inventory contains two references to the same object in memory. Modifying one would modify both.

**Required Change:**
To support unique modifications (e.g., one Silver Blade having +5 Atk and another having +2 Atk), the inventory system must store **unique instances** of items.

#### New Class: `Game_Item`
A new wrapper class `Game_Item` should be introduced to encapsulate item data and handle unique traits.

```javascript
class Game_Item {
    constructor(data) {
        this.id = data.id;
        this.templateId = data.id; // Reference to original data
        this.name = data.name;
        this.type = data.type; // 'equipment', 'consumable'
        this.equipType = data.equipType; // 'Weapon', 'Armor', etc.
        this.icon = data.icon;
        this.description = data.description;
        this.price = data.cost;

        // Deep copy traits to allow modification
        this.traits = data.traits ? JSON.parse(JSON.stringify(data.traits)) : [];

        // Unique Instance ID (UUID) for tracking
        this._uuid = crypto.randomUUID();
    }

    /**
     * Checks if this item is essentially the same as another (for stacking logic, if applicable).
     * For equipment, this usually returns false unless UUIDs match.
     */
    equals(otherItem) {
        return this._uuid === otherItem._uuid;
    }
}
```

#### Update: `Game_Party` Inventory Management
The `Game_Party` class must be updated to instantiate `Game_Item` objects when adding to the inventory.

*   `getInventory` in `data/party.js` must return `new Game_Item(data)`.
*   Shop purchases must instantiate new items.
*   Loot drops must instantiate new items.

### 2. Trait Structure & Stacking
The system relies on the standard `trait` structure: `{ code, dataId, value }`.

*   **Stacking Rules:** The system needs logic to determine if traits stack.
    *   `PARAM_PLUS`: Stacks additively (Atk +1 & Atk +2 -> Atk +3).
    *   `PARAM_RATE`: Stacks multiplicatively? Or additively? (Usually additive in this context for UX clarity).
    *   `Unique/Boolean Traits` (e.g., `SEE_WALLS`): Do not stack.

## Implementation Variants

We propose three variants for the gameplay mechanics.

### Variant A: "The Anvil" (Fusion & Inheritance)
*Inspired by: Disgaea, Final Fantasy Tactics*

**Concept:**
A direct "Feed B to A" system. You select a **Target Item** and a **Material Item**. The Material is destroyed to enhance the Target.

**Rules:**
1.  **Same-Item Fusion (Reinforcement):**
    *   Condition: Target and Material have the same `templateId` (e.g., both are "Silver Blade").
    *   Effect: All numerical traits on the Target are increased by a set amount (e.g., +10% of base value, or +1 flat).
    *   *Example:* Silver Blade (Atk+1) + Silver Blade -> Silver Blade +1 (Atk+2).

2.  **Different-Item Fusion (Inheritance):**
    *   Condition: Target and Material are different items.
    *   Effect: The Target inherits specific traits from the Material.
    *   Constraints:
        *   **Slot Limit:** Items have a max number of traits (e.g., 4).
        *   **Conflict:** If Target already has the trait type, it upgrades the existing one (slower than Same-Item fusion) or is ignored.
    *   *Example:* Silver Blade (Atk+1) + Wind Charm (Spd+2) -> Silver Blade (Atk+1, Spd+2).

**UI Workflow:**
1.  Open "Refactor" Menu.
2.  Select Target Item (Equipment only).
3.  Select Material Item (Equipment only).
4.  Preview Window shows the "Before" vs "After" state.
5.  Confirm -> Animation -> Material removed, Target updated.

---

### Variant B: "The Socket System" (Modular Components)
*Inspired by: Diablo, Path of Exile*

**Concept:**
Items are containers. You don't fuse items directly; you dismantle items into **Components** (Gemstones/Runes) and insert them into **Sockets**.

**Rules:**
1.  **Dismantle:**
    *   Action: Destroy an item to extract one of its traits as a "Gem".
    *   RNG: Might fail, or you might get to choose which trait to keep.
2.  **Socketing:**
    *   Action: Items have 0-3 "Empty Slots".
    *   Insert a Gem into a Slot to add that trait.
3.  **Removal:**
    *   Gems can be removed (perhaps destroying the item or costing Gold).

**Architecture Impact:**
*   Requires a new Item Type: `Component/Gem`.
*   Requires `Game_Item` to have a `slots` array.

---

### Variant C: "Soul Synthesis" (Roguelike/Randomized)
*Inspired by: Shin Megami Tensei Fusion*

**Concept:**
Merge Item A + Item B to create a brand new Item C.

**Rules:**
1.  **Recipe Logic:**
    *   Sword + Sword -> Better Sword.
    *   Sword + Armor -> Shield?
2.  **Trait Inheritance:**
    *   Item C starts with its base traits.
    *   Then, it inherits X random traits from the pool of A and B's traits.
3.  **Risk:**
    *   Chance for "Mutation" (Trait becomes negative or transforms into a Rare trait).

**Pros:** High excitement, encourages hoarding trash items.
**Cons:** Harder to balance, players might lose good items to bad RNG.

---

## Recommended Choice: Variant A (The Anvil)

**Why?**
*   It fits the "Resource Management" theme. Duplicate drops become valuable resources rather than vendor trash.
*   It is deterministic (Player knows what they will get), which fits the tactical nature of the game.
*   It reuses the existing `trait` system without needing complex new item types (like Gems).

## Technical Implementation Plan (Variant A)

### 1. New Manager: `RefactorManager` (Static)
Located in `src/managers/refactor.js`.

```javascript
class RefactorManager {
    /**
     * Previews the result of fusing material into target.
     */
    static getFusionPreview(target, material) {
        // Clone target to simulate result
        const result = new Game_Item(target);

        if (target.templateId === material.templateId) {
            // Logic for Reinforcement
            this._applyReinforcement(result, material);
        } else {
            // Logic for Inheritance
            this._applyInheritance(result, material);
        }

        return result;
    }

    static _applyReinforcement(item, material) {
        // Boost existing numeric traits
        item.traits.forEach(t => {
            if (t.code === 'PARAM_PLUS') t.value += 1;
        });
        // Add 'Plus' counter to name: "Silver Blade +1"
        item.plusLevel = (item.plusLevel || 0) + 1;
        item.name = `${item.baseName} +${item.plusLevel}`;
    }

    static _applyInheritance(item, material) {
        // Copy non-conflicting traits
        material.traits.forEach(t => {
            if (!this._hasConflictingTrait(item, t)) {
                if (item.traits.length < this.MAX_TRAITS) {
                    item.traits.push({ ...t });
                }
            }
        });
    }
}
```

### 2. UI: `Window_Refactor`
*   **Layout:** Three columns.
    *   Left: Target Selection (Inventory List).
    *   Center: Material Selection.
    *   Right: Preview Panel (Shows Stats Diff).
*   **Interaction:**
    *   Select Target -> List filters to exclude Target.
    *   Select Material -> Preview updates.
    *   "Fuse" Button triggers `Game_Party.consumeItem(material)` and updates Target.

### 3. Data Integrity
*   **Save/Load:** The save system usually serializes `Game_Party`. Since `Game_Item` will be a class, `DataManager.makeSaveContents` and `extractSaveContents` might need to handle re-instantiation of these objects (hydration) if JSON serialization strips the class prototype.
    *   *Solution:* Use a `reviver` or manually map inventory arrays back to `new Game_Item(data)` on load.

## Future Considerations
*   **Catalysts:** Items that improve success rate or boost stat gain during fusion.
*   **Skills:** Inheriting "Skills" (Actions) instead of just passive traits.
