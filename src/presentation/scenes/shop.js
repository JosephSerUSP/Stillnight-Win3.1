import { Scene_Base } from "./base.js";
import { Window_Shop } from "../windows/index.js";
import { AudioAdapter } from "../../adapters/audio_adapter.js";

/**
 * @class Scene_Shop
 * @description Handles the shop interaction logic.
 * @extends Scene_Base
 */
export class Scene_Shop extends Scene_Base {
    /**
     * Creates a new Scene_Shop.
     * @param {import("../../managers/index.js").DataManager} dataManager - The data manager.
     * @param {import("../../managers/index.js").SceneManager} sceneManager - The scene manager.
     * @param {import("../windows/index.js").WindowManager} windowManager - The window manager.
     * @param {import("../../objects/party.js").Game_Party} party - The player's party.
     * @param {import("../windows/index.js").WindowLayer} windowLayer - The window layer to attach the shop window to.
     * @param {string} [shopId] - Optional shop ID to load specific inventory.
     */
    constructor(dataManager, sceneManager, windowManager, party, windowLayer, shopId = null) {
        super(dataManager, windowManager);
        this.sceneManager = sceneManager;
        this.party = party;
        this.windowLayer = windowLayer;
        this.shopId = shopId;

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
        AudioAdapter.play('UI_SELECT');
    }

    startBuy() {
        let items = [];

        if (this.shopId && this.dataManager.shops && this.dataManager.shops[this.shopId]) {
            const shopData = this.dataManager.shops[this.shopId];
            items = shopData.items
                .filter(entry => this.checkCondition(entry.condition))
                .map(entry => this.dataManager.items.find(i => i.id === entry.id))
                .filter(i => i); // Remove nulls if item ID not found
        } else {
            // Fallback: all non-key items if no shopId (legacy behavior or failsafe)
            items = this.dataManager.items.filter(i => i.type !== 'key');
        }

        this.shopWindow.setupBuy(
            this.party.gold,
            this.dataManager.terms.shop.vendor_message,
            items,
            (itemId) => this.buyItem(itemId)
        );
    }

    checkCondition(conditionString) {
        if (!conditionString) return true;
        const [type, value] = conditionString.split(':');

        if (type === 'level') {
            // Check if any party member meets level requirement
            // Or typically check if highest level member meets it
            const reqLevel = parseInt(value, 10);
            return this.party.members.some(m => m.level >= reqLevel);
        }

        if (type === 'hasItem') {
            return this.party.inventory.some(i => i.id === value);
        }

        if (type === 'gold') {
             return this.party.gold >= parseInt(value, 10);
        }

        // Future: Story flags
        // if (type === 'storyFlags') return this.party.getFlag(value);

        return true;
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
            AudioAdapter.play('SHOP_SELL');
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
            AudioAdapter.play('UI_CANCEL');
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
        AudioAdapter.play('SHOP_BUY');
    }
}
