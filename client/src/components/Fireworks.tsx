import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  color: string;
  radius: number;
  velocity: {
    x: number;
    y: number;
  };
  alpha: number;
  decay: number;
  update: () => boolean;
  draw: (ctx: CanvasRenderingContext2D) => void;
}

export default function Fireworks() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas to full window size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    const getRandomColor = () => {
      const hue = Math.floor(Math.random() * 360);
      const saturation = 70 + Math.floor(Math.random() * 30);
      const lightness = 50 + Math.floor(Math.random() * 20);
      return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    };
    
    const fireworks: Particle[] = [];
    
    const createParticle = (x: number, y: number, color: string): Particle => {
      return {
        x,
        y,
        color,
        radius: Math.random() * 2 + 1,
        velocity: {
          x: (Math.random() - 0.5) * 6,
          y: (Math.random() - 0.5) * 6
        },
        alpha: 1,
        decay: Math.random() * 0.02 + 0.01,
        
        draw(ctx) {
          ctx.save();
          ctx.globalAlpha = this.alpha;
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
          ctx.fillStyle = this.color;
          ctx.fill();
          ctx.restore();
        },
        
        update() {
          this.velocity.y += 0.03; // gravity
          this.x += this.velocity.x;
          this.y += this.velocity.y;
          this.alpha -= this.decay;
          this.draw(ctx);
          return this.alpha > 0;
        }
      };
    };
    
    const createFirework = (x: number, y: number) => {
      const color = getRandomColor();
      const particleCount = 80 + Math.floor(Math.random() * 50);
      
      for (let i = 0; i < particleCount; i++) {
        fireworks.push(createParticle(x, y, color));
      }
    };
    
    const animate = () => {
      requestAnimationFrame(animate);
      ctx.fillStyle = 'rgba(18, 18, 18, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Random chance to create new firework
      if (Math.random() < 0.02) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height * 0.6;
        createFirework(x, y);
      }
      
      // Update existing fireworks
      for (let i = fireworks.length - 1; i >= 0; i--) {
        if (!fireworks[i].update()) {
          fireworks.splice(i, 1);
        }
      }
    };
    
    animate();
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);
  
  return (
    <canvas 
      ref={canvasRef} 
      className="fixed top-0 left-0 w-full h-full z-0 pointer-events-none"
    />
  );
}
