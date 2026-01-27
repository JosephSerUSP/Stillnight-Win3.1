/**
 * @class ConfigManager
 * @description Manages persistent game configuration settings.
 */
export class ConfigManager {
    static autoBattle = false;
    static windowAnimations = true;
    static masterVolume = 0.5;
    static sfxVolume = 0.5;
    static musicVolume = 0.5;

    static load() {
        try {
            const data = localStorage.getItem("stillnight_config");
            if (data) {
                const config = JSON.parse(data);
                this.autoBattle = !!config.autoBattle;
                this.windowAnimations = config.windowAnimations !== undefined ? !!config.windowAnimations : true;

                // Migrate legacy booleans to floats if needed
                if (typeof config.audioEnabled === 'boolean') {
                    this.masterVolume = config.audioEnabled ? 0.5 : 0.0;
                } else if (config.masterVolume !== undefined) {
                    this.masterVolume = parseFloat(config.masterVolume);
                }

                if (typeof config.sfxEnabled === 'boolean') {
                    this.sfxVolume = config.sfxEnabled ? 0.5 : 0.0;
                } else if (config.sfxVolume !== undefined) {
                    this.sfxVolume = parseFloat(config.sfxVolume);
                }

                if (typeof config.musicEnabled === 'boolean') {
                    this.musicVolume = config.musicEnabled ? 0.5 : 0.0;
                } else if (config.musicVolume !== undefined) {
                    this.musicVolume = parseFloat(config.musicVolume);
                }
            }
        } catch (e) {
            console.error("Failed to load config", e);
        }
    }

    static save() {
        try {
            const config = {
                autoBattle: this.autoBattle,
                windowAnimations: this.windowAnimations,
                masterVolume: this.masterVolume,
                sfxVolume: this.sfxVolume,
                musicVolume: this.musicVolume
            };
            localStorage.setItem("stillnight_config", JSON.stringify(config));
        } catch (e) {
            console.error("Failed to save config", e);
        }
    }
}
ConfigManager.load();
