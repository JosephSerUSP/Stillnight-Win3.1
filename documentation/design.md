Technical Design Document & Refactoring Roadmap
Project: Stillnight Engine Refactoring
Role: Senior Game Engine Architect
Version: 2.0.0 (Proposed)
Date: November 26, 2025
1. Executive Summary
The current Stillnight codebase functions as a monolithic prototype. While the data layer (JSON) is reasonably separated, the application logic suffers from high coupling. Specifically, Scene_Map acts as a "God Class," managing input, exploration logic, battle calculations, and direct DOM manipulation.
To transition to a scalable game engine (similar to RPG Maker MZ), we must decouple the Visual Layer (DOM/Windows) from the Logic Layer (Game Objects) and introduce a proper Scene Management flow.
2. Architectural Analysis
2.1. Inheritance Tree & Class Hierarchy
Current State
The current hierarchy is flat and functional but lacks specialization.
Scene_Base
Scene_Map (Handles everything: Exploration, Battles, Shop, Menu, Input)
Window_Base (Wraps existing HTML elements via ID lookups)
Window_Battle (Toggles visibility of #battle-overlay)
Window_Shop (Toggles #shop-overlay, modifies specific spans)
... (Other windows follow this "Wrapper" pattern)
Target State (Proposed)
We need a strict separation between Scenes (States) and Windows (Views).
Scene_Base (Abstract lifecycle: create, start, update, stop)
Scene_Map (Exploration only)
Scene_Battle (Battle flow only)
Scene_Menu (Base for non-gameplay screens)
Scene_Shop
Scene_Title
Window_Base (Abstract: Handles rect, padding, openness, DOM generation)
Window_Selectable (Handles cursor logic, scrolling, index management)
Window_Command (List of clickable text commands)
Window_ItemList (Inventory grids)
Window_Help (Text display)
Window_Status (Actor inspection)
2.2. Coupling Analysis
Critical Issue: DOM Coupling
Currently, index.html acts as the definitive structure. JS classes search for specific IDs (document.getElementById).
Risk: You cannot instantiate two instances of the same window.
Risk: Layout changes require editing HTML, CSS, and JS simultaneously.
Refactoring Goal:
The Window class should generate its own DOM structure upon instantiation. index.html should essentially be an empty container (<div id="game-container"></div>).
2.3. Logic vs. Data (Hardcoding Analysis)
The system is only partially data-driven. Logic that belongs in the Engine is mixed with Gameplay Data.
Feature	Current Implementation	Refactoring Target
Passives	Hardcoded if (code === "PARASITE") inside resolveBattleRound.	Observer Pattern / Traits System: Game_Battler emits events (e.g., onTurnEnd), passives subscribe to them.
Skills	Hardcoded eval inside resolveBattleRound logic.	ActionManager: A class dedicated to executing Game_Action objects against Game_Battler targets.
Battle	Logic exists inside Scene_Map methods.	BattleManager: A static singleton or instance to handle turn flow, independent of the Scene.
Elements	Hardcoded multipliers inside elementMultiplier.	Trait System: Elements should be defined as rates on the Game_Battler.
3. Scalability Assessment
New Stats
Current: Adding a "Defense" stat requires modifying Game_Battler, Window_Inspect, and the damage formula in Scene_Map.
Difficulty: High. logic is scattered.
New Window Types
Current: Requires writing HTML in index.html, CSS in style.css, and a new class in windows.js.
Difficulty: Medium-High. The dependency on static HTML limits dynamic UI creation.
New Scenes
Current: Impossible. Scene_Map is the only active state.
Difficulty: Very High. The game loop is tied explicitly to the map.
4. Phased Refactoring Roadmap
Phase 1: The Window System (Foundation)
Objective: Eliminate index.html dependency for UI.
Refactor Window_Base:
It should create a div element in the constructor.
It should accept x, y, width, height arguments.
It should implement a standard refresh() method that clears and redraws inner HTML based on state.
Create WindowLayer:
A DOM container that manages z-indexing of windows.
Refactor Window_Battle:
Convert from a wrapper to a class that generates the ASCII grid programmatically.

***Refactoring Notes:***
-   **Coordinate System:** `Window_Base` and its subclasses now operate on a relative coordinate system. The `(x, y)` coordinates passed to the constructor are relative to the main game container (`.win-window`). The `Window_Base` constructor is responsible for calculating the final, absolute on-screen position.
-   **Drag and Drop:** A `makeDraggable` method has been added to `Window_Base`, allowing any window to be made draggable by its title bar.
-   **DOM Structure:** `Window_Battle` has been refactored to use a flexible, terminal-style layout with a `.terminal-viewport` and `.terminal-log`, removing the dependency on a single `<pre>` tag and allowing for individual element animation.
-   **Window-Game Attachment:** The `WindowLayer` is now appended to the main game container (`div.win-window`) instead of `document.body`. This makes the entire UI self-contained and ensures that all windows automatically scale and move with the game container, simplifying positioning logic and improving robustness.
Phase 2: The Manager Layer (Logic Extraction)
Objective: Remove game logic from Scene_Map.
Create BattleManager:
Extract resolveBattleRound, victory, flee, and xp logic from scenes.js.
It should handle the Turn state machine (Input -> Action -> Resolution -> End).
Create SoundManager:
Encapsulate audioCtx and beep logic.
Refactor Game_Battler:
Add executeAction(action, target) method.
Move damage calculation logic here or to Game_Action.
Phase 3: Scene Segregation (Flow Control)
Objective: Support multiple distinct game states.
SceneStack / SceneManager:
Create a manager to push/pop scenes (e.g., Map -> Battle -> Map).
Split Scene_Map:
Scene_Map: Handles movement, tile interaction.
Scene_Battle: Handles the battle view and links BattleManager to Window_Battle.
Scene_Shop: Dedicated scene for buying/selling.
Phase 4: Data-Driven Trait System
Objective: Remove hardcoded passive/skill effects.
Trait Evaluator:
Instead of checking for "GOLD_DIGGER", Game_Battler should have a property traits.
getTraitSum(code) returns the total value.
Formula Interpreter:
Standardize skill JSON formulas. Use a safe evaluator or parser rather than raw eval if possible, or strictly sanitize inputs.
5. Technical Specification for Standardized Code (JSDoc)
To ensure long-term maintainability, all new classes must strictly adhere to the following documentation standard:
code
JavaScript
/**
 * Represents the visual container for a specific UI element.
 * Handles the DOM generation and update cycle.
 *
 * @class Window_Selectable
 * @extends Window_Base
 */
class Window_Selectable extends Window_Base {
    /**
     * @param {number} x - The x coordinate on screen.
     * @param {number} y - The y coordinate on screen.
     * @param {number} width - The width of the window.
     * @param {number} height - The height of the window.
     */
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this._index = -1;
        this.refresh();
    }
}
6. Implementation Notes for Current Prototype
While the full roadmap is extensive, the immediate priority to unblock development is Phase 2 (Logic Extraction).
Immediate Action Item:
Move the contents of resolveBattleRound in scenes.js into a new file battle_system.js (or BattleManager), accepting actors and enemies as arguments, and returning a Log object. This decouples the calculation from the text rendering.
7. Cleanup and Assessment (November 26, 2025)
A general cleanup pass was performed on the project, focusing on the directives outlined in this document.

Summary of Actions Taken:

- All legacy window classes (`Window_Shop`, `Window_Formation`, `Window_Event`, `Window_Confirm`) were refactored to extend the new `Window_Base` class.
- The obsolete `Legacy_Window_Base` class was removed from `windows.js`.
- All static HTML for modals was removed from `index.html`.
- Obsolete CSS selectors targeting the old static HTML were removed from `style.css`.
- JSDoc-compliant comments were added to `Window_Base` and corrected across all `Window` classes to ensure accurate inheritance documentation.
- Future-forward comments were added to `WindowLayer`, `Window_Battle`, and `Scene_Map` to provide context for future developers.

Assessment of Phase 1:

The project has successfully implemented the foundational elements of Phase 1. All UI windows now inherit from a dynamic `Window_Base` class and are managed by a central `WindowLayer`, removing the dependency on static HTML for modals.

However, the core application layout (the main desktop, side panels, grid area, and status bar) was previously defined in `index.html`. This has now been accomplished by refactoring `Scene_Map` to programmatically generate this core UI, allowing `index.html` to become the simple, empty container envisioned in the roadmap. This fully decouples the view layer from the application logic.

Overall Roadmap Assessment:

The overall roadmap remains a valid and effective plan for achieving a more scalable, data-driven, and object-oriented architecture. The successful completion of the core Phase 1 objectives is a major step in the right direction and provides a solid foundation for the subsequent phases.

The next priority should be Phase 2 (Logic Extraction), as stated in the "Implementation Notes for Current Prototype." Moving the battle logic out of `Scene_Map` will be the next major milestone in reducing the complexity of the codebase and improving its maintainability.
--- END OF FILE documentation/design.md ---