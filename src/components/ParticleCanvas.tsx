import React, { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  type: 'heart' | 'sakura' | 'sparkle' | 'bubble';
  color: string;
}

export const ParticleCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { settings } = useApp();
  const mouseRef = useRef<{ x: number; y: number }>({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Particle density calculation
    const particleCountMap = { low: 25, medium: 50, high: 90 };
    const maxParticles = particleCountMap[settings.particle_intensity] || 50;

    const colors = ['#FF69B4', '#FFB6C1', '#FFC0CB', '#EC407A', '#F8BBD0', '#FFF0F6'];
    const types: ('heart' | 'sakura' | 'sparkle' | 'bubble')[] = ['heart', 'sakura', 'sparkle', 'bubble'];

    const createParticle = (): Particle => {
      const type = types[Math.floor(Math.random() * types.length)];
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 12 + 6,
        speedX: (Math.random() - 0.5) * 0.8,
        speedY: type === 'sakura' ? Math.random() * 0.8 + 0.3 : -(Math.random() * 0.6 + 0.2),
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        opacity: Math.random() * 0.6 + 0.3,
        type,
        color: colors[Math.floor(Math.random() * colors.length)],
      };
    };

    const particles: Particle[] = Array.from({ length: maxParticles }, createParticle);

    const drawHeart = (ctx: CanvasRenderingContext2D, size: number, color: string, opacity: number) => {
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.fillStyle = color;
      ctx.beginPath();
      const topCurveHeight = size * 0.3;
      ctx.moveTo(0, topCurveHeight);
      // top left curve
      ctx.bezierCurveTo(0, 0, -size / 2, 0, -size / 2, topCurveHeight);
      // bottom left curve
      ctx.bezierCurveTo(-size / 2, (size + topCurveHeight) / 2, 0, size * 0.8, 0, size);
      // bottom right curve
      ctx.bezierCurveTo(0, size * 0.8, size / 2, (size + topCurveHeight) / 2, size / 2, topCurveHeight);
      // top right curve
      ctx.bezierCurveTo(size / 2, 0, 0, 0, 0, topCurveHeight);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    const drawSakura = (ctx: CanvasRenderingContext2D, size: number, opacity: number) => {
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.fillStyle = '#FFC0CB';
      ctx.beginPath();
      ctx.ellipse(0, 0, size / 2, size, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const drawSparkle = (ctx: CanvasRenderingContext2D, size: number, color: string, opacity: number) => {
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-size, 0);
      ctx.lineTo(size, 0);
      ctx.moveTo(0, -size);
      ctx.lineTo(0, size);
      ctx.stroke();
      ctx.restore();
    };

    const drawBubble = (ctx: CanvasRenderingContext2D, size: number, opacity: number) => {
      ctx.save();
      ctx.globalAlpha = opacity * 0.5;
      ctx.fillStyle = '#FFF0F6';
      ctx.strokeStyle = '#FFB6C1';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        // Move particle
        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;

        // Mouse repelling interaction
        const dx = mouseRef.current.x - p.x;
        const dy = mouseRef.current.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
          const force = (100 - dist) / 100;
          p.x -= (dx / dist) * force * 2;
          p.y -= (dy / dist) * force * 2;
        }

        // Wrap around screens
        if (p.y < -20) p.y = height + 20;
        if (p.y > height + 20) p.y = -20;
        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;

        // Render
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        if (p.type === 'heart') {
          drawHeart(ctx, p.size, p.color, p.opacity);
        } else if (p.type === 'sakura') {
          drawSakura(ctx, p.size, p.opacity);
        } else if (p.type === 'sparkle') {
          drawSparkle(ctx, p.size, p.color, p.opacity);
        } else {
          drawBubble(ctx, p.size, p.opacity);
        }

        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [settings.particle_intensity]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
    />
  );
};
