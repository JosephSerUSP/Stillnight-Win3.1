import { MidiParser, MidiPlayer } from "./midi.js";

const DEFAULT_SETTINGS = Object.freeze({
  masterVolume: 0.5,
  musicVolume: 0.5,
  sfxVolume: 0.5
});

/**
 * Browser audio service. Mutable playback/cache details remain private to this
 * infrastructure boundary; callers use the public command/query contract.
 * Volume settings are supplied by the application composition root.
 */
export class SoundManager {
  static _audioCtx = null;
  static _buffers = new Map();
  static _soundMap = {};
  static _midiData = new Map();
  static _musicPlayer = null;
  static _sfxCount = 0;
  static _currentMusicKey = null;
  static _settings = DEFAULT_SETTINGS;

  static configureSettings(settings) {
      if (!settings) throw new TypeError("SoundManager requires a settings provider.");
      this._settings = settings;
      this.updateVolumes();
  }

  static _volume(kind) {
      const master = Number(this._settings.masterVolume ?? DEFAULT_SETTINGS.masterVolume);
      const channel = Number(this._settings[kind] ?? DEFAULT_SETTINGS[kind]);
      return master * channel;
  }

  static async init(soundMap) {
      this._soundMap = soundMap || {};
      this._initializeContext();
      return this.loadAll();
  }

  static _initializeContext() {
    if (!this._audioCtx && typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) {
      this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this._audioCtx && !this._musicPlayer) {
        this._musicPlayer = new MidiPlayer(this._audioCtx);
    }
  }

  static async loadAll() {
      if (!this._audioCtx) return;
      const promises = Object.entries(this._soundMap).map(([key, value]) => {
          if (typeof value === 'string') return this.loadSound(key, value);
          return Promise.resolve();
      });

      const midiFolder = 'assets/midi/';
      let midiFiles = [
          'battle1.mid', 'dungeon1.mid', 'town1.mid', 'event1.mid', 'event2.mid', 'victory1.mid',
          'coverCapsuleHello.mid', 'emotional1_bitSad.mid', 'emotional2_sadNostalgic.mid', 'emotional3_sadSad.mid',
          'event3.mid', 'event4_darkJester.mid', 'event5_nostalgia.mid', 'event6_happyfinality.mid',
          'event7_happyPrelude.mid', 'event8_yearning.mid', 'event9_magical.mid'
      ];

      try {
          const response = await fetch(midiFolder);
          if (response.ok) {
              const text = await response.text();
              const matches = text.matchAll(/href="([^"]+\.mid)"/g);
              const found = [];
              for (const match of matches) {
                  const parts = decodeURI(match[1]).split('/');
                  const fileName = parts[parts.length - 1];
                  if (fileName && !found.includes(fileName)) found.push(fileName);
              }
              if (found.length > 0) midiFiles = found;
          }
      } catch (e) {
          console.warn("Dynamic MIDI scan failed, using fallback list.", e);
      }

      midiFiles.forEach(file => {
          const key = file.replace(/\.mid$/i, '');
          promises.push(this.loadMidi(key, midiFolder + file));
      });

