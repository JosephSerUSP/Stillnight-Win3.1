Disable window animations when running tests, unless otherwise required.

## Refactor
Please refer to `refactor.md` for the architectural roadmap and strict import boundaries. Update it accordingly as the refactor is executed.
All changes must align with the "One source of truth for runtime state" philosophy.

**Note:** Legacy managers (`TraitManager`, `EffectManager`) have been removed. Use `TraitSystem` (`src/engine/rules/traits.js`) and `EffectSystem` (`src/engine/rules/effects.js`) instead.
