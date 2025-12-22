# Story Implementation Plan

This plan bridges the gap between `doc/storyDoc.md` and the current implementation in `data/`.

## Phase 1: Core Character Implementation

### 1.1 Raphael (New NPC)
*   **Goal:** Implement Raphael as a key narrative figure who visits the town.
*   **Tasks:**
    *   Add `npc_raphael` to `data/npcs.json`.
    *   Define portrait (stub or placeholder if needed, e.g., `NPC_Raphael`).
    *   Write dialogue reflecting his controlling nature over Laura and rivalry/pity toward Alicia.
    *   Add logic to `Town of Stillnight` (Floor 0) to conditionally spawn him (e.g., based on a `storyFlag` or random chance per run).

### 1.2 Yukio (Expand Stub)
*   **Goal:** Flesh out the rival summoner.
*   **Tasks:**
    *   Update `npc_yukio` in `data/npcs.json` with actual dialogue.
    *   Implement "Rivalry" dialogue branches.
    *   **Mechanic:** Design the "Shielding Summons" concept (Summons take damage for him).

### 1.3 Daphne (Expand Stub)
*   **Goal:** Give purpose to the Floor 4 encounter.
*   **Tasks:**
    *   Update `npc_daphne` in `data/npcs.json`.
    *   Write lore-heavy dialogue regarding the dungeon's history or the "True Ending" hints.

## Phase 2: Events & Quests

### 2.1 The Dancer Event (Raphael)
*   **Goal:** Implement the "Choose a Dancer" event for player expression.
*   **Tasks:**
    *   Create a new event `event_dancer_selection` triggered by Raphael.
    *   Implement choices for different dancers (flavor text/minor reward differences).
    *   Store result in `storyFlags` (e.g., `dancer_choice_made`).

### 2.2 Alicia's Rescue Quest
*   **Goal:** Implement the quest where Alicia must be rescued from the dungeon.
*   **Tasks:**
    *   Create quest `alicia_rescue` in `data/quests.json`.
    *   Add a triggered event on a dungeon floor (e.g., Floor 2 or 3) where she is found.
    *   **Mechanic:** Implement her as a temporary "Locked Slot" party member (or distinct Escort quest mechanic).
    *   Update Town Alicia dialogue to reflect her absence/return.

### 2.3 Yukio Rival Battle & Recruitment
*   **Goal:** Fight and potentially recruit Yukio.
*   **Tasks:**
    *   Create a `BATTLE_START` event for Yukio.
    *   Define Yukio's enemy stats in `data/enemies.json` (Summoner archetype).
    *   Create a post-battle decision (Spare/Recruit/Leave).
    *   Implement `npc_recruit_yukio` logic.

## Phase 3: Unique Recruitment System ('U' Tiles)

### 3.1 Refactor Generic Recruits
*   **Goal:** Replace/Augment generic `recruit` tiles with unique NPC interactions.
*   **Tasks:**
    *   Create specific recruit NPCs in `data/npcs.json` (e.g., `npc_recruitable_imp`, `npc_recruitable_golem`).
    *   **Interaction Types:**
        *   **Payment:** "Give me 500G."
        *   **Item:** "I want a Potion."
        *   **Quiz:** Lore question.
        *   **Battle:** "Prove your strength!"
    *   Update `data/maps.json` to place these specific IDs instead of just generic logic, or update the `Recruit` event handler to pull from a pool of unique encounters.

## Phase 4: Meta-Progression & Endings

### 4.1 Run Tracking
*   **Goal:** Track number of completed runs for the True Ending path.
*   **Tasks:**
    *   Ensure `Game_Party` or a global `SaveManager` tracks `completedRuns`.
    *   Save this data persistently across "New Games" (Meta-save).

### 4.2 True Ending Logic
*   **Goal:** Unlock deeper lore/endings based on run count.
*   **Tasks:**
    *   Add conditions to `npc_daphne` or the Final Boss to check `completedRuns`.
    *   Implement the "True Ending" cutscene/dialogue variant.

## Phase 5: Polish & Integration

*   **Dialogue Review:** Ensure all three (Alicia, Laura, Raphael) react to each other's states.
*   **Portrait Integration:** Ensure all new NPCs have valid sprite keys.
*   **Testing:** Verify flags trigger correctly (e.g., Alicia missing from shop when in dungeon).
