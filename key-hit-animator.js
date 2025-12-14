export class KeyHitAnimator {
    constructor(piano) {
        this.piano = piano;
        this.pausedHitAnimations = [];
        this.batchedHits = [];
    }
    
    addHit(note) {
        this.batchedHits.push(note);
    }
    
    processHits() {
        if (this.batchedHits.length === 0) return;
        
        const elementsToAnimate = [];
        
        // Phase 1: Reset and prepare
        this.batchedHits.forEach(note => {
            const keyElement = this.piano.getKeyElement(note.name);
            if (!keyElement) return;
            
            keyElement.dataset.hitDuration = note.duration;
            
            const gradient = note.isBlack
                ? 'linear-gradient(to bottom, #ff6b6b, #ee5a52)'
                : 'linear-gradient(to bottom, #4ecdc4, #44a08d)';
            
            keyElement.style.backgroundImage = gradient;
            keyElement.style.backgroundRepeat = 'no-repeat';
            keyElement.style.backgroundPosition = 'top center';
            
            // Reset transition and size
            keyElement.style.transition = 'none';
            keyElement.style.backgroundSize = '100% 0%';
            
            elementsToAnimate.push({ element: keyElement, duration: note.duration });
        });
        
        // Phase 2: Force reflow (once for all elements)
        // This prevents layout thrashing when many notes start simultaneously
        if (elementsToAnimate.length > 0) {
            void elementsToAnimate[0].element.offsetWidth;
        }
        
        // Phase 3: Start animation
        elementsToAnimate.forEach(({ element, duration }) => {
            element.style.transition = `background-size ${duration}s linear`;
            element.style.backgroundSize = '100% 100%';
        });
        
        this.batchedHits = [];
    }
    
    pauseCSSHitAnimations() {
        this.pausedHitAnimations = [];
        document.querySelectorAll('.piano-key').forEach(keyEl => {
            const transition = keyEl.style.transition;
            if (transition && transition.includes('background-size')) {
                const computedBS = getComputedStyle(keyEl).backgroundSize;
                const parts = computedBS.split(' ');
                if (parts.length >= 2) {
                    let percent = 0;
                    const heightPart = parts[1];
                    if (heightPart.endsWith('%')) {
                        percent = parseFloat(heightPart);
                    }
                    const duration = keyEl.dataset.hitDuration
                        ? parseFloat(keyEl.dataset.hitDuration)
                        : (() => {
                            const m = transition.match(/background-size\s+([\d.]+)s/);
                            return m ? parseFloat(m[1]) : 0;
                        })();
                    
                    keyEl.style.transition = 'none';
                    keyEl.style.backgroundSize = `100% ${percent}%`;
                    
                    if (percent > 0 && percent < 100 && duration > 0 && keyEl.dataset.note) {
                        this.pausedHitAnimations.push({
                            noteName: keyEl.dataset.note,
                            remainingTime: duration * (1 - percent / 100),
                        });
                    }
                }
            }
        });
    }
    
    resumeCSSHitAnimations() {
        if (!this.pausedHitAnimations || this.pausedHitAnimations.length === 0) return;
        this.pausedHitAnimations.forEach(({ noteName, remainingTime }) => {
            const keyEl = this.piano.getKeyElement(noteName);
            if (keyEl) {
                keyEl.style.transition = `background-size ${remainingTime}s linear`;
                void keyEl.offsetWidth;
                keyEl.style.backgroundSize = '100% 100%';
            }
        });
        this.pausedHitAnimations = [];
    }
}