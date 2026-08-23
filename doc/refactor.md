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
*   **Audio contract**: `AudioAdapter` consumes public SoundManager commands/queries only; private cache fields no longer leak.
*   **Settings ownership**: mutable settings state and localStorage persistence are separated in `src/infrastructure/settings.js`; `ConfigManager` is a compatibility facade only.
*   **Composition**: audio receives its settings dependency explicitly from `main.js`; `DataManager` loads content only and no longer bootstraps audio.
*   **Infrastructure cleanup**: **In progress.** Compatibility manager names remain and should now be reassessed rather than assumed necessary.

See `doc/refactor-audit-2026-08.md` for the evidence-based boundary audit that reopened the final infrastructure cleanup.

## Assessment

The simulation/runtime-state refactor is largely complete. The infrastructure pass has now removed the concrete ownership violations found by the August audit: input is presentation-side, audio has a public contract, audio no longer imports configuration, settings persistence is separated from state, and content loading no longer initializes audio.

Phase 7 remains open for one final reason: the repository still carries a `src/managers/` compatibility namespace (`DataManager`, `SoundManager`, `SceneManager`, `ConfigManager`, MIDI classes). The next step is no longer to invent more wrappers; it is to classify those remaining responsibilities, move/rename only where that improves ownership truth, and delete compatibility exports that no longer have real consumers.

## Target Architecture

### Engine (pure-ish, testable, serializable)
`src/engine/`
*   `session/` – runtime state + save/load serialization
*   `systems/` – battle, exploration, encounters, interpreter, progression
*   `rules/` – effects, traits, formulas (pure functions + registries)
*   `events/` – event types + helpers
*   `ports/` – interfaces required by engine logic only; browser infrastructure does not belong here merely to satisfy a diagram

### Presentation (DOM-first, fast iteration)
`src/presentation/`
*   `scenes/` – glue: translate user intent to engine commands; route to windows
*   `windows/` – DOM UI only (no simulation imports)
*   `selectors/` – view models derived from session state

### Infrastructure
`src/infrastructure/` + browser-facing adapters
*   browser persistence and service implementations
*   explicit composition from `src/main.js` / boot lifecycle
*   no hidden module-load lifecycle side effects

### Data (read-only)
`data/` + loaders
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
*   Give audio a public command/query contract; no adapter reads of underscored SoundManager fields remain.
*   Remove direct `SoundManager` → `ConfigManager` coupling; volume settings are injected at the composition root.
*   Separate mutable settings state from `localStorage` persistence; `ConfigManager` remains only for compatibility/debug consumers.
*   Separate `DataManager` content acquisition from audio initialization; boot initializes audio explicitly after content loading.

Remaining:
*   Audit consumers of the remaining `src/managers/` namespace and classify each file as infrastructure, presentation lifecycle, data loader, compatibility facade, or obsolete barrel.
*   Retire `ConfigManager` once direct debug/test compatibility consumers are migrated.
*   Move/rename remaining services only when the destination expresses real ownership; do not perform a cosmetic directory shuffle.
*   Strengthen lint/import boundaries around the resulting architecture.

Completion rule: Phase 7 may be marked complete only when code search confirms no compatibility manager silently retains ownership that the architecture says has moved.
