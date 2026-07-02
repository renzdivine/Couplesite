import { useEffect, useRef } from 'react';

/**
 * Renders a GIF on a canvas and removes the specified background color.
 * Works by drawing each frame to canvas and replacing near-white pixels with transparent.
 */
export default function TransparentGif({ src, width = 90, height = 90, bgColor = [255, 255, 255], threshold = 40, style = {} }) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;

    const [r, g, b] = bgColor;

    const drawFrame = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      try {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          const dr = Math.abs(data[i] - r);
          const dg = Math.abs(data[i + 1] - g);
          const db = Math.abs(data[i + 2] - b);

          if (dr < threshold && dg < threshold && db < threshold) {
            data[i + 3] = 0; // make transparent
          }
        }

        ctx.putImageData(imageData, 0, 0);
      } catch {
        // cross-origin fallback — just show as-is
      }

      rafRef.current = requestAnimationFrame(drawFrame);
    };

    img.onload = () => {
      imgRef.current = img;
      drawFrame();
    };

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [src, width, height, bgColor, threshold]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ display: 'block', ...style }}
    />
  );
}
