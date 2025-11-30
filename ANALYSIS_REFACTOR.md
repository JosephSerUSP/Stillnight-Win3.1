# Analysis & Refactoring Roadmap

**Date:** Oct 26, 2023
**Focus:** Window System Architecture (DOM vs. MZ)

## 1. The "Baby Steps" Explanation: DOM vs. Canvas

To understand how to improve the windows, we first need to understand the fundamental difference between this engine and RPG Maker MZ.

### RPG Maker MZ (The "Painter" Approach)
MZ uses a technology called **Canvas**. Imagine the game screen is a single blank piece of paper.
*   **Drawing:** Every frame (60 times a second), the game code picks up a pen and draws everything: the map background, the characters, the blue window boxes, and the text letters.
*   **Interaction:** If you want a button, you draw a rectangle. The "button" doesn't actually exist as an object the browser knows about. To click it, you have to write math code: "Did the mouse click happen between x=10 and x=50?"
*   **Pros:** Total control over every pixel. Great for special effects.
*   **Cons:** Hard to handle text (word wrapping is math). Hard to make accessible. Buttons are fake.

### Stillnight Engine (The "Website" Approach)
This engine uses the **DOM** (Document Object Model). This is exactly how websites work.
*   **Drawing:** The game creates "Elements" (divs, spans, buttons). The browser (Chrome/Firefox) handles the drawing.
*   **Interaction:** A button is a real HTML `<button>`. The browser handles the clicking, hovering, and scrolling automatically.
*   **Pros:** Text is crisp and wraps automatically. CSS handles styling easily. Accessibility is built-in.
*   **Cons:** Harder to do complex pixel-perfect 9-slice scaling (stretching a window frame image) without CSS tricks.

---

## 2. Architectural Comparison

We are aiming for the **logical robustness** of MZ, but keeping the **technological advantages** of the DOM.

### 2.1. The Window Base Class
*   **MZ (`Window_Base`)**: A heavyweight class. It manages the "Window Skin" (the blue frame graphics), the "Contents" (where text is drawn), opening animations, and padding.
*   **Stillnight (`Window_Base`)**: A lightweight wrapper around a `div`.
    *   *Current State:* It creates a `div` with a standard border. It handles dragging (which MZ doesn't do natively) and basic Open/Close.
    *   *Missing:* It relies on CSS borders (`border: 2px solid`) rather than an image-based Window Skin. This gives it the "Windows 3.1" look but makes it harder to switch to a fancy fantasy UI later if desired.

### 2.2. The Selectable Window (The "Cursor" Problem)
*   **MZ (`Window_Selectable`)**: The most important class. It manages a **List of Items** and a **Cursor Index**.
    *   It listens for Arrow Keys -> Moves the cursor index.
    *   It listens for OK/Cancel -> Triggers handlers.
    *   It automatically draws the cursor box over the selected item.
*   **Stillnight**: **Does not exist.**
    *   *Current State:* Windows like `Window_Inventory` manually create a list of buttons. There is no concept of a "Cursor". You can't use the arrow keys to scroll through your inventory. You *must* click.
    *   *Impact:* This makes the game feel less like a console RPG and more like a web page.

### 2.3. Input Handling
*   **MZ**: A centralized `Input` class. Windows explicitly check `if (Input.isRepeated('down'))`. The active window "consumes" the input.
*   **Stillnight**: Scattered event listeners.
    *   *Current State:* `WindowManager` only listens for `Escape` to close windows. It does NOT pass arrow keys to the top window.
    *   *Impact:* If you open the Inventory, pressing "Down" might still move the player on the map (unless blocked by flags), or simply do nothing.

---

## 3. Areas for Improvement

### 3.1. Implement `Window_Selectable`
We need to create a class `Window_Selectable extends Window_Base`.
*   **Responsibilities**:
    *   Store a list of data (e.g., items).
    *   Track `this._index` (0 to length-1).
    *   Handle Keyboard Input (Arrows to change index, Enter to select).
    *   Visually highlight the selected item (add `.selected` CSS class).
*   **Benefit**: This will unify Inventory, Shop, Party Select, and Formation under one logic system.

### 3.2. Centralize Input Routing
*   **Change**: Modify `WindowManager.handleInput(e)`.
*   **Logic**: Instead of just checking for Escape, it should pass the *entire* event to the top window: `topWindow.processInput(e)`.
*   **Result**: The window gets first dibs on all keys. If the window uses the arrow keys (like a `Window_Selectable`), it returns `true` (handled), preventing the map from moving.

### 3.3. Decouple "View" from "Logic"
*   **Current**: `Window_Shop` contains some logic for buying.
*   **Goal**: The Window should just *display* data and *report* clicks/selections. It shouldn't know *how* to deduct gold. The `Scene_Shop` should handle the transaction. (This is already mostly true, but we should be strict about it).

---

## 4. Refactoring Roadmap

To achieve an MZ-like architecture without rewriting everything:

### Step 1: The Input Upgrade
1.  Update `Window_Base` to add a default `processInput(event)` method (returns false).
2.  Update `WindowManager` to call `topWindow.processInput(event)` for *all* keydown events.

### Step 2: Create `Window_Selectable`
1.  Create the class in `windows.js`.
2.  Implement `select(index)`, `cursorDown()`, `cursorUp()`.
3.  Implement `drawItem(index)` (which in DOM terms means "create the HTML element for this item").
4.  Add CSS for `.selected` (already exists, but standardize it).

### Step 3: Refactor Inventory
1.  Change `Window_Inventory` to inherit from `Window_Selectable`.
2.  Replace the manual loop of creating buttons with the `drawItem` pattern.
3.  **Result**: You can now navigate inventory with Arrow Keys.

### Step 4: Refactor Shop
1.  Change `Window_Shop` to inherit from `Window_Selectable`.
2.  **Result**: Shopping with keyboard support.

### Note on "Sprite-Based Windows"
You mentioned ensuring we don't use "window.png" loading (Sprite-based windows).
*   **Good News**: The DOM approach naturally avoids this. We use CSS borders.
*   **Constraint**: We will stick to CSS styling (`border`, `box-shadow`) to create the window appearance. This is performant and crisp.
