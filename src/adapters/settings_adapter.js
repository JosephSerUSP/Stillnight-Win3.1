import { settingsStore } from "../infrastructure/settings.js";

/**
 * Presentation-facing settings contract.
 * Mutable state and persistence are owned by infrastructure, not this adapter.
 */
export const SettingsAdapter = {
    load() { return settingsStore.load(); },

    get masterVolume() { return settingsStore.get('masterVolume'); },
    get sfxVolume() { return settingsStore.get('sfxVolume'); },
    get musicVolume() { return settingsStore.get('musicVolume'); },
    get windowAnimations() {
        if (typeof window !== 'undefined' && window.location && window.location.search.includes("test=true")) {
            return false;
        }
        return settingsStore.get('windowAnimations');
    },
    get autoBattle() { return settingsStore.get('autoBattle'); },

    setMasterVolume(val) { return settingsStore.set('masterVolume', val); },
    setSfxVolume(val) { return settingsStore.set('sfxVolume', val); },
    setMusicVolume(val) { return settingsStore.set('musicVolume', val); },
    setWindowAnimations(val) { return settingsStore.set('windowAnimations', !!val); },

    toggleAutoBattle() {
        return settingsStore.set('autoBattle', !settingsStore.get('autoBattle'));
    },

    setAutoBattle(val) {
        return settingsStore.set('autoBattle', !!val);
    },

    save() {
        settingsStore.save();
    }
};
