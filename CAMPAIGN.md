# The Echoes of Aethelgard

**A Dark Fantasy Campaign for the Stillnight Engine**

## Narrative Overview

**Premise:**
The Kingdom of Aethelgard has been swallowed by the "Hollow Eternity," a temporal anomaly created by the sorcerer-king Malacor to cheat death. Now, the kingdom exists in a fractured state, repeating the same twilight hours endlessly. The player controls a squad of "Echo Walkers"—souls who have retained their consciousness across the loops. Their mission: Ascend the Spire of Aethelgard, defeat the corrupted guardians, and break the Hourglass of Malacor.

**Themes:** Memory, decay, inevitability, and sacrifice.

## Campaign Structure (10 Floors)

The campaign is a linear ascent through 3 distinct zones, culminating in the Spire.

### Zone 1: The Ashen Outskirts (Floors 1-3)
*Setting:* The ruined city streets surrounding the castle. Ash falls like snow.
*   **Floor 1: The Silent Gate**
    *   *Intro:* "The gates of Aethelgard stand open, rusted by centuries of a single night."
    *   *Enemies:* Hollow Militia, Ash Rats, Cinder Wisps.
    *   *Boss:* None.
*   **Floor 2: The Crumbling Market**
    *   *Intro:* "Stalls still hold rotted fruit from a harvest that never ends."
    *   *Event:* "The Starving Merchant" (Rare Shop/NPC).
*   **Floor 3: The Cathedral of Dust**
    *   *Intro:* "Prayers hang frozen in the cold air."
    *   *Boss:* **The Belltoll Gargoyle** (Stone/Sonic). Blocks the path to the inner city.

### Zone 2: The Gilded Halls (Floors 4-6)
*Setting:* The opulent, yet twisted interior of the castle. Gold is melted, portraits are screaming.
*   *Enemies:* Gilded Armor, Mirror Mimics, Court Jesters (Madness).
*   **Floor 4: The Hall of Mirrors**
    *   *Intro:* "Your reflections show the faces you wore in lives before."
    *   *Mechanic:* High chance of "Doppelganger" events (fight your own party copies).
*   **Floor 5: The Royal Banquet**
    *   *Intro:* "A feast laid for ghosts. The wine has turned to vinegar and blood."
*   **Floor 6: The Throne Room**
    *   *Boss:* **Queen Aeliana, the Weeping** (Ghost/Water). She weeps for a child never born.

### Zone 3: The Spire of Time (Floors 7-9)
*Setting:* Abstract geometry, floating platforms, gears, and starry voids.
*   *Enemies:* Time Wraiths, Clockwork Sentinels, Paradox Beings.
*   **Floor 7: The Gearworks**
    *   *Intro:* "The heartbeat of the curse. Gears grind the bones of the fallen."
*   **Floor 8: The Fractured Observatory**
    *   *Intro:* "The stars here are wrong. They form constellations of despair."
*   **Floor 9: The Precipice of Seconds**
    *   *Intro:* "One step from eternity."
    *   *Boss:* **The Chrono-Lich Malacor** (Time/Dark).

### The Finale (Floor 10)
*   **Floor 10: The Shattered Hourglass**
    *   *Event:* The final choice. Destroy the hourglass (End the loop, everyone dies peacefully) or Seize it (Become the new Lord of Time).

## New Data Requirements

### Actors (Enemies)
1.  **Hollow Militia** (Weak, Physical)
2.  **Ash Rat** (Fast, Disease)
3.  **Cinder Wisp** (Fire, Self-Destruct)
4.  **Belltoll Gargoyle** (Boss, High DEF, AOE Stun)
5.  **Gilded Armor** (High HP, Slow)
6.  **Mirror Mimic** (Copies stats - *implementation complexity: medium*) -> *Simplification: High EVA, variable damage*
7.  **Court Jester** (Random effects, Debuffs)
8.  **Queen Aeliana** (Boss, Drain HP, Summon ghosts)
9.  **Clockwork Sentinel** (Mechanical, High Physical Resist)
10. **Time Wraith** (Teleports/Miss chance, Haste)
11. **Paradox Being** (Shifting Elements)
12. **Malacor, the Chrono-Lich** (Final Boss, Time Stop, Doom)

### Items
1.  **Ashen Blade** (Weapon, basic)
2.  **Clockwork Shield** (Shield, +DEF, +Initiative)
3.  **Ghostly Veil** (Armor, +EVA)
4.  **Vial of Starlight** (Potion, Full Heal)
5.  **Rust-Eater** (Consumable, Cure Defense Down)
6.  **Mirror Shard** (Accessory, Reflect Magic chance)
7.  **Hourglass Sand** (Consumable, Haste party)
8.  **Royal Signet** (Accessory, +MaxHP)
9.  **Void Key** (Key Item, unlocks Floor 10)
10. **Memory Crystal** (XP Item)

### Skills
1.  **Ash Breath** (Enemy, Fire/Blind)
2.  **Sonic Shriek** (Gargoyle, Stun)
3.  **Gilded Slam** (Physical, High Dmg)
4.  **Wail of Sorrow** (Queen, MP Drain or Debuff)
5.  **Temporal Shift** (Wraith, +EVA buff)
6.  **Gear Grind** (Physical, Bleed)
7.  **Time Stop** (Malacor, Skip player turn - *Major mechanic*)
8.  **Doom** (Apply 'Death in 3 turns' state)
9.  **Holy Smite** (Player, effective vs Undead)
10. **Chronal Trigger** (Player, Reset cooldowns? Or Haste)

## Mechanics to Implement
1.  **Story Modals:** Pause gameplay on floor entry to show narrative text.
2.  **Boss Events:** Fixed encounters that must be cleared to reveal the stairs.
3.  **Locked Stairs:** Stairs on Floor 3, 6, 9 require a "Boss Defeated" flag or Key Item.
