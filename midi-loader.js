import { Midi } from 'tone';

export class MidiLoader {
    constructor() {
        this.midiData = null;
        this.rawMidiBuffer = null;
    }
    
    async loadMidi(file, timeOffset = 5) {
        try {
            this.rawMidiBuffer = await file.arrayBuffer();
            this.applyTimeOffset(timeOffset);
            console.log(`MIDI loaded and shifted by ${timeOffset}s:`, this.midiData);
            return true;
        } catch (error) {
            console.error('Error loading MIDI:', error);
            this.rawMidiBuffer = null; // Clear on error
            return false;
        }
    }

    applyTimeOffset(timeOffset) {
        if (!this.rawMidiBuffer) return false;

        // Re-create from the raw buffer to get clean, unmodified note times
        this.midiData = new Midi(this.rawMidiBuffer);

        // Shift all notes if a positive offset is provided
        if (timeOffset > 0) {
            this.midiData.tracks.forEach(track => {
                track.notes.forEach(note => {
                    note.time += timeOffset;
                });
            });
        }
        return true;
    }
    
    getAllNotes(activeTrackIndices) {
        if (!this.midiData) return [];
        
        const allNotes = [];
        this.midiData.tracks.forEach((track, index) => {
             if (activeTrackIndices === undefined || activeTrackIndices.has(index)) {
                track.notes.forEach(note => {
                    allNotes.push({
                        name: note.name,
                        time: note.time,
                        duration: note.duration,
                        velocity: note.velocity,
                        track: index
                    });
                });
            }
        });
        
        return allNotes.sort((a, b) => a.time - b.time);
    }
    
    getDuration() {
        return this.midiData ? this.midiData.duration : 0;
    }

    getTrackInfo() {
        if (!this.midiData) return [];
        return this.midiData.tracks.map((track, index) => ({
            index: index,
            name: track.name.trim() || `Track ${index + 1}`,
            instrument: track.instrument.name
        }));
    }
}