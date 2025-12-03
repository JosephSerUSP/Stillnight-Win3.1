# Gameplay Direction: Evolving the Stillnight Engine

## I. Core Philosophy: The Glitching World

The "retro OS" aesthetic is a powerful narrative tool. We will lean into this. The world of Stillnight is not just a fantasy world with a Windows 3.1 skin; it is a digital space that is breaking down. This "glitching" is our justification for the obtuse, unpredictable, and emergent mechanics of a SaGa-like experience. The player is not just an adventurer; they are a user trying to make sense of a corrupted system.

## II. Character Progression: Data Corruption & Adaptation

Instead of abstract leveling, character growth should feel like a direct consequence of interacting with this broken world. We can achieve this by evolving the existing systems in `actors.json` and the `Game_Battler` object.

### A. Skill "Glimmer" as Data-Spikes

The "Glimmer" or "Spark" system fits perfectly with the theme of a glitching world. A character doesn't learn a new skill; their code is unpredictably rewritten in the heat of battle.

*   **Integration:** We can make this entirely data-driven without adding significant new engine code. Let's modify the structure in `data/skills.js`.
    ```javascript
    // In skills.js
    windBlade: {
        id: 'windBlade',
        name: 'Wind Blade',
        // ... existing properties
        sparks: [
            { skillId: 'galeSlash', chance: 0.05, prereq: { level: 5 } },
            { skillId: 'holyBlade', chance: 0.02, prereq: { element: 'White' } }
        ]
    },
    ```
    *   **Logic:** In the `BattleManager`, after a skill is used, it checks for a `sparks` array. If it exists, it iterates through the potential sparks, checks the prerequisites against the actor's current state (level, elements from `actors.json`), and performs a random roll. This is a small, targeted addition to the battle resolution loop that creates immense gameplay depth.

### B. Stat Growth as "File Fragmentation"

Instead of linear stat growth, stats should increase based on actions taken. This represents the character's data "fragmenting" and re-optimizing itself in response to stress.

*   **Integration:** We can add a `growth` object to `actors.json`.
    ```json
    // In actors.json, for a specific actor
    "growth": {
        "onDamageTaken": { "maxHp": 0.3, "def": 0.1 },
        "onPhysicalAttack": { "atk": 0.2 },
        "onMagicAttack": { "mag": 0.2 }
    }
    ```
    *   **Logic:** In the `Game_Battler`'s `applyDamage` and `executeAction` methods, we can add a hook that checks the actor's `growth` profile. If the corresponding event occurs, it rolls against the chance for each stat. This ties stat growth directly to the actions players are already taking, encouraging varied gameplay without adding new UI or complex systems.

## III. Combat: Exploiting the System's Rules

Combat should feel less like a JRPG battle and more like manipulating a complex, rule-based system, much like *DUNGEON ENCOUNTERS*.

### A. Formations as Memory Addresses

Formations are not just about who is in front. They are about placing your party members in specific "memory addresses" to gain advantages.

*   **Integration:** The party is already an array of 4 actors. We can define formation bonuses directly in `data/passives.js` or a new `formations.json`.
    ```javascript
    // In a new formations.json
    "vanguard": {
        "name": "Vanguard",
        "slots": [
            { "position": 0, "effects": [{ "code": "target_rate", "value": 1.5 }, { "code": "atk_boost", "value": 0.1 }] },
            { "position": 1, "effects": [{ "code": "def_boost", "value": 0.1 }] },
            { "position": 2, "effects": [] },
            { "position": 3, "effects": [] }
        ]
    }
    ```
    *   **Logic:** The `BattleManager` can apply these effects as passive states at the start of combat based on the current formation. This reuses the existing passive effect system and requires minimal new code, but adds a significant strategic layer.

### B. Combo Attacks as "Race Conditions"

Combos are not planned team-up moves. They are "race conditions" where two actors' actions happen to execute in a way that creates an exploit.

*   **Integration:** This can be driven by the `elements` array in `actors.json`.
    *   **Logic:** In `BattleManager`, after an attack, if the target is not dead, loop through the remaining actors. If another actor has a skill that shares an element with the skill just used, there's a chance they will immediately execute that skill on the same target at reduced power. This encourages building parties with elemental synergy and makes turn order manipulation more critical.

## IV. Exploration and Narrative: Decompiling the World

The world should unfold in a non-linear fashion, driven by the player "de-compiling" or "un-corrupting" new areas.

### A. The "World Rank" as System Instability

The World Rank is not just a difficulty slider; it's a measure of the system's instability. As the player wins battles (writes data), the system becomes more unstable, leading to more dangerous "processes" (enemies) spawning.

*   **Integration:** This is a simple global variable, let's call it `$gameSystem.instability`.
    *   **Logic:** The `Game_Map.prototype.generateFloor` method can be modified. Instead of pulling from a fixed enemy pool, it can check the `$gameSystem.instability` level to determine which enemies can spawn. High instability could also trigger random events from `data/events.json`. This makes the simple act of grinding a risky decision with tangible consequences, a core SaGa principle.

### B. "Free Scenario" as User Accounts

The Free Scenario system can be framed as logging into different "User Accounts" on the Stillnight OS. Each account has its own starting `party.js`, starting location on the map, and a unique "main quest" which is just a series of event flags.

*   **Integration:** Your engine already supports this. The main menu would simply offer a choice of "User Account," which loads a different initial setup file. The narrative then unfolds through the existing event interpreter as each "User" interacts with the world and its corrupted data, occasionally crossing paths with the others.

## V. Reference Game Integration: A Practical Approach

*   ***Azure Dreams***: The town-building can be framed as "installing new programs." Instead of a physical town, the player has a "Desktop" scene. Completing certain dungeons unlocks ".exe" items that, when used, add new windows/functionality to the Desktop (e.g., a shop, a fusion center). This fits the OS aesthetic perfectly.
*   ***Legend of Mana***: The "Land Make" system can be a "File Manager" interface. The player gets "corrupted files" (artifacts) and can "defragment" them onto a world map grid. Placing a "Forest.dat" file next to a "Lake.dat" file could create a special "Wetlands" dungeon, reusing your procedural map generator with a different tileset and enemy pool. This makes world-building an active, strategic part of the game.

This revised guide provides a roadmap for evolving your existing, well-structured engine into a unique SaGa-like experience. It focuses on small, data-driven changes that create deep, emergent gameplay, all while reinforcing your game's core aesthetic.
