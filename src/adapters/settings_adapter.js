import { ConfigManager } from "./implementations/config_impl.js";

/**
 * Adapter for configuration settings.
 */
export const SettingsAdapter = {
    get masterVolume() { return ConfigManager.masterVolume; },
    get sfxVolume() { return ConfigManager.sfxVolume; },
    get musicVolume() { return ConfigManager.musicVolume; },
    get windowAnimations() { return ConfigManager.windowAnimations; },
    get autoBattle() { return ConfigManager.autoBattle; },

    setMasterVolume(val) { ConfigManager.masterVolume = val; ConfigManager.save(); },
    setSfxVolume(val) { ConfigManager.sfxVolume = val; ConfigManager.save(); },
    setMusicVolume(val) { ConfigManager.musicVolume = val; ConfigManager.save(); },
    setWindowAnimations(val) { ConfigManager.windowAnimations = val; ConfigManager.save(); },

    toggleAutoBattle() {
        ConfigManager.autoBattle = !ConfigManager.autoBattle;
        ConfigManager.save();
        return ConfigManager.autoBattle;
    },

    setAutoBattle(val) {
        ConfigManager.autoBattle = !!val;
        ConfigManager.save();
        return ConfigManager.autoBattle;
    },

    save() {
        ConfigManager.save();
    }
};
