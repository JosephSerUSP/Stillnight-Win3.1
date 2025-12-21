import { Game_Battler } from "./battler.js";

/**
 * @class Game_Party
 * @description Manages the party, inventory, and gold.
 */
export class Game_Party {
  /**
   * Creates a new Game_Party instance.
   */
  constructor() {
    /**
     * Maximum number of party members.
     * @type {number}
     */
    this.MAX_MEMBERS = 24;

    /**
     * The slots for party members. Can contain nulls.
     * @type {Array<Game_Battler|null>}
     */
    this.slots = new Array(this.MAX_MEMBERS).fill(null);

    /**
     * The party's gold.
     * @type {number}
     */
    this.gold = 0;

    /**
     * The party's inventory.
     * @type {Array}
     */
    this.inventory = [];

    /**
     * Known words unlocked via story beats.
     * @type {Array<string>}
     */
    this.knownWords = [];

    /**
     * Story/quest flags for persistent progression.
     * @type {Record<string, boolean>}
     */
    this.storyFlags = {};

  }

  /**
   * Gets the Summoner (Commander), who occupies the fixed 5th slot (index 4).
   * @type {Game_Battler|null}
   */
  get summoner() {
      return this.slots[4];
  }

  /**
   * Gets the list of active (non-null) members.
   * @type {Game_Battler[]}
   */
  get members() {
      return this.slots.filter(m => m !== null);
  }

  get activeMembers() {
      return this.slots.slice(0, 4).filter(m => m !== null);
  }

  get reserveMembers() {
      return this.slots.slice(5).filter(m => m !== null);
  }

  /**
   * Checks for party members with 0 HP and handles permadeath or rebirth traits.
   * @returns {Array<Object>} List of events (e.g., { type: 'DEATH', member: ... }, { type: 'REBIRTH', member: ... })
   */
  checkDeaths() {
      const events = [];

      // Check Summoner Death
      if (this.summoner && this.summoner.hp <= 0) {
          events.push({ type: 'GAME_OVER', member: this.summoner });
          // Typically we can return early, but maybe we want to process other deaths for log consistency?
          // Since it's game over, it might not matter.
      }

      const members = [...this.members];

      for (const member of members) {
          if (member.hp <= 0) {
              const permadeathTraits = member.traits.filter(t => t.code === 'ON_PERMADEATH');

              if (permadeathTraits.length > 0) {
                   const heal = Math.floor(member.maxHp * 0.2) || 1;
                   member.hp = heal;

                   const oldLevel = member.level;
                   const levelsLost = 2;
                   member.level = Math.max(1, member.level - levelsLost);

                   if (member.level < oldLevel) {
                       const lost = oldLevel - member.level;
                       member._baseMaxHp = Math.max(1, member._baseMaxHp - (lost * 3));
                       member.xp = 0;
                   }

                   if (member.hp > member.maxHp) member.hp = member.maxHp;

                   events.push({ type: 'REBIRTH', member });
              } else {
                  this.removeMember(member);
                  events.push({ type: 'DEATH', member });
              }
          }
      }
      return events;
  }

  /**
   * Initializes the party members based on starting data.
   * @param {import("./managers.js").DataManager} dataManager - The data manager.
   */
  createInitialMembers(dataManager) {
    const { startingParty, actors, items } = dataManager;

    this.gold = startingParty.getGold();
    this.inventory = startingParty.getInventory(items);

    const memberConfigs = startingParty.getMembers(actors);
    const initialMembers = memberConfigs.map(config => {
      const actorData = actors.find(a => a.id === config.id);
      if (!actorData) {
        console.error(`Actor data not found for ID: ${config.id}`);
        return null;
      }
      return Game_Battler.create(actorData, config.level);
    }).filter(member => member !== null);

    // Place initial members in slots 0-3, then 5+
    let slotIndex = 0;
    initialMembers.forEach((m) => {
        if (slotIndex === 4) slotIndex++; // Skip Summoner slot
        if (slotIndex < this.MAX_MEMBERS) {
            this.slots[slotIndex] = m;
            slotIndex++;
        }
    });

    // Initialize Summoner in Slot 4
    const summonerData = actors.find(a => a.id === 'summoner');
    let summoner;
    if (summonerData) {
        summoner = Game_Battler.create(summonerData, 1);
    } else {
        console.warn("Summoner data not found in actors.json. Creating default.");
        summoner = new Game_Battler({
            id: 'summoner',
            name: 'Commander',
            maxHp: 50,
            maxMp: 100,
            level: 1,
            role: 'Summoner',
            traits: []
        });
    }
    this.slots[4] = summoner;
  }

