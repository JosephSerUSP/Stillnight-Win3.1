# Campaign Walkthrough: The Depths of Alencar
## A Design & Narrative Deep Dive

**Setting:** Post-Apocalyptic Medieval / Techno-Arcane
**Tone:** Oppressive, Melancholic, Textural
**Length:** ~5 Hours (Vertical Slice of a larger world)

---

## I. Introduction: The World of Alencar

The campaign begins in **Alencar**, a town clinging to the edge of a massive, technological crater known only as "The Throat." The setting is "Rusty Medieval" — knights wear plate armor patched with street signs; swords are forged from re-purposed industrial girders. There are no gods, only the "Signals" — ghostly transmissions from the Old World that some can hear and manipulate.

The Player Character is a **Summoner** named **Alex** (default). In this world, Summoners are living antennas, capable of tuning into the Signals to manifest "Programs" (demons/spirits) into physical form.

**Design Philosophy: The Summoner as the Anchor**
The Summoner is the game's "King" piece.
*   **Mechanic:** `Game_Party.summoner`. The Summoner has high MP (`maxMp: 820`) but fragile HP (`maxHp: 18`).
*   **Constraint:** Every step in the dungeon drains MP. Every spell cast drains MP.
*   **Tension:** MP is both *Health* (for the run) and *Ammo* (for battles). Running out of MP doesn't kill you immediately; it applies the `WEAKENED` state to your party (reduced stats, HP rot), creating a "death spiral" that forces a desperate retreat or a risky push forward.

---

## II. Chapter 1: The Signal (Tutorial & Early Game)

### 1.1 The Hook: Alencar Upper Ward
The game opens with Alex standing at the lip of The Throat. The sky is a bruise of purple and gray smog.
**NPC Interaction:** **Elder Jace** (a man whose face is half-covered by a rebreather) approaches.
> "The vents are clogged, Alex. The smog is thickening. If we don't restart the turbines on Floor -5, Alencar dies tonight. Take this."

**Item Acquired:** **Rusty Receiver** (Key Item).
**Tutorial:** The Receiver hums. It allows you to see "Signal Ghosts" (save points/tutorial markers).

### 1.2 The Descent: Floor -1 "The Rust Gardens"
You descend a rickety elevator. The doors open to a biome of overgrown metallic vines and mud.
*   **Visuals:** CRT monitors half-buried in the dirt, flickering with static.
*   **Audio:** Wind howling through pipes, distant static crackles.

**Mechanical Introduction:**
As you take your first 10 steps, a notification pops: *"-10 MP (Step)"*.
*   **Design Note:** This is the first lesson. Exploration is not free. You check your menu: `MP: 810/820`. It seems negligible now, but the seed of anxiety is planted.

### 1.3 Combat: The First Manifestation
A **Rat** (Reskinned `Imp` with `Red` element) jumps from a pile of scrap.
**Battle Start.**
*   **Turn 1:** Alex tries to attack. `Damage: 1`. The Rat bites back for `4 damage`.
*   **Lesson:** The Summoner is weak.
*   **Turn 2:** You use the **Summon** command (Menu). You call forth your starter units:
    1.  **Pixie** (Healer, `Green` element).
    2.  **Skeleton** (Attacker, `Black` element).
*   **Turn 3:** The Skeleton uses `Bone Rush`. `Damage: 8`. The Rat dies.

**Post-Battle:**
> *"Skeleton's ribcage rattles. (MaxHP +1)"*
*   **Design Note (Usage-Based Progression):** This text line is crucial. It teaches the player that *taking hits* increases HP, and *dealing damage* increases STR. The character sheet is written by gameplay, not a level-up table.

### 1.4 The "Egg" Dilemma
Deep in the eastern quadrant of Floor -1, guarded by two Rats, you find a **Mystic Egg** item.
You use it in the menu.
> *"The egg cracks. A slimy, wriggling Larva emerges."*

**New Party Member:** **Larva**.
*   **Analysis:** You check its stats. `HP: 12`, `Skills: None`.
*   **Trait:** `Parasite` - *"Consumes 20% of party XP."*
*   **The Choice:** It's useless in a fight and actively hurts your progression. Do you keep it?
    *   **Hint:** The flavor text says: *"It hungers for greatness."*
    *   **Design Philosophy:** We reward curiosity and patience. Most players will discard it. Those who keep it are playing the "long game," which aligns with the game's endurance themes.

---

## III. Interlude: Campfire at Depth -2
Between floors, you find a "Safe Zone" — a dry patch of concrete with a functioning vending machine.
**Menu:** Camp.
*   **Alex:** "We have enough supplies for one meal."
*   **Party Interaction:** The Pixie flits around the glowing buttons of the vending machine. The Skeleton stares at a wall.
*   **Mechanic:** You feed the **Larva** your last ration.
    *   **Feedback:** *Larva vibrates happily. (Friendship +1)*.
    *   **Resource Sink:** Rations are scarce. Using one here means you can't heal the Skeleton fully.

