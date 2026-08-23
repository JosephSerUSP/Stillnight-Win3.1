/** Parses standard MIDI files (SMF). */
export class MidiParser {
  constructor(arrayBuffer) { this.data = new Uint8Array(arrayBuffer); this.view = new DataView(arrayBuffer); this.pos = 0; }
  readString(len) { let str = ""; for (let i = 0; i < len; i++) str += String.fromCharCode(this.data[this.pos++]); return str; }
  readInt32() { const val = this.view.getUint32(this.pos); this.pos += 4; return val; }
  readInt16() { const val = this.view.getUint16(this.pos); this.pos += 2; return val; }
  readInt8() { return this.data[this.pos++]; }
  readVarInt() { let value = 0; let byte; do { byte = this.readInt8(); value = (value << 7) | (byte & 0x7f); } while (byte & 0x80); return value; }
  parse() {
    this.pos = 0; if (this.readString(4) !== "MThd") throw new Error("Invalid MIDI header"); this.readInt32(); this.readInt16(); const nTracks = this.readInt16(); const division = this.readInt16(); const tracks = []; let tracksFound = 0;
    while (tracksFound < nTracks && this.pos < this.data.length) { if (this.pos + 8 > this.data.length) break; const chunkType = this.readString(4); const chunkLen = this.readInt32(); if (chunkType !== "MTrk") { this.pos += chunkLen; continue; } const startPos = this.pos; const events = []; let ticks = 0; let runningStatus = 0; while (this.pos < startPos + chunkLen) { ticks += this.readVarInt(); let eventType = this.data[this.pos]; let event = { ticks }; if (eventType >= 0x80) { this.pos++; runningStatus = eventType; } else eventType = runningStatus; if (eventType === 0xff) { const metaType = this.readInt8(); const len = this.readVarInt(); if (metaType === 0x51) { event.type = "tempo"; event.microsecondsPerBeat = (this.data[this.pos] << 16) | (this.data[this.pos + 1] << 8) | this.data[this.pos + 2]; } else if (metaType === 0x2f) event.type = "end"; this.pos += len; } else if (eventType === 0xf0 || eventType === 0xf7) { const len = this.readVarInt(); this.pos += len; } else { const command = eventType & 0xf0; event.channel = eventType & 0x0f; if (command === 0x90) { event.note = this.readInt8(); event.velocity = this.readInt8(); event.type = event.velocity === 0 ? "noteOff" : "noteOn"; } else if (command === 0x80) { event.note = this.readInt8(); event.velocity = this.readInt8(); event.type = "noteOff"; } else if (command === 0xc0 || command === 0xd0) this.readInt8(); else { this.readInt8(); this.readInt8(); } } if (event.type) events.push(event); } tracks.push(events); tracksFound++; }
    return { division, tracks };
  }
}

/** Plays parsed MIDI data using Web Audio API. */
export class MidiPlayer {
  constructor(audioCtx) {
    this.audioCtx = audioCtx; this.gainNode = audioCtx.createGain(); this.gainNode.connect(audioCtx.destination); this.gainNode.gain.value = 0.3;
    this.isPlaying = false; this.events = []; this.eventIndex = 0; this.startTime = 0; this.activeOscillators = []; this.schedulerTimer = null; this.lookahead = 0.1; this.scheduleAheadTime = 0.2; this.pausedTime = 0;
  }
  get duration() { return this.events?.length ? this.events[this.events.length - 1].time : 0; }
  get currentTime() { if (!this.isPlaying && this.pausedTime > 0) return this.pausedTime; if (!this.isPlaying) return 0; return Math.max(0, this.audioCtx.currentTime - this.startTime); }
  load(midiData) { this.stop(); this.events = this._mergeTracks(midiData); }
  _mergeTracks(midiData) { const merged=[];midiData.tracks.forEach(track=>merged.push(...track));merged.sort((a,b)=>a.ticks-b.ticks);const result=[];let currentTicks=0,currentTime=0,microsecondsPerBeat=500000;merged.forEach(event=>{const deltaTicks=event.ticks-currentTicks;currentTime+=deltaTicks*(microsecondsPerBeat/1000000/midiData.division);currentTicks=event.ticks;if(event.type==="tempo")microsecondsPerBeat=event.microsecondsPerBeat;else if(event.type==="noteOn"||event.type==="noteOff")result.push({time:currentTime,type:event.type,note:event.note,velocity:event.velocity,channel:event.channel});});return result; }
  play(loop = true) {
    if (!this.events.length) return;
    this.stop();
    this.isPlaying = true;
    this.loop = loop;
    this.startTime = this.audioCtx.currentTime;
    this.eventIndex = 0;
    this.pausedTime = 0;
    this.schedule();
  }
  stop() {
    this.isPlaying = false;
    this.pausedTime = 0;
    clearTimeout(this.schedulerTimer);
    this.activeOscillators.forEach(osc => { try { osc.stop(); osc.disconnect(); } catch (_e) {} });
    this.activeOscillators = [];
  }
  pause() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    clearTimeout(this.schedulerTimer);
    this.pausedTime = this.audioCtx.currentTime - this.startTime;
    this.activeOscillators.forEach(osc => { try { osc.stop(); osc.disconnect(); } catch (_e) {} });
    this.activeOscillators = [];
  }
  resume() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.startTime = this.audioCtx.currentTime - this.pausedTime;
    this.schedule();
  }
  setVolume(value) { this.gainNode.gain.setTargetAtTime(value, this.audioCtx.currentTime, 0.1); }
  schedule() { if (!this.isPlaying) return; const currentTime = this.audioCtx.currentTime; while (this.eventIndex < this.events.length && this.events[this.eventIndex].time + this.startTime < currentTime + this.scheduleAheadTime) { const event = this.events[this.eventIndex]; const playTime = this.startTime + event.time; if (playTime >= currentTime) { if (event.type === "noteOn") this.playNote(event.note, event.velocity, playTime); else if (event.type === "noteOff") this.stopNote(event.note, playTime); } this.eventIndex++; } if (this.eventIndex >= this.events.length) { if (this.loop) { const duration = this.events[this.events.length - 1].time; if (currentTime >= this.startTime + duration + 1.0) { this.startTime = currentTime; this.eventIndex = 0; } } else { this.stop(); return; } } this.schedulerTimer = setTimeout(() => this.schedule(), this.lookahead * 1000); }
  playNote(note, velocity, time) { const osc = this.audioCtx.createOscillator(); const gain = this.audioCtx.createGain(); osc.type = "square"; osc.frequency.value = 440 * Math.pow(2, (note - 69) / 12); osc.connect(gain); gain.connect(this.gainNode); gain.gain.value = 0.5 * (velocity / 127); osc.start(time); this.activeOscillators.push(osc); osc._midiNote = note; }
  stopNote(note, time) { const index = this.activeOscillators.findIndex(o => o._midiNote === note); if (index !== -1) { const osc = this.activeOscillators[index]; osc.stop(time); this.activeOscillators.splice(index, 1); setTimeout(() => { try { osc.disconnect(); } catch (_e) {} }, (time - this.audioCtx.currentTime + 1) * 1000); } }
}
