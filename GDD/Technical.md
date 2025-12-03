# Technical Details

This document provides a high-level overview of the technical aspects of the Stillnight Engine.

**For a detailed breakdown of the engine's architecture and data flow, please see the [Technical Architecture Deep Dive](../doc/technical_architecture.md).**

---

## 1. Game Engine

The Stillnight Engine is a custom-built, single-page application engine using modern, vanilla JavaScript (ES modules). It is designed to be lightweight, performant, and easily moddable. It has no major frontend framework dependencies.

## 2. Software Architecture

The engine's architecture emphasizes a clear separation of concerns, inspired by classic RPG Maker designs.
-   **Scene-Based State Management:** A stack-based `SceneManager` controls the high-level game flow (e.g., map, battle, menu).
-   **Data-Driven Content:** All game content (actors, items, skills) is loaded from external `.json` and `.js` files, making modification and expansion simple.
-   **Global Managers:** A collection of static manager classes (`DataManager`, `BattleManager`, etc.) handle global systems and state.
-   **Inheritance-Based UI:** The UI is built on a programmatic windowing system with a `Window_Base` class providing core functionality for all UI elements.

## 3. Technology Stack

-   **Programming Language:** JavaScript (ES modules)
-   **Styling:** CSS3
-   **Testing:** Playwright for end-to-end and unit testing.
-   **Version Control:** Git

## 4. Modding

The data-driven design makes the engine highly accessible for modding. By editing the files in the `/data` directory, users can easily change game balance, add new content, or create entirely new experiences.