---

## IV. Chapter 2: The Static (Mid Game)

### 2.1 Floor -3: The Server Tomb
The environment shifts. The "organic" rust is replaced by clean, cold server racks. The air hums.
**Enemies:**
*   **Glitch** (Reskinned `Wisp`, `Blue` element): High evasion, casts "Static Shock".
*   **Security Drone** (Reskinned `Bat`, `White` element): Fast, alerts other enemies.

### 2.2 Feature Highlight: Elemental Tuning
You encounter a room filled with **Glitches** (Blue). Your `Red` attacks (from the Rat soul you might have equipped) are doing 50% damage (`Resist`).
**Loot:** You find a **Mercury Crest** (Accessory).
*   **Description:** "Ornate and delicate, its blue sheen is comforting."
*   **Trait:** `ELEMENT_CHANGE: 'Blue'`.

**The Strategy:**
You equip the Crest on the **Skeleton**.
*   **Before:** Skeleton (`Black`) vs Glitch (`Blue`) -> Neutral Damage.
*   **After:** Skeleton (`Blue`) vs Glitch (`Blue`) -> **1.25x Damage (Element Match Bonus)**.
*   **Wait, that's not right?** In this system, same-element attacks *buff* the attacker (Resonance) or *resist* (typical RPG)?
    *   **Clarification:** In our Unified System, `elements` array on a battler acts as an *outgoing multiplier* for abilities of that element (1.25x). It *also* acts as resistance to incoming damage of that element.
    *   **Correction:** By making the Skeleton `Blue`, he now *resists* the Glitches' attacks (0.75x Damage Taken). His `Bone Rush` (`Black` element) doesn't get a damage bonus, but his *survival* skyrockets.
    *   **Design Note:** This teaches defensive customization. You tune your party to survive the environment.

### 2.3 Boss: The Firewall Guardian (Golem Variant)
A massive, rusted Golem blocks the elevator to Floor -4.
*   **Boss Traits:** `High DEF`, `Weakness: Green`.
*   **The Turn:** The Golem charges a massive attack (`Telegraph: "The pistons hiss..."`).
*   **Player Action:** Alex checks MP. `MP: 120/820`. Dangerously low.
*   **Choice:**
    1.  Cast **"Wall"** (50 MP) to survive the hit? (Leaves 70 MP - barely enough to walk to the exit).
    2.  Risk it and attack?
*   **The Play:** Alex casts "Wall". The Golem slams down. The party takes 15 damage instead of 30. Everyone survives with < 5 HP.
*   **The Turnaround:** The **Pixie**, having cast `Heal` every turn for the last hour, hits Level 6 mid-fight.
    *   **Evolution:** *Pixie is enveloped in light! Evolved into High Pixie!*
    *   **New Skill:** `Holy Smite` (White Damage).
    *   **Climax:** High Pixie casts Holy Smite. It crits. The Golem crumbles.

---

## V. Chapter 3: The Echo (Late Game)

### 3.1 Floor -5: The Ventilation Array
The air here is sterile. The "monsters" look like half-formed sketches—wireframe models. The walls are scrolling text.

### 3.2 Narrative Twist: The Truth
You reach the control terminal. It's not a turbine. It's a **Console**.
**Speaker:** A **Brain in a Jar** connected to the console.
> "Signal limit reached. User 'Alex' is requesting administrative access. Denied."
> "Why do you persist, Debugger? The simulation 'Alencar' is corrupted. We are purging the cache."

**Realization:** Alencar isn't a town. It's a simulation buffer. Alex isn't a human; he's a debugging tool / antivirus. The "Demons" are deleted files. The "Glitches" are the system trying to fix itself.

### 3.3 The Sacrifice
To override the lockout, the Brain demands a "High-Entropy Data Signature."
**System Prompt:** *Sacrifice a Party Member to bypass the firewall?*

*   **The Weight:** You look at your party.
    *   The **Skeleton** who has been with you since Floor -1.
    *   The **High Pixie** who saved you at the Golem.
    *   The **Larva**... wait.
*   **The Larva Payoff:** If you kept the Larva, it is now Level 6. It evolves into **Crimson Lord** (Vampire).
    *   *Crimson Lord*: "My hunger is sated, Master. I am ready."
*   **The Choice:** You sacrifice the **Skeleton**.
    *   **Visual:** The Skeleton pixelates and dissolves into binary code.
    *   **Audio:** A sad, 8-bit descending scale.
    *   **Reward:** **Bone Plate** (Armor) + **"Survivor's Guilt"** (Passive on Alex: Summon Speed UP, Max MP DOWN).
    *   **Design Philosophy:** Mechanics as storytelling. You literally "spent" a friend to progress.

