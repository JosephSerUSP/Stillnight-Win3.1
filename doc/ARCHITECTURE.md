# Project Architecture & Implementation Guide

This document is the **current structural authority** for Stillnight's codebase. It describes how the repository is organized after the completed runtime-ownership refactor merged in PR #469.

For the history and completion status of that migration, see `doc/refactor.md`. `doc/refactorPlan.md` is retained only as the historical plan that led to the current architecture; it is not an implementation guide for new work.

## 1. Core invariants

### 1.1 One source of truth for runtime state

Runtime gameplay truth belongs to the engine/session model. Do not introduce a second authoritative party, battle, exploration, interpreter, quest, flag, or run state in scenes, windows, globals, or service singletons.

Presentation objects may retain references or view models needed to render and orchestrate the current flow, but they do not establish an alternate state authority.

### 1.2 Hard layer boundaries

The repository is intentionally split by responsibility:

- `src/engine/`: runtime state, systems, rules, events, engine data contracts, graph logic, and ports.
- `src/presentation/`: DOM UI, scenes, selectors, presentation-local managers, and scene/window lifecycle.
- `src/infrastructure/`: browser-dependent implementations such as settings persistence and WebAudio/MIDI playback.
- `src/data/`: acquisition/loading of static authored content.
- `src/adapters/`: narrow bridges used by presentation/composition to invoke engine or infrastructure capabilities.
- `src/objects/`: gameplay object representations used by the current runtime. They must not become a competing global state model.
- `src/generators/`: procedural generation helpers.
- `src/core/`: shared low-level utilities such as deterministic RNG.

The retired root `src/managers/` namespace must not be recreated. Presentation-local managers under `src/presentation/managers/` are a different concern and are allowed because they own presentation behavior only.

ESLint encodes the important import restrictions. In particular:

- engine code must not import presentation or browser infrastructure;
- presentation windows must not reach directly into engine systems;
- imports that resolve to the retired root `src/managers/` namespace are forbidden.

### 1.3 DOM-first presentation

Stillnight's interface is DOM-first. Windows, buttons, text, menus, and overlays are HTML/CSS presentation objects. Do not implement ordinary UI by drawing it to a canvas.

### 1.4 Systems produce gameplay results; presentation renders them

Battle, exploration, interpreter, encounters, effects, progression, and related runtime decisions belong in engine systems/rules. Scenes and adapters translate user intent into those operations and render the resulting state/events.

Do not move simulation decisions into windows simply because a window is where the player triggers them.

### 1.5 Explicit browser-service composition

Browser infrastructure is wired at the application boundary rather than initializing itself through import side effects. `src/main.js` is the composition root.

Settings persistence, audio configuration, static-content acquisition, presentation lifecycle, and boot are deliberately separate responsibilities.

## 2. Application bootstrap

`src/main.js` currently composes the application in this order:

1. `SettingsAdapter.load()` loads persisted settings.
2. `AudioAdapter.configureSettings(SettingsAdapter)` supplies audio with its settings query contract.
3. `SceneManager`, `ContentLoader`, and `WindowManager` are instantiated.
4. `Scene_Boot` receives those dependencies and is pushed onto the presentation scene stack.
5. The document-level keyboard listener gives `WindowManager` first refusal, then delegates unhandled input to the current scene.
6. `exposeGlobals(...)` exposes the deliberately limited test/debug surface.

`ContentLoader` replaces the historical `DataManager` source owner. Loading static content does not initialize audio or other runtime services.

`SceneManager` lives at `src/presentation/scene_manager.js` because scene-stack ownership and `requestAnimationFrame` lifecycle are presentation concerns.

## 3. Engine

`src/engine/` is the runtime rules/state layer. Current top-level areas include:

- `session/`: serializable battle, exploration, interpreter, quest, and related session state plus serialization.
- `systems/`: battle, exploration, interpreter, progression, and other gameplay operations.
- `rules/`: reusable effect, trait, formula, encounter, and other rule logic.
- `events/`: structured gameplay-event definitions/helpers.
- `ports/`: engine-facing contracts for capabilities supplied from outside the engine.
- `data/`: engine-side data contracts/registries needed by runtime rules.
- `graph/`: graph runtime logic.
- `utils/`: engine-local helpers.

The engine should remain deterministic where gameplay determinism matters. Use the repository's RNG/service contracts rather than ad-hoc randomness.

### Runtime state and serialization

The session layer is the persistence boundary for gameplay state. Save/load should serialize and restore the authoritative runtime model rather than scraping presentation objects or browser globals.

Battle, exploration, interpreter, and quest state already have explicit session representations under `src/engine/session/`. Preserve that direction when extending gameplay.

