import { Midi } from 'tone';
import * as Tone from 'tonejs';
import { MidiLoader } from './midi-loader.js';
import { CanvasManager } from './canvas-manager.js';
import { FallingNotesRenderer } from './falling-notes-renderer.js';
import { KeyHitAnimator } from './key-hit-animator.js';

export class MidiPlayer {
    constructor(piano) {
        this.piano = piano;
        this.isPlaying = false;
        this.currentTime = 0;
        this.startTime = 0;
        this.animationId = null;
        this.activeNotesByFallingNote = new Map();
        this.lookaheadTime = 5;
        this.lastScheduleTime = 0;
        this.pausedTime = null;
        this.activeTrackIndices = new Set();

        this.midiLoader = new MidiLoader();
        this.canvasManager = new CanvasManager();
        this.fallingNotesRenderer = new FallingNotesRenderer(this.piano, this.canvasManager);
        this.keyHitAnimator = new KeyHitAnimator(this.piano);
    }

    async loadMidi(file, timeOffset) {
        if (this.isPlaying) {
            this.stop();
        }
        const success = await this.midiLoader.loadMidi(file, timeOffset);
        if (success) {
            // Update total time display
            const duration = this.midiLoader.getDuration();
            const totalTimeDisplay = document.getElementById('total-time-display');
            if (totalTimeDisplay) {
                totalTimeDisplay.textContent = this.formatTime(duration);
            }

            // By default, enable all tracks
            const trackInfo = this.midiLoader.getTrackInfo();
            this.activeTrackIndices.clear();
            trackInfo.forEach(track => this.activeTrackIndices.add(track.index));
            return trackInfo;
        }
        return null;
    }

    updateMidiDelay(timeOffset) {
        // Only update if a MIDI file is actually loaded.
        if (!this.midiLoader.rawMidiBuffer) return;

        // If it's playing, stop it first to apply changes cleanly.
        if (this.isPlaying) {
            this.stop();
        }
        // Also clear any paused state
        this.pausedTime = null;
        this.currentTime = 0;

        // Re-process the MIDI with the new delay
        this.midiLoader.applyTimeOffset(timeOffset);
        
        // After reprocessing, all tracks should be re-enabled by default
        const trackInfo = this.midiLoader.getTrackInfo();
        this.activeTrackIndices.clear();
        trackInfo.forEach(track => this.activeTrackIndices.add(track.index));

        // Reset visualizers and schedulers
        this.fallingNotesRenderer.reset();
        this.activeNotesByFallingNote.clear();
        this.lastScheduleTime = 0;

        // Reset play button state to 'Play' as playback has been stopped/reset
        const playBtn = document.getElementById('play-btn');
        if (playBtn) {
            playBtn.textContent = 'Play';
            playBtn.disabled = false;
        }
        const stopBtn = document.getElementById('stop-btn');
        if (stopBtn) {
            stopBtn.disabled = true;
        }

        // Return track info so UI can be updated if needed
        return trackInfo;
    }

    play() {
        if (!this.midiLoader.midiData) return;
        if (this.isPlaying) return;

        if (this.pausedTime !== null) {
            this.isPlaying = true;
            if (Tone.context.state !== 'running') {
                if (typeof Tone.context.resume === 'function') {
                    Tone.context.resume();
                } else if (Tone.context.rawContext && typeof Tone.context.rawContext.resume === 'function') {
                    Tone.context.rawContext.resume();
                }
            }
            this.startTime = performance.now() - this.pausedTime * 1000;
            this.keyHitAnimator.resumeCSSHitAnimations();
            this.animate();
        } else {
            this.isPlaying = true;
            this.pausedTime = null;
            this.startTime = performance.now();
            this.currentTime = 0;
            this.fallingNotesRenderer.reset();
            this.activeNotesByFallingNote.clear();
            this.lastScheduleTime = 0;
            this.scheduleInitialNotes();
            this.animate();
        }
    }

    pause() {
        if (!this.isPlaying) return;
        this.isPlaying = false;
        this.pausedTime = this.currentTime;

        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        this.keyHitAnimator.pauseCSSHitAnimations();

        if (Tone.context.state === 'running') {
            if (typeof Tone.context.suspend === 'function') {
                Tone.context.suspend();
            } else if (Tone.context.rawContext && typeof Tone.context.rawContext.suspend === 'function') {
                Tone.context.rawContext.suspend();
            }
        }
    }

    stop() {
        this.isPlaying = false;
        this.pausedTime = null;
        this.currentTime = 0;
        this.fallingNotesRenderer.reset();
        this.activeNotesByFallingNote.clear();

        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        this.canvasManager.clear();

        this.piano.stopAll();
    }

