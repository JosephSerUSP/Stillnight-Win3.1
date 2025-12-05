Baseline:

-Traits: These modify or change characteristics of battlers, including triggering behaviors. They are properties of Equipment, Passives and States. 
'elementAdd' - Adds a new element to the battler.
'elementChange' - Changes all elements of this battler to the target element. If the battler has no elements, it should now have one.
Some traits will execute effects on certain triggers, such as restoring HP when winning a battle.
'actionSpeed' - a flat modifier applied to a trait object's actions' 'actionSpeed'.
Traits should be flexible. I should be able to cover novel traits without needing to hardcode them.

-Effects: These directly affect battlers, such as changing hp, applying states, changing level / xp / parameters, etc. 
They are properties of Items and actions. (And Traits too, possibly?)
'learnAction' - Teaches an action to a creature. 
'learnPassive' - Teaches a passive to a creature. 
'elementAdd' - Adds a new element to the battler.
'elementChange' - Changes all elements of this battler to the target element. If the battler has no elements, it should now have one.
Effects should be flexible. I should be able to cover novel effects without hardcoding them. For example, I should be able to write an effect that changes a battler's maxActions on the fly, even if a 'changeMaxActions' effect doesn't exist.
'changeGold' - adds or removes gold from the party.

ALL OBJECTS THAT HAVE TRAITS AND / OR EFFECTS DISPLAY THESE DYNAMICALLY ON THEIR DESCRIPTION.
This means, for example, that a "Hermes Shoes" doesn't need to explicitly say in its data description string that it provides +1 actionSpeed. That'll be appended to the description instead.


-Creatures: Trait Objects. They will generally not have any innate traits, as the Passives system is used for that. They also track things such as parameters and experience. 
The battle units. They're both allies and enemies. 
'cost' - how much MP they drain per action on the map. 
'actions' - an array of all the actions the creature has.
'maxActions' - the maximum number of actions the creature can have.
'passives' - an array of all the passives the creature has.
'maxPassives' - the maximum number of passives the creature can have.
'buyPrice' - modulates purchasing prices on shops.
'sellPrice' - modulates sales prices on shops.

-Actions: Apply Effects on Targets.
'actionSpeed' - a decisive factor in deciding turn order. A action with a higher final actionSpeed will ALWAYS act first. This can be negative.
'element' - actions often have an element. Their damage is increased by *1.25 for every instance of that element that the caster also has, which is separate from resistance and weakness mechanics.
'formationSlots' - an array of formation slots in which that action can be used. 

-Items: Apply Effects on Targets.
These are usable exclusively by the PC. 

-Spells: Apply Effects on Targets.
These are usable exclusively by the PC.


-Passives: Trait Objects that are innate or learned by creatures. a and b are the same subject. 
'formationSlots' - an array of formation slots in which that passive is active.

-Equipment: Trait Objects that are equipped to creatures. a and b are the same subject.
Equipment can be modified to have different traits. 

-States: Trait Objects that are temporarily applied to creatures; a is the state applier, b is the state subject.

-Summoner:
The Player Character, mostly a non-combatant. 
Performing actions (such as moving) in the dungeon drains their MP. When it hits 0, the creatures get progressively weaker, gaining a penalty to damage and success rates and losing HP with each step. This weakness gets worse every turn the PC has 0 MP.
The summoner has access to unique equipment that yields party-wide or exploration effects. 
The summoner also has access to a skill tree and can choose their stats on level up.
Every turn the Summoner can perform one action: Use Item, Formation or Spell.
The Summoner can attempt to Flee as much as they want, without consuming a turn. It costs a semi-random amount of MP and money. The chances increase with every attempt.

-Quests: 
Inspired by Diablo, mostly. NPCs can yield the player Quests, which can be tracked in a dedicated Quest window. 