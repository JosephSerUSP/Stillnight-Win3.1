# Narrative Assessment

## Current Capabilities

The engine currently supports a linear, exploration-focused gameplay loop with the following narrative elements:

1.  **Linear Progression**: The game is structured as a series of "Floors" (Maps) that are unlocked sequentially. Each floor has an "Intro" text.
2.  **Basic Event Triggers**: Interactions are triggered by stepping on specific tiles (Events).
3.  **Simple Dialogue**: The `NPC_DIALOGUE` action allows displaying a static string of text from an NPC. It is strictly one-way (Player reads, then leaves).
4.  **Choice-Based Scenarios**: `SHRINE` events allow for a single decision point with immediate, hardcoded mechanical consequences (HP/Gold/XP changes).
5.  **Flavor Text**: Actors, Skills, and Items have description fields that add lore.

## Limitations

1.  **No State Persistence**: The game does not track narrative progress (e.g., "Met the King", "Defeated the Guardian"). Interactions are stateless and repeatable unless the event is removed from the current map instance.
2.  **No Event Chaining**: `NPC_DIALOGUE` cannot trigger a Battle, nor can a Battle trigger a specific Dialogue. Events are isolated.
3.  **No Conditional Logic**: Events cannot check if a condition is met (e.g., "Only show this NPC if you have the 'Golden Key'").
4.  **Static World**: The world does not react to player actions. Map content is generated based on static configuration tables.
5.  **Limited Output**: Text is displayed in a "Terminal" style window, which is good for the theme but limited in expressiveness (no portraits in dialogue, no scene blocking).

## Conclusion

To support a "lengthy, original gameplay campaign," the engine requires significant expansion in its **Event System** and **State Management**. Specifically, it needs:
-   A **StoryManager** to track global flags (Booleans) and variables (Numbers).
-   A **Scripted Event System** that allows defining sequences of actions (Text -> Choice -> Logic -> Effect).
-   **Conditional Logic** in map generation and event execution to make the world reactive.
