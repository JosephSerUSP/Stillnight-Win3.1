# Debugging Guide

This guide provides instructions on how to debug the game using the browser's developer console.

## Getting Started

To enable debugging, you must append `?test=true` to the URL in your browser. For example: `http://127.0.0.1:8000/?test=true`

This will expose several key game manager objects on the `window` object, allowing you to inspect and manipulate the game state.

## Global Objects

The following global objects are available for debugging when `?test=true` is active:

- `window.sceneManager`: Manages the current game scene (e.g., map, battle).
- `window.windowManager`: Manages the UI windows.
- `window.dataManager`: Holds all the static game data (actors, items, etc.).
- `window.Game_Party`: The player's party object.
- `window.Game_Map`: The current game map object.
- `window.Game_Event`: The game event object.
- `window.Game_Battler`: The game battler object.

You can access the current scene, which contains the most relevant data for debugging, using:

```javascript
const currentScene = window.sceneManager.currentScene();
```

From the `currentScene` object, you can access the party, map, and other important game objects.

## Manipulating the Party

You can manipulate the player's party through the `Game_Party` object.

### Accessing the Party

```javascript
const party = window.sceneManager.currentScene()._party;
```

### Adding a Member

To add a new member to the party, you need to create a new `Game_Battler` instance and then add it to the party.

```javascript
// Get the actor data from the dataManager
const actorData = window.dataManager.actors.find(a => a.id === 'ACTOR_ID'); // Replace ACTOR_ID with the desired actor ID

// Create a new battler
const newMember = new window.Game_Battler(actorData);

// Add the new member to the party
party.addMember(newMember);
```

### Changing a Member's HP

You can directly modify the HP of a party member.

```javascript
// Get the first party member
const member = party.members[0];

// Set their HP to a new value
member.hp = 50;

// Set their HP to the maximum
member.hp = member.maxHp;
```

### Adding Items to the Inventory

You can add items to the party's inventory.

```javascript
// Get the item data from the dataManager
const itemData = window.dataManager.items.find(i => i.id === 'ITEM_ID'); // Replace ITEM_ID with the desired item ID

// Add the item to the inventory
party.inventory.push(itemData);
```

### Adding Gold

You can add gold to the party.

```javascript
party.gold += 1000;
```

## Manipulating the Map

You can manipulate the game map through the `Game_Map` object.

### Accessing the Map

```javascript
const map = window.sceneManager.currentScene()._map;
```

### Revealing the Map

To reveal the entire current floor:

```javascript
map.revealCurrentFloor();
```

### Moving the Player

You can change the player's position on the map.

```javascript
// Set the player's X and Y coordinates
map.playerX = 10;
map.playerY = 10;

// You may need to refresh the scene to see the change
window.sceneManager.currentScene().refresh();
```
