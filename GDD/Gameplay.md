# Gameplay Mechanics

## 1. Core Loop

The primary gameplay loop is a cycle of dungeon exploration, combat, and party management.

-   **Dungeon Exploration:** Players navigate procedurally generated floors, revealing the map as they move. The goal is to find the stairs to the next floor while managing resources and avoiding or defeating enemies.
-   **Combat:** When the player encounters an enemy, the game transitions to a turn-based combat scene.
-   **Party Management:** Between battles, the player can manage their party's formation, skills, and equipment.

## 2. Combat System

-   **Turn-Based:** Combat is turn-based, with the order of actions determined by the `agility` stat of each combatant.
-   **Party Formation:** The player's party is arranged in a 2x2 grid, with a front row and a back row. The front row is more likely to be targeted by physical attacks, while the back row is better protected.
-   **Skills and Magic:** Characters can use a variety of skills and magic spells, each with different costs (e.g., MP) and effects.
-   **Elements:** A system of elemental strengths and weaknesses adds a layer of strategy to combat.
-   **Passives:** Many creatures have passive abilities that provide unique advantages in and out of combat.
    -   **Initiative:** A rare passive that provides a chance for a first strike. If both parties have Initiative, the chance is contested.
    -   **Rear Guard:** A more common passive that negates the enemy's Initiative.
-   **Recruitment:** Players can recruit defeated enemies into their party, either through a random chance or by fulfilling specific conditions (e.g., paying them, having a specific item).

## 3. Creature Progression

-   **Experience and Leveling:** Creatures gain experience points (XP) from defeating enemies. When they accumulate enough XP, they level up, and their stats increase.
-   **Skills:** Creatures can learn new skills by leveling up or by using certain items.
-   **Evolution:** Some creatures can evolve into more powerful forms after reaching a certain level or meeting other conditions.

## 4. Dungeon Exploration

-   **Procedural Generation:** Each floor of the dungeon is procedurally generated, ensuring a different experience on each playthrough.
-   **Events:** The dungeon contains various events, such as finding treasure chests, encountering NPCs, or triggering traps.
-   **Resources:** Players must manage their resources carefully, including health, magic points, and items.

## 5. Items

-   **Consumables:** Items that can be used to restore health or magic, cure status effects, or provide temporary buffs.
-   **Equipment:** Items that can be equipped to creatures to boost their stats or provide other benefits.
-   **Key Items:** Items that are required to progress through the dungeon or complete quests.
