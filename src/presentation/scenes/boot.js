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
    constructor(contentLoader, sceneManager, windowManager) {
        super(contentLoader, windowManager);
        this.sceneManager = sceneManager;
    }

    async start() {
        await this.contentLoader.loadData();

        Registry.set('items', this.contentLoader.items);
        Registry.set('skills', this.contentLoader.skills);
        Registry.set('actors', this.contentLoader.actors);
        if (this.contentLoader.states) Registry.set('states', this.contentLoader.states);
        if (this.contentLoader.enemies) Registry.set('enemies', this.contentLoader.enemies);
        if (this.contentLoader.quests) Registry.set('quests', this.contentLoader.quests);

        ThemeManager.init(this.contentLoader.themes);
        if (this.contentLoader.sounds) {
            await AudioAdapter.initialize(this.contentLoader.sounds);
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

        this.sceneManager.push(new Scene_Map(this.contentLoader, this.sceneManager, this.windowManager, session));
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
