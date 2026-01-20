import { Game_Battler } from "./objects/battler.js";
import { Game_Party } from "./objects/party.js";
import { Game_Event } from "./objects/event.js";
import { Game_Base } from "./objects/game_base.js";
import { Game_Action } from "./objects/action.js";
import { ThemeManager } from "./managers/theme.js";
import { ConfigManager } from "./managers/config.js";
import { SoundManager } from "./managers/sound.js";
import { InterpreterAdapter } from "./adapters/interpreter_adapter.js";
import { Scene_Boot, Scene_Map as Scene_Map_Class, Scene_Battle, Scene_Shop } from "./presentation/scenes/scenes.js";

/**
 * Exposes game objects and managers to the window object for testing/debugging.
 * Only active if 'test=true' query parameter is present.
 * @param {Object} instances - Key-value pairs of instances to expose (e.g. sceneManager).
 */
export function exposeGlobals(instances = {}) {
    if (typeof window === 'undefined') return;
    if (!window.location.search.includes("test=true")) return;

    // Instances
    if (instances.sceneManager) window.sceneManager = instances.sceneManager;
    if (instances.windowManager) window.windowManager = instances.windowManager;
    if (instances.dataManager) window.dataManager = instances.dataManager;

    // Classes
    window.Game_Battler = Game_Battler;
    window.Game_Party = Game_Party;
    window.Game_Event = Game_Event;
    window.Game_Base = Game_Base;
    window.Game_Action = Game_Action;
    window.InterpreterAdapter = InterpreterAdapter;

    // Scenes
    window.Scene_Boot = Scene_Boot;
    window.Scene_Map = Scene_Map_Class;
    window.Scene_Battle = Scene_Battle;
    window.Scene_Shop = Scene_Shop;

    // Static Managers
    window.ThemeManager = ThemeManager;
    window.ConfigManager = ConfigManager;
    window.SoundManager = SoundManager;
}
