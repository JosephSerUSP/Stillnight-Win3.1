# Refactor Plan

This document outlines the architectural refactor to create a single source of truth for runtime state and enforce hard layer boundaries.

## Execution audit (Current State)

* **Deterministic RNG**: implemented (`src/core/rng.js`).
* **Engine skeleton**: implemented (`src/engine/`) with import boundaries.
* **Battle / Exploration / Interpreter**: migrated to engine systems + adapters; legacy simulation managers deleted.
* **Save/load**: session serialization is authoritative for runtime state.
* **Input**: browser keyboard translation is presentation-side in `InputAdapter`.
* **Scene lifecycle**: presentation-side in `src/presentation/scene_manager.js`.
* **Settings**: state + persistence live in `src/infrastructure/settings.js`; no runtime `ConfigManager` class remains.
* **Audio**: browser/WebAudio implementation lives in `src/infrastructure/audio/`, consumed through `AudioAdapter`.
* **Static content**: acquisition lives in `src/data/content_loader.js`; it does not initialize runtime services.
* **Composition**: `src/main.js` wires settings, audio, content, presentation lifecycle, and boot explicitly.
* **Legacy root managers namespace**: retired. `src/managers/` no longer owns runtime behavior or compatibility exports. Presentation-local managers such as theme/window concerns remain presentation-owned.
* **Boundary guardrails**: engine imports are barred from presentation/browser infrastructure, and presentation windows remain barred from engine systems / the retired root managers namespace.

See `doc/refactor-audit-2026-08.md` for the audit that reopened and drove this cleanup.

## Assessment

The architectural refactor described by this plan is complete at the ownership level. Runtime simulation truth is in the engine/session model; browser infrastructure is explicit; presentation lifecycle is presentation-owned; static content acquisition is data-owned; and the historical catch-all root `src/managers/` namespace has been removed rather than preserved as a second architectural vocabulary.

The browser debug surface intentionally retains the names `window.ConfigManager` and `window.SoundManager` for existing tests. These are test-facing compatibility surfaces only: `ConfigManager` delegates directly to the settings store and `SoundManager` is a debug wrapper over `AudioAdapter`. Historical underscore cache getters remain only on that test/debug wrapper so existing inspection tests retain their value semantics; production `AudioAdapter` exposes only its public contract.

## Target Architecture

### Engine — `src/engine/`
Pure-ish, testable, serializable runtime rules and state: session, systems, rules, events, and engine-required ports.

### Presentation — `src/presentation/`
DOM UI, scenes, selectors, windows, theme/window lifecycle, and the scene stack/browser animation-frame lifecycle.

### Infrastructure — `src/infrastructure/`
Browser persistence and service implementations, including settings and WebAudio/MIDI playback.

### Data — `data/` + `src/data/`
Static authored content plus acquisition/loading code. Loading content does not bootstrap services.

### Adapters — `src/adapters/`
Narrow presentation/composition-facing boundaries over engine systems and browser infrastructure.

## Phases 0–6 — Complete

0. Lock behavior / deterministic RNG.
1. Engine skeleton + import boundaries.
2. Battle migration.
3. Exploration migration.
4. Interpreter/events migration.
5. UI decoupling.
6. Save/load + session authority.

## Phase 7 — Remove the remaining legacy knot (Complete)

Completed:
* retired obsolete objects/legacy barrels and ad-hoc manager globals;
* migrated Effect/Trait/Encounter responsibilities to systems/rules;
* retired `InputController` and moved keyboard intent translation presentation-side;
* moved `SceneManager` to presentation lifecycle;
* established a public audio adapter contract and isolated private-cache inspection to the test/debug surface;
* removed audio → configuration coupling and injected an explicit settings query contract from composition;
* separated settings state from `localStorage` persistence;
* separated static content loading from service initialization;
* classified `DataManager` as static content acquisition and replaced it with `ContentLoader` in `src/data/`;
* classified Sound + MIDI playback as browser audio infrastructure and moved them to `src/infrastructure/audio/`;
* retired the runtime `ConfigManager` class while preserving only a debug/test compatibility object;
* retired `src/managers/index.js` and the remaining root `src/managers/` source files;
* removed the composition root's dependency on the managers barrel;
* strengthened ESLint boundaries around engine/browser infrastructure and presentation windows.

### Completion rule

Satisfied: no source-layer compatibility manager remains as an alternate owner of runtime state. Future work should be ordinary architecture maintenance and executable validation, not continuation of Phase 7.
