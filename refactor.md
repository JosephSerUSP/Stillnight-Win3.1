# Refactor Plan

This document outlines the architectural refactor to create a single source of truth for runtime state and enforce hard layer boundaries.

## Execution audit (current state)

*   Deterministic RNG is available through `src/core/rng.js` and is wired into the battle/dungeon harness at `tests/harness.js`, but several UI helpers (e.g., window wobble) still call `Math.random()` directly.
*   Engine skeletons exist (`src/engine/**` and `src/presentation/selectors/**`), yet import bans are only partially enforced and the runtime still boots through legacy managers in `src/main.js`.
*   Battle refactor: `Scene_Battle` now uses `EncounterAdapter` and plain actions, decoupling it from `Game_Battler` and `Game_Action` instantiation. Windows are still legacy.
*   Exploration, interpreter, and UI decoupling phases have starter files, but scenes and windows still depend on legacy managers instead of the new systems and selectors.
*   Save/load work has not been verified end-to-end; serializer helpers exist but are not wired into the boot sequence.

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

## Phase 0 — Lock behavior and make refactor safe (mandatory) (Mostly completed)
**Goal:** You can change architecture without changing gameplay accidentally. Harnesses exist, but stray UI Math.random usages still need to be routed through the RNG to guarantee repeatability.

*   **Deterministic RNG**: One RNG service used everywhere. Replace scattered `randInt` usage with `rng.nextInt()`.
*   **Golden Logs**:
    *   One battle seed (turn-by-turn event log).
    *   One dungeon seed (map generation summary).
*   **Tiny Headless Harness**:
    *   "Run one battle with seed X and assert event log matches snapshot".
    *   Exit criteria: You can run the harness and get identical results twice in a row.

## Phase 1 — Create the New Engine skeleton + import bans (In progress)
**Goal:** Lay the new foundation without mixing. Skeleton directories exist and ESLint now blocks engine->presentation imports, but the runtime still boots through legacy managers and presentation windows still import systems directly.

*   Add `src/engine/` with session, events, ports.
*   Add `src/presentation/selectors/`.
*   Add ESLint rules:
    *   Forbid imports from `src/presentation/**` inside `src/engine/**`.
    *   Forbid imports from `src/engine/systems/**` inside `src/presentation/windows/**`.
*   Create `src/legacy/` folder.

## Phase 2 — Migrate Battle as the first “vertical slice” (In progress)
**Goal:** Migrate Battle and delete legacy battle. `BattleSystem` and adapters exist, yet `Scene_Battle` still instantiates legacy objects, and the managers/objects folders are still live.

*   **Build new battle surface**: `BattleState`, `BattleSystem` (start, chooseAction, step).
*   **Refactor rules**: Move game-specific behavior to `BattleRuleset` or `BattleHooks`.
*   **Bridge the UI**: `Scene_Battle` asks `BattleSystem` for event list. `Scene_Battle` decoupled from legacy objects via `EncounterAdapter`.
*   **Delete legacy battle path**: Remove `managers/battle.js`.

## Phase 3 — Migrate Exploration + Encounters (In progress)
**Goal:** Migrate Exploration and delete legacy. `ExplorationSystem` creates state, but `Scene_Map` still leans on legacy managers and windows; event emission/render routing remains to be hooked up.

*   **Exploration System**: `ExplorationSystem` (move, interact) emitting events.
*   **Exploration State**: `ExplorationState` holding dungeon data.
*   **Adapter**: `ExplorationAdapter` bridging `Scene_Map` and `ExplorationSystem`.
*   **Key Change**: Exploration emits events like `PlayerMoved`, `DoorOpened`. `Scene_Map` renders events.
*   Note: Encounters are currently handled via static event placement by Generator + `EncounterManager` utils.

## Phase 4 — Migrate Interpreter / Events (In progress)
**Goal:** Engine-side serializable interpreter. `InterpreterState` and run helpers exist, yet scenes still execute legacy interpreter flows; events are not wired through the engine session.

*   `InterpreterState` (stack, IP, locals).
*   `Interpreter.runUntilPause(session)` -> `GameEvent[]`.

## Phase 5 — UI decoupling pass (Not started)
**Goal:** UI depends only on view models. Presentation windows still import managers and objects; selectors are present but not used as the only input surface.

*   Replace simulation imports in Windows with `selectors`.
*   `selectBattlerDetails`, `selectPartyHUD`, `selectInventory`.
*   `selectBattleScreen`.
*   Cleaned up `src/presentation/windows/` to remove `ProgressionSystem` and other engine dependencies.

## Phase 6 — Save/Load (In progress)
**Goal:** Trivial serialization. Serializer helpers exist, but the boot flow and scenes still manage state through legacy managers.

*   `SessionSerializer.toJSON(session)`
*   `SessionSerializer.fromJSON(...)`
*   Status: Implemented `src/engine/session/serializer.js` and added unit tests.

## Phase 7 — Remove the remaining legacy knot (Not started)
**Goal:** Cleanups. Legacy managers and object barrels are still present; debug globals remain in parts of the UI layer.

*   Retire `src/objects/objects.js` barrel. (Pending)
*   Replace `window.*` debug globals with `DebugTools`. (Pending)
*   Stop "core" importing data. (Pending)
*   Delete `src/legacy/**`. (Pending)
*   Migrate `ProgressionSystem` to `src/engine/systems/progression.js`. (Pending)
