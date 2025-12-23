Disable window animations when running tests, unless otherwise required.

## Refactor
Please refer to `refactor.md` for the architectural roadmap and strict import boundaries. Update it accordingly as the refactor is executed.
All changes must align with the "One source of truth for runtime state" philosophy.

### Enforcement notes
* Treat `refactor.md` as the canonical status tracker. Do not mark a phase complete unless the legacy managers/objects usage described there has actually been removed.
* Keep import boundaries clean: Engine code must not depend on `src/presentation/**`, and presentation windows should access engine state via selectors/adapters rather than direct system imports.
* Prefer wiring new work through the engine session as the single runtime source of truth instead of adding more global/manager state.

## NPC Interaction
* By strict design rule, all Map Events are **non-solid** (`isObstacle: false`) and interactable via `onEnter` (step-on) triggers, unless explicitly stated otherwise for specific mechanics (e.g., blocking walls).
