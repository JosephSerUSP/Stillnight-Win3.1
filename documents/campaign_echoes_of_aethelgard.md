# Campaign: The Echoes of Aethelgard

## Premise
The "Silence" is a creeping metaphysical void that erases history and memory. It has consumed the world below, leaving only the **Spire of Aethelgard** standing—a massive, ancient archive-tower. The player leads a band of "Echoes" (memories given form) to climb the spire, activate the "Resonance Engines," and push back the Silence.

## Structure
The campaign spans **15 Floors**, divided into 3 Zones.

### Zone 1: The Whispering Base (Floors 1-5)
**Theme**: A dusty, abandoned archive. The Silence is leaking in.
**Enemy Faction**: *The Silenced* (Twisted, glitchy forms of animals and commoners).
**Narrative Arc**: The players meet **Custodian Kael**, a damaged construct who forgot his purpose. They must find his memory core to open the gate to the upper levels.

### Zone 2: The Clockwork Heart (Floors 6-10)
**Theme**: Giant gears, steam, and brass. The Spire's machinery.
**Enemy Faction**: *The Keepers* (Automata that view organic life as inefficient/a source of Silence).
**Narrative Arc**: The Keepers are culling "imperfect" memories to save space. The players must convince or destroy the **Grand Architect** to stop the purge.

### Zone 3: The Silent Summit (Floors 11-15)
**Theme**: Abstract geometry, floating islands, crystallized void.
**Enemy Faction**: *The Voidborn* (Pure manifestations of Silence).
**Narrative Arc**: The players reach the Zenith. They discover that the Spire isn't saving the world, but *storing* it before the end. They must decide whether to **Archive** the world (End) or **Shatter** the Spire (Rebirth).

## Required Data Assets

### 1. Actors (Heroes/Recruits) - 10 Total
1.  **Kael, the Custodian** (Role: Tank, Zone 1 Guide)
2.  **Lyra, the Scribe** (Role: Mage, Knowledge seeker)
3.  **Baudin, the Smith** (Role: Physical DPS, Dwarven archetype)
4.  **Vex, the Glitch** (Role: Rogue, a partially silenced spirit)
5.  **Unit 734** (Role: Support, a defecting Keeper drone)
6.  **Aria, the Songstress** (Role: Healer, opposes the Silence with music)
7.  **Grom, the Anchor** (Role: Tank, heavy physicality)
8.  **Sylas, the Shade** (Role: DPS, uses void powers)
9.  **Echo of Valour** (Role: Paladin, ancient hero)
10. **Echo of Sorrow** (Role: Debuffer, tragic figure)

### 2. Enemies - 10 Total
**Zone 1: The Silenced**
1.  `silenced_rat`: A rat with static for a face.
2.  `blur_wolf`: A wolf that phases in and out.
3.  `memory_eater`: Amorphous blob.

**Zone 2: The Keepers**
4.  `gear_soldier`: Brass soldier.
5.  `steam_turret`: Static defense.
6.  `archivist_bot`: Casts silence spells.
7.  `logic_gate`: A wall-like enemy.

**Zone 3: The Voidborn**
8.  `null_elemental`: Pure void damage.
9.  `erasure_wisp`: Drains XP/Levels.
10. `entropy_lord`: Boss of the campaign.

### 3. Items - 10 Total
1.  `memory_shard`: Currency/Story item.
2.  `rusty_gear`: Crafting/Story item for Kael.
3.  `tuning_fork`: Removes Silence debuff.
4.  `archive_key`: Unlocks Zone 2.
5.  `architect_blueprint`: Story item.
6.  `void_essence`: High-tier crafting.
7.  `aethelgard_ration`: Heals HP + MP.
8.  `keeper_oil`: Buffs defense.
9.  `scribe_ink`: Buffs magic.
10. `zenith_lens`: Endgame accessory.

### 4. Skills - 10 Total
1.  `resonance_wave`: AOE Magic (Lyra).
2.  `gear_grind`: Physical DOT (Baudin).
3.  `static_discharge`: Lightning DMG (Vex).
4.  `repair_protocol`: Heal (Unit 734).
5.  `song_of_hope`: Party Buff (Aria).
6.  `void_spike`: Dark DMG (Sylas).
7.  `data_purge`: Removes buffs (Enemies).
8.  `silence_scream`: AOE Stun (Enemies).
9.  `clockwork_barrage`: Random target physical (Keepers).
10. `entropy_touch`: Reduces Max HP (Voidborn).

### 5. Maps - 15 Floors
Defined in `maps.json` with increasing difficulty and specific event triggers.

## Gameplay Features
To realize this, we need:
-   **Quest Tracking**: "Find 3 Rusty Gears for Kael."
-   **Gating**: "Cannot enter Floor 6 without Archive Key."
-   **Boss Events**: Fixed encounters at Floor 5, 10, 15.
