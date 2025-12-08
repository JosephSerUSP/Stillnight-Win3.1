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
    this.MAX_MEMBERS = 24;
    this.slots = new Array(this.MAX_MEMBERS).fill(null);
    this.gold = 0;
    this.inventory = [];
    this.knownWords = []; // FF2 Word Memory System
  }

  get members() {
      return this.slots.filter(m => m !== null);
  }

  get activeMembers() {
      return this.slots.slice(0, 4).filter(m => m !== null);
  }

  get reserveMembers() {
      return this.slots.slice(4).filter(m => m !== null);
  }

  learnWord(word) {
      if (!this.knownWords.includes(word)) {
          this.knownWords.push(word);
      }
  }

  checkDeaths() {
      const events = [];
      const members = [...this.members];
      for (const member of members) {
          if (member.hp <= 0) {
              const permadeathTraits = member.traits.filter(t => t.code === 'ON_PERMADEATH');
              if (permadeathTraits.length > 0) {
                   const heal = Math.floor(member.maxHp * 0.2) || 1;
                   member.hp = heal;
                   events.push({ type: 'REBIRTH', member });
              } else {
                  // In FF2, characters die and can be revived. Game Over only if all dead.
                  // We don't remove them. They stay in slot with 0 HP (Dead state).
                  // But current engine might expect removal?
                  // Let's NOT remove them for FF2 style.
                  // events.push({ type: 'DEATH', member });
              }
          }
      }
      return events;
  }

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

  addMember(battler) {
      const index = this.slots.indexOf(null);
      if (index === -1) return false;
      this.slots[index] = battler;
      return true;
  }

  removeMember(battler) {
      const index = this.slots.indexOf(battler);
      if (index === -1) return false;
      this.slots[index] = null;
      return true;
  }

  replaceMember(index, battler) {
      if (index >= 0 && index < this.MAX_MEMBERS) {
          this.slots[index] = battler;
          return true;
      }
      return false;
  }

  hasEmptySlot() {
      return this.slots.includes(null);
  }

  reorderMembers(fromIndex, toIndex) {
      if (fromIndex < 0 || fromIndex >= this.MAX_MEMBERS) return false;
      if (toIndex < 0 || toIndex >= this.MAX_MEMBERS) return false;
      const temp = this.slots[fromIndex];
      this.slots[fromIndex] = this.slots[toIndex];
      this.slots[toIndex] = temp;
      return true;
  }

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
      // Only remove if consumable
      if (item.type === 'consumable') {
          this.inventory.splice(index, 1);
      }
      return { success: true, outcomes, item };
  }

  equipItem(member, item) {
      if (!item) {
          if (member.equipmentItem) {
              this.inventory.push(member.equipmentItem);
          }
          member.equipmentItem = null;
          return { success: true, msg: `${member.name} unequipped item.` };
      } else if (item.equippedMember) {
          // If item is already equipped by someone else? (Not supported by UI usually)
          // For now, assume unequipped from inventory
          return { success: false, msg: "Item already equipped." };
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
}
