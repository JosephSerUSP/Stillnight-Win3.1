import {
  Window_Inventory,
  Window_Event,
  Window_Recruit,
  Window_Formation,
  Window_Inspect,
  Window_Evolution,
  Window_Confirm,
  Window_ConfirmEffect,
  Window_PartySelect,
  Window_EquipItemSelect,
  Window_Options,
  Window_AudioPlayer,
  Window_Quest,
  Window_Help,
  Window_CardNavigator,
  WindowLayer
} from "../presentation/windows/index.js";

/**
 * @class HUDManager
 * @description Manages the lifecycle and instantiation of UI windows for the exploration scene.
 */
export class HUDManager {
    /**
     * @param {import("../presentation/windows/index.js").WindowManager} windowManager
     * @param {HTMLElement} gameContainer
     */
    constructor(windowManager, gameContainer) {
        this.windowManager = windowManager;
        this.windowLayer = new WindowLayer();
        this.windowLayer.appendTo(gameContainer);

        this.inventoryWindow = new Window_Inventory();
        this.windowLayer.addChild(this.inventoryWindow);

        this.eventWindow = new Window_Event();
        this.windowLayer.addChild(this.eventWindow);

        this.recruitWindow = new Window_Recruit();
        this.windowLayer.addChild(this.recruitWindow);

        this.questWindow = new Window_Quest();
        this.windowLayer.addChild(this.questWindow);

        this.formationWindow = new Window_Formation();
        this.windowLayer.addChild(this.formationWindow);

        this.inspectWindow = new Window_Inspect();
        this.windowLayer.addChild(this.inspectWindow);

        this.evolutionWindow = new Window_Evolution();
        this.windowLayer.addChild(this.evolutionWindow);

        this.confirmWindow = new Window_Confirm();
        this.windowLayer.addChild(this.confirmWindow);

        this.confirmEffectWindow = new Window_ConfirmEffect();
        this.windowLayer.addChild(this.confirmEffectWindow);

        this.partySelectWindow = new Window_PartySelect();
        this.windowLayer.addChild(this.partySelectWindow);

        this.equipItemSelectWindow = new Window_EquipItemSelect();
        this.windowLayer.addChild(this.equipItemSelectWindow);

        this.optionsWindow = new Window_Options();
        this.windowLayer.addChild(this.optionsWindow);

        this.audioWindow = new Window_Options("Audio Settings");
        this.windowLayer.addChild(this.audioWindow);

        this.audioPlayerWindow = new Window_AudioPlayer();
        this.windowLayer.addChild(this.audioPlayerWindow);

        this.helpWindow = new Window_Help();
        this.windowLayer.addChild(this.helpWindow);

        this.cardNavigatorWindow = new Window_CardNavigator();
        this.windowLayer.addChild(this.cardNavigatorWindow);

        this.setupDefaultCloseHandlers();
    }

    setupDefaultCloseHandlers() {
        const close = (w) => this.windowManager.close(w);
        this.evolutionWindow.onUserClose = () => close(this.evolutionWindow);
        this.confirmWindow.onUserClose = () => close(this.confirmWindow);
        this.confirmEffectWindow.onUserClose = () => close(this.confirmEffectWindow);
        this.partySelectWindow.onUserClose = () => close(this.partySelectWindow);
        this.equipItemSelectWindow.onUserClose = () => close(this.equipItemSelectWindow);
        this.optionsWindow.onUserClose = () => close(this.optionsWindow);
        this.audioWindow.onUserClose = () => close(this.audioWindow);
        this.audioPlayerWindow.onUserClose = () => close(this.audioPlayerWindow);
        this.helpWindow.onUserClose = () => close(this.helpWindow);
        this.questWindow.onUserClose = () => close(this.questWindow);
        this.cardNavigatorWindow.onUserClose = () => close(this.cardNavigatorWindow);
    }

    getSharedWindows() {
        return {
            formation: this.formationWindow,
            inventory: this.inventoryWindow,
            partySelect: this.partySelectWindow,
            confirmEffect: this.confirmEffectWindow,
            confirm: this.confirmWindow,
            equipItemSelect: this.equipItemSelectWindow,
        };
    }
}
