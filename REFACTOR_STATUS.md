# Refactor Status Report

## Overview
A deep architectural refactor has been performed to address technical debt identified in the analysis report. The primary goals were:
1.  **Decouple Battle Logic:** Separated effect execution from `BattleManager` into `EffectProcessor`.
2.  **Purify Data Models:** Extracted business logic (Progression, Encounters) from `Game_Battler` and `Game_Map` into specialized Managers (`ProgressionSystem`, `EncounterManager`).
3.  **Break Scene_Map Monolith:** Extracted Input and UI management into `InputController` and `HUDManager`.
4.  **Standardize UI:** Refactored `Window_Base` to use the declarative `UI.build` system.

## Current Stage
The refactor has been applied to the core codebase (`src/objects`, `src/managers`, `src/scenes`). However, runtime errors in the frontend indicate that several consumers of the refactored code were not fully updated, leading to a broken state.

## Known Issues & Regressions

### 1. `Game_Battler` Method Removal
The methods `xpNeeded`, `gainXp`, and `getEvolutionStatus` were removed from `Game_Battler` and moved to `ProgressionSystem` (static class). However, several UI components still attempt to call these methods on battler instances.

*   **File:** `src/windows/utils.js`
    *   **Error:** `Uncaught TypeError: battler.xpNeeded is not a function`
    *   **Location:** `drawBattlerStats` function.
    *   **Fix Required:** Update to use `ProgressionSystem.xpNeeded`.

*   **File:** `src/windows/formation.js`
    *   **Error:** `Uncaught TypeError: m.getEvolutionStatus is not a function`
    *   **Location:** `Window_Formation.renderFormationGrid`.
    *   **Fix Required:** Update to use `ProgressionSystem.getEvolutionStatus`.

### 2. `Scene_Map` UI Access
`Scene_Map` delegated UI window management to `HUDManager`. Consequently, windows like `recruitWindow` and `eventWindow` are no longer direct properties of `Scene_Map`, but `Game_Interpreter` still attempts to access them via `this.scene.recruitWindow`.

*   **File:** `src/managers/interpreter.js`
    *   **Error:** `Uncaught TypeError: Cannot read properties of undefined (reading 'bodyEl')` (accessing `recruitWindow`) and `reading 'show'` (accessing `eventWindow`).
    *   **Location:** `openRecruitEvent`, `openTreasureEvent`, `openShrineEvent`.
    *   **Fix Required:** Update `Game_Interpreter` to access windows via `this.scene.hudManager`.

## Next Steps
To restore stability, the following actions are required:

1.  **Update `src/windows/utils.js`**: Import `ProgressionSystem` and replace `battler.xpNeeded` calls.
2.  **Update `src/windows/formation.js`**: Import `ProgressionSystem` and replace `m.getEvolutionStatus` calls.
3.  **Update `src/managers/interpreter.js`**: Update all references to `this.scene.windowName` to `this.scene.hudManager.windowName`.

The core architectural split is sound and verified by unit tests, but the integration with legacy UI components requires these follow-up fixes.