      await Promise.allSettled(promises);
  }

  static async loadSound(key, path) {
      if (!this._audioCtx) return;
      try {
          const response = await fetch(path);
          if (!response.ok) throw new Error(`HTTP error ${response.status}`);
          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await this._audioCtx.decodeAudioData(arrayBuffer);
          this._buffers.set(key, audioBuffer);
      } catch (error) {
          console.warn(`SoundManager: Failed to load sound '${key}' from '${path}'.`, error);
      }
  }

  static async loadMidi(key, path) {
      if (!this._audioCtx) return;
      try {
          const response = await fetch(path);
          if (!response.ok) throw new Error(`HTTP error ${response.status}`);
          const parser = new MidiParser(await response.arrayBuffer());
          this._midiData.set(key, parser.parse());
      } catch (error) {
          console.warn(`SoundManager: Failed to load midi '${key}' from '${path}'.`, error);
      }
  }

  static playMusic(key) {
      this._initializeContext();
      if (!this._audioCtx) return;
      if (this._audioCtx.state === 'suspended') this._audioCtx.resume();

      if (this._currentMusicKey === key && this._musicPlayer.isPlaying) {
          this.updateVolumes();
          return;
      }

      const data = this._midiData.get(key);
      if (!data) {
          console.warn(`SoundManager: Music '${key}' not found or not loaded.`);
          this.stopMusic();
          return;
      }

      this._currentMusicKey = key;
      this._musicPlayer.load(data);
      this._musicPlayer.play(true);
      this.updateVolumes();
  }

  static stopMusic() {
      if (this._musicPlayer) this._musicPlayer.stop();
      this._currentMusicKey = null;
  }

  static pauseMusic() { if (this._musicPlayer) this._musicPlayer.pause(); }
  static resumeMusic() { if (this._musicPlayer) this._musicPlayer.resume(); }
  static isMusicPlaying() { return !!(this._musicPlayer && this._musicPlayer.isPlaying); }
  static getMusicDuration() { return this._musicPlayer ? this._musicPlayer.duration : 0; }
  static getMusicTime() { return this._musicPlayer ? this._musicPlayer.currentTime : 0; }

  static getCurrentMusicKey() { return this._currentMusicKey; }
  static getMusicKeys() { return Array.from(this._midiData.keys()).sort(); }
  static getSfxKeys() { return Object.keys(this._soundMap).sort(); }

  static updateVolumes() {
      if (!this._audioCtx) return;
      const musicVol = this._volume('musicVolume');
      if (this._sfxCount > 0) {
          if (this._musicPlayer) this._musicPlayer.setVolume(0);
      } else if (this._musicPlayer) {
          this._musicPlayer.setVolume(musicVol * 0.6);
      }
  }

  static async play(key, options = {}) {
      const sfxVol = this._volume('sfxVolume');
      if (sfxVol <= 0) return;

      this._initializeContext();
      if (!this._audioCtx) return;
      if (this._audioCtx.state === 'suspended') this._audioCtx.resume();

      let soundDef = this._soundMap[key];
      if (!soundDef) return;

      this._sfxCount++;
      this.updateVolumes();
      const onEnd = () => {
          this._sfxCount--;
          if (this._sfxCount <= 0) {
              this._sfxCount = 0;
              this.updateVolumes();
          }
      };

      if (typeof soundDef === 'string') {
          let buffer = this._buffers.get(key);
          if (!buffer) {
             await this.loadSound(key, soundDef);
             buffer = this._buffers.get(key);
          }
          if (buffer) {
              const source = this._audioCtx.createBufferSource();
              source.buffer = buffer;
              const gainNode = this._audioCtx.createGain();
              gainNode.gain.value = (options.volume !== undefined ? options.volume : 0.5) * sfxVol;
              if (options.pitch) source.playbackRate.value = options.pitch;
              source.connect(gainNode);
              gainNode.connect(this._audioCtx.destination);
              source.onended = onEnd;
              source.start(0);
          } else onEnd();
          return;
      }

      if (!Array.isArray(soundDef)) soundDef = [soundDef];
      const now = this._audioCtx.currentTime;
      let maxDuration = 0;
      soundDef.forEach(note => {
          try {
              const oscillator = this._audioCtx.createOscillator();
              const gainNode = this._audioCtx.createGain();
              oscillator.type = note.type || 'square';
              let freq = note.frequency || 440;
              if (options.pitch) freq *= options.pitch;
              oscillator.frequency.value = freq;
              const noteVol = note.volume || 0.3;
              gainNode.gain.value = (options.volume !== undefined ? options.volume : 0.5) * noteVol * sfxVol;
              oscillator.connect(gainNode);
              gainNode.connect(this._audioCtx.destination);
              const startTime = now + (note.start || 0) / 1000;
              const duration = (note.duration || 100) / 1000;
              const endTime = (note.start || 0) + (note.duration || 100);
              if (endTime > maxDuration) maxDuration = endTime;
              oscillator.start(startTime);
              oscillator.stop(startTime + duration);
          } catch (e) {
              console.error("SoundManager note error:", e);
          }
      });
      setTimeout(onEnd, maxDuration);
  }

  static beep(frequency = 440, duration = 120) {
      const sfxVol = this._volume('sfxVolume');
      if (sfxVol <= 0) return;
      this._initializeContext();
      if (!this._audioCtx) return;
      if (this._audioCtx.state === 'suspended') this._audioCtx.resume();
      this._sfxCount++;
      this.updateVolumes();
      const onEnd = () => {
          this._sfxCount--;
          if (this._sfxCount <= 0) {
              this._sfxCount = 0;
              this.updateVolumes();
          }
      };
      try {
          const oscillator = this._audioCtx.createOscillator();
          const gainNode = this._audioCtx.createGain();
          oscillator.type = "square";
          oscillator.frequency.value = frequency;
          gainNode.gain.value = 0.2 * sfxVol;
          oscillator.connect(gainNode);
          gainNode.connect(this._audioCtx.destination);
          oscillator.start();
          oscillator.stop(this._audioCtx.currentTime + duration / 1000);
          oscillator.onended = onEnd;
      } catch (_e) { onEnd(); }
  }
}
