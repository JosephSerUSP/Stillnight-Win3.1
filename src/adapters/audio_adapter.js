import { SoundManager } from "../managers/sound.js";

/**
 * Adapter for audio operations.
 * Wraps the legacy SoundManager to prevent direct imports from presentation layer.
 */
export const AudioAdapter = {
    /**
     * Plays a sound effect.
     * @param {string} key
     * @param {Object} [options]
     */
    play(key, options) {
        SoundManager.play(key, options);
    },

    /**
     * Plays background music.
     * @param {string} key
     */
    playMusic(key) {
        SoundManager.playMusic(key);
    },

    /**
     * Stops background music.
     */
    stopMusic() {
        SoundManager.stopMusic();
    },

    pauseMusic() {
        SoundManager.pauseMusic();
    },

    resumeMusic() {
        SoundManager.resumeMusic();
    },

    isMusicPlaying() {
        return SoundManager.isMusicPlaying();
    },

    updateVolumes() {
        SoundManager.updateVolumes();
    },

    getCurrentMusicKey() {
        return SoundManager._currentMusicKey;
    },

    getMusicKeys() {
        // Accessing internal state of SoundManager for debug/list purposes
        return SoundManager._midiData ? Array.from(SoundManager._midiData.keys()).sort() : [];
    },

    getSfxKeys() {
        return SoundManager._soundMap ? Object.keys(SoundManager._soundMap).sort() : [];
    }
};
