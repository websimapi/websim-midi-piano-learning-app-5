import { PIANO_CONFIG, UI_CONFIG } from './piano-config.js';

export class PianoRenderer {
    constructor(piano) {
        this.piano = piano;
    }
    
    invertMap(map) {
        const inverted = {};
        for (const key in map) {
            const value = map[key];
            if (!inverted[value]) {
                inverted[value] = [];
            }
            inverted[value].push(key);
        }
        return inverted;
    }

    initializeMainPiano() {
        const pianoElement = document.getElementById('piano');
        pianoElement.innerHTML = '';
        
        const { whiteKeyLabels, blackKeyLabels } = UI_CONFIG.mainPiano;
        const reversedWhiteKeyMap = this.invertMap(PIANO_CONFIG.whiteKeyMap);
        const reversedBlackKeyMap = this.invertMap(PIANO_CONFIG.blackKeyMap);
        
        let whiteKeyLabelIndex = 0;
        let blackKeyLabelIndex = 0;
        
        // Create a visual TAB key on the left (non-playable, just for reference)
        const tabKey = document.createElement('div');
        tabKey.className = 'piano-key white-key function-key';
        tabKey.textContent = 'TAB';
        tabKey.id = 'tab-key';
        pianoElement.appendChild(tabKey);
        
        // Create 2 octaves of keys
        for (let octave = 0; octave < 2; octave++) {
            for (let i = 0; i < PIANO_CONFIG.whiteKeys.length; i++) {
                const whiteKey = document.createElement('div');
                const note = PIANO_CONFIG.whiteKeys[i];
                const noteWithOctave = `${note}${this.piano.currentOctave + octave}`;
                
                whiteKey.className = 'piano-key white-key';
                whiteKey.dataset.note = noteWithOctave;
                
                // Assign data-code for keyboard events
                const codesForNote = reversedWhiteKeyMap[note] || [];
                const code = codesForNote[octave] || codesForNote[0];
                if (code) {
                    whiteKey.dataset.code = code;
                }
                
                // Label with keyboard keys (or leave blank if no more labels)
                if (whiteKeyLabelIndex < whiteKeyLabels.length) {
                    whiteKey.textContent = whiteKeyLabels[whiteKeyLabelIndex];
                    whiteKeyLabelIndex++;
                }
                
                whiteKey.addEventListener('mousedown', () => this.piano.playNote(noteWithOctave));
                whiteKey.addEventListener('mouseup', () => this.piano.stopNote(noteWithOctave));
                whiteKey.addEventListener('mouseleave', () => this.piano.stopNote(noteWithOctave));
                
                this.piano.registerKey(noteWithOctave, whiteKey);
                pianoElement.appendChild(whiteKey);
                
                // Add black keys after C, D, F, G, A
                if (['C', 'D', 'F', 'G', 'A'].includes(note)) {
                    const blackKey = document.createElement('div');
                    const blackNote = `${note}#`;
                    const blackNoteWithOctave = `${blackNote}${this.piano.currentOctave + octave}`;
                    
                    blackKey.className = 'piano-key black-key';
                    blackKey.dataset.note = blackNoteWithOctave;

                    // Assign data-code for keyboard events
                    const codesForBlackNote = reversedBlackKeyMap[blackNote] || [];
                    const blackCode = codesForBlackNote[octave] || codesForBlackNote[0];
                    if (blackCode) {
                        blackKey.dataset.code = blackCode;
                    }
                    
                    if (blackKeyLabelIndex < blackKeyLabels.length) {
                       blackKey.textContent = blackKeyLabels[blackKeyLabelIndex];
                       blackKeyLabelIndex++;
                    }
                    
                    blackKey.addEventListener('mousedown', () => this.piano.playNote(blackNoteWithOctave));
                    blackKey.addEventListener('mouseup', () => this.piano.stopNote(blackNoteWithOctave));
                    blackKey.addEventListener('mouseleave', () => this.piano.stopNote(blackNoteWithOctave));
                    
                    this.piano.registerKey(blackNoteWithOctave, blackKey);

                    // Position black key between white keys (adjusted for the extra TAB key)
                    const leftPosition = (i * 62) + 42 + (octave * 434) + 62;
                    blackKey.style.left = `${leftPosition}px`;
                    
                    pianoElement.appendChild(blackKey);
                }
            }
        }
        
        // Add a visual key for Octave Up on the right
        const octaveUpKey = document.createElement('div');
        octaveUpKey.className = 'piano-key white-key function-key';
        octaveUpKey.textContent = '8/Up';
        octaveUpKey.id = 'octave-up-key';
        pianoElement.appendChild(octaveUpKey);
    }

