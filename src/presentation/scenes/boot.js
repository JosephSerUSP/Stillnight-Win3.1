import { Scene_Base } from "./base.js";
import { Scene_Map } from "./map.js";
import { ThemeManager } from "../managers/theme.js";
import { Registry } from "../../engine/data/registry.js";
import { SessionSerializer } from "../../engine/session/serializer.js";
import { Game_Party } from "../../objects/party.js";
import { QuestLogState } from "../../engine/session/quest_state.js";

/**
 * @class Scene_Boot
 * @description The initial scene that loads game data and transitions to the title or map scene.
 * @extends Scene_Base
 */
export class Scene_Boot extends Scene_Base {
    /**
     * Creates a new Scene_Boot.
     * @param {import("../../managers/index.js").DataManager} dataManager - The data manager instance.
     * @param {import("../../managers/index.js").SceneManager} sceneManager - The scene manager instance.
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

        // Populate Registry
        Registry.set('items', this.dataManager.items);
        Registry.set('skills', this.dataManager.skills);
        Registry.set('actors', this.dataManager.actors);
        if (this.dataManager.states) Registry.set('states', this.dataManager.states);
        if (this.dataManager.enemies) Registry.set('enemies', this.dataManager.enemies);
        if (this.dataManager.quests) Registry.set('quests', this.dataManager.quests);

        ThemeManager.init(this.dataManager.themes);

        // Load Session
        let session;
        // In a real implementation, we might check for a 'continue' flag or show a Title Screen first.
        // For now, we auto-load if save exists, else new game.
        // Or better: Scene_Map handles the "New Game" logic if session is fresh.
        const savedData = localStorage.getItem('stillnight_save_data');
        if (savedData) {
            try {
                session = SessionSerializer.fromJSON(JSON.parse(savedData));
            } catch (e) {
                console.error("Failed to load save:", e);
                session = this._createNewSession();
            }
        } else {
            session = this._createNewSession();
        }

        this.sceneManager.push(new Scene_Map(this.dataManager, this.sceneManager, this.windowManager, session));
    }

    _createNewSession() {
        return {
            party: new Game_Party(),
            exploration: null,
            battle: null,
            interpreter: null,
            quests: new QuestLogState()
        };
    }
}
