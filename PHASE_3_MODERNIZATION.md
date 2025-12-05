# Phase 3: Modernization & Testability

**Objective:** Future-proof the engine by adopting modern component patterns and ensuring 100% testability of core game logic in headless environments.

## 1. UI References (The "Ref" System)

### The Problem
Code like `shopBody.children[0].children[0]` is brittle. Changing the UI layout (e.g., wrapping a button in a div) breaks the logic.

### The Standard
UI Components must be accessible via **Named References**, not DOM traversal.

### Execution Plan
1.  **Update `UI.build`**:
    *   Add support for a `ref` property in the structure: `{ type: 'button', ref: 'btnBuy', ... }`.
    *   `UI.build` should return an object containing the root element *and* a map of refs: `{ element, refs: { btnBuy: ... } }`.
2.  **Refactor Windows**:
    *   Update `Window_Shop`, `Window_Battle`, etc., to use refs.
    *   Example: `this.refs.btnBuy.addEventListener(...)` instead of traversing `children`.

## 2. Pure Logic Battle System

### The Problem
`BattleManager` currently mixes state calculation with side effects (sounds, logging strings). This makes it impossible to run thousands of simulated battles for balance testing.

### The Standard
The **Battle Engine** must be a pure state machine.
*   **Input:** State + Action.
*   **Output:** New State + Semantic Event Log.

### Execution Plan
1.  **Isolate `BattleEngine`**:
    *   Create `src/managers/battle_engine.js`.
    *   It should have **zero dependencies** on `SoundManager` or `DataManager` (pass data in).
2.  **Semantic Returns**:
    *   Instead of `events.push({ msg: "Player attacks!" })`, return `{ type: 'ATTACK', source: A, target: B, damage: 10, isCrit: true }`.
3.  **View Layer Interpreter**:
    *   `Scene_Battle` takes these semantic events and translates them into:
        *   Visuals (Flash screen).
        *   Audio (Play 'DAMAGE' sound).
        *   Text (Construct the string "Player attacks for 10 damage!").

## 3. The "Headless" Vision

### The Goal
We must be able to run `npm run test:logic` and execute an entire dungeon run (generation, movement, combat, looting, leveling) in milliseconds without launching a browser window.

### Strict Restrictions for Phase 3
*   **No Global State in Logic:** `BattleEngine` instances must be self-contained.
*   **No localized strings in Logic:** Logic returns numbers/enums. The View translates `ATTACK` to "You swing your sword!".
*   **Full Test Coverage:** Every Manager must have a corresponding `.spec.js` that runs in Node.js (or Playwright's Node context) verifying 100% of the game rules.
