import { Scene_Base } from "./base.js";
import { Window_Shop } from "../windows/index.js";
import { SoundManager } from "../managers/index.js";

/**
 * @class Scene_Shop
 * @description Handles the shop interaction logic.
 * @extends Scene_Base
 */
export class Scene_Shop extends Scene_Base {
    /**
     * Creates a new Scene_Shop.
     * @param {import("../managers/index.js").DataManager} dataManager - The data manager.
     * @param {import("../managers/index.js").SceneManager} sceneManager - The scene manager.
     * @param {import("../windows/index.js").WindowManager} windowManager - The window manager.
     * @param {import("../objects/objects.js").Game_Party} party - The player's party.
     * @param {import("../windows/index.js").WindowLayer} windowLayer - The window layer to attach the shop window to.
     */
    constructor(dataManager, sceneManager, windowManager, party, windowLayer) {
        super(dataManager, windowManager);
        this.sceneManager = sceneManager;
        this.party = party;
        this.windowLayer = windowLayer;

        this.shopWindow = new Window_Shop();
        this.windowLayer.addChild(this.shopWindow);

        this.shopWindow.onUserClose = this.closeShop.bind(this);
        this.shopWindow.btnLeave.addEventListener("click", this.closeShop.bind(this));

        this.shopWindow.setHandler('mode_buy', () => this.startBuy());
        this.shopWindow.setHandler('mode_sell', () => this.startSell());
    }

    /**
     * Initializes the shop content and pushes the shop window.
     * @method start
     */
    start() {
        this.startBuy();
        this.windowManager.push(this.shopWindow);
        document.getElementById("mode-label").textContent = "Shop";
        SoundManager.play('UI_SELECT');
    }

    startBuy() {
        this.shopWindow.setupBuy(
            this.party.gold,
            this.dataManager.terms.shop.vendor_message,
            this.dataManager.items,
            (itemId) => this.buyItem(itemId)
        );
    }

    startSell() {
        this.shopWindow.setupSell(
            this.party.gold,
            this.party.inventory,
            (item) => this.sellItem(item)
        );
    }

    sellItem(item) {
        const index = this.party.inventory.indexOf(item);
        if (index > -1) {
            this.party.inventory.splice(index, 1);
            const price = Math.floor(item.cost / 2);
            this.party.gold += price;

            this.startSell();

            this.sceneManager.previous().logMessage(`[Shop] Sold ${item.name} for ${price}G.`);
            SoundManager.play('SHOP_SELL');
            this.sceneManager.previous().updateAll();
        }
    }

    /**
     * Closes the shop window.
     * @method stop
     */
    stop() {
        this.windowManager.close(this.shopWindow);
        document.getElementById("mode-label").textContent = "Exploration";
    }

    /**
     * Handles closing the shop and returning to the previous scene.
     * @method closeShop
     */
    closeShop() {
        this.sceneManager.pop();
        if (this.sceneManager.currentScene() && this.sceneManager.currentScene().updateAll) {
            this.sceneManager.currentScene().updateAll();
        }
    }

    /**
     * Logic for purchasing an item.
     * @method buyItem
     * @param {string} itemId - The ID of the item to buy.
     */
    buyItem(itemId) {
        const item = this.dataManager.items.find((i) => i.id === itemId);
        if (!item) return;

        if (this.party.gold < item.cost) {
            this.shopWindow.messageEl.textContent = this.dataManager.terms.shop.not_enough_gold;
            SoundManager.play('UI_CANCEL');
            return;
        }

        this.party.gold -= item.cost;
        this.party.inventory.push(item);

        // Update window state to refresh button availability
        this.shopWindow.gold = this.party.gold;
        this.shopWindow.goldLabelEl.textContent = `${this.party.gold}G`;
        this.shopWindow.refresh();

        this.shopWindow.messageEl.textContent = this.dataManager.terms.shop.purchased + item.name + ".";
    this.sceneManager.previous().logMessage(
            `[Shop] ${this.dataManager.terms.shop.purchased}${item.name}.`
        );
    this.sceneManager.previous().updateAll();
        SoundManager.play('SHOP_BUY');
    }
}
