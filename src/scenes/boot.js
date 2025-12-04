import { Scene_Base } from "./base.js";
import { Scene_Map } from "./map.js";
import { ThemeManager } from "../managers/index.js";

/**
 * @class Scene_Boot
 * @description The initial scene that loads game data and transitions to the title or map scene.
 * @extends Scene_Base
 */
export class Scene_Boot extends Scene_Base {
    /**
     * Creates a new Scene_Boot.
     * @param {import("../managers/index.js").DataManager} dataManager - The data manager instance.
     * @param {import("../managers/index.js").SceneManager} sceneManager - The scene manager instance.
     * @param {import("../windows/index.js").WindowManager} windowManager - The window manager instance.
     */
    constructor(dataManager, sceneManager, windowManager) {
        super(dataManager, windowManager);
        this.sceneManager = sceneManager;
    }

    /**
     * Loads all necessary data and then pushes the initial game scene (Scene_Map).
     * @method start
     * @async
     */
    async start() {
        await this.dataManager.loadData();
        ThemeManager.init(this.dataManager.themes);
        this.sceneManager.push(new Scene_Map(this.dataManager, this.sceneManager, this.windowManager));
    }
}
