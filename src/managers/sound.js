import { MidiParser, MidiPlayer } from "./midi.js";
import { ConfigManager } from "./config.js";

/**
 * @class SoundManager
 * @description A static class for handling audio playback.
 * This encapsulates the AudioContext and provides a simple interface
 * for playing sound effects. Handles loading and caching of audio buffers
 * and synthesis of procedural sounds (single notes, sequences, chords).
 */
export class SoundManager {
  /**
   * The global AudioContext instance.
   * @private
   * @type {AudioContext}
   */
  static _audioCtx = null;

  /**
   * Map of sound keys to audio buffers.
   * @private
   * @type {Map<string, AudioBuffer>}
   */
  static _buffers = new Map();

  /**
   * Map of sound keys to configuration (path string, object, or array).
   * @private
   * @type {Object}
   */
  static _soundMap = {};

  /**
   * Map of MIDI keys to parsed MIDI data.
   * @private
   * @type {Map<string, Object>}
   */
  static _midiData = new Map();

  /**
   * The MIDI player instance.
   * @private
   * @type {MidiPlayer}
   */
  static _musicPlayer = null;

  /**
   * Counter for active SFX to handle interruption logic.
   * @private
   * @type {number}
   */
  static _sfxCount = 0;

  /**
   * The current music key being played.
   * @private
   * @type {string|null}
   */
  static _currentMusicKey = null;

  /**
   * Initializes the SoundManager with sound data.
   * @method init
   * @param {Object} soundMap - Key-value pair of sound names and config/paths.
   * @returns {Promise} Resolves when all sounds and MIDI are loaded.
   */
  static async init(soundMap) {
      this._soundMap = soundMap || {};
      this._initializeContext();
      return this.loadAll();
  }

  /**
   * Initializes the AudioContext if it hasn't been initialized yet.
   * @method _initializeContext
   * @private
   */
  static _initializeContext() {
    if (!this._audioCtx && typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) {
      this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this._audioCtx && !this._musicPlayer) {
        this._musicPlayer = new MidiPlayer(this._audioCtx);
    }
  }

  /**
   * Loads all file-based sounds defined in the sound map.
   * @method loadAll
   * @async
   */
  static async loadAll() {
      if (!this._audioCtx) return;
      const promises = Object.entries(this._soundMap).map(([key, value]) => {
          if (typeof value === 'string') {
              return this.loadSound(key, value);
          }
          return Promise.resolve();
      });

      // Load MIDI files
      // Try to fetch directory listing if possible (for local/dev environments),
      // otherwise fall back to known list.
      const midiFolder = 'assets/midi/';
      let midiFiles = [
          'battle1.mid', 'dungeon1.mid', 'town1.mid', 'event1.mid', 'event2.mid', 'victory1.mid',
          'coverCapsuleHello.mid', 'emotional1_bitSad.mid', 'emotional2_sadNostalgic.mid', 'emotional3_sadSad.mid',
          'event3.mid', 'event4_darkJester.mid', 'event5_nostalgia.mid', 'event6_happyfinality.mid',
          'event7_happyPrelude.mid', 'event8_yearning.mid', 'event9_magical.mid'
      ];

      try {
          // Attempt to scan directory (works in some local servers that serve auto-index)
          const response = await fetch(midiFolder);
          if (response.ok) {
              const text = await response.text();
              // Simple regex to find hrefs ending in .mid
              const matches = text.matchAll(/href="([^"]+\.mid)"/g);
              const found = [];
              for (const match of matches) {
                  // decodeURI in case of encoded characters
                  // Split by / and take the last part to ensure we only get the filename
                  // even if the server returns a relative path (e.g. assets/midi/file.mid)
                  const parts = decodeURI(match[1]).split('/');
                  const fileName = parts[parts.length - 1];
                  if (fileName && !found.includes(fileName)) found.push(fileName);
              }
              if (found.length > 0) {
                  midiFiles = found;
              }
          }
      } catch (e) {
          console.warn("Dynamic MIDI scan failed, using fallback list.", e);
      }

      midiFiles.forEach(file => {
          // Key is filename without extension
          const key = file.replace(/\.mid$/i, '');
          const path = midiFolder + file;
          promises.push(this.loadMidi(key, path));
      });

