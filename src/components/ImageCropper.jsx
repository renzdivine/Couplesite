import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { saveImage } from '../utils/imageStore';
import './ImageCropper.css';


export default function ImageCropper({ src, aspect = 1, onConfirm, onCancel }) {
  const containerRef = useRef(null);
  const imgRef       = useRef(null);

  
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale,  setScale]  = useState(1);
  const [saving, setSaving] = useState(false);

  
  const [natural, setNatural] = useState({ w: 0, h: 0 });

  
  const drag = useRef({ active: false, startX: 0, startY: 0, ox: 0, oy: 0 });

  
  useEffect(() => {
    setOffset({ x: 0, y: 0 });
    setScale(1);
  }, [src]);

  const onImgLoad = (e) => {
    setNatural({ w: e.target.naturalWidth, h: e.target.naturalHeight });
  };

  
  const clamp = useCallback((ox, oy, sc) => {
    const el = containerRef.current;
    if (!el || !natural.w) return { x: ox, y: oy };

    const cw = el.clientWidth;
    const ch = el.clientHeight;  

    
    const iw = natural.w * sc;
    const ih = natural.h * sc;

    const maxX = Math.max(0, (iw - cw) / 2);
    const maxY = Math.max(0, (ih - ch) / 2);

    return {
      x: Math.min(maxX, Math.max(-maxX, ox)),
      y: Math.min(maxY, Math.max(-maxY, oy)),
    };
  }, [natural]);

  
  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { active: true, startX: e.clientX, startY: e.clientY, ox: offset.x, oy: offset.y };
  };
  const onPointerMove = (e) => {
    if (!drag.current.active) return;
    const dx = e.clientX - drag.current.startX;
    const dy = e.clientY - drag.current.startY;
    setOffset(clamp(drag.current.ox + dx, drag.current.oy + dy, scale));
  };
  const onPointerUp = () => { drag.current.active = false; };

  
  const onWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.08 : -0.08;
    setScale(prev => {
      const next = Math.min(4, Math.max(0.5, prev + delta));
      setOffset(o => clamp(o.x, o.y, next));
      return next;
    });
  };

  
  const touches = useRef({});
  const onTouchStart = (e) => {
    [...e.touches].forEach(t => { touches.current[t.identifier] = { x: t.clientX, y: t.clientY }; });
  };
  const onTouchMove = (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const [a, b] = [...e.touches];
      const prev = touches.current;
      if (!prev[a.identifier] || !prev[b.identifier]) return;
      const prevDist = Math.hypot(prev[a.identifier].x - prev[b.identifier].x, prev[a.identifier].y - prev[b.identifier].y);
      const currDist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      const ratio    = currDist / prevDist;
      setScale(s => {
        const next = Math.min(4, Math.max(0.5, s * ratio));
        setOffset(o => clamp(o.x, o.y, next));
        return next;
      });
    } else if (e.touches.length === 1) {
      const t = e.touches[0];
      const prev = touches.current[t.identifier];
      if (!prev) return;
      const dx = t.clientX - prev.x;
      const dy = t.clientY - prev.y;
      setOffset(o => clamp(o.x + dx, o.y + dy, scale));
    }
    [...e.touches].forEach(t => { touches.current[t.identifier] = { x: t.clientX, y: t.clientY }; });
  };

  
  const handleConfirm = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const el  = containerRef.current;
      const cw  = el.clientWidth;
      const ch  = el.clientHeight;
      const iw  = natural.w * scale;
      const ih  = natural.h * scale;

      
      const imgLeft = cw / 2 - iw / 2 + offset.x;
      const imgTop  = ch / 2 - ih / 2 + offset.y;

      
      const sx = (-imgLeft / iw)  * natural.w;
      const sy = (-imgTop  / ih)  * natural.h;
      const sw = (cw / iw) * natural.w;
      const sh = (ch / ih) * natural.h;

      
      const OUT = 800;
      const outH = Math.round(OUT / aspect);
      const canvas = document.createElement('canvas');
      canvas.width  = OUT;
      canvas.height = outH;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(imgRef.current, sx, sy, sw, sh, 0, 0, OUT, outH);

      const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.88));
      const key  = await saveImage(blob);
      onConfirm(key);
    } catch (err) {
      console.error('Crop save failed:', err);
      setSaving(false);
    }
  };

  return createPortal(
    <div className="ic-backdrop" onClick={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="ic-modal">

        <div className="ic-header">
          <span className="ic-header-title">Adjust Image</span>
          <span className="ic-header-sub">Drag to reposition · scroll to zoom</span>
        </div>

        {}
        <div
          ref={containerRef}
          className="ic-crop-window"
          style={{ aspectRatio: aspect }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          onWheel={onWheel}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
        >
          <img
            ref={imgRef}
            src={src}
            alt="crop"
            className="ic-img"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
              transformOrigin: 'center',
            }}
            onLoad={onImgLoad}
            draggable={false}
          />
          {}
          <div className="ic-border" />
          {}
          <div className="ic-grid">
            <div className="ic-grid-col"/><div className="ic-grid-col"/>
            <div className="ic-grid-row"/><div className="ic-grid-row"/>
          </div>
        </div>

        {}
        <div className="ic-zoom-row">
          <span className="ic-zoom-icon">🔍</span>
          <input
            type="range" min={50} max={400} step={1}
            value={Math.round(scale * 100)}
            onChange={e => {
              const next = Number(e.target.value) / 100;
              setScale(next);
              setOffset(o => clamp(o.x, o.y, next));
            }}
            className="ic-slider"
          />
          <span className="ic-zoom-pct">{Math.round(scale * 100)}%</span>
        </div>

        {}
        <div className="ic-actions">
          <button className="ic-btn ic-btn--cancel" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
          <button className="ic-btn ic-btn--confirm" onClick={handleConfirm} disabled={saving}>
            {saving ? 'Saving…' : '✓ Use this crop'}
          </button>
        </div>
      </div>
    </div>
  , document.body);
}
