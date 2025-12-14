export const PIANO_CONFIG = {
    whiteKeys: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
    blackKeys: ['C#', 'D#', 'F#', 'G#', 'A#'],
    
    whiteKeyMap: {
        'KeyQ': 'C', 'KeyW': 'D', 'KeyE': 'E', 'KeyR': 'F', 'KeyT': 'G', 
        'KeyY': 'A', 'KeyU': 'B', 'KeyI': 'C', 'KeyO': 'D', 'KeyP': 'E',
        'BracketLeft': 'F', 'BracketRight': 'G', 'Backslash': 'A',
        'Numpad7': 'B', 'Home': 'B'
    },
    
    blackKeyMap: {
        'Digit2': 'C#', 'Digit3': 'D#', 'Digit5': 'F#', 'Digit6': 'G#', 'Digit7': 'A#',
        'Digit9': 'C#', 'Digit0': 'D#', 'Minus': 'F#', 'Equal': 'G#', 'Backspace': 'A#'
    },
    
    subKeyboards: {
        left: {
            white: { 
                'KeyZ': 'E', 'KeyX': 'F', 'KeyC': 'G', 'KeyV': 'A', 'KeyB': 'B',
                'KeyN': 'C', 'KeyM': 'D', 'Comma': 'E', 'Period': 'F', 'Slash': 'G'
            },
            black: { 
                'KeyS': 'F#', 'KeyD': 'G#', 'KeyG': 'A#', 
                'KeyL': 'C#', 'Semicolon': 'D#', 'Quote': 'F#' 
            }
        },
        right: {
            white: { 
                'ShiftRight': 'C', 'ArrowUp': 'D', 'Numpad1': 'E', 'Numpad2': 'F', 
                'Numpad3': 'G', 'ArrowLeft': 'A', 'ArrowDown': 'B', 'ArrowRight': 'C',
                'Numpad0': 'D', 'NumpadDecimal': 'E'
            },
            black: { 
                 // No default black keys for this layout, they get assigned dynamically
            }
        }
    }
};

export const UI_CONFIG = {
    mainPiano: {
        whiteKeyLabels: ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']', '\\', '7/Home'],
        blackKeyLabels: ['2', '3', '5', '6', '7', '9', '0', '-', '=', '⌫']
    },
    
    leftSubKeyboard: {
        whiteKeyCodes: ['ControlLeft', 'ShiftLeft', 'KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM', 'Comma', 'Period', 'Slash'],
        whiteKeyLabels: ['L-CTRL', 'L-SHIFT', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/'],
        blackKeyLabels: ['A', 'S', 'D', 'G', 'H', 'K', 'L', ';'],
        blackKeyCodes: ['KeyA', 'KeyS', 'KeyD', 'KeyG', 'KeyH', 'KeyK', 'KeyL', 'Semicolon'],
        notes: ['E', 'F', 'G', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'A', 'B']
    },
    
    rightSubKeyboard: {
        whiteKeyConfig: [
            { key: 'R-SHIFT', label: 'R-SHIFT', code: 'ShiftRight' }, 
            { key: 'ArrowUp', label: '↑', code: 'ArrowUp' }, 
            { key: 'Numpad1', label: 'N1', code: 'Numpad1' }, 
            { key: 'Numpad2', label: 'N2', code: 'Numpad2' }, 
            { key: 'Numpad3', label: 'N3', code: 'Numpad3' },
            { key: 'ArrowLeft', label: '←', code: 'ArrowLeft' }, 
            { key: 'ArrowDown', label: '↓', code: 'ArrowDown' }, 
            { key: 'ArrowRight', label: '→', code: 'ArrowRight' },
            { key: 'Numpad0', label: 'N0', code: 'Numpad0' }, 
            { key: 'NumpadDecimal', label: '.', code: 'NumpadDecimal' }
        ],
        
        blackKeyConfig: [
            { label: 'N4', code: 'Numpad4' },
            { label: 'N5', code: 'Numpad5' },
            { label: 'N-ADD', code: 'NumpadAdd' },
            { label: 'N-SUB', code: 'NumpadSubtract' },
            { label: 'N-MUL', code: 'NumpadMultiply' },
            { label: 'N9', code: 'Numpad9' },
            { label: 'N/', code: 'NumpadDivide' }
        ],
        
        notes: ['C', 'D', 'E', 'F', 'G', 'A', 'B']
    }
};