    setTrackEnabled(trackIndex, isEnabled) {
        if (isEnabled) {
            this.activeTrackIndices.add(trackIndex);
            // Un-hide existing notes for this track
            this.fallingNotesRenderer.fallingNotes.forEach(note => {
                if (note.track === trackIndex) {
                    note.hidden = false;
                }
            });
        } else {
            this.activeTrackIndices.delete(trackIndex);
            // Hide notes for the disabled track and stop any that are playing
            this.fallingNotesRenderer.fallingNotes.forEach(note => {
                if (note.track === trackIndex) {
                    note.hidden = true;
                    // If the note was playing, stop it
                    if (this.activeNotesByFallingNote.has(note.id)) {
                        this.piano.stopNote(this.activeNotesByFallingNote.get(note.id));
                        this.activeNotesByFallingNote.delete(note.id);
                    }
                }
            });
        }
    }

    scheduleInitialNotes() {
        const allNotes = this.midiLoader.getAllNotes(undefined); // Get all notes regardless of active tracks

        allNotes.forEach(note => {
            if (note.time <= this.fallingNotesRenderer.fallTime) {
                const isHidden = !this.activeTrackIndices.has(note.track);
                this.fallingNotesRenderer.createFallingNote(note, isHidden);
                this.fallingNotesRenderer.scheduledNotes.add(`${note.name}-${note.time}`);
            }
        });
    }

    scheduleNotes() {
        if (this.currentTime - this.lastScheduleTime < 0.1) return;
        this.lastScheduleTime = this.currentTime;

        const allNotes = this.midiLoader.getAllNotes(undefined); // Get all notes to schedule them all
        allNotes.forEach(note => {
            const isHidden = !this.activeTrackIndices.has(note.track);
            this.fallingNotesRenderer.scheduleNote(note, this.currentTime, isHidden);
        });
    }

    animate() {
        if (!this.isPlaying) return;

        this.currentTime = (performance.now() - this.startTime) / 1000;
        this.updateTimelineUI();

        this.canvasManager.clear();

        this.fallingNotesRenderer.fallingNotes = this.fallingNotesRenderer.fallingNotes.filter(note => {
            if (note.released) {
                return false;
            }

            const timeToHit = note.time - this.currentTime;
            note.y = note.targetY - (timeToHit * this.fallingNotesRenderer.noteSpeed);

            if (!note.hidden && !note.played && this.currentTime >= note.time - 0.05) {
                if (this.currentTime < note.time + note.duration) {
                    this.piano.playNote(note.name);
                    note.played = true;
                    this.activeNotesByFallingNote.set(note.id, note.name);
                } else {
                    // Note already finished (e.g. seeking past it), mark as processed without playing
                    note.played = true;
                    note.released = true;
                }
            }

            if (!note.hidden && note.played && !note.hitAnimationStarted && !note.released) {
                this.keyHitAnimator.addHit(note);
                note.hitAnimationStarted = true;
            }

            this.updateShiftKeyHighlight(note.name);

            if (!note.hidden && note.played && !note.released && this.currentTime >= note.time + note.duration - 0.02) {
                if (this.activeNotesByFallingNote.has(note.id)) {
                    this.piano.stopNote(note.name);
                    this.activeNotesByFallingNote.delete(note.id);
                }
                note.released = true;
            }

            this.fallingNotesRenderer.drawFallingNote(note);

            // Keep the note if it is still playing OR if its visual representation (top edge) is still on screen
            // The previous check only looked at the bottom edge (y), which caused long notes to be culled early
            const isVisible = (note.y - note.height) < (this.canvasManager.canvas.height + 50);
            const isPlaying = note.played && !note.released;
            
            const shouldKeep = isVisible || isPlaying;

            if (!shouldKeep && this.activeNotesByFallingNote.has(note.id)) {
                this.piano.stopNote(note.name);
                this.activeNotesByFallingNote.delete(note.id);
            }

            return shouldKeep;
        });
        
        // Process all triggered key animations for this frame in one batch to prevent layout thrashing
        this.keyHitAnimator.processHits();

        if (this.animationId % 30 === 0) {
            this.cleanupStuckNotes();
        }

        this.scheduleNotes();

        this.animationId = requestAnimationFrame(() => this.animate());

        if (this.midiLoader.midiData && this.currentTime > this.midiLoader.getDuration() + 1) {
            this.stop();
            document.getElementById('play-btn').disabled = this.midiLoader.midiData === null;
            document.getElementById('stop-btn').disabled = true;
        }
    }

