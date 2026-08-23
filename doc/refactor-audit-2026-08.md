# Architecture Audit — August 2026

## Result

The audit began because the repository's refactor tracker described infrastructure ownership as complete while a catch-all root `src/managers/` layer still retained input, scene lifecycle, settings, audio, MIDI, and static-content responsibilities.

That discrepancy has now been resolved by the refactor performed alongside this audit. Phase 7 is complete at the ownership level.

## Findings and resolution

### Runtime simulation
Battle, exploration, interpreter, progression/effects/traits/encounters already had credible engine-owned homes. This audit deliberately did not reopen those systems merely to increase refactor scope.

### Input
`InputController` mixed browser KeyboardEvents, modal presentation state, Scene_Map knowledge, and movement calls. It was presentation logic. The manager was deleted and the behavior moved behind `InputAdapter`.

### Scene lifecycle
`SceneManager` owns presentation Scene instances and `requestAnimationFrame`. It now lives in `src/presentation/scene_manager.js` rather than a generic root managers namespace.

### Settings
`src/infrastructure/settings.js` separates settings state from its localStorage repository. Runtime code consumes `SettingsAdapter` or an injected settings query contract. The old source-layer `ConfigManager` class is deleted; only a browser test/debug compatibility object preserves the historical `window.ConfigManager` shape.

### Audio and MIDI
The public `AudioAdapter` contract now fronts `src/infrastructure/audio/sound_service.js`; MIDI parsing/playback lives with that audio infrastructure. Settings are injected explicitly from composition. Existing browser tests historically inspect underscore audio caches; that inspection is isolated to `AudioDebug`, the object exposed as `window.SoundManager` under test mode. Production `AudioAdapter` has no private-cache surface.

### Static content
The old DataManager had ceased to be a runtime service after audio bootstrap was removed. Its remaining responsibility was static authored-content acquisition, so it is now `src/data/content_loader.js`.

### Composition and enforcement
`src/main.js` no longer imports a managers barrel. It explicitly composes settings, audio, static content, presentation scene lifecycle, windows, and boot. ESLint now also bars engine imports from presentation/browser infrastructure and keeps presentation windows away from engine systems and the retired root managers path.

## Final ownership map

- `src/engine/`: runtime state, deterministic systems/rules, serialization-facing domain behavior.
- `src/presentation/`: scenes, windows, selectors, scene lifecycle, and presentation-only managers such as theme/window concerns.
- `src/infrastructure/`: browser persistence and WebAudio/MIDI implementation.
- `src/data/` + `data/`: static content acquisition and authored data.
- `src/adapters/`: narrow boundaries consumed by presentation/composition.
- root `src/managers/`: retired.

## Completion criterion

The criterion was not “rename every Manager.” It was: no compatibility manager may silently retain ownership that the architecture claims has moved.

The source-layer root `src/managers/` files and barrel are now removed. Remaining historical manager names exposed on `window` under `?test=true` are compatibility/debug surfaces only and delegate to the real settings/audio boundaries; they are not alternate state owners. Presentation-local managers are not part of the retired legacy namespace and remain where their ownership is truthful.

Executable Playwright validation remains a merge gate because this GitHub editing environment cannot run the repository's browser suite. That validation caveat does not change the ownership classification above.
