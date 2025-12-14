import { Piano } from './piano.js';
import { MidiPlayer } from './midi-player.js';

class App {
    constructor() {
        this.piano = new Piano();
        // The piano needs to be rendered before other components that depend on its layout
        this.piano.onPianoRendered = () => {
            this.midiPlayer = new MidiPlayer(this.piano);
        };
        
        this.setupEventListeners();
        this.piano.initializePiano(); // This will trigger the rendering and midiPlayer initialization
    }
    
    setupEventListeners() {
        const midiFileInput = document.getElementById('midi-file');
        const playBtn = document.getElementById('play-btn');
        const stopBtn = document.getElementById('stop-btn');
        const delaySlider = document.getElementById('midi-delay');
        const delayValueSpan = document.getElementById('delay-value');
        
        delaySlider.addEventListener('input', () => {
            const newDelay = parseFloat(delaySlider.value);
            delayValueSpan.textContent = newDelay;
            // Update the midi player with the new delay if a file is loaded
            if (this.midiPlayer && this.midiPlayer.midiLoader.midiData) {
                const trackInfo = this.midiPlayer.updateMidiDelay(newDelay);
                this.updateTrackControls(trackInfo);
            }
        });

        midiFileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                const timeOffset = parseFloat(delaySlider.value);
                const trackInfo = await this.midiPlayer.loadMidi(file, timeOffset);
                if (trackInfo) {
                    playBtn.disabled = false;
                    playBtn.textContent = 'Play';
                    this.updateTrackControls(trackInfo);
                    console.log('MIDI file loaded successfully');
                } else {
                    alert('Error loading MIDI file');
                    this.updateTrackControls([]); // Clear controls on error
                }
            }
        });
        
        playBtn.addEventListener('click', () => {
            if (this.midiPlayer.isPlaying) {
                this.midiPlayer.pause();
                playBtn.textContent = 'Play';
                stopBtn.disabled = false;
            } else {
                this.midiPlayer.play();
                playBtn.textContent = 'Pause';
                playBtn.disabled = false;
                stopBtn.disabled = false;
            }
        });
        
        stopBtn.addEventListener('click', () => {
            this.midiPlayer.stop();
            playBtn.disabled = false;
            stopBtn.disabled = true;
            playBtn.textContent = 'Play';
        });

        this.setupTimelineListeners();
    }

    setupTimelineListeners() {
        const timelineContainer = document.getElementById('timeline-container');
        let isDragging = false;

        const handleSeek = (e) => {
            if (!this.midiPlayer.midiLoader.midiData) return;
            
            const rect = timelineContainer.getBoundingClientRect();
            const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
            const percentage = x / rect.width;
            
            const duration = this.midiPlayer.midiLoader.getDuration();
            const seekTime = duration * percentage;
            
            this.midiPlayer.seek(seekTime);
        };

        timelineContainer.addEventListener('mousedown', (e) => {
            isDragging = true;
            handleSeek(e);
        });

        window.addEventListener('mousemove', (e) => {
            if (isDragging) {
                e.preventDefault();
                handleSeek(e);
            }
        });

        window.addEventListener('mouseup', () => {
            isDragging = false;
        });
    }

    updateTrackControls(tracks) {
        const trackControlsContainer = document.getElementById('track-controls');
        trackControlsContainer.innerHTML = ''; // Clear existing controls

        if (!tracks || tracks.length === 0) {
            return;
        }
        
        const colors = ['#ff6b6b', '#4ecdc4', '#ffc837', '#7b2cbf', '#f77f00', '#00f5d4'];

        tracks.forEach((track, index) => {
            const btn = document.createElement('button');
            btn.className = 'track-toggle-btn active'; // Active by default
            btn.dataset.trackIndex = track.index;

            const icon = document.createElement('div');
            icon.className = 'track-icon';
            icon.style.backgroundColor = colors[index % colors.length];

            const label = document.createElement('span');
            label.textContent = track.name;
            
            btn.appendChild(icon);
            btn.appendChild(label);

            btn.addEventListener('click', () => {
                const wasActive = btn.classList.toggle('active');
                this.midiPlayer.setTrackEnabled(track.index, wasActive);
            });

            trackControlsContainer.appendChild(btn);
        });
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new App();
});