    initializeLeftSubKeyboard() {
        const leftPianoEl = document.getElementById('left-sub-keyboard');
        leftPianoEl.innerHTML = '';
        
        const { whiteKeyCodes, whiteKeyLabels, blackKeyLabels, blackKeyCodes, notes } = UI_CONFIG.leftSubKeyboard;
        let blackKeyIndex = 0;

        let startOctave = this.piano.currentOctave - 2;
        let currentOctave = startOctave;

        for (let i = 0; i < whiteKeyLabels.length; i++) {
            const noteName = notes[i];
            
            // Octave increases after B and not before C.
            if (i > 0 && notes[i-1] === 'B') {
                currentOctave++;
            }
            const note = `${noteName}${currentOctave}`;
            const whiteKey = this.createKeyElement('white', note, whiteKeyLabels[i], whiteKeyCodes[i]);
            leftPianoEl.appendChild(whiteKey);

            // Add black keys
            if (!['B', 'E'].includes(noteName)) {
                 const blackNoteName = `${noteName}#`;
                 const blackNote = `${blackNoteName}${currentOctave}`;
                 
                 const label = blackKeyLabels[blackKeyIndex] || '';
                 const code = blackKeyCodes[blackKeyIndex] || null;
                 const blackKey = this.createKeyElement('black', blackNote, label, code);
                 blackKeyIndex++;

                 // Position needs to account for the key's position
                 const leftPosition = (i * 31) + 20; 
                 blackKey.style.left = `${leftPosition}px`;
                 leftPianoEl.appendChild(blackKey);
            }
        }
    }

    initializeRightSubKeyboard() {
        const rightPianoEl = document.getElementById('right-sub-keyboard');
        rightPianoEl.innerHTML = '';
        
        const octaveShift = this.piano.isRightShiftDown ? 1 : 0;
        let startOctave = this.piano.currentOctave + 2 + octaveShift;

        const { whiteKeyConfig, blackKeyConfig, notes } = UI_CONFIG.rightSubKeyboard;
        let blackKeyIndex = 0;

        // Correctly handle the functional R-SHIFT key at the start
        const rShiftKey = this.createKeyElement('white', '', 'R-SHIFT', 'ShiftRight');
        rShiftKey.classList.add('function-key');
        rShiftKey.id = 'right-shift-key'; // For highlighting
         if (this.piano.isRightShiftDown) {
            rShiftKey.classList.add('active');
        }
        rightPianoEl.appendChild(rShiftKey);
        
        // Start from the second item for playable keys
        for (let i = 1; i < whiteKeyConfig.length; i++) {
            const noteName = notes[(i-1) % 7];
            if (i > 1 && noteName === 'C') {
                startOctave++;
            }
            const note = `${noteName}${startOctave}`;
            const whiteKey = this.createKeyElement('white', note, whiteKeyConfig[i].label, whiteKeyConfig[i].code);
            rightPianoEl.appendChild(whiteKey);

            if (['C', 'D', 'F', 'G', 'A'].includes(noteName)) {
                const blackNote = `${noteName}#${startOctave}`;
                const config = blackKeyConfig[blackKeyIndex];
                const label = config ? config.label : '';
                const code = config ? config.code : null;
                const blackKey = this.createKeyElement('black', blackNote, label, code);
                blackKeyIndex++;

                // Adjust left position to account for R-SHIFT key
                const leftPosition = (i * 31) + 20;
                blackKey.style.left = `${leftPosition}px`;
                rightPianoEl.appendChild(blackKey);
            }
        }
        
        // Add visual shift key at the end
        const enterKey = this.createKeyElement('white', '', 'N-ENTER', 'NumpadEnter');
        enterKey.classList.add('function-key');
        enterKey.id = 'numpad-enter-key'; // For highlighting
        rightPianoEl.appendChild(enterKey);
    }

    createKeyElement(type, note, label, code = null) {
        const key = document.createElement('div');
        key.className = `piano-key ${type}-key`;
        key.dataset.note = note;
        if(code) {
            key.dataset.code = code;
        }
        key.textContent = label;

        key.addEventListener('mousedown', () => this.piano.playNote(note));
        key.addEventListener('mouseup', () => this.piano.stopNote(note));
        key.addEventListener('mouseleave', () => this.piano.stopNote(note));
        
        if (note) {
            this.piano.registerKey(note, key);
        }
        
        return key;
    }
}