  /**
   * Handles map steps. Drains MP and applies Weakened effects.
   * @returns {Array} List of events (e.g. damage logs).
   */
  onStep() {
      const events = [];
      const activeCount = this.activeMembers.length;
      if (activeCount === 0 || !this.summoner) return events;

      // Drain MP
      const mpCostPerStep = activeCount; // 1 MP per active creature
      this.summoner.mp = Math.max(0, this.summoner.mp - mpCostPerStep);

      // Check Weakened State
      if (this.summoner.mp === 0) {
          // Apply Weakened State if not already applied
          this.activeMembers.forEach(m => {
              if (!m.isStateAffected('weakened')) {
                  m.addState('weakened');
                  events.push({ type: 'text', msg: `${m.name} is weakened!` });
              }
              // HP Drain
              const damage = Math.max(1, Math.floor(m.maxHp * 0.05));
              m.hp = Math.max(0, m.hp - damage);
              // events.push({ type: 'damage', target: m, value: damage }); // Too spammy for map?
          });
      } else {
          // Remove Weakened State if applied
          this.activeMembers.forEach(m => {
              if (m.isStateAffected('weakened')) {
                  m.removeState('weakened');
                  events.push({ type: 'text', msg: `${m.name} recovered strength.` });
              }
          });
      }

      return events;
  }

  /**
   * Adds a member to the first available slot (skipping index 4).
   * @param {Game_Battler} battler - The battler to add.
   * @returns {boolean} True if added, false if party is full.
   */
  addMember(battler) {
      let index = this.slots.indexOf(null);

      // If found index is 4 (Summoner slot), find next null
      if (index === 4) {
          index = this.slots.indexOf(null, 5);
      }

      if (index === -1) return false;
      this.slots[index] = battler;
      return true;
  }

  /**
   * Removes a member from the party (sets slot to null).
   * @param {Game_Battler} battler - The battler to remove.
   * @returns {boolean} True if removed.
   */
  removeMember(battler) {
      const index = this.slots.indexOf(battler);
      if (index === -1) return false;
      this.slots[index] = null;
      return true;
  }

  /**
   * Replaces a member at a specific index.
   * @param {number} index - The slot index.
   * @param {Game_Battler} battler - The new battler.
   * @returns {boolean} True if successful.
   */
  replaceMember(index, battler) {
      if (index >= 0 && index < this.MAX_MEMBERS) {
          this.slots[index] = battler;
          return true;
      }
      return false;
  }

  /**
   * Checks if there is space in the party.
   * @returns {boolean}
   */
  hasEmptySlot() {
      return this.slots.includes(null);
  }

  /**
   * Reorders a party member/slot from one index to another.
   * Prevent moving index 4 (Summoner).
   * @param {number} fromIndex - The current index of the member.
   * @param {number} toIndex - The target index.
   * @returns {boolean} True if successful.
   */
  reorderMembers(fromIndex, toIndex) {
      if (fromIndex < 0 || fromIndex >= this.MAX_MEMBERS) return false;
      if (toIndex < 0 || toIndex >= this.MAX_MEMBERS) return false;

      if (fromIndex === 4 || toIndex === 4) return false; // Locked slot

      const temp = this.slots[fromIndex];
      this.slots[fromIndex] = this.slots[toIndex];
      this.slots[toIndex] = temp;
      return true;
  }


  /**
   * Equips an item to a member, handling swaps and inventory updates.
   * @param {Game_Battler} member - The member to equip.
   * @param {Object} item - The item to equip (can be null to unequip).
   * @returns {Object} { success: boolean, msg: string }
   */
  equipItem(member, item) {
      if (!item) {
          if (member.equipmentItem) {
              this.inventory.push(member.equipmentItem);
          }
          member.equipmentItem = null;
          return { success: true, msg: `${member.name} unequipped item.` };
      } else if (item.equippedMember) {
          const otherMember = item.equippedMember;
          const currentItem = member.equipmentItem;
          otherMember.equipmentItem = currentItem;
          member.equipmentItem = item;
          return { success: true, msg: `${member.name} swapped ${item.name} with ${otherMember.name}.` };
      } else {
          if (member.equipmentItem) {
              this.inventory.push(member.equipmentItem);
          }
          member.equipmentItem = item;
          const invIndex = this.inventory.findIndex((i) => i.id === item.id);
          if (invIndex > -1) {
              this.inventory.splice(invIndex, 1);
          }
          return { success: true, msg: `${member.name} equipped ${item.name}.` };
      }
  }

  /**
   * Adds an item instance to the inventory.
   * @param {Object} item
   */
  addItem(item) {
      this.inventory.push(item);
  }

  /**
   * Counts how many copies of an item ID are held.
   * @param {string} itemId
   * @returns {number}
   */
  countItem(itemId) {
      return this.inventory.filter((i) => i.id === itemId).length;
  }

  /**
   * Removes up to count copies of an item ID from inventory.
   * @param {string} itemId
   * @param {number} count
   */
  removeItemById(itemId, count = 1) {
      let remaining = count;
      this.inventory = this.inventory.filter((item) => {
          if (item.id === itemId && remaining > 0) {
              remaining--;
              return false;
          }
          return true;
      });
  }

  /**
   * Checks whether a story flag is set.
   * @param {string} flag
   * @returns {boolean}
   */
  hasStoryFlag(flag) {
      return !!this.storyFlags[flag];
  }

  /**
   * Sets a story flag to true.
   * @param {string} flag
   */
  setStoryFlag(flag) {
      this.storyFlags[flag] = true;
  }

  /**
   * Clears a story flag.
   * @param {string} flag
   */
  clearStoryFlag(flag) {
      delete this.storyFlags[flag];
  }
}