## 4. Adapters

`src/adapters/` contains narrow boundaries between presentation/composition and deeper runtime or infrastructure implementations. Current adapters include battle, exploration, interpreter, encounter, effects, input, audio, and settings.

Adapters are not alternate state owners. They should translate calls, normalize inputs/outputs, or expose a deliberately small capability surface.

Examples:

- `BattleAdapter` connects battle presentation to `BattleSystem`.
- `ExplorationAdapter` connects map intent to exploration logic.
- `InterpreterAdapter` coordinates engine interpreter results with presentation side effects.
- `AudioAdapter` is the production-facing audio contract over browser audio infrastructure.
- `SettingsAdapter` is the presentation/composition-facing settings contract.
- `InputAdapter` translates browser keyboard input into map movement intent.

Avoid turning adapters into catch-all managers.

## 5. Presentation

`src/presentation/` owns browser UI and presentation lifecycle:

- `scenes/`: orchestration and user-flow glue.
- `windows/`: DOM UI components.
- `selectors/`: view models derived from runtime state.
- `scene_manager.js`: scene stack + animation-frame lifecycle.
- `managers/`: presentation-local concerns only, such as theme/window behavior.

### Scenes

Scenes coordinate presentation and call adapters; they should not become homes for simulation rules that belong in engine systems.

### Windows

Windows render state and collect user intent. They must not import engine systems directly. Prefer selectors, adapters, and presentation helpers.

### Selectors

Selectors are the preferred way to derive UI-facing structures from runtime state. If a window needs a computed gameplay view, add or extend a selector rather than teaching the window how to run simulation logic.

## 6. Static data

Authored game content remains under `data/`. `src/data/content_loader.js` owns acquisition/loading of that content for runtime use.

Keep loading separate from service initialization. A content loader may provide data needed by another service, but it should not decide that service's lifecycle.

When adding new authored-content formats, prefer validation and explicit failure over silent schema drift.

## 7. Browser infrastructure

`src/infrastructure/` owns browser-specific implementations that must not leak into the engine.

### Settings

`src/infrastructure/settings.js` owns settings state and persistence. `SettingsAdapter` is the normal consumer-facing boundary.

The historical `window.ConfigManager` name exists only in `?test=true` debug compatibility. It is not a production architecture surface and must not gain new consumers.

### Audio

WebAudio and MIDI playback live under `src/infrastructure/audio/`. Production code consumes them through `AudioAdapter`.

The historical `window.SoundManager` name is likewise test/debug compatibility only. It delegates to the current audio contract/debug queries; it does not own a second audio cache or configuration model.

## 8. Debug/test surface

`src/debug_tools.js` exposes compatibility globals only for the repository's browser test/debug mode. These names exist to protect regression tests across the architecture migration, not to provide a convenient production dependency mechanism.

Do not write production code against `window.ConfigManager`, `window.SoundManager`, or other debug globals.

## 9. Testing and architecture gates

PR validation is expected to protect both behavior and architecture:

- ESLint/source-boundary validation;
- deterministic golden-log harness;
- battle-selector smoke coverage;
- Playwright browser regression suite.

The deterministic harness is especially important for engine work: a refactor that changes deterministic event logs must be treated as either a bug or an intentional gameplay change with an explicit golden update.

Window animations should be disabled during tests unless the behavior under test specifically requires them.

## 10. Working rules for new changes

1. **Do not recreate root managers.** Name a responsibility and put it in its actual layer.
2. **Do not add runtime globals.** Extend session/runtime ownership or a narrow service contract instead.
3. **Keep browser APIs out of the engine.** Use ports/adapters/infrastructure.
4. **Keep simulation out of windows.** Use systems, rules, adapters, and selectors.
5. **Keep content loading passive.** Loading data must not secretly bootstrap services.
6. **Prefer explicit composition.** Cross-layer dependencies should be visible at construction/configuration boundaries.
7. **Preserve deterministic tests.** Use the existing RNG and golden harness for gameplay changes.
8. **Delete obsolete architecture when replacing it.** Do not preserve a second vocabulary as a permanent compatibility layer.

## 11. Document authority

Use the documents as follows:

- **`doc/ARCHITECTURE.md`** — current structural architecture and implementation rules.
- **`doc/refactor.md`** — completed migration status, ownership audit, and refactor history.
- **`doc/refactor-audit-2026-08.md`** — evidence/audit that reopened and completed the infrastructure cleanup.
- **`doc/refactorPlan.md`** — historical migration proposal only; do not use its future-tense phases as current repository truth.
- Game-design/story documents describe desired game behavior and content; they do not override source-layer ownership rules in this document.
