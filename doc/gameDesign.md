-Effects: These directly affect battlers, such as changing hp, applying states, changing level / xp / parameters, etc. 
'learnAction' - Teaches an action to a creature. 
'learnPassive' - Teaches a passive to a creature. 
'elementAdd' - Adds a new element to the battler.
'elementChange' - Changes all elements of this battler to the target element. If the battler has no elements, it should now have one.
Effects should be flexible. I should be able to cover novel effects without hardcoding them. For example, I should be able to write an effect that changes a battler's maxActions on the fly, even if a 'changeMaxActions' effect doesn't exist.

-Traits: These modify or change characteristics of battlers, or/and trigger Effects. They are properties of Equipment, Passives and States. 
Some examples:
'elementAdd' - Adds a new element to the battler.
'elementChange' - Changes all elements of this battler to the target element. If the battler has no 
elements, it should now have one.
'paramMod' etc - ways to affect a battler's stats, such as 'mhp' or MP Drain.
'actionMod' etc - ways to affect an Action's effects, such as 'actionSpeed'. 
Traits can execute Effects on certain triggers, such as restoring HP when winning a battle.
Traits should be flexible. I should be able to cover novel traits without needing to hardcode them.

Both Effects and Traits also must generate description strings. These are going to be attached to an object's description. For example, a "Mythril Sword"'s "Description" field might just say "A sword made from legendary ore.", but, dynamically, "Increases ATK by 5." will be appended to its description, and (ATK 12 -> ATK 17 (+5)) will be shown in the equip preview when equipping this item.
Characteristics such as Scope and Condition must also be dynamically shown on the description.

TRAIT OBJECTS:
-Battlers: The battle units. They're both allies and enemies. They can inherit traits from Passives, Equipment, States and the PC.
'mpDrain' - how much MP this creature drains per action on the map. 

-Passives: Trait Objects that are innate or learned by creatures. a and b are the same subject. 
'condition' - a condition for which this object's traits are inherited. 

-Equipment: Trait Objects that are equipped to creatures. a and b are the same subject.
Equipment can be modified to have different traits. 
'condition' - a condition for which this object's traits are inherited.

-States: Trait Objects that are temporarily applied to creatures; a is the state applier, b is the state subject.
'condition' - a condition for which this object's traits are inherited.

Actions apply Effects to targets. They can be:
-Skills: Used by creatures.
-Items: Used exclusively by the PC. They, by default, consume themselves on use.
-Spells: Used exclusively by the PC. They, by default, consume MP on use.

'actionSpeed' - a decisive factor in deciding turn order. An action with a higher final actionSpeed will ALWAYS act first. This can be negative. PC Actions don't care for this - they're always instant as the PC's turn is out of the regular turn order flow.
'element' - actions often have an element. Their damage is increased by *1.25 for every instance of that element that the caster also has, which is separate from resistance and weakness mechanics.
'condition' - a condition required for this Action to be usable. 



-Summoner:
The Player Character, mostly a non-combatant. 
Performing actions (such as moving) in the dungeon drains their MP. When it hits 0, the creatures get progressively weaker, gaining a penalty to damage and success rates and losing HP with each step. This weakness gets worse every turn the PC has 0 MP.
The summoner has access to unique equipment that yields party-wide or exploration effects. 
The summoner also has access to a skill tree and can choose their stats on level up.
Every turn the Summoner can perform one action: Use Item, Formation or Spell.
The Summoner can attempt to Flee as much as they want, without consuming a turn. It costs a semi-random amount of MP and money. The chances increase with every attempt.





EXAMPLE COMPLEX ACTIONS: 

Potion Rain: 
Condition: Having one of a few different types of healing items in the inventory.
Cost: Consuming the healing item.
Effect: Restores HP equal to the healing item's normal restoration effect to every party member. Effect is multiplied by 75% for every valid target.


EXAMPLE COMPLEX TRAITS:

Mug: 
Trigger: On dealing damage.
Effect: Gains gold equal to damage dealt. 