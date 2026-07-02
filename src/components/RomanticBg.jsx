import { useEffect, useRef } from 'react';
import '../styles/components/RomanticBg.css';

// Draws animated floating hearts, petals, and sparkles on a canvas
// Props:
//   bg  - CSS background value (image url or gradient). Defaults to redbg.png.
export default function RomanticBg({ bg }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animId;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const COUNT    = 35;
    const particles = Array.from({ length: COUNT }, (_, i) => createParticle(i, canvas));

    function createParticle(i, canvas) {
      const types = ['heart', 'heart', 'petal', 'petal', 'sparkle', 'circle'];
      return {
        type:        types[Math.floor(Math.random() * types.length)],
        x:           Math.random() * canvas.width,
        y:           Math.random() * canvas.height + canvas.height,
        size:        Math.random() * 18 + 6,
        speedY:      Math.random() * 0.6 + 0.2,
        speedX:      (Math.random() - 0.5) * 0.4,
        opacity:     Math.random() * 0.5 + 0.2,
        rotation:    Math.random() * Math.PI * 2,
        rotSpeed:    (Math.random() - 0.5) * 0.02,
        hue:         Math.random() * 40 + 330,
        wobble:      Math.random() * Math.PI * 2,
        wobbleSpeed: Math.random() * 0.02 + 0.01,
      };
    }

    function drawHeart(ctx, x, y, size, rotation, color) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.beginPath();
      ctx.moveTo(0, -size * 0.35);
      ctx.bezierCurveTo( size * 0.5, -size * 0.9,  size * 1.1, size * 0.1, 0, size * 0.7);
      ctx.bezierCurveTo(-size * 1.1,  size * 0.1, -size * 0.5,-size * 0.9, 0,-size * 0.35);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.restore();
    }

    function drawPetal(ctx, x, y, size, rotation, color) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.beginPath();
      ctx.ellipse(0, 0, size * 0.4, size * 1.0, 0, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.restore();
    }

    function drawSparkle(ctx, x, y, size, color) {
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = color;
      for (let i = 0; i < 4; i++) {
        ctx.save();
        ctx.rotate((Math.PI / 2) * i);
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.lineTo(size * 0.2, -size * 0.2);
        ctx.lineTo(size, 0);
        ctx.lineTo(size * 0.2, size * 0.2);
        ctx.lineTo(0, size);
        ctx.lineTo(-size * 0.2, size * 0.2);
        ctx.lineTo(-size, 0);
        ctx.lineTo(-size * 0.2, -size * 0.2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    }

    function drawFlower(ctx, x, y, size, rotation, color) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      for (let i = 0; i < 5; i++) {
        ctx.save();
        ctx.rotate((Math.PI * 2 / 5) * i);
        ctx.beginPath();
        ctx.ellipse(0, -size * 0.6, size * 0.3, size * 0.6, 0, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.restore();
      }
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.25, 0, Math.PI * 2);
      ctx.fillStyle = 'hsla(50, 100%, 70%, 0.9)';
      ctx.fill();
      ctx.restore();
    }

    let lastTime = 0;
    function animate(now) {
      animId = requestAnimationFrame(animate);
      // Throttle to ~30fps — halves CPU/GPU draw calls
      if (now - lastTime < 32) return;
      lastTime = now;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.y       -= p.speedY;
        p.x       += p.speedX + Math.sin(p.wobble) * 0.3;
        p.wobble  += p.wobbleSpeed;
        p.rotation+= p.rotSpeed;

        if (p.y < -100) {
          p.y = canvas.height + 50;
          p.x = Math.random() * canvas.width;
        }

        const color     = `hsla(${p.hue}, 85%, 65%, ${p.opacity})`;
        const pinkColor = `hsla(${p.hue - 10}, 80%, 75%, ${p.opacity})`;

        ctx.globalAlpha = p.opacity;
        if      (p.type === 'heart')   drawHeart  (ctx, p.x, p.y, p.size, p.rotation, color);
        else if (p.type === 'petal')   drawPetal  (ctx, p.x, p.y, p.size, p.rotation, pinkColor);
        else if (p.type === 'sparkle') drawSparkle(ctx, p.x, p.y, p.size * 0.5, `hsla(50, 100%, 90%, ${p.opacity})`);
        else if (p.type === 'circle')  drawFlower (ctx, p.x, p.y, p.size * 0.8, p.rotation, pinkColor);
        ctx.globalAlpha = 1;
      });
    }
    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="rbg-root">
      <div className="rbg-image" style={bg ? { background: bg, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined} />
      <div className="rbg-orb-1" />
      <div className="rbg-orb-2" />
      <div className="rbg-orb-center" />
      <canvas ref={canvasRef} className="rbg-canvas" />
    </div>
  );
}
