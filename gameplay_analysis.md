# Gameplay Loop Analysis

## 1. Gap Analysis

A comparison of the current engine against standard genre expectations for dungeon crawlers and monster-taming RPGs.

### Gameplay Loop
- **Core Loop:** The basic loop of `Explore -> Battle -> Reward` is present and functional.
- **Missing Component: Meaningful Exploration:** Exploration is currently limited to uncovering tiles and triggering static events. There's a lack of dynamic interaction, puzzles, or environmental storytelling to make dungeon traversal more engaging than just a resource drain.
- **Missing Component: Strategic Depth in Combat:** Combat is a straightforward exchange of damage and healing. Key strategic layers are missing:
    - **Status Effects:** While `Regen` and `Berserk` exist, the system is not fully fleshed out. There are no debuffs, crowd control, or damage-over-time effects.
    - **Elemental System:** Creatures have elemental affinities, but these currently have no mechanical impact on combat effectiveness (e.g., weaknesses/resistances).
    - **Resource Management (MP/Stamina):** All skills are free to use, removing a critical layer of resource management and decision-making in longer battles.

### Narrative Delivery
- **Missing Component: Story Integration:** The game lacks an overarching narrative. Events are isolated encounters rather than parts of a cohesive story. There's no sense of purpose or progression beyond "clear the dungeon."
- **Missing Component: Characterization:** NPCs are currently just dialogue dispensers. There are no character arcs, quests, or meaningful relationships to build with them.

### Meta-Progression
- **Missing Component: Long-Term Goals:** The only meta-progression is creature evolution. There are no persistent upgrades, unlockable classes/features, or a "hub" area that grows and improves over multiple runs. This limits the incentive for replayability.
- **Missing Component: Economy Sink:** Gold is primarily used for buying consumable items. There's a lack of significant long-term investments for the player to save up for, such as base upgrades or rare creature purchases.

---

## 2. Friction Report

Analysis of design elements that may conflict or create a negative player experience.

### Mechanic Conflict
- **Recruitment vs. Roster Size:** The game encourages recruiting new creatures, but the active party is limited to 4 slots. Without a "storage" or "reserve" system that allows for more than a few benched members, players will be forced to discard creatures they've invested time in, which feels punishing.
- **Permadeath vs. Grinding:** The permadeath system for non-special creatures clashes with the potential need to grind levels for evolutions or difficult floors. Losing a high-level creature to an unlucky crit can feel unfair and invalidate significant time investment, especially without a way to mitigate this risk.

### Complexity Bloat
- **Status: Minimal Risk:** The current complexity is low, which is a strength. However, future additions must be carefully managed. For example, adding too many complex passive skills without clear UI feedback could quickly become overwhelming.

### Technical Constraints
- **Data-Driven, Not Data-Defined:** The engine is data-driven (it reads from JSON files), but many core mechanics are still hardcoded in `scenes.js`. For example, the logic for specific passive skills (`POST_BATTLE_HEAL`) is implemented directly in the scene code. This makes it difficult to add new, creative mechanics without modifying the core engine code, hindering rapid prototyping and expansion.
- **UI Limitations:** The current UI is functional but lacks dedicated screens for important information. A "bestiary" to view creature stats/skills outside of combat, or a more detailed "status" screen for party members, is a notable omission.

---

## 3. SWOT Analysis

A structured analysis of the engine's Strengths, Weaknesses, Opportunities, and Threats.

| Strengths                               | Weaknesses                                     |
| --------------------------------------- | ---------------------------------------------- |
| **Solid Foundation:** Clean, modular, and well-organized codebase. | **Lack of Strategic Depth:** Combat is simplistic; elemental system is non-functional. |
| **Data-Driven Core:** Easy to add new creatures, skills, and items. | **No Meta-Progression:** Limited long-term goals or reasons to replay. |
| **Fast Prototyping:** The simple loop allows for rapid testing of new content. | **Hardcoded Mechanics:** Core passive/skill logic is in the code, not data files. |
| **Retro Charm:** The ASCII art style and simple UI have a clear, appealing aesthetic. | **Absent Narrative:** No story, quests, or character development. |

| Opportunities                             | Threats                                        |
| --------------------------------------- | ---------------------------------------------- |
| **Implement Elemental System:** Immediately adds a strategic layer to combat and team-building. | **Content Treadmill:** Without deeper systems, the game will rely on a constant stream of new monsters/floors to stay fresh. |
| **Introduce a Hub/Base:** A persistent area for the player to upgrade between runs would create a strong meta-progression loop. | **Balance Issues:** The lack of a mana system means healing can easily outpace damage, leading to stalemates or trivializing encounters. |
| **Develop a Quest System:** Simple quests from NPCs could integrate narrative and provide clear short-term goals. | **Repetitive Gameplay:** The core loop is at risk of becoming monotonous without more varied and dynamic exploration events. |
| **Flesh out the Passive Skill System:** Moving passive logic into data files would allow for more creative and complex creature designs without code changes. | **Negative Player Experience:** The combination of permadeath and grinding can lead to frustration and burnout. |

---

## 4. Strategic Overhaul Roadmap

A prioritized list of proposed changes to address the identified weaknesses and threats.

| Feature / Change                      | Description                                                                                             | Impact | Effort | Priority |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------ | ------ | :------: |
| **1. Implement Elemental Weaknesses**   | Activate the elemental system. Add `weaknesses` and `resistances` arrays to `actors.json`. Modify the damage formula in `BattleManager` to account for them. | High   | Low    |    **1**   |
| **2. Introduce MP/Resource System**     | Add an `mp` stat to creatures and a `cost` to skills. This adds a critical resource management layer to combat, preventing spamming of powerful abilities. | High   | Medium |    **2**   |
| **3. Create a Creature Storage System** | Implement a "reserve" system that allows the player to store more creatures than the active party limit, mitigating the friction of recruitment vs. roster size. | High   | Medium |    **3**   |
| **4. Externalize Passive Skill Logic**  | Refactor `BattleManager` to interpret passive skill effects from data files rather than hardcoded methods. This would allow for effects like `deal_damage_on_hit` or `increase_stat_on_turn` to be defined in `passives.js`. | Medium | High   |    **4**   |
| **5. Develop a Simple Quest System**    | Allow NPCs to give the player simple "fetch" or "kill" quests that provide rewards. This would be the first step towards integrating a narrative. | Medium | High   |    **5**   |
