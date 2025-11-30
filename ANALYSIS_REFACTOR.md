# Codebase Analysis & Refactoring Assessment

**Date:** 2024-05-23
**Assessor:** Agent Jules

## 1. Overview
The codebase implements a retro Windows 3.1-style RPG engine. While the architecture has moved towards a modular scene-based system, several "God Classes" and monolithic files persist, impeding maintainability and scalability.

## 2. Identified Violations & Problems

### 2.1. Monolithic Files ("God Files")
*   **`windows.js` (~1700 lines)**: This file is the most significant violation. It contains:
    *   The core window system (`Window_Base`, `WindowManager`, `WindowLayer`).
    *   **All** specific window implementations (Battle, Shop, Inventory, Formation, Event, etc.).
    *   UI utility functions (`createIcon`, `createGauge`, `renderCreatureInfo`).
    *   **Impact**: Navigating this file is difficult. Any UI change requires touching this massive file, increasing merge conflict risks and cognitive load. It violates the **Single Responsibility Principle (SRP)** at the module level.

### 2.2. God Classes
*   **`Scene_Map` (~900 lines)**: This class acts as a catch-all for the exploration state.
    *   **Responsibilities**: Map movement, Tile interaction, Event delegation, UI management for sub-windows (Inventory, Formation, Inspect, Recruit, Evolution, Settings), Debug logic.
    *   **Violation**: SRP. It handles both the "Game World" logic and the "Meta UI" logic.
*   **`Game_Battler`**:
    *   **Responsibilities**: Stats storage, Stats calculation (getters), Leveling logic, State management, Equipment slot management, *and* Battle Mechanics (`onTurnStart` logic).
    *   **Violation**: High coupling between Data and Logic.

### 2.3. Open/Closed Principle (OCP) Violations
The code is not easily extensible without modification.
*   **`Game_Battler.onTurnStart`**: Hardcodes specific passive effects (`HRG`, `PARASITE`). Adding a new start-of-turn effect requires modifying this method directly.
*   **`BattleManager.executeAction`**: Contains a hardcoded switch/if-else block for skill effects (`hp_damage`, `hp_heal`, `add_status`). Adding a new effect type (e.g., `mp_drain`) requires modifying the core manager.

### 2.4. Data Encapsulation
*   **`Game_Battler._baseMaxHp`**: This property is modified directly by various systems (Leveling, Permadeath/Rebirth). This makes tracking stat bugs difficult.

## 3. Refactoring Plan

### Phase 1: Deconstruct `windows.js` (High Priority)
Split `windows.js` into a directory structure `js/windows/`:
1.  **Core**: `Window_Base.js`, `WindowManager.js`, `WindowLayer.js`, `WindowAnimator.js`.
2.  **Utils**: `ui_utils.js` (for `createIcon`, `renderCreatureInfo`, etc.).
3.  **Modules**: Individual files for each window class:
    *   `Window_HUD.js`
    *   `Window_Battle.js`
    *   `Window_Shop.js`
    *   `Window_Inventory.js`
    *   `Window_Formation.js`
    *   `Window_Inspect.js` (can include Evolution)
    *   `Window_Event.js` (can include Recruit)
    *   `Window_Selectable.js` (Base for lists)
    *   `Window_Common.js` (Confirm, Alert, Help)

**Action**: Create a `windows/` directory (or just separate files in root if folder structure is constrained) and migrate code. *Note: Given the flat file structure preference in `AGENTS.md` ("There is no src/ folder"), we might need to keep them in root or creating a `windows/` folder is acceptable if we update imports.*

### Phase 2: Decouple `Scene_Map`
1.  **Extract UI Controllers**: Create `MapUIManager` (or similar) to handle the opening/closing and callbacks of the inventory, formation, and inspection windows.
2.  **Delegate**: `Scene_Map` should instantiate the manager and delegate button clicks to it.

### Phase 3: Data-Driven Effects System
1.  **Effect Registry**: Create a system to register effect handlers (e.g., `EffectManager`).
2.  **Refactor `onTurnStart`**: Instead of hardcoding `HRG`, iterate through traits and look for handlers registered to `ON_TURN_START`.
3.  **Refactor `executeAction`**: Use the registry to find handlers for `hp_damage`, `hp_heal`, etc.

## 4. Immediate Next Steps
1.  **Split `windows.js`**: This is the lowest hanging fruit that yields the highest maintainability boost.
2.  **Update Imports**: Ensure `scenes.js` and `main.js` import from the new locations.
