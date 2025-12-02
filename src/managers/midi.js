
/**
 * @class MidiParser
 * @description Parses standard MIDI files (SMF).
 */
export class MidiParser {
  constructor(arrayBuffer) {
    this.data = new Uint8Array(arrayBuffer);
    this.view = new DataView(arrayBuffer);
    this.pos = 0;
  }

  readString(len) {
    let str = "";
    for (let i = 0; i < len; i++) {
      str += String.fromCharCode(this.data[this.pos++]);
    }
    return str;
  }

  readInt32() {
    const val = this.view.getUint32(this.pos);
    this.pos += 4;
    return val;
  }

  readInt16() {
    const val = this.view.getUint16(this.pos);
    this.pos += 2;
    return val;
  }

  readInt8() {
    return this.data[this.pos++];
  }

  readVarInt() {
    let value = 0;
    let byte;
    do {
      byte = this.readInt8();
      value = (value << 7) | (byte & 0x7f);
    } while (byte & 0x80);
    return value;
  }

  parse() {
    this.pos = 0;
    if (this.readString(4) !== "MThd") throw new Error("Invalid MIDI header");
    const headerLen = this.readInt32();
    const format = this.readInt16();
    const nTracks = this.readInt16();
    const division = this.readInt16();

    const tracks = [];
    let tracksFound = 0;

    while (tracksFound < nTracks && this.pos < this.data.length) {
      if (this.pos + 8 > this.data.length) break;

      const chunkType = this.readString(4);
      const chunkLen = this.readInt32();

      if (chunkType === "MTrk") {
        const startPos = this.pos;
        const events = [];
        let ticks = 0;
        let runningStatus = 0;

        while (this.pos < startPos + chunkLen) {
          const deltaTime = this.readVarInt();
          ticks += deltaTime;

          let eventType = this.data[this.pos];
          let event = { ticks };

          if (eventType >= 0x80) {
            this.pos++;
            runningStatus = eventType;
          } else {
            eventType = runningStatus;
          }

          if (eventType === 0xff) {
            // Meta
            const metaType = this.readInt8();
            const len = this.readVarInt();

            if (metaType === 0x51) {
              // Tempo
              const microseconds =
                (this.data[this.pos] << 16) |
                (this.data[this.pos + 1] << 8) |
                this.data[this.pos + 2];
              event.type = "tempo";
              event.microsecondsPerBeat = microseconds;
            } else if (metaType === 0x2f) {
              // End of Track
              event.type = "end";
            }
            this.pos += len;
          } else if (eventType === 0xf0 || eventType === 0xf7) {
            // SysEx
            const len = this.readVarInt();
            this.pos += len;
          } else {
            // Channel Message
            const command = eventType & 0xf0;
            const channel = eventType & 0x0f;
            event.channel = channel;

            if (command === 0x90) {
              // Note On
              event.note = this.readInt8();
              event.velocity = this.readInt8();
              event.type = event.velocity === 0 ? "noteOff" : "noteOn";
            } else if (command === 0x80) {
              // Note Off
              event.note = this.readInt8();
              event.velocity = this.readInt8();
              event.type = "noteOff";
            } else if (command === 0xc0 || command === 0xd0) {
              this.readInt8(); // 1 data byte
            } else {
              this.readInt8();
              this.readInt8(); // 2 data bytes
            }
          }
          if (event.type) events.push(event);
        }
        tracks.push(events);
        tracksFound++;
      } else {
        // Skip unknown chunk
        this.pos += chunkLen;
      }
    }
    return { division, tracks };
  }
}

/**
 * @class MidiPlayer
 * @description Plays parsed MIDI data using Web Audio API.
 */
export class MidiPlayer {
  constructor(audioCtx) {
    this.audioCtx = audioCtx;
    this.gainNode = this.audioCtx.createGain();
    this.gainNode.connect(this.audioCtx.destination);
    this.gainNode.gain.value = 0.3; // Default volume
    this.isPlaying = false;
    this.events = [];
    this.eventIndex = 0;
    this.startTime = 0;
    this.activeOscillators = [];
    this.schedulerTimer = null;
    this.lookahead = 0.1; // seconds
    this.scheduleAheadTime = 0.2; // seconds
  }

  load(midiData) {
    this.stop();
    this.events = this._mergeTracks(midiData);
  }

