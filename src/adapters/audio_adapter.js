import { SoundManager } from "../managers/sound.js";

/**
 * Presentation-facing audio boundary.
 *
 * SoundManager is still the infrastructure implementation during Phase 7, but
 * this adapter consumes only its public contract. Private WebAudio/cache state
 * must not leak into presentation callers.
 */
export const AudioAdapter = {
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
