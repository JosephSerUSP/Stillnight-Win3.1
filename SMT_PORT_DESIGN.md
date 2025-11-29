# SMT Port Design Document

## Overview
This document outlines the plan to port the campaign of *Shin Megami Tensei I* (SFC) to the Stillnight engine. The goal is to adapt the narrative and core gameplay loop (Negotiation, Fusion, Magnetite) while leveraging the engine's existing capabilities.

## Narrative Arc

### 1. The Dream (Intro)
*   **Setting**: A surreal, dark void.
*   **Events**:
    *   Meeting the crucified man (Law Hero).
    *   Meeting the tormented man (Chaos Hero).
    *   Meeting the woman in the spring (Heroine).
    *   Naming the character (handled via pre-set names for this port: Kazuya).
*   **Map**: `smt_dream`. Linear path with symbolic encounters.

### 2. Kichijoji (Part 1)
*   **Setting**: Urban Japan, slightly unsettled.
*   **Events**:
    *   Waking up in the bedroom.
    *   Checking email (COMP acquired).
    *   The murder in Inokashira Park.
    *   The Hospital (first dungeon).
*   **Map**: `smt_kichijoji`.

## Gameplay Adaptations

### Demon Negotiation
*   **Concept**: Instead of random recruitment tiles, players negotiate with enemies during battle.
*   **Implementation**:
    *   **UI**: Add a `Talk` button to the Battle Window.
    *   **Logic**:
        *   When `Talk` is selected, the battle pauses.
        *   A dialogue window (`Window_Event`) opens.
        *   The demon asks a question or demands an item/money.
        *   Player chooses from options.
        *   **Outcomes**: Join (Recruit), Leave (Flee), Give Item, Get Angry (Attack).
    *   **Stats**: `Intelligence` (INT) and `Luck` (LUK) affect success rates (mapped to existing stats or new traits).

### Magnetite (MAG)
*   **Concept**: Currency required to keep demons summoned.
*   **Adaptation**:
    *   Simplified for Phase 1: Demons have a "Summon Cost" (paid in Gold/MAG upon party entry).
    *   Future: "Step Cost" on the map.

### Alignment
*   **Concept**: Law vs. Chaos.
*   **Adaptation**:
    *   Hidden `alignment` score in `Game_Party`.
    *   Shifted by dialogue choices (Dream sequence, Negotiation).
    *   Affects which demons can be recruited.

## Technical Requirements

### Engine Expansion
1.  **Battle Dialogue**: Enable `Scene_Battle` to suspend combat and open `Window_Event`.
2.  **Negotiation Logic**: A new class or method in `BattleManager` to handle the state machine of a conversation.
3.  **Data Support**:
    *   Add `personality` field to `actors.json`.
    *   Add `dialogue` field to `actors.json` (or a separate `negotiations.json`).

### New Data Assets
*   **Maps**: Dream Void, Kichijoji.
*   **Actors**: Pixie (SMT variant), Kobold, Preta, Law Hero, Chaos Hero.
*   **Items**: Life Stone, Chakra Drop.
*   **Skills**: Agi, Bufu, Zio, Dia.

## Phase 1 Deliverable
*   Playable "Dream Sequence" map.
*   Functional "Talk" button in battle.
*   Basic negotiation with a Pixie.
