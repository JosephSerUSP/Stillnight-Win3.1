import { SoundManager } from "../managers/sound.js";

/**
 * Presentation/boot-facing audio boundary. Private WebAudio/cache state remains
 * inside the infrastructure implementation.
 */
export const AudioAdapter = {
    initialize(soundMap) {
        return SoundManager.init(soundMap);
    },

    play(key, options) {
        return SoundManager.play(key, options);
    },

    playMusic(key) {
        SoundManager.playMusic(key);
    },

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
        return SoundManager.getCurrentMusicKey();
    },

    beep(freq, duration) {
        SoundManager.beep(freq, duration);
    },

    getMusicKeys() {
        return SoundManager.getMusicKeys();
    },

    getSfxKeys() {
        return SoundManager.getSfxKeys();
    }
};
