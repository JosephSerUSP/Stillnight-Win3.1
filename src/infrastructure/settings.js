const STORAGE_KEY = "stillnight_config";
const DEFAULTS = Object.freeze({ autoBattle: false, windowAnimations: true, masterVolume: 0.5, sfxVolume: 0.5, musicVolume: 0.5 });

function volume(value, fallback) { const parsed = Number.parseFloat(value); return Number.isFinite(parsed) ? parsed : fallback; }
function normalize(raw = {}) {
    const settings = { ...DEFAULTS };
    settings.autoBattle = !!raw.autoBattle;
    settings.windowAnimations = raw.windowAnimations !== undefined ? !!raw.windowAnimations : DEFAULTS.windowAnimations;
    settings.masterVolume = typeof raw.audioEnabled === 'boolean' ? (raw.audioEnabled ? 0.5 : 0.0) : volume(raw.masterVolume, DEFAULTS.masterVolume);
    settings.sfxVolume = typeof raw.sfxEnabled === 'boolean' ? (raw.sfxEnabled ? 0.5 : 0.0) : volume(raw.sfxVolume, DEFAULTS.sfxVolume);
    settings.musicVolume = typeof raw.musicEnabled === 'boolean' ? (raw.musicEnabled ? 0.5 : 0.0) : volume(raw.musicVolume, DEFAULTS.musicVolume);
    return settings;
}

export class LocalStorageSettingsRepository {
    constructor(storage = globalThis.localStorage, key = STORAGE_KEY) { this.storage = storage; this.key = key; }
    load() { const data = this.storage?.getItem(this.key); return data ? JSON.parse(data) : null; }
    save(settings) { this.storage?.setItem(this.key, JSON.stringify(settings)); }
}

export class SettingsStore {
    constructor(repository = new LocalStorageSettingsRepository()) { this.repository = repository; this.state = { ...DEFAULTS }; }
    load() { try { const persisted = this.repository.load(); this.state = persisted ? normalize(persisted) : { ...DEFAULTS }; } catch (error) { console.error("Failed to load config", error); this.state = { ...DEFAULTS }; } return this.state; }
    save() { try { this.repository.save(this.snapshot()); } catch (error) { console.error("Failed to save config", error); } }
    snapshot() { return { ...this.state }; }
    get(key) { return this.state[key]; }
    set(key, value, { persist = true } = {}) { this.state[key] = value; if (persist) this.save(); return value; }
}

export const settingsStore = new SettingsStore();
