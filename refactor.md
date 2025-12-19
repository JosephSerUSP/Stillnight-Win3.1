# Refactor Plan

This document outlines the architectural refactor to create a single source of truth for runtime state and enforce hard layer boundaries.

## Target Architecture

### Engine (pure-ish, testable, serializable)
`src/engine/`
*   `session/` – runtime state + save/load serialization
*   `systems/` – battle, exploration, encounters, interpreter, progression
*   `rules/` – effects, traits, formulas (pure functions + registries)
*   `events/` – event types + helpers
*   `ports/` – interfaces for audio, storage, rng, clock, midi, etc.
*   `adapters/` – DOM/audio/localStorage implementations of ports (thin wrappers)

### Presentation (DOM-first, fast iteration)
`src/presentation/`
*   `scenes/` – glue: translate user intent to engine commands; route to windows
*   `windows/` – DOM UI only (no simulation imports)
*   `selectors/` – “view models” derived from session state (selectPartyHUD(session))

### Data (read-only)
`data/` + `src/data/`
*   loader + validators
*   schemas (even lightweight) to fail loudly on broken content

## Phase 0 — Lock behavior and make refactor safe (mandatory) (Completed)
**Goal:** You can change architecture without changing gameplay accidentally.

*   **Deterministic RNG**: One RNG service used everywhere. Replace scattered `randInt` usage with `rng.nextInt()`.
*   **Golden Logs**:
    *   One battle seed (turn-by-turn event log).
    *   One dungeon seed (map generation summary).
*   **Tiny Headless Harness**:
    *   "Run one battle with seed X and assert event log matches snapshot".
    *   Exit criteria: You can run the harness and get identical results twice in a row.

## Phase 1 — Create the New Engine skeleton + import bans (Completed)
**Goal:** Lay the new foundation without mixing.

*   Add `src/engine/` with session, events, ports.
*   Add `src/presentation/selectors/`.
*   Add ESLint rules:
    *   Forbid imports from `src/presentation/**` inside `src/engine/**`.
    *   Forbid imports from `src/engine/systems/**` inside `src/presentation/windows/**`.
*   Create `src/legacy/` folder.

## Phase 2 — Migrate Battle as the first “vertical slice”
**Goal:** Migrate Battle and delete legacy battle.

*   **Build new battle surface**: `BattleState`, `BattleSystem` (start, chooseAction, step).
*   **Refactor rules**: Move game-specific behavior to `BattleRuleset` or `BattleHooks`.
*   **Bridge the UI**: `Scene_Battle` asks `BattleSystem` for event list.
*   **Delete legacy battle path**: Remove `managers/battle.js`.

## Phase 3 — Migrate Exploration + Encounters
**Goal:** Migrate Exploration and delete legacy.

*   **Exploration System**: `ExplorationSystem` (move, interact) emitting events.
*   **Encounter System**: `EncounterSystem.roll`.
*   **Key Change**: Exploration emits events like `PlayerMoved`, `DoorOpened`. `Scene_Map` renders events.

## Phase 4 — Migrate Interpreter / Events
**Goal:** Engine-side serializable interpreter.

*   `InterpreterState` (stack, IP, locals).
*   `Interpreter.runUntilPause(session)` -> `GameEvent[]`.

## Phase 5 — UI decoupling pass
**Goal:** UI depends only on view models.

*   Replace simulation imports in Windows with `selectors`.
*   `selectBattlerDetails`, `selectPartyHUD`.

## Phase 6 — Save/Load
**Goal:** Trivial serialization.

*   `SessionSerializer.toJSON(session)`
*   `SessionSerializer.fromJSON(...)`

## Phase 7 — Remove the remaining legacy knot
**Goal:** Cleanups.

*   Retire `src/objects/objects.js` barrel.
*   Replace `window.*` debug globals with `DebugTools`.
*   Stop "core" importing data.
*   Delete `src/legacy/**`.
