export class CanvasManager {
    constructor() {
        this.canvas = document.getElementById('falling-keys');
        this.ctx = this.canvas.getContext('2d');
        this.setupCanvas();
    }
    
    setupCanvas() {
        const visualizerWrapper = document.querySelector('.visualizer-wrapper');
        // Resize canvas to fit container
        const resizeCanvas = () => {
            const rect = visualizerWrapper.getBoundingClientRect();
            this.canvas.width = rect.width;
            this.canvas.height = rect.height;
        };
        
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
    }
    
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    getCanvasRect() {
        return this.canvas.getBoundingClientRect();
    }
}