    formatTime(seconds) {
        if (!seconds && seconds !== 0) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    updateTimelineUI() {
        if (!this.midiLoader.midiData) return;
        
        const duration = this.midiLoader.getDuration();
        const progress = Math.min(100, Math.max(0, (this.currentTime / duration) * 100));
        
        const progressBar = document.getElementById('timeline-progress');
        const handle = document.getElementById('timeline-handle');
        const timeDisplay = document.getElementById('current-time-display');
        
        if (progressBar) progressBar.style.width = `${progress}%`;
        if (handle) handle.style.left = `${progress}%`;
        if (timeDisplay) timeDisplay.textContent = this.formatTime(this.currentTime);
    }

    seek(time) {
        if (!this.midiLoader.midiData) return;
        
        const duration = this.midiLoader.getDuration();
        time = Math.max(0, Math.min(time, duration));
        
        // Stop current sounds
        this.piano.stopAll();
        this.activeNotesByFallingNote.clear();
        
        // Clear visuals
        this.keyHitAnimator.pauseCSSHitAnimations();
        this.fallingNotesRenderer.reset();
        this.lastScheduleTime = -100; // Reset so scheduling happens immediately
        
        // Update time state
        if (this.isPlaying) {
            this.startTime = performance.now() - (time * 1000);
            this.currentTime = time;
        } else {
            this.pausedTime = time;
            this.currentTime = time;
            // If paused, we need to manually update UI to show we seeked
            this.updateTimelineUI();
            
            // Render a static frame so user sees notes at new position
            this.canvasManager.clear();
            
            // We need to temporarily schedule notes around this time to draw them
            const allNotes = this.midiLoader.getAllNotes(undefined);
            allNotes.forEach(note => {
                const isHidden = !this.activeTrackIndices.has(note.track);
                this.fallingNotesRenderer.scheduleNote(note, this.currentTime, isHidden);
            });
            
            // Draw them without triggering audio or playing logic
            // We manually manipulate fallingNotes just for drawing
            this.fallingNotesRenderer.fallingNotes = this.fallingNotesRenderer.fallingNotes.filter(note => {
                // Calculate y position based on current time
                const timeToHit = note.time - this.currentTime;
                note.y = note.targetY - (timeToHit * this.fallingNotesRenderer.noteSpeed);
                
                // Only keep visible ones
                const isVisible = (note.y - note.height) < (this.canvasManager.canvas.height + 50) && 
                                  (note.y > -note.height);
                
                if (isVisible) {
                    this.fallingNotesRenderer.drawFallingNote(note);
                }
                return isVisible;
            });
        }
    }

    updateShiftKeyHighlight(noteName) {
        if (!this.piano) return;

        const noteOctave = parseInt(noteName.match(/\d+$/)[0]);
        const mainOctave = this.piano.currentOctave;

        const isLeftShiftNote = noteOctave < mainOctave - 1;
        const isRightShiftNote = noteOctave > mainOctave + 2;

        const leftShiftKey = document.getElementById('left-shift-key');
        const rightShiftKey = document.getElementById('right-shift-key');

        if (leftShiftKey) {
            if (isLeftShiftNote) {
                leftShiftKey.classList.add('active');
            } else {
                const needsLeftShift = this.fallingNotesRenderer.fallingNotes.some(n => n.played && !n.released && parseInt(n.name.match(/\d+$/)[0]) < mainOctave - 1);
                if (!needsLeftShift) {
                    leftShiftKey.classList.remove('active');
                }
            }
        }

        if (rightShiftKey) {
            if (isRightShiftNote) {
                rightShiftKey.classList.add('active');
            } else {
                const needsRightShift = this.fallingNotesRenderer.fallingNotes.some(n => n.played && !n.released && parseInt(n.name.match(/\d+$/)[0]) > mainOctave + 2);
                if (!needsRightShift) {
                    rightShiftKey.classList.remove('active');
                }
            }
        }
    }

    cleanupStuckNotes() {
        const currentFallingNoteIds = new Set(this.fallingNotesRenderer.fallingNotes.map(note => note.id));

        for (const [noteId, noteName] of this.activeNotesByFallingNote.entries()) {
            if (!currentFallingNoteIds.has(noteId)) {
                this.piano.stopNote(noteName);
                this.activeNotesByFallingNote.delete(noteId);
            }
        }

        this.fallingNotesRenderer.fallingNotes.forEach(note => {
            if (note.played && !note.released && this.currentTime > note.time + note.duration + 0.5) {
                if (this.activeNotesByFallingNote.has(note.id)) {
                    this.piano.stopNote(note.name);
                    this.activeNotesByFallingNote.delete(note.id);
                }
                note.released = true;
            }
        });
    }
}