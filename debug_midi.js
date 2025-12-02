import { MidiParser } from './src/managers/midi.js';
import fs from 'fs';

async function checkMidi(path) {
    try {
        const buffer = fs.readFileSync(path);
        const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
        const parser = new MidiParser(arrayBuffer);
        const data = parser.parse();

        let noteOnCount = 0;
        let noteOffCount = 0;
        data.tracks.forEach(track => {
            track.forEach(e => {
                if (e.type === 'noteOn') noteOnCount++;
                if (e.type === 'noteOff') noteOffCount++;
            });
        });

        console.log(`${path}: Tracks=${data.tracks.length}, NoteOn=${noteOnCount}, NoteOff=${noteOffCount}, Division=${data.division}`);
    } catch (e) {
        console.error(`Failed to parse ${path}: `, e);
    }
}

checkMidi('assets/midi/battle1.mid');
checkMidi('assets/midi/dungeon1.mid');
checkMidi('assets/midi/town1.mid');
