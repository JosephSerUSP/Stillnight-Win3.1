import { Game_Battler } from "./battler.js";
import { SummonerResourceSystem } from "../engine/systems/summoner_resource.js";

/**
 * @class Game_Party
 * @description Manages the party, inventory, and gold.
 */
export class Game_Party {
  /** Creates a new Game_Party instance. */
  constructor() {
    this.MAX_MEMBERS = 24;
    this.slots = new Array(this.MAX_MEMBERS).fill(null);
    this.gold = 0;
    this.inventory = [];
    this.storyFlags = {};
    this.variables = {};
    this.knownWords = [];
  }

  /** Gets the Summoner (Commander), fixed at index 4. */
  get summoner() { return this.slots[4]; }

  get members() { return this.slots.filter(m => m !== null); }

  /** Slots 0-3 + Summoner at 4. */
  get activeMembers() { return this.slots.slice(0, 5).filter(m => m !== null); }

  get reserveMembers() { return this.slots.slice(5).filter(m => m !== null); }

  checkDeaths() {
      const events = [];
      if (this.summoner && this.summoner.hp <= 0) events.push({ type: 'GAME_OVER', member: this.summoner });
      const members = [...this.members];
      for (const member of members) {
          if (member === this.summoner) continue;
          if (member.hp <= 0) {
              const permadeathTraits = member.traits.filter(t => t.code === 'ON_PERMADEATH');
              if (permadeathTraits.length > 0) {
                   const heal = Math.floor(member.maxHp * 0.2) || 1;
                   member.hp = heal;
                   const oldLevel = member.level;
                   member.level = Math.max(1, member.level - 2);
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

    let slotIndex = 0;
    initialMembers.forEach((m) => {
        if (slotIndex === 4) slotIndex++;
        if (slotIndex < this.MAX_MEMBERS) this.slots[slotIndex++] = m;
    });

    const summonerData = actors.find(a => a.id === 'summoner');
    let summoner;
    if (summonerData) {
        summoner = Game_Battler.create(summonerData, 1);
    } else {
        console.warn("Summoner data not found in actors.json. Creating default.");
        summoner = new Game_Battler({
            id: 'summoner', name: 'Commander', maxHp: 50, maxMp: 100,
            level: 1, role: 'Summoner', traits: []
        });
    }
    this.slots[4] = summoner;
  }

  /**
   * Compatibility entry point used by Scene_Map. Resource semantics live in
   * SummonerResourceSystem; Game_Party no longer calculates MP/exhaustion.
   */
  onStep(isSafe = false) {
      return SummonerResourceSystem.consumeMovement(this, { safe: isSafe });
  }

  addMember(battler) {
      let index = this.slots.indexOf(null);
      if (index === 4) index = this.slots.indexOf(null, 5);
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

  hasEmptySlot() { return this.slots.includes(null); }

  hasItem(itemId, qty = 1) {
      let remaining = qty;
      for (const item of this.inventory) {
          if (item.id === itemId && --remaining <= 0) return true;
      }
      return false;
  }

  removeItemById(itemId, qty = 1) {
      let remaining = qty;
      this.inventory = this.inventory.filter(item => {
          if (item.id === itemId && remaining > 0) {
              remaining--;
              return false;
          }
          return true;
      });
  }

  addItem(itemDef, qty = 1) {
      for (let i = 0; i < qty; i++) this.inventory.push(itemDef);
  }

  reorderMembers(fromIndex, toIndex) {
      if (fromIndex < 0 || fromIndex >= this.MAX_MEMBERS) return false;
      if (toIndex < 0 || toIndex >= this.MAX_MEMBERS) return false;
      if (fromIndex === 4 || toIndex === 4) return false;
      const temp = this.slots[fromIndex];
      this.slots[fromIndex] = this.slots[toIndex];
      this.slots[toIndex] = temp;
      return true;
  }

  setVariable(key, value) { this.variables[key] = value; }
  getVariable(key) { return this.variables[key]; }

  modifyVariable(key, operation, value) {
      let current = this.variables[key];
      if (current === undefined && operation !== 'set') current = 0;
      switch (operation) {
          case 'add': this.variables[key] = current + value; break;
          case 'sub': this.variables[key] = current - value; break;
          case 'mul': this.variables[key] = current * value; break;
          case 'div': this.variables[key] = Math.floor(current / value); break;
          case 'set': this.variables[key] = value; break;
          default: console.warn(`Game_Party: Unknown modify operation '${operation}'`);
      }
  }

  equipItem(member, item) {
      if (!item) {
          if (member.equipmentItem) this.inventory.push(member.equipmentItem);
          member.equipmentItem = null;
          return { success: true, msg: `${member.name} unequipped item.` };
      } else if (item.equippedMember) {
          const otherMember = item.equippedMember;
          const currentItem = member.equipmentItem;
          otherMember.equipmentItem = currentItem;
          member.equipmentItem = item;
          return { success: true, msg: `${member.name} swapped ${item.name} with ${otherMember.name}.` };
      } else {
          if (member.equipmentItem) this.inventory.push(member.equipmentItem);
          member.equipmentItem = item;
          const invIndex = this.inventory.findIndex((i) => i.id === item.id);
          if (invIndex > -1) this.inventory.splice(invIndex, 1);
          return { success: true, msg: `${member.name} equipped ${item.name}.` };
      }
  }
}
