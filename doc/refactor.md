# Refactor Plan

This document outlines the architectural refactor to create a single source of truth for runtime state and enforce hard layer boundaries.

## Execution audit (Current State)

*   **Deterministic RNG**: Implemented (`src/core/rng.js`) and verified via harness.
*   **Engine Skeleton**: Implemented (`src/engine/`). Import boundaries enforced via ESLint.
*   **Battle**: Migrated to `BattleSystem` and `BattleAdapter`. Legacy `managers/battle.js` deleted.
*   **Exploration**: Migrated to `ExplorationSystem` and `ExplorationAdapter`. Legacy `managers/exploration.js` deleted.
*   **Interpreter**: Migrated to `InterpreterSystem` and `InterpreterAdapter`. Legacy `managers/interpreter.js` deleted.
*   **UI Decoupling**: Windows generally use adapters and selectors rather than simulation imports.
*   **Save/Load**: Wired into `Scene_Boot` and `Scene_Map` via `SessionSerializer`.
*   **Cleanup**: `src/objects/objects.js` and `src/legacy/` retired.
*   **Input ownership**: `InputController` manager retired; browser keyboard translation now lives inside `InputAdapter`.
*   **Infrastructure cleanup**: **In progress.** Sound and Config remain manager-owned globals behind adapters; DataManager still initializes audio.

See `doc/refactor-audit-2026-08.md` for the evidence-based boundary audit that reopened the final infrastructure cleanup.

## Assessment

The simulation/runtime-state refactor is largely complete: battle, exploration, interpreter, effects, traits, and encounters have moved to engine systems/rules and presentation boundaries are substantially cleaner.

The repository is **not yet finished with Phase 7**, however. The previous tracker overstated completion of the infrastructure-manager migration. `SoundManager` and `ConfigManager` remain global static owners; `AudioAdapter` reaches into private SoundManager fields for catalog/current-track queries; and `DataManager` still bootstraps audio as a loading side effect. These are boundary/lifecycle problems rather than reasons to disturb the now-stable engine architecture.

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
*   `selectors/` – view models derived from session state

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
*   `src/legacy/` created and subsequently retired.

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
*   Refactored key windows to use adapters.
*   Removed direct simulation-manager imports from presentation layer.

## Phase 6 — Save/Load (Complete)
*   `SessionSerializer` implemented.
*   `Scene_Boot` loads session from local storage or creates new.
*   `Scene_Map` accepts and resumes session.
*   `Registry` populated in boot.

## Phase 7 — Remove the remaining legacy knot (In progress)
**Goal:** Finish ownership cleanup without reintroducing a second source of runtime truth.

Completed:
*   Retire `src/objects/objects.js` barrel.
*   Replace ad-hoc debug globals with `DebugTools` exposure.
*   Migrate `EffectManager` to `EffectSystem`.
*   Migrate `TraitManager` to `TraitRules`.
*   Migrate `EncounterManager` to `EncounterRules`.
*   Retire `InputController` manager; keyboard mapping is presentation adapter logic.

Remaining:
*   Give audio a public adapter/service contract so `AudioAdapter` no longer reads private `SoundManager` fields.
*   Remove direct `SoundManager` → `ConfigManager` global coupling through explicit settings/volume dependencies.
*   Separate configuration persistence (`localStorage`) from mutable settings ownership.
*   Separate `DataManager` content loading from audio/service initialization.
*   Re-audit `src/managers/` after those moves and retire the namespace where responsibilities have acquired explicit homes.

Completion rule: Phase 7 may be marked complete only when the remaining ownership described above has actually moved and code search confirms no compatibility manager is silently retaining it.
