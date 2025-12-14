export class PianoKeyboardHandler {
    constructor(piano) {
        this.piano = piano;
        this.setupKeyboardListeners();
    }
    
    setupKeyboardListeners() {
        document.addEventListener('keydown', (e) => {
            if (e.repeat) return;
            
            // Prevent default for keys we handle to avoid browser actions (like find on '/')
            const handledKeys = ['ControlLeft', 'ShiftLeft', 'KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM', 'Comma', 'Period', 'Slash', 'Tab', 'NumpadEnter', 'Numpad8'];
            if (handledKeys.includes(e.code)) {
                e.preventDefault();
            }

            // Handle Shift keys first
            if (e.code === 'NumpadEnter') {
                document.getElementById('numpad-enter-key')?.classList.add('active');
                if (!this.piano.isRightShiftDown) {
                    this.piano.isRightShiftDown = true;
                    this.piano.initializeRightSubKeyboard();
                }
                return;
            }

            // Handle octave changes
            if (e.code === 'Tab') {
                this.piano.changeOctave(-1);
                return;
            }
            // ArrowUp is now on the right sub-keyboard, so it shouldn't change octave.
            if (e.code === 'Numpad8') { 
                this.piano.changeOctave(1);
                return;
            }
            
            // Find the key element by its code and play its note
            const keyEl = document.querySelector(`.piano [data-code="${e.code}"]`);
            if (keyEl && keyEl.dataset.note) {
                 this.piano.playNote(keyEl.dataset.note);
            }
        });
        
        document.addEventListener('keyup', (e) => {
            // Handle Shift keys
            if (e.code === 'NumpadEnter') {
                e.preventDefault();
                document.getElementById('numpad-enter-key')?.classList.remove('active');
                this.piano.isRightShiftDown = false;
                this.piano.initializeRightSubKeyboard();
                return;
            }

            // Find the key element by its code and stop its note
            const keyEl = document.querySelector(`.piano [data-code="${e.code}"]`);
            if (keyEl && keyEl.dataset.note) {
                this.piano.stopNote(keyEl.dataset.note);
            }
        });
    }
}