Baseline:
-Traits: These modify or change characteristics of battlers, including triggering behaviors. They are properties of Equipment, Passives and States. 
'elementAdd' - Adds a new element to the battler.
'elementChange' - Changes all elements of this battler to the target element. If the battler has no elements, it should now have one.
Some traits will execute effects on certain triggers, such as restoring HP when winning a battle.
'actionSpeed' - a flat modifier applied to a trait object's Skills' 'actionSpeed'.

-Effects: These directly affect battlers, such as changing hp, applying states, changing level / xp / parameters, etc. 
They are properties of Items and Skills. (And Traits too, possibly?)

Creatures: Trait Objects. They will generally not have any innate traits, as the Passives system is used for that. They also track things such as parameters and experience. 
The battle units. They're both allies and enemies. 
'cost' - how much MP they drain per action on the map. 

Skills: Apply Effects on Targets.
'actionSpeed' - a decisive factor in deciding turn order. A skill with a higher final actionSpeed will ALWAYS act first. This can be negative.
'element' - skills often have an element. Their damage is increased by *1.25 for every instance of that element that the caster also has, which is separate from resistance and weakness mechanics.
'formationSlots' - an array of formation slots in which that skill can be used. 

Passives: Trait Objects that are innate or learned by creatures. a and b are the same subject. 
'formationSlots' - an array of formation slots in which that passive is active.

Equipment: Trait Objects that are equipped to creatures. a and b are the same subject.

States: Trait Objects that are temporarily applied to creatures; a is the state applier, b is the state subject.

Summoner:
The Player Character, mostly a non-combatant. 
Performing actions (such as moving) in the dungeon drains their MP. When it hits 0, the creatures get progressively weaker, gaining a penalty to damage and success rates and losing HP with each step. This weakness gets worse every turn the PC has 0 MP.

The summoner has access to unique equipment that yields party-wide or exploration effects. 
The summoner also has access to a skill tree and can choose their stats on level up.