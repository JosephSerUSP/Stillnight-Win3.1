Base Level:
-Traits: These modify or change characteristics of battlers, including triggering behaviors. They are properties of Equipment, Passives and States. 
'elementAdd' - Adds a new element to the battler.
'elementChange' - Changes all elements of this battler to the target element. If the battler has no elements, it should now have one.
Some traits will execute effects on certain triggers, such as restoring HP when winning a battle.

-Effects: These directly affect battlers, such as changing hp, applying states, changing level / xp / parameters, etc. 
They are properties of Items and Skills. (And Traits too, possibly?)

Summoner:
The Player Character, mostly a non-combatant. 
Performing actions (such as walking) in the dungeon drains their MP. When it hits 0, the creatures get progressively weaker, gaining a penalty to damage and success rates and losing HP with each step. This weakness gets worse every turn the PC has 0 MP.

Creatures: 
The battle units. They're both allies and enemies. 

Skills: Apply Effects on Targets.
'actionSpeed' - a decisive factor in deciding turn order. A skill with a higher final actionSpeed will ALWAYS act first. This can be negative.
'element' - skills often have an element. Their damage is increased by *1.25 for every instance of that element that the caster also has, which is separate from resistance and weakness mechanics.
'formationSlots' - an array of formation slots in which that skill can be used. 

Passives:
'formationSlots' - an array of formation slots in which that passive is active.
