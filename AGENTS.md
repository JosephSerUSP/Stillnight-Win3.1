Disable window animations when running tests, unless otherwise required.

## Architecture
Use `doc/ARCHITECTURE.md` as the current structural implementation guide. Use `doc/refactor.md` for completed migration status/history and ownership-audit context. `doc/refactorPlan.md` is a historical future-tense plan only; do not treat its phases or legacy paths as current instructions.

All changes must align with the "One source of truth for runtime state" philosophy.

### Enforcement notes
* Phase 7 is complete; do not recreate the retired root `src/managers/` catch-all namespace.
* Keep import boundaries clean: Engine code must not depend on `src/presentation/**` or browser infrastructure, and presentation windows should access engine state via selectors/adapters rather than direct system imports.
* Static authored-content acquisition belongs in `src/data/`; browser persistence and WebAudio/MIDI implementations belong in `src/infrastructure/`; scene lifecycle belongs in presentation.
* Prefer wiring new work through the engine session as the single runtime source of truth instead of adding global/manager state.
* Historical `window.ConfigManager` / `window.SoundManager` names exist only as `?test=true` compatibility surfaces and must not become production dependencies.
* Architectural migrations are complete. New work should normally be gameplay/content/product work unless a concrete architectural defect is demonstrated.
