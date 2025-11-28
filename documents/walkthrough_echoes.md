# Let's Play: The Echoes of Aethelgard (100% Completion Guide)

**By: LoreSeeker99**
**Posted: Nov 28, 2025**

## Introduction
So you've stumbled into the *Stillnight Stack*. You probably tried to rush Floor 1, hit the stairs, and got the message: *"The Rusted Gate is sealed."* Yeah, the devs actually put a story in this one. You can't just speedrun it (at least, not the first time).

Here is the definitive guide to ascending the Spire of Aethelgard, dealing with the Silence, and getting both endings.

---

## Zone 1: The Whispering Base (Floors 1-5)

### Floor 1: The Gatekeeper
You spawn in. The music is this eerie, quiet drone. Don't wander aimlessly.
**Objective:** Open the Stairs.
1.  **The Stairs:** If you touch them immediately, you get a "Locked" message.
2.  **Custodian Kael:** Find the NPC marked `K`. He's usually near the center. Talk to him. He's glitching out—"Memory core... damaged." He needs a **Rusty Gear**.
3.  **The Hunt:** Explore the map. You're looking for a specific Treasure chest. It's guaranteed to spawn on this floor. Inside is the **Rusty Gear**.
4.  **Return:** Bring it to Kael. He has a cool little repair animation (text-based, but hey). He says *"Systems online"* and gives you the **Archive Key**.
5.  **Descend:** Now the stairs work.

*Tip: Grab the "Wind Blade" skill from a recruit if you can. The rats here are weak to Green.*

### Floor 5: The Crimson Gate
Floors 2-4 are standard dungeon crawling. Grind some XP. You want to be at least Level 5 before Floor 5.
**Boss:** Crimson Lord.
**The Gimmick:** The stairs on Floor 5 aren't just locked; they are *guarded*. The Crimson Lord is a unique enemy standing ON the exit tile (or blocking the corridor).
**Strategy:**
-   He uses *Shadow Claw*. Have your tank (Grom or a Golem) taunt.
-   When he dies, a script triggers: *"The Lord dissolves into ash."*
-   **Crucial:** This sets the `f5_boss_dead` flag. Without this, the stairs script won't let you pass.

---

## Zone 2: The Clockwork Heart (Floors 6-10)

### Floor 6: The Barrier
New Zone, new mechanics. The enemies here are "Keepers"—machines.
You might think you can just walk down, but Floor 6 has a **Security Check**.
**Event:** A terminal asks for authorization.
**Solution:** If you saved Kael in Floor 1, you have the **Archive Key**. The terminal recognizes it: *"Access Granted: Unit 01 Authorization."*
*Note: If you didn't do Kael's quest (how did you get here? noclip?), you'd be stuck.*

### Floor 10: The Architect's Dilemma
This is the mid-game narrative peak.
**NPC:** The Grand Architect (`A`).
He stops you before the stairs. He doesn't attack immediately.
**Dialogue Choice:**
1.  *"We are here to save the world."* -> He calls you inefficient. Fight starts.
2.  *"We seek to be archived."* -> He considers it. Requires passing a check (maybe having `architect_blueprint` found on F8?).
**Outcome:**
-   **Violence:** Kill him. He drops **Logic Core**. Stairs unlock.
-   **Diplomacy:** He steps aside. You get no XP but keep your health.
*Most players kill him for the loot.*

---

## Zone 3: The Silent Summit (Floors 11-15)

### Floor 15: The Zenith
This is it. No enemies (usually), just the Core.
**The Choice:**
You interact with the "Singularity" (`!`).
The game explains that the Spire isn't saving the *people*, it's saving the *data* of the world to reboot it later.
**Option A: Archive (Bad/Neutral Ending)**
-   You agree to the process. The screen fades to white. "World Archived."
**Option B: Shatter (True/Chaos Ending)**
-   You break the machine. The Silence floods in, but so does the Chaos of life. "Rebirth Initiated."

## Checklist
-   [x] Floor 1: Rusty Gear -> Kael.
-   [x] Floor 5: Kill Crimson Lord.
-   [x] Floor 10: Deal with Architect.
-   [x] Floor 15: Make the choice.

Good luck, Echoes.
