import { settingsStore } from "../infrastructure/settings.js";

/**
 * @deprecated Compatibility facade for debug/test consumers.
 * Runtime settings ownership lives in infrastructure/settings.js; new code
 * should use SettingsAdapter (presentation) or inject a settings contract.
 */
export class ConfigManager {
    static get autoBattle() { return settingsStore.get('autoBattle'); }
    static set autoBattle(value) { settingsStore.set('autoBattle', !!value, { persist: false }); }

    static get windowAnimations() { return settingsStore.get('windowAnimations'); }
    static set windowAnimations(value) { settingsStore.set('windowAnimations', !!value, { persist: false }); }

    static get masterVolume() { return settingsStore.get('masterVolume'); }
    static set masterVolume(value) { settingsStore.set('masterVolume', value, { persist: false }); }

    static get sfxVolume() { return settingsStore.get('sfxVolume'); }
    static set sfxVolume(value) { settingsStore.set('sfxVolume', value, { persist: false }); }

    static get musicVolume() { return settingsStore.get('musicVolume'); }
    static set musicVolume(value) { settingsStore.set('musicVolume', value, { persist: false }); }

    static load() { return settingsStore.load(); }
    static save() { settingsStore.save(); }
}
