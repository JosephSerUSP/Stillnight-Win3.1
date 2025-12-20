# Refactor Plan

This document outlines the architectural refactor to create a single source of truth for runtime state and enforce hard layer boundaries.

## Execution audit (Current State)

*   **Deterministic RNG**: Implemented (`src/core/rng.js`) and verified via harness.
*   **Engine Skeleton**: Implemented (`src/engine/`). Import boundaries enforced via ESLint.
*   **Battle**: Migrated to `BattleSystem` and `BattleAdapter`. Legacy `managers/battle.js` deleted.
*   **Exploration**: Migrated to `ExplorationSystem` and `ExplorationAdapter`. Legacy `managers/exploration.js` deleted.
*   **Interpreter**: Migrated to `InterpreterSystem` and `InterpreterAdapter`. Legacy `managers/interpreter.js` deleted.
*   **UI Decoupling**: Windows now use `Adapters` (Audio, Settings, Effect) and `Selectors`. Direct manager imports removed from key windows.
*   **Save/Load**: Wired into `Scene_Boot` and `Scene_Map` via `SessionSerializer`.
*   **Cleanup**: `src/objects/objects.js` retired. `src/legacy/` created.

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

## Phase 0 — Lock behavior and make refactor safe (Complete)
*   **Deterministic RNG**: One RNG service used everywhere.
*   **Golden Logs**: Harness verifies battle and dungeon determinism.

## Phase 1 — Create the New Engine skeleton + import bans (Complete)
*   `src/engine/` created.
*   ESLint rules added.
*   `src/legacy/` created.

## Phase 2 — Migrate Battle (Complete)
*   `BattleSystem` and `BattleAdapter` implemented.
*   `Scene_Battle` decoupled.
*   `managers/battle.js` deleted.

## Phase 3 — Migrate Exploration (Complete)
*   `ExplorationSystem` and `ExplorationAdapter` implemented.
*   `Scene_Map` uses `ExplorationAdapter`.
*   `managers/exploration.js` deleted.

## Phase 4 — Migrate Interpreter / Events (Complete)
*   `InterpreterSystem` implemented.
*   `InterpreterAdapter` implemented.
*   `Scene_Map` uses `InterpreterAdapter`.
*   `managers/interpreter.js` deleted.

## Phase 5 — UI decoupling pass (Complete)
*   Created `AudioAdapter`, `SettingsAdapter`, `EffectAdapter`.
*   Refactored Windows (`base.js`, `audio_player.js`, `formation.js`, `confirm.js`) to use adapters.
*   Removed direct `manager` imports from presentation layer.

## Phase 6 — Save/Load (Complete)
*   `SessionSerializer` implemented.
*   `Scene_Boot` loads session from local storage or creates new.
*   `Scene_Map` accepts and resumes session.
*   `Registry` populated in boot.

## Phase 7 — Remove the remaining legacy knot (In Progress)
**Goal:** Final cleanups.
*   Retire `src/objects/objects.js` barrel (Complete).
*   Replace `window.*` debug globals with `DebugTools` (Complete - via `exposeGlobals`).
*   Migrate `EffectManager` to `EffectSystem` (Partial - Adapter uses System for preview).
*   Migrate remaining infrastructure managers (`Sound`, `Input`, `Config`) to pure Ports/Adapters structure (Adapters exist, Managers serve as implementation).
