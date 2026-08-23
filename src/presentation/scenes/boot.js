import { Scene_Base } from "./base.js";
import { Scene_Map } from "./map.js";
import { ThemeManager } from "../managers/theme.js";
import { AudioAdapter } from "../../adapters/audio_adapter.js";
import { Registry } from "../../engine/data/registry.js";
import { SessionSerializer } from "../../engine/session/serializer.js";
import { Game_Party } from "../../objects/party.js";
import { QuestLogState } from "../../engine/session/quest_state.js";

/**
 * Initial composition scene: acquires content, initializes content-dependent
 * presentation services, restores session state, then enters the map.
 */
export class Scene_Boot extends Scene_Base {
    constructor(dataManager, sceneManager, windowManager) {
        super(dataManager, windowManager);
        this.sceneManager = sceneManager;
    }

    async start() {
        await this.dataManager.loadData();

        Registry.set('items', this.dataManager.items);
        Registry.set('skills', this.dataManager.skills);
        Registry.set('actors', this.dataManager.actors);
        if (this.dataManager.states) Registry.set('states', this.dataManager.states);
        if (this.dataManager.enemies) Registry.set('enemies', this.dataManager.enemies);
        if (this.dataManager.quests) Registry.set('quests', this.dataManager.quests);

        ThemeManager.init(this.dataManager.themes);
        if (this.dataManager.sounds) {
            await AudioAdapter.initialize(this.dataManager.sounds);
        }

        let session;
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
