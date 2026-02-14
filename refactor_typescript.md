# TypeScript Refactor Plan

This document outlines the strategic plan to migrate the codebase from JavaScript (ESM) to TypeScript.

## Executive Summary

The codebase has recently undergone a significant architectural refactor (Phases 0-7), resulting in a clean separation between the **Engine** (logic, state) and **Presentation** (UI, DOM). This modular structure makes it an ideal candidate for a TypeScript migration. The migration will be executed iteratively, starting with build tooling and core types, then moving through the Engine and Presentation layers.

## Pros & Cons

### Pros
1.  **Type Safety**: Eliminates entire classes of bugs (e.g., `undefined` access, incorrect function arguments) at compile time. This is critical for the Engine's deep state objects (e.g., `GameState`, `Party`, `BattleState`) and complex logic rules.
2.  **Architectural Enforcement**: TypeScript interfaces will strictly enforce the boundaries between "Systems", "Adapters", and "Presentation". For example, we can ensure `Window` classes only receive specific "View Models" and not raw Engine entities.
3.  **Developer Experience**: Drastically improves code navigation ("Go to Definition"), autocompletion, and refactoring safety. Renaming a method in a System will automatically update all usages.
4.  **Self-Documentation**: Interfaces serve as living documentation. Instead of relying on `AGENTS.md` or stale comments to know what properties a `Battler` has, the interface defines it explicitly.
5.  **Data Validation**: Strong typing for the `Registry` ensures that static JSON assets (items, skills, enemies) loaded from `data/` match the engine's expectations.

### Cons
1.  **Build Complexity**: Introduces a build step (compilation/bundling). The current "edit and reload" workflow with native ESM will require a dev server (like Vite) to transpile TS on the fly.
2.  **Initial Velocity Dip**: The migration process involves "fighting the compiler," fixing typing errors, and defining interfaces, which will temporarily slow down feature development.
3.  **Learning Curve**: Requires the team (and future contributors) to be proficient in TypeScript.
4.  **Tooling Overhead**: Requires maintaining `tsconfig.json`, build scripts, and potentially type definitions for custom logic.

## Strategy: The "Strangler Fig" Approach

We will not stop development for a full rewrite. Instead, we will introduce the tooling and migrate module-by-module, leveraging the strict architectural boundaries already in place.

### Phase 1: Infrastructure & Tooling
**Goal**: Enable TypeScript without breaking the current JS workflow.
*   **Action**: Install `typescript` and `vite` (as a dev server/bundler).
*   **Action**: Create `tsconfig.json` with lenient settings (`allowJs: true`, `checkJs: false`, `noImplicitAny: false`).
*   **Action**: Rename entry point `main.js` to `main.ts` and ensure the app runs via the Vite dev server.
*   **Deliverable**: App runs in dev mode with TS support; CI (if any) runs `tsc --noEmit`.

### Phase 2: Core Domain & Data
**Goal**: Define the "Language" of the game.
*   **Action**: Define core interfaces in `src/engine/types/`:
    *   `GameState`: The root session object.
    *   `Battler`: The entity used in combat.
    *   `Action`: The object representing a skill/item usage.
*   **Action**: Type the `Registry` (`src/engine/data/registry.js`) to enforce data schemas for items, skills, and actors.
*   **Action**: Define generic types for `System` and `Adapter` to standardize the architecture patterns.

### Phase 3: Engine Migration (`src/engine`)
**Goal**: Make the business logic type-safe.
*   **Action**: Convert `src/engine/systems/` files one by one.
*   **Action**: Convert `src/engine/rules/` (pure functions are easiest to type).
*   **Action**: Convert `src/engine/session/` (critical for state integrity).
*   **Note**: This phase is high-value as it often uncovers subtle logic bugs.

### Phase 4: Presentation Migration (`src/presentation`)
**Goal**: Type-safe UI and DOM interaction.
*   **Action**: Define "View Model" interfaces for Selectors.
    *   *Concept*: `selectBattleScreen(state): BattleScreenVM`.
    *   *Benefit*: Windows become dumb renderers that only accept `BattleScreenVM`, removing any risk of them mutating engine state.
*   **Action**: Convert `src/presentation/windows/` classes. Use `HTMLElement` subtypes (e.g., `HTMLDivElement`) for better DOM API access.
*   **Action**: Convert `src/presentation/scenes/`.

### Phase 5: Strictness & Cleanup
**Goal**: Maximize long-term benefits.
*   **Action**: Enable `strict: true` in `tsconfig.json`.
*   **Action**: Resolve `any` types and remove temporary casting.
*   **Action**: Remove JSDoc types that are now redundant.
*   **Action**: Update `AGENTS.md` and `refactor.md` to reflect the TS transition.

## Build Pipeline Changes

*   **Current**: Native ESM (`<script type="module" src="main.js">`).
*   **Target**: Vite Bundle (`<script type="module" src="main.ts">`).
    *   **Vite**: Recommended for its speed, HMR (Hot Module Replacement), and native ESM handling during development.
    *   **Tests**: Update `package.json` scripts to use `tsx` (TypeScript Execute) for running the headless harness (`tests/harness.js`) directly from TS sources.
