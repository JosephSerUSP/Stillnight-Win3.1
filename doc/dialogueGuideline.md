# Dialogue and Event Design Guidelines

This document outlines the core principles for creating engaging, immersive, and narratively coherent dialogue and events in the game.

## 1. The "Natural Conversation" Principle

**Problem:** Conversations can feel robotic if an NPC either repeats the same greeting every time a player loops back to a choice menu, or if they never greet the player at all after the first meeting.

**Guideline:** A natural conversation has a clear beginning and a fluid middle. We will structure our dialogue graphs to reflect this by using two distinct types of "hub" nodes.

### 1A. The Greeting Hub

*   **Purpose:** To welcome the player at the beginning of an interaction.
*   **When to Use:** This node should be the main entry point for an NPC after the player has already met them once. Every time the player initiates a *new* conversation, they should land here.
*   **Content:** This node should contain a proper, in-character greeting.
*   **Example:** `default_hub_text` should contain dialogue like, "Well, hello there, darling. Looking for something shiny, or just admiring the view?"

### 1B. The Internal Hub (or "Looping Hub")

*   **Purpose:** To serve as a return point *within* an ongoing conversation.
*   **When to Use:** After the player has explored a dialogue branch (e.g., asked a question), the "Back" or "Ask about something else" option should lead to this node, not the Greeting Hub.
*   **Content:** This node should use descriptive, non-greeting text. It describes a subtle action, a brief pause, or a change in expression, making it feel like a natural pause in the conversation.
*   **Example:** A `talk_menu_hub` node could contain text like `(Laura is adjusting her hair, her gaze distant for a moment.)` or `(She waits for you to say more.)`.

This two-hub structure ensures the NPC properly greets the player at the start of each new encounter, while avoiding the immersion-breaking repetition of that greeting mid-conversation.

## 2. The "Smooth Transition" Principle

**Problem:** Abruptly returning to a top-level menu after an emotionally significant topic can feel unnatural.

**Guideline:** Use intermediate "buffer" nodes to transition smoothly. After a deep conversation branch, the return path shouldn't immediately jump to the main menu. It should first go to a node that acknowledges the preceding topic before offering a path back.

**Example Flow:**
1.  `Talk Menu Hub` -> Player chooses "Talk about her tragic past."
2.  ...Emotional dialogue unfolds...
3.  **`Buffer Node`**: The choice here isn't just "Back." It's a choice that transitions the topic, like ["Let's talk about something else.", "I should go."].
4.  Choosing "Let's talk about something else" leads back to the `Talk Menu Hub`.

## 3. The "Dynamic World" Principle

**Problem:** If NPCs are always in the same place, the world feels static.

**Guideline:** Key locations, especially social hubs like the Pub, should be a stage for both significant, story-driven events and random, ambient interactions.

**Implementation:**
*   **Story-Driven Encounters:** Use the flag system to trigger specific NPC appearances in shared spaces after major quests are completed.
*   **Ambient Encounters:** Maintain a pool of random, smaller interactions (like a gambler or mercenary) to provide texture and make the space feel alive.

By adhering to these guidelines, we can create a rich, character-driven world that rewards players for paying attention and encourages them to linger and explore the stories within it.

## 4. The "Text-Choice Merge" Optimization

**Context:** To reduce unnecessary clicks, the `DirectorSystem` implements a specific optimization when processing dialogue graphs.

**Behavior:** If a `TEXT` node is followed *immediately* by a `CHOICE` node (via the `next` pointer), the system will **merge** them into a single interaction.
*   The text from the `TEXT` node is displayed.
*   The options from the `CHOICE` node are displayed immediately below it.
*   The user does not need to click "Continue" to see the choices.

**Guideline:** Writers can safely split a long lead-in sentence into a `TEXT` node and the actual question into the `CHOICE` node's content. The engine will present them seamlessly.
