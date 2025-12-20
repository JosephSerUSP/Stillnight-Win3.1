# Campaign Walkthrough: The Shadow of Alencar

**Estimated Playtime:** 5-6 Hours
**Themes:** Memory, Obsession, Decay, Hope in Darkness.

## Overview
The player takes on the role of the **Summoner (Alex)**, arriving in the town of **Alencar** (formerly Stillnight), a settlement perched on the edge of the **Void**. The Void is not just darkness; it is the erasure of existence. The town is slowly being forgotten, physically and conceptually, by the rest of the world.

The Summoner's goal is to delve into the **Abyssal Dungeon** beneath the town to find the **Anchors**—ancient relics that can stabilize reality and prevent Alencar from dissolving into nothingness.

## Cast of Characters

### The Town of Alencar
1.  **Alicia (The Alchemist)**: A bubbly but deeply insecure pink-haired girl. She runs the consumables shop. She is infatuated with Laura.
    *   *Arc*: "The Potion of Permanence". She believes if she can make herself "unforgettable", Laura will love her.
2.  **Laura (The Goldsmith)**: A pragmatic, flirtatious blonde woman. She is engaged to Raphael, a knight who went missing in the dungeon weeks ago.
    *   *Arc*: "The Golden Promise". She refuses to believe Raphael is gone and demands proof.
3.  **Kael (The Blacksmith)**: A disgraced, one-armed knight who now forges weapons. He blames himself for the town's decay.
    *   *Arc*: "Reforging Honor". He seeks to forge a weapon capable of slaying the Void Beasts.
4.  **Vex (The Auctioneer)**: A mysterious, hooded figure who trades in "memories" and artifacts.
    *   *Arc*: "The Ledger of Lost Things". He wants to recover the memories of the townspeople that the Void has stolen.

---

## Walkthrough

### Prologue: The Arrival (0:00 - 0:30)
*   **Event**: The Summoner wakes up in the Town Square. The sky is a bruising purple.
*   **Interaction**: Meet **Alicia** at the item shop. She gives the player a basic **Potion** and mentions that "things have been disappearing lately. Not just keys, but... streets."
*   **Interaction**: Meet **Laura** near the dungeon entrance. She warns the player about the **Void Sickness** and asks if they've seen a man in silver armor (Raphael).
*   **Mission**: Enter **Floor 1: The Entry Hall**.
    *   *Goal*: Reach the stairs to Floor 2.
    *   *Tutorial*: Learn combat, recruitment, and the "Sacrifice" mechanic (healing at shrines by giving up max HP or items).
    *   *Boss*: **Void Wisp**.

### Act 1: The Missing Pieces (0:30 - 2:00)
The player establishes a loop: Delve -> Gather Resources -> Return to Town -> Upgrade.

*   **Quest 1: Alicia's Request - "Sweet Nectar"**
    *   Alicia needs **Glow-Moss** from **Floor 2: Chasm Crossing** to brew a potion.
    *   *Gameplay*: Navigate the windy bridges of Floor 2. Avoid or fight **Wind Elementals**.
    *   *Reward*: Unlocks **Hi-Potions** in the shop.
    *   *Narrative*: Alicia hints she plans to use the potion on herself to become "brighter" for Laura.

*   **Quest 2: Kael's Request - "The Dull Blade"**
    *   Kael asks for **Iron Ore** from **Floor 3: Rusted Choir**.
    *   *Gameplay*: Floor 3 is filled with metallic enemies (Golems). Physical resistance is high; magic is encouraged.
    *   *Reward*: Unlocks **Tier 2 Weapons** (Steel).
    *   *Narrative*: Kael recognizes a broken sword found in the dungeon. It belonged to his former squad.

*   **Major Beat**: Upon returning to town after clearing Floor 3, a building (The Library) has vanished. No one remembers it except the Summoner and Vex.

### Act 2: The Deepening Shadow (2:00 - 4:00)
The stakes rise. The town is physically shrinking.

*   **Quest 3: Laura's Desperation - "The Signet Ring"**
    *   Laura spots a **Crimson Lord** on **Floor 4: Cryptic Vault** wearing a familiar ring.
    *   *Mission*: Hunt the Crimson Lord. This is a mini-boss fight.
    *   *Gameplay*: The Cryptic Vault has teleport traps.
    *   *Outcome*: The player retrieves the ring. It is Raphael's. He was turned into a monster.
    *   *Narrative*: Laura breaks down but thanks the player. She gives the player **Raphael's Shield** (Accessory).

*   **Quest 4: Vex's Bargain - "Bottled Memories"**
    *   Vex asks the player to find **Memory Jars** scattered on **Floor 5: Blood Chapel**.
    *   *Gameplay*: High enemy density. Vex pays in **Soul Coins** (currency for rare items).
    *   *Narrative*: Vex reveals he is not human, but a construct trying to catalog humanity before it's wiped out.

*   **Quest 5: Alicia's Folly - "The Unforgettable"**
    *   Alicia goes missing. She went to **Floor 6** to find the "Eternal Rose".
    *   *Mission*: Rescue Alicia.
    *   *Outcome*: Find Alicia cornered by shadows. Save her. She confesses her feelings to the air, realizing she doesn't need a potion, she needs courage. (She doesn't get Laura, but she gets self-respect).

### Act 3: The Abyssal Heart (4:00 - 5:30)
The final descent. The town is now just the shops and the square. The sky is black.

*   **Location**: **Floors 7-9: The Void Sanctum**.
    *   *Environment*: Glitchy tiles, enemies that copy the player's party, silence instead of music.
*   **Boss**: **The Erasure**. A being of pure negative space.
    *   *Mechanics*: It bans certain elements during the fight.
*   **Finale**: The Summoner defeats the Erasure. They find the **Core Anchor**.
*   **Choice**:
    1.  **Restore Alencar**: The town returns, but the Summoner fades away, becoming the new Anchor.
    2.  **Save Themselves**: The Summoner leaves. Alencar is forgotten, but the NPCs live on as refugees in the player's party.

## Gameplay Mechanics to Implement
1.  **Town Hub Updates**: Visual changes to the town background as the "corruption" spreads.
2.  **NPC Dialogue System**: Dynamic dialogue based on quest progress.
3.  **New Floors**: Expand `maps.json` to 9 Floors.
4.  **New Items/Enemies**: Add "Memory Jars", "Glow-Moss", "Void Beasts".
5.  **Quest Tracking**: Simple journal or dialogue cues.
