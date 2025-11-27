import { Scene_Base } from "./sceneBase.js";
import { Window_Shop } from "./windows.js";
import { SoundManager } from "./managers.js";
import { SceneManager } from "./sceneManager.js";

/**
 * @class Scene_Shop
 * @description Handles the shop screen.
 */
export class Scene_Shop extends Scene_Base {
  /**
   * @param {import("./objects.js").Game_Party} party
   * @param {Array} items - Items available in shop.
   * @param {import("./managers.js").DataManager} dataManager
   */
  constructor(party, items, dataManager) {
    super(dataManager);
    this.party = party;
    this.items = items;
  }

  create() {
    super.create();
    this.shopWindow = new Window_Shop();
    this.windowLayer.addChild(this.shopWindow);

    this.shopWindow.btnClose.addEventListener("click", this.closeShop.bind(this));
    this.shopWindow.btnLeave.addEventListener("click", this.closeShop.bind(this));
  }

  start() {
    this.shopWindow.open(
      this.party.gold,
      this.dataManager.terms.shop.vendor_message,
      this.items,
      this.buyItem.bind(this)
    );
    SoundManager.beep(650, 150);
  }

  closeShop() {
    SceneManager.pop();
  }

  buyItem(itemId) {
    const item = this.items.find((i) => i.id === itemId);
    if (!item) return;

    if (this.party.gold < item.cost) {
      this.shopWindow.messageEl.textContent = this.dataManager.terms.shop.not_enough_gold;
      SoundManager.beep(180, 80);
      return;
    }

    this.party.gold -= item.cost;
    this.party.inventory.push(item);

    this.shopWindow.goldLabelEl.textContent = `${this.party.gold}G`;
    this.shopWindow.messageEl.textContent = this.dataManager.terms.shop.purchased + item.name + ".";

    SoundManager.beep(600, 80);
  }
}