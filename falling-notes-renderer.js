export class FallingNotesRenderer {
    constructor(piano, canvasManager) {
        this.piano = piano;
        this.canvasManager = canvasManager;
        this.fallingNotes = [];
        this.scheduledNotes = new Set();
        this.nextNoteId = 0;
        this.noteSpeed = 80;
        this.fallTime = 8;
    }
    
    createFallingNote(note, isHidden = false) {
        const keyPosition = this.getKeyPosition(note.name);
        if (keyPosition === null) return;
        
        // Calculate note height based on duration and fall speed.
        const minHeight = 20; // Minimum visible height for very short notes.
        const durationHeight = Math.max(minHeight, note.duration * this.noteSpeed);
        
        const fallingNote = {
            id: this.nextNoteId++,
            name: note.name,
            x: keyPosition.x,
            y: 0,
            width: keyPosition.width * 0.9,
            height: durationHeight,
            targetY: keyPosition.hitLineY, // The top of the note should hit the line
            time: note.time,
            duration: note.duration,
            velocity: note.velocity,
            isBlack: note.name.includes('#'),
            played: false,
            released: false,
            hitAnimationStarted: false,
            track: note.track, // Keep track of the note's track
            hidden: isHidden
        };
        
        this.fallingNotes.push(fallingNote);
    }
    
    getKeyPosition(noteName) {
        // Use the map from Piano to get the element (handles aliases and is faster)
        const keyElement = this.piano.getKeyElement(noteName);
        
        if (!keyElement) return null;
        
        // Find the parent piano container to calculate relative positions correctly
        const pianoContainer = keyElement.closest('.piano-container');
        if (!pianoContainer) return null;

        const pianoContainerRect = pianoContainer.getBoundingClientRect();
        const keyRect = keyElement.getBoundingClientRect();
        const canvasRect = this.canvasManager.getCanvasRect();

        const hitLineY = this.canvasManager.canvas.height - pianoContainerRect.height;
        
        const pianoContainerXInCanvas = pianoContainerRect.left - canvasRect.left;
        const keyXInPiano = keyRect.left - pianoContainerRect.left;

        return {
            x: pianoContainerXInCanvas + keyXInPiano,
            width: keyRect.width,
            hitLineY: hitLineY,
        };
    }
    
    drawFallingNote(note) {
        if (note.hidden) {
            return; // Don't draw hidden notes
        }

        const ctx = this.canvasManager.ctx;
        ctx.save();
        
        // Calculate opacity based on whether note is active
        let alpha = 0.8;
        if (note.played && !note.released) {
            alpha = 1.0;
        } else if (note.released) {
            alpha = 0.4;
        }
        
        // Set colors with alpha
        if (note.isBlack) {
            ctx.fillStyle = `rgba(255, 107, 107, ${alpha})`;
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        } else {
            ctx.fillStyle = `rgba(78, 205, 196, ${alpha})`;
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        }
        
        ctx.lineWidth = 2;
        
        // Draw note rectangle extending upwards from note.y
        ctx.fillRect(note.x, note.y - note.height, note.width, note.height);
        ctx.strokeRect(note.x, note.y - note.height, note.width, note.height);
        
        // Add note name text at the bottom of the rectangle
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom'; // Align text to the bottom
        ctx.fillText(note.name, note.x + note.width / 2, note.y - 5); // 5px padding from bottom
        
        ctx.restore();
    }
    
    updateFallingNotes(currentTime) {
        this.fallingNotes = this.fallingNotes.filter(note => {
            if (note.released) {
                return false;
            }
            
            // Calculate y position based on current time
            const timeToHit = note.time - currentTime;
            note.y = note.targetY - (timeToHit * this.noteSpeed);
            
            // Draw note
            this.drawFallingNote(note);
            
            // Remove note if it's far below the screen (checking top of note)
            const shouldKeep = (note.y - note.height) < (this.canvasManager.canvas.height + 50);
            
            return shouldKeep;
        });
    }
    
    reset() {
        this.fallingNotes = [];
        this.scheduledNotes.clear();
    }
    
    scheduleNote(note, currentTime, isHidden = false) {
        const noteKey = `${note.name}-${note.time}`;
        const timeTillNote = note.time - currentTime;
        
        // Allow scheduling past notes if they are still within their duration window (plus buffer)
        // This ensures long notes are rendered when seeking into the middle of them
        const pastThreshold = -(note.duration + 2);
        
        if (timeTillNote <= this.fallTime && timeTillNote > pastThreshold && !this.scheduledNotes.has(noteKey)) {
            this.createFallingNote(note, isHidden);
            this.scheduledNotes.add(noteKey);
        }
    }
}