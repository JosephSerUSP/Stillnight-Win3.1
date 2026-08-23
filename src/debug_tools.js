import { Game_Battler } from "./objects/battler.js";
import { Game_Party } from "./objects/party.js";
import { Game_Map } from "./objects/map.js";
import { Game_Event } from "./objects/event.js";
import { Game_Base } from "./objects/game_base.js";
import { Game_Action } from "./objects/action.js";
import { ThemeManager } from "./presentation/managers/theme.js";
import { settingsStore } from "./infrastructure/settings.js";
import { AudioAdapter } from "./adapters/audio_adapter.js";
import { InterpreterAdapter } from "./adapters/interpreter_adapter.js";
import { ProgressionSystem } from "./engine/systems/progression.js";
import { Scene_Boot, Scene_Map as Scene_Map_Class, Scene_Battle, Scene_Shop } from "./presentation/scenes/scenes.js";

const ConfigDebug = {};
for (const key of ['autoBattle','windowAnimations','masterVolume','sfxVolume','musicVolume']) {
  Object.defineProperty(ConfigDebug, key, { enumerable: true, get: () => settingsStore.get(key), set: value => settingsStore.set(key, value, { persist: false }) });
}
ConfigDebug.load = () => settingsStore.load();
ConfigDebug.save = () => settingsStore.save();

export function exposeGlobals(instances = {}) {
    if (typeof window === 'undefined' || !window.location.search.includes("test=true")) return;
    if (instances.sceneManager) window.sceneManager = instances.sceneManager;
    if (instances.windowManager) window.windowManager = instances.windowManager;
    if (instances.dataManager) window.dataManager = instances.dataManager;
    window.Game_Battler = Game_Battler; window.Game_Party = Game_Party; window.Game_Map = Game_Map;
    window.Game_Event = Game_Event; window.Game_Base = Game_Base; window.Game_Action = Game_Action;
    window.InterpreterAdapter = InterpreterAdapter;
    window.Scene_Boot = Scene_Boot; window.Scene_Map = Scene_Map_Class; window.Scene_Battle = Scene_Battle; window.Scene_Shop = Scene_Shop;
    window.ThemeManager = ThemeManager;
    window.ConfigManager = ConfigDebug;
    window.SoundManager = AudioAdapter;
    window.ProgressionSystem = ProgressionSystem;
}
