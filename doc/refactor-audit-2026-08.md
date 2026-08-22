# Architecture Refactor Audit — 2026-08

This audit checks the repository against `AGENTS.md` and the canonical `doc/refactor.md` claim that the runtime refactor is complete.

## Executive finding

The engine migration is materially advanced, but the repository is **not yet at the architecture described by the completion language in `doc/refactor.md`**. The most important remaining debt is no longer battle/exploration/interpreter simulation logic; it is infrastructure ownership and boundary truthfulness.

The audit therefore treats the previous “Phase 7 complete” statement as too broad. This PR starts the corrective pass by removing `InputController` from `src/managers/` entirely and making keyboard-to-scene intent a presentation adapter concern.

## Findings

### A. Engine/presentation separation: strong

Battle, exploration, interpreter, effects, traits, encounters, and progression have dedicated engine modules. Presentation generally reaches those systems through adapters/selectors. This is the successful core of the earlier refactor and should be preserved.

### B. `src/managers/` still owns infrastructure that the roadmap says was migrated

At audit time the directory still contains:

- `config.js`
- `data.js`
- `index.js`
- `input_controller.js`
- `midi.js`
- `scene.js`
- `sound.js`

This contradicts the broad Phase 7 wording that Sound/Input/Config were migrated to a Ports/Adapters structure. Wrapping a manager in an adapter is useful dependency shielding, but it is not the same as migrating ownership.

### C. Input manager is misplaced presentation logic

`InputController` knows `Scene_Map` shape, `windowManager.stack`, `runActive`, browser `KeyboardEvent`, and `movePlayer`. It is presentation glue, not a runtime service and not engine state.

**Action in this PR:** move that behavior behind `src/adapters/input_adapter.js` and delete `src/managers/input_controller.js` plus its barrel export.

### D. Audio adapter leaks SoundManager internals

`AudioAdapter.getCurrentMusicKey()`, `getMusicKeys()`, and `getSfxKeys()` read underscored static fields on `SoundManager`. This means the adapter boundary is nominal rather than contractual for those queries.

**Follow-up:** give audio infrastructure a public query contract (or an injected audio port/service) and remove adapter knowledge of private storage.

### E. Sound and config remain coupled globals

`SoundManager` reads `ConfigManager` static volume fields directly. `ConfigManager` loads itself at module evaluation time and talks directly to `localStorage`. This makes audio/config lifecycle implicit and complicates isolated tests.

**Follow-up:** introduce explicit settings/storage ownership and inject volume/settings reads into audio infrastructure. Do this behavior-preservingly; do not move these globals into `src/engine/`.

### F. Data loading initializes audio as a side effect

`DataManager.loadData()` both loads content and initializes `SoundManager`. That mixes static data acquisition with runtime service bootstrapping.

**Follow-up:** let boot/composition root initialize data and audio explicitly after data has loaded.

### G. Documentation had two competing truths

`doc/ARCHITECTURE.md` accurately describes infrastructure managers as still present, while `doc/refactor.md` said the relevant migration was complete. The canonical tracker must prefer observable repository state over aspirational completion labels.

## Refactor direction

1. **This PR:** retire `InputController` manager; keep input in the presentation adapter where its dependencies actually live.
2. **Next:** make AudioAdapter consume only a public audio contract; eliminate reads of `_currentMusicKey`, `_midiData`, `_soundMap`.
3. **Then:** separate configuration persistence from mutable settings state and inject settings into audio.
4. **Then:** separate data loading from service initialization/composition.
5. **Finally:** reassess whether `src/managers/` is still a meaningful layer or merely a compatibility namespace; delete/rename it only when remaining responsibilities have clear homes.

## Guardrails

- Do not migrate DOM, WebAudio, localStorage, or KeyboardEvent concerns into `src/engine/`.
- Do not create a second runtime-state authority while removing managers.
- Prefer explicit composition/injection over replacement globals.
- Preserve deterministic engine behavior and save compatibility.
- A wrapper is not proof that ownership has migrated.
- `doc/refactor.md` completion claims must be backed by code search and actual deletion of the legacy ownership described.