---

## VI. Chapter 4: The Source (Finale)

### 4.1 Floor -99: The Kernel
Reality breaks down. The floor tiles are replaced by floating code blocks. The background is a scrolling parallax of "System Error" messages.

### 4.2 The Gauntlet
You must fight through 3 waves of **"Anti-Virus Seraphs"** (Reskinned Angels, `White` element).
*   **Challenge:** They use `Purge` (Removes all buffs).
*   **Counter:** You rely on **"Raw Data"** items (Grenades) you collected, which deal unblockable `Almighty` damage.

### 4.3 Final Boss: The System Admin
**Visuals:** A multi-winged angel made of fiber-optic cables and screaming faces.
**Stats:** `HP: 5000`, `Element: White/Blue`.

**Phase 1: The Firewall**
The Admin has infinite DEF.
*   **Mechanic:** You must destroy the 3 **"Logic Nodes"** floating around him.
*   **Tactics:** The **Crimson Lord** (if you have him) shines here. His `Shadow Claw` (`Black`) shreds the White-aligned Nodes.

**Phase 2: Reformat**
The Admin changes the arena.
> *"Environment Variable Changed: HOLY LAND."*
*   **Effect:** All `White` healing is doubled. All `Black` damage is halved.
*   **Crisis:** Your main damage dealer (Crimson Lord) is now useless.
*   **Solution:** Alex uses **"Corruption Grenade"** (Rare Drop from Floor -3).
    *   **Effect:** Changes Arena to `Dark World`.
    *   **Turnaround:** The Admin shrieks. Crimson Lord hits for 400 damage.

**Phase 3: Factory Reset**
The Admin prepares a wipe attack. Count: 3 Turns.
*   **Situation:** Alex has 15 MP left. `WEAKENED` state is active. Party HP is critical.
*   **The Secret:** Remember the **Mystic Egg**? If you found a *second* one (hidden in a secret room on Floor -4) and kept it unhatched...
*   **Action:** Alex uses **"Mystic Egg"**.
    *   **Effect:** Instead of hatching, the Egg *absorbs* the Factory Reset energy.
    *   **Text:** *"The Egg resonates with the pure data! It cracks... A Phoenix emerges!"*
    *   **Result:** The **Phoenix** casts `Flame Rebirth`. Party Fully Healed.

**Victory:** The party unleashes a full combo. The Admin shatters into glass polygons.

---

## VII. Epilogue: The New OS

Alex sits on the Admin Throne. The console blinks.
> "System Restore Failed. New OS Booting..."

**The Ending:**
The screen fades to the town of Alencar. The smog is gone. The sky is blue... but it's *too* blue. It's a perfect hex-code #0000FF.
The people are cheering, but they are glitching slightly. Their dialogue loops.
*   **Meaning:** You saved them, but they are just simulations in your new world. You are God, and you are alone.

**The Loop:**
The game saves a "New Game+" file.
*   **Carryover:** You keep the **"Survivor's Guilt"** passive.
*   **Implication:** In the next cycle, you will be weaker, but faster. The degradation of the Summoner continues.

---

## VIII. Technical Appendix & Credits

### 1. The Economy of Attrition (MP System)
The decision to tie MP to `Scene_Map` movement transforms exploration into a resource management game.
*   **Implementation:** `src/managers/exploration.js` hooks into the player's movement event. `Game_Party.mp` is decremented by `floorDepth * 1.5`.
*   **Impact:** It prevents "completionist" behavior in a healthy way. Players actively *choose* to skip loot to save "fuel" for the boss.

### 2. The Trait System (Code: `src/managers/trait_manager.js`)
The **Larva/Parasite** mechanic demonstrates the system's flexibility.
*   **Code:** A custom trait `XP_DRAIN` was added to `data/traits.js`.
*   **Logic:** `ProgressionSystem.gainXp` checks for this trait on any active party member and redirects the flow.
*   **Scalability:** This same system allows for "Cursed Equipment" that eats Gold, or "Solar Powered" gear that regenerates MP only on surface floors.

### 3. Usage-Based Progression (Code: `src/managers/progression.js`)
Moving away from standard XP curves creates organic storytelling.
*   **Logic:** `ProgressionSystem.checkGrowth(battler, actionResult)` is called after every action.
*   **Example:** If `actionResult.damageTaken > 0`, there is a `(damage / maxHp) * 100`% chance to gain MaxHP.
*   **Result:** A `Pixie` who gets hit often will eventually become tanky, diverging from her "Healer" archetype based purely on player tactical choices.

---
*End of Design Document*
