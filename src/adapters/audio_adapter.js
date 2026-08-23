import { SoundService } from "../infrastructure/audio/sound_service.js";

/** Presentation/boot-facing audio boundary. */
export const AudioAdapter = {
    initialize(soundMap) { return SoundService.init(soundMap); },
    configureSettings(settings) { SoundService.configureSettings(settings); },
    play(key, options) { return SoundService.play(key, options); },
    playMusic(key) { SoundService.playMusic(key); },
    stopMusic() { SoundService.stopMusic(); },
    pauseMusic() { SoundService.pauseMusic(); },
    resumeMusic() { SoundService.resumeMusic(); },
    isMusicPlaying() { return SoundService.isMusicPlaying(); },
    getMusicDuration() { return SoundService.getMusicDuration(); },
    getMusicTime() { return SoundService.getMusicTime(); },
    updateVolumes() { SoundService.updateVolumes(); },
    getCurrentMusicKey() { return SoundService.getCurrentMusicKey(); },
    beep(freq, duration) { SoundService.beep(freq, duration); },
    getMusicKeys() { return SoundService.getMusicKeys(); },
    getSfxKeys() { return SoundService.getSfxKeys(); }
};