      await Promise.allSettled(promises);
  }

  /**
   * Loads a single sound into the buffer cache.
   * @method loadSound
   * @async
   * @param {string} key - The sound key.
   * @param {string} path - The file path.
   */
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
          const arrayBuffer = await response.arrayBuffer();
          const parser = new MidiParser(arrayBuffer);
          const data = parser.parse();
          this._midiData.set(key, data);
      } catch (error) {
          console.warn(`SoundManager: Failed to load midi '${key}' from '${path}'.`, error);
      }
  }

  /**
   * Plays background music.
   * @method playMusic
   * @param {string} key - The music key (e.g., 'battle1').
   */
  static playMusic(key) {
      const volume = ConfigManager.masterVolume * ConfigManager.musicVolume;
      if (volume <= 0) {
          // If volume is 0, we can start it muted to keep state, or just return.
          // Let's start it so we can fade in later if volume changes.
      }

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
      if (this._musicPlayer) {
          this._musicPlayer.stop();
      }
      this._currentMusicKey = null;
  }

  static pauseMusic() {
      if (this._musicPlayer) {
          this._musicPlayer.pause();
      }
  }

  static resumeMusic() {
      if (this._musicPlayer) {
          this._musicPlayer.resume();
      }
  }

  static isMusicPlaying() {
      return this._musicPlayer && this._musicPlayer.isPlaying;
  }

  static getMusicDuration() {
      return this._musicPlayer ? this._musicPlayer.duration : 0;
  }

  static getMusicTime() {
      return this._musicPlayer ? this._musicPlayer.currentTime : 0;
  }

  /**
   * Updates volumes of active playback based on ConfigManager.
   */
  static updateVolumes() {
      if (!this._audioCtx) return;

      const musicVol = ConfigManager.masterVolume * ConfigManager.musicVolume;
      // If SFX are active, silence music
      if (this._sfxCount > 0) {
          if (this._musicPlayer) this._musicPlayer.setVolume(0);
      } else {
          // Normal music volume (0.6 base scaling to match square wave loudness)
          if (this._musicPlayer) this._musicPlayer.setVolume(musicVol * 0.6);
      }
  }

  /**
   * Plays a sound effect by key.
   * Supports file-based, single procedural notes, and note sequences (polyphony).
   * @method play
   * @param {string} key - The key of the sound to play.
   * @param {Object} [options] - Playback options.
   * @param {number} [options.volume] - Volume multiplier.
   * @param {number} [options.pitch] - Pitch multiplier.
   */
  static async play(key, options = {}) {
      const sfxVol = ConfigManager.masterVolume * ConfigManager.sfxVolume;
      if (sfxVol <= 0) return;

      this._initializeContext();
      if (!this._audioCtx) return;

      if (this._audioCtx.state === 'suspended') {
          this._audioCtx.resume();
      }

      let soundDef = this._soundMap[key];
      if (!soundDef) {
          // console.warn(`SoundManager: Sound '${key}' not found.`);
          return;
      }

      // Interrupt Music
      this._sfxCount++;
      this.updateVolumes(); // Will silence music

      const onEnd = () => {
          this._sfxCount--;
          if (this._sfxCount <= 0) {
              this._sfxCount = 0;
              this.updateVolumes(); // Restore music
          }
      };

      // Case 1: File-based sound
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

              // Default volume 0.5
              let playVol = (options.volume !== undefined ? options.volume : 0.5) * sfxVol;
              gainNode.gain.value = playVol;

              if (options.pitch) source.playbackRate.value = options.pitch;
              source.connect(gainNode);
              gainNode.connect(this._audioCtx.destination);
              source.onended = onEnd;
              source.start(0);
          } else {
              onEnd();
          }
          return;
      }

      // Case 2: Procedural (Synthesized)
      // Normalize single object to array for sequence handling
      if (!Array.isArray(soundDef)) {
          soundDef = [soundDef];
      }

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

              // Default note volume 0.3
              let noteVol = (note.volume || 0.3);
              let playVol = (options.volume !== undefined ? options.volume : 0.5) * noteVol * sfxVol;

              gainNode.gain.value = playVol;

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

  /**
   * Legacy beep (used if no configuration exists or direct call needed).
   * @deprecated Use play() instead.
   */
  static beep(frequency = 440, duration = 120) {
      const sfxVol = ConfigManager.masterVolume * ConfigManager.sfxVolume;
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
          // Tuned up beep volume to 0.2 (was 0.05)
          gainNode.gain.value = 0.2 * sfxVol;
          oscillator.connect(gainNode);
          gainNode.connect(this._audioCtx.destination);
          oscillator.start();
          oscillator.stop(this._audioCtx.currentTime + duration / 1000);
          oscillator.onended = onEnd;
      } catch (_e) {
          onEnd();
      }
  }
}
