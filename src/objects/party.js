import { EffectProcessor } from "../managers/effect_processor.js";
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
      return this.slots.slice(4).filter(m => m !== null);
  }

  /**
   * Checks for party members with 0 HP and handles permadeath or rebirth traits.
   * @returns {Array<Object>} List of events (e.g., { type: 'DEATH', member: ... }, { type: 'REBIRTH', member: ... })
   */
  checkDeaths() {
      const events = [];
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

    initialMembers.forEach((m, i) => {
        if (i < this.MAX_MEMBERS) {
            this.slots[i] = m;
        }
    });
  }

  /**
   * Adds a member to the first available slot.
   * @param {Game_Battler} battler - The battler to add.
   * @returns {boolean} True if added, false if party is full.
   */
  addMember(battler) {
      const index = this.slots.indexOf(null);
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
   * @param {number} fromIndex - The current index of the member.
   * @param {number} toIndex - The target index.
   * @returns {boolean} True if successful.
   */
  reorderMembers(fromIndex, toIndex) {
      if (fromIndex < 0 || fromIndex >= this.MAX_MEMBERS) return false;
      if (toIndex < 0 || toIndex >= this.MAX_MEMBERS) return false;

      const temp = this.slots[fromIndex];
      this.slots[fromIndex] = this.slots[toIndex];
      this.slots[toIndex] = temp;
      return true;
  }

  /**
   * Consumes an item on a target member.
   * @param {Object} item - The item object (from inventory).
   * @param {import("./objects.js").Game_Battler} targetMember - The target.
   * @returns {Object} Result of the operation.
   */
  useItem(item, targetMember) {
      const index = this.inventory.indexOf(item);
      if (index === -1) return { success: false, msg: "Item not in inventory." };

      const outcomes = [];

      if (item.effects) {
          item.effects.forEach(effect => {
              const key = effect.type;
              const value = effect.formula || effect.value;
              const result = EffectProcessor.apply(key, value, item, targetMember);
              if (result) outcomes.push(result);
          });
      }

      this.inventory.splice(index, 1);
      return { success: true, outcomes, item };
  }

  /**
   * Equips an item to a member, handling swaps and inventory updates.
   * @param {Game_Battler} member - The member to equip.
   * @param {Object} item - The item to equip (can be null to unequip).
   * @returns {Object} { success: boolean, msg: string }
   */
  equipItem(member, item) {
      if (!item) return this.unequipItem(member, 'equipmentItem');

      const isPersona = item.equipType === 'Persona';
      const slot = isPersona ? 'personaItem' : 'equipmentItem';

      if (item.equippedMember) {
          const otherMember = item.equippedMember;
          const currentItem = member[slot];
          otherMember[slot] = currentItem;
          member[slot] = item;
          return { success: true, msg: `${member.name} swapped ${item.name} with ${otherMember.name}.` };
      } else {
          if (member[slot]) {
              this.inventory.push(member[slot]);
          }
          member[slot] = item;
          const invIndex = this.inventory.findIndex((i) => i.id === item.id);
          if (invIndex > -1) {
              this.inventory.splice(invIndex, 1);
          }
          return { success: true, msg: `${member.name} equipped ${item.name}.` };
      }
  }

  unequipItem(member, slot = 'equipmentItem') {
      if (member[slot]) {
          this.inventory.push(member[slot]);
          member[slot] = null;
          return { success: true, msg: `${member.name} unequipped ${slot === 'personaItem' ? 'Persona' : 'item'}.` };
      }
      return { success: false, msg: "Nothing to unequip." };
  }
}