  _mergeTracks(midiData) {
    // Merge all tracks into a single sorted event list with absolute times
    const merged = [];
    midiData.tracks.forEach((track) => {
      merged.push(...track);
    });
    merged.sort((a, b) => a.ticks - b.ticks);

    // Calculate absolute time in seconds
    const result = [];
    let currentTicks = 0;
    let currentTime = 0;
    let microsecondsPerBeat = 500000; // Default 120 BPM
    const division = midiData.division;

    merged.forEach((event) => {
      const deltaTicks = event.ticks - currentTicks;
      const secondsPerTick = microsecondsPerBeat / 1000000 / division;
      currentTime += deltaTicks * secondsPerTick;
      currentTicks = event.ticks;

      if (event.type === "tempo") {
        microsecondsPerBeat = event.microsecondsPerBeat;
      } else if (event.type === "noteOn" || event.type === "noteOff") {
        result.push({
          time: currentTime,
          type: event.type,
          note: event.note,
          velocity: event.velocity,
          channel: event.channel,
        });
      }
    });

    return result;
  }

  play(loop = true) {
    if (!this.events.length) return;
    this.stop();
    this.isPlaying = true;
    this.loop = loop;
    this.startTime = this.audioCtx.currentTime;
    this.eventIndex = 0;
    this.schedule();
  }

  stop() {
    this.isPlaying = false;
    clearTimeout(this.schedulerTimer);
    this.activeOscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {}
    });
    this.activeOscillators = [];
  }

  setVolume(value) {
    this.gainNode.gain.setTargetAtTime(value, this.audioCtx.currentTime, 0.1);
  }

  schedule() {
    if (!this.isPlaying) return;

    const currentTime = this.audioCtx.currentTime;
    // Iterate through events that fall within the schedule window
    while (
      this.eventIndex < this.events.length &&
      this.events[this.eventIndex].time + this.startTime < currentTime + this.scheduleAheadTime
    ) {
      const event = this.events[this.eventIndex];
      const playTime = this.startTime + event.time;

      if (playTime >= currentTime) {
          if (event.type === "noteOn") {
            this.playNote(event.note, playTime);
          } else if (event.type === "noteOff") {
            this.stopNote(event.note, playTime);
          }
      }
      this.eventIndex++;
    }

    if (this.eventIndex >= this.events.length) {
      if (this.loop) {
        // Simple loop: restart when last event is processed
        // Add a small buffer based on the last event time
        const duration = this.events[this.events.length - 1].time;
        const delay = Math.max(0, (this.startTime + duration) - currentTime);

        // Wait for the track to naturally finish before looping
        // Actually, for simplicity, let's just loop immediately if we processed everything.
        // But we need to wait for the actual time.

        const loopTime = this.startTime + duration + 1.0; // 1 sec buffer
        if (currentTime >= loopTime) {
             this.startTime = currentTime;
             this.eventIndex = 0;
        }
      } else {
        this.stop();
        return;
      }
    }

    this.schedulerTimer = setTimeout(() => this.schedule(), this.lookahead * 1000);
  }

  playNote(note, time) {
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = "square";
    // Convert MIDI note to frequency: f = 440 * 2^((d-69)/12)
    osc.frequency.value = 440 * Math.pow(2, (note - 69) / 12);

    osc.connect(gain);
    gain.connect(this.gainNode);

    gain.gain.value = 0.1;

    osc.start(time);
    this.activeOscillators.push(osc);

    // Tag oscillator with note so we can stop it
    osc._midiNote = note;
  }

  stopNote(note, time) {
    // Find active oscillators for this note
    // MIDI allows multiple same notes, but usually it's one per channel.
    // We simplified by merging channels, so let's just stop the oldest one matching the note.
    const index = this.activeOscillators.findIndex(o => o._midiNote === note);
    if (index !== -1) {
      const osc = this.activeOscillators[index];
      osc.stop(time);
      // Remove from array?
      // We should cleanup stopped oscillators periodically or just splice now.
      // Splicing might mess up if we iterate, but we are just finding index.
      this.activeOscillators.splice(index, 1);

      // Garbage collection of AudioNodes handles the rest after disconnection/stop
      // We should disconnect after stop to be clean, but time-delayed stop prevents immediate disconnect.
      // So we rely on GC.
      setTimeout(() => { try { osc.disconnect(); } catch(e){} }, (time - this.audioCtx.currentTime + 1) * 1000);
    }
  }
}
