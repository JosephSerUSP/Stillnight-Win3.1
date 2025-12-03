# Gameplay Mechanics

This document provides a high-level overview of the core gameplay mechanics in the Stillnight Engine.

**For a detailed breakdown of the formulas and algorithms, please see the [Gameplay Systems Deep Dive](../doc/gameplay_systems.md).**

---

## 1. Core Loop

The gameplay is a cycle of dungeon exploration, turn-based combat, and party management. Players navigate procedurally generated floors, engage in battles to gain experience and resources, and manage their party of creatures to overcome increasingly difficult challenges.

## 2. Combat System

Combat is a turn-based affair that emphasizes strategy and preparation. Key features include:
-   **Turn Order:** Determined by each combatant's `agility` stat.
-   **Party Formation:** A 2x2 grid with front and back rows, affecting targeting and defense.
-   **Skills & Elements:** A wide variety of skills with different effects and an elemental system of strengths and weaknesses.
-   **Passives:** Unique creature abilities like `Initiative` (first strike chance) and `Rear Guard` (negates Initiative).
-   **Recruitment:** The ability to recruit defeated enemies into the player's party.

## 3. Creature Progression

Creatures grow and evolve through a robust progression system:
-   **Leveling:** Gaining experience (XP) from battles to level up and increase stats.
-   **Skill Acquisition:** Learning new skills through leveling or items.
-   **Evolution:** Evolving into more powerful forms after meeting certain conditions.

## 4. Dungeon Exploration

The dungeon is a procedurally generated, multi-floor environment. Exploration involves:
-   **Map Generation:** Each floor is uniquely generated using a cellular automata algorithm to create a natural, cave-like feel.
-   **Events:** Discovering treasure, encountering NPCs, and navigating environmental hazards.
-   **Resource Management:** Carefully managing HP, MP, and a limited inventory of items.
