/**
 * PositionDraggable — click-to-select, drag-move, resize, rotate
 *
 * Interaction model (editing mode only):
 *   • Click element   → select it (shows handles + toolbar)
 *   • Drag body       → move
 *   • Drag corner/edge handles → resize (pixel-accurate)
 *   • Drag ↻ rotation handle  → rotate freely
 *   • Click outside   → deselect
 *   • Double-click body → deselect + pass dblclick to children (add image)
 *   • Double-click rotation handle → reset everything
 *
 * Saved data: { offsetX, offsetY, width, height, rotation }
 */

import { useRef, useCallback, useEffect, useState } from 'react';
import './PositionDraggable.css';

const HANDLES = [
  { id: 'nw', cur: 'nwse-resize' },
  { id: 'n',  cur: 'ns-resize'   },
  { id: 'ne', cur: 'nesw-resize' },
  { id: 'e',  cur: 'ew-resize'   },
  { id: 'se', cur: 'nwse-resize' },
  { id: 's',  cur: 'ns-resize'   },
  { id: 'sw', cur: 'nesw-resize' },
  { id: 'w',  cur: 'ew-resize'   },
];

function getAngle(cx, cy, ex, ey) {
  return Math.atan2(ey - cy, ex - cx) * (180 / Math.PI);
}

export default function PositionDraggable({
  id,
  children,
  isEditing        = false,
  offsetX          = 0,
  offsetY          = 0,
  width            = null,
  height           = null,
  rotation         = 0,
  onPositionChange,
  label            = 'Element',
  style            = {},
  className        = '',
  disabled         = false,
}) {
  const wrapRef = useRef(null);
  const [selected, setSelected] = useState(false);

  // Live state in refs — zero re-renders during drag
  const lx  = useRef(offsetX);
  const ly  = useRef(offsetY);
  const lw  = useRef(width);
  const lh  = useRef(height);
  const lr  = useRef(rotation);

  const interacting = useRef(false);

  // Sync from parent (Supabase load) — skip if mid-interaction
  useEffect(() => {
    if (interacting.current) return;
    lx.current = offsetX;
    ly.current = offsetY;
    lw.current = width;
    lh.current = height;
    lr.current = rotation;
    applyDOM();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offsetX, offsetY, width, height, rotation]);

  // Write all values to DOM directly — no React setState
  const applyDOM = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    el.style.transform = `translate(${lx.current}px, ${ly.current}px) rotate(${lr.current}deg)`;
    if (lw.current != null) {
      el.style.width  = `${lw.current}px`;
      el.classList.add('pd-wrap--sized');
    } else {
      el.style.width  = '';
    }
    if (lh.current != null) {
      el.style.height = `${lh.current}px`;
      el.classList.add('pd-wrap--sized');
    } else {
      el.style.height = '';
    }
    if (lw.current == null && lh.current == null) {
      el.classList.remove('pd-wrap--sized');
    }
    // Update size label
    const lbl = el.querySelector('.pd-size-label');
    if (lbl && lw.current != null) {
      lbl.textContent = `${Math.round(lw.current)} × ${Math.round(lh.current ?? 0)}  ${Math.round(lr.current)}°`;
    }
  }, []);

  const persist = useCallback(() => {
    onPositionChange?.(id, {
      offsetX: lx.current,
      offsetY: ly.current,
      width:   lw.current,
      height:  lh.current,
      rotation: lr.current,
    });
  }, [id, onPositionChange]);

  // ── Get the cumulative CSS scale of an element's ancestors ─
  const getAncestorScale = useCallback((el) => {
    let scaleX = 1;
    let scaleY = 1;
    let node = el?.parentElement;
    while (node && node !== document.body) {
      const st = window.getComputedStyle(node);
      const transform = st.transform || st.webkitTransform;
      if (transform && transform !== 'none') {
        const mat = transform.match(/matrix(?:3d)?\(([^)]+)\)/);
        if (mat) {
          const vals = mat[1].split(',').map(Number);
          if (vals.length === 16) {
            // matrix3d — column-major layout:
            // col0 = [0,1,2,3], col1 = [4,5,6,7], col2 = [8,9,10,11], col3 = [12,13,14,15]
            // X basis = (m00, m10, m20), Y basis = (m01, m11, m21)
            scaleX *= Math.sqrt(vals[0] * vals[0] + vals[1] * vals[1] + vals[2] * vals[2]);
            scaleY *= Math.sqrt(vals[4] * vals[4] + vals[5] * vals[5] + vals[6] * vals[6]);
          } else {
            // matrix(a,b,c,d,e,f) — 2D
            const a = vals[0];
            const b = vals[1];
            const c = vals[2] ?? 0;
            const d = vals[3] ?? 1;
            scaleX *= Math.sqrt(a * a + b * b);
            scaleY *= Math.sqrt(c * c + d * d);
          }
        }
      }
      node = node.parentElement;
    }
    return { scaleX, scaleY };
  }, []);

  // ── SELECT on click ────────────────────────────────────────
  const handleWrapClick = useCallback((e) => {
    if (!isEditing || disabled) return;
    const isInteractive = e.target.closest(
      'input, textarea, button, select, .pd-toolbar, .ctb-root'
    );
    if (isInteractive) return;
    // If click hit a text element directly, don't intercept — let EditableText handle it
    if (e.target.closest('[data-et-wrap]')) return;
    // If already selected, let clicks pass through to children (photos, etc.)
    if (selected) return;
    e.stopPropagation();
    setSelected(true);
  }, [isEditing, disabled, selected]);

  // ── Double-click — pass through to text elements inside ───
  const handleWrapDblClick = useCallback((e) => {
    if (!isEditing || disabled) return;
    if (e.target.closest('[data-et-wrap]')) return; // let it bubble to EditableText
    e.stopPropagation();
  }, [isEditing, disabled]);

  // Deselect on outside click
  useEffect(() => {
    if (!selected) return;
    const onOutside = (e) => {
      // Ignore handle / toolbar presses — they manage their own drag lifecycle
      if (e.target.closest('.pd-drag-handle, .pd-resize-handle, .pd-rotate-handle, .pd-toolbar')) return;
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setSelected(false);
      }
    };
    const onEsc = (e) => { if (e.key === 'Escape') setSelected(false); };
    document.addEventListener('mousedown', onOutside, true);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onOutside, true);
      document.removeEventListener('keydown', onEsc);
    };
  }, [selected]);

  // ── MOVE drag — shared by drag handle + body overlay ───────
  const startMoveDrag = useCallback((e, { selectOnStart = false } = {}) => {
    if (!isEditing || disabled) return;
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    e.preventDefault();
    e.stopPropagation();

    const captureEl = e.currentTarget;
    captureEl.setPointerCapture(e.pointerId);

    const el = wrapRef.current;
    const { scaleX, scaleY } = getAncestorScale(el);
    const pointerId = e.pointerId;
    const startMx = e.clientX;
    const startMy = e.clientY;
    const startX = lx.current;
    const startY = ly.current;
    let moved = false;

    interacting.current = true;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'grabbing';

    // Defer selection so React 18's sync re-render doesn't cancel the active press
    if (selectOnStart && !selected) {
      queueMicrotask(() => setSelected(true));
    }

    const cleanup = () => {
      if (captureEl.hasPointerCapture?.(pointerId)) {
        captureEl.releasePointerCapture(pointerId);
      }
      captureEl.removeEventListener('pointermove', onMove);
      captureEl.removeEventListener('pointerup', onUp);
      captureEl.removeEventListener('pointercancel', onUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      el?.classList.remove('pd-wrap--dragging');
      interacting.current = false;
    };

    const onMove = (mv) => {
      if (mv.pointerId !== pointerId) return;
      const dx = mv.clientX - startMx;
      const dy = mv.clientY - startMy;
      if (!moved && Math.hypot(dx, dy) < 3) return;
      if (!moved) {
        moved = true;
        el?.classList.add('pd-wrap--dragging');
      }
      lx.current = startX + dx / scaleX;
      ly.current = startY + dy / scaleY;
      applyDOM();
    };

    const onUp = (up) => {
      if (up.pointerId !== pointerId) return;
      cleanup();
      if (moved) {
        persist();
      } else if (selectOnStart) {
        setSelected(true);
      }
    };

    captureEl.addEventListener('pointermove', onMove);
    captureEl.addEventListener('pointerup', onUp);
    captureEl.addEventListener('pointercancel', onUp);
  }, [isEditing, disabled, selected, applyDOM, persist, getAncestorScale]);

  // Touch move
  const onBodyTouchStart = useCallback((e) => {
    if (!isEditing || disabled || !selected) return;
    if (e.target.closest('[contenteditable], input, textarea, button, select, .pd-resize-handle, .pd-rotate-handle, .pd-toolbar')) return;
    e.stopPropagation();
    interacting.current = true;
    const t = e.touches[0];
    const startX = lx.current;
    const startY = ly.current;
    const startTx = t.clientX;
    const startTy = t.clientY;
    const { scaleX, scaleY } = getAncestorScale(wrapRef.current);
    document.body.style.userSelect = 'none';

    const onMove = (mv) => {
      const touch = mv.touches[0];
      lx.current = startX + (touch.clientX - startTx) / scaleX;
      ly.current = startY + (touch.clientY - startTy) / scaleY;
      applyDOM();
    };
    const onEnd = () => {
      interacting.current = false;
      document.body.style.userSelect = '';
      persist();
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('touchcancel', onEnd);
    };
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd);
    window.addEventListener('touchcancel', onEnd);
  }, [isEditing, disabled, selected, applyDOM, persist, getAncestorScale]);

  // ── RESIZE — pixel accurate, accounts for ancestor CSS scale ─
  const onResizeMouseDown = useCallback((e, handleId) => {
    if (!isEditing || disabled) return;
    e.preventDefault();
    e.stopPropagation();

    const el = wrapRef.current;
    const ow = lw.current ?? (el ? el.offsetWidth  : 200);
    const oh = lh.current ?? (el ? el.offsetHeight : 200);
    const ox = lx.current;
    const oy = ly.current;
    const startMx = e.clientX;
    const startMy = e.clientY;
    const { scaleX, scaleY } = getAncestorScale(el);
    let started = false;

    document.body.style.userSelect = 'none';

    const onMove = (mv) => {
      const dx = (mv.clientX - startMx) / scaleX;
      const dy = (mv.clientY - startMy) / scaleY;

      if (!started && Math.hypot(dx, dy) < 2) return;
      if (!started) {
        started = true;
        interacting.current = true;
        wrapRef.current?.classList.add('pd-wrap--resizing');
      }

      let newW = ow, newH = oh, newX = ox, newY = oy;
      if (handleId.includes('e')) newW = Math.max(40, ow + dx);
      if (handleId.includes('w')) { newW = Math.max(40, ow - dx); newX = ox + (ow - newW); }
      if (handleId.includes('s')) newH = Math.max(40, oh + dy);
      if (handleId.includes('n')) { newH = Math.max(40, oh - dy); newY = oy + (oh - newH); }

      lw.current = newW;
      lh.current = newH;
      lx.current = newX;
      ly.current = newY;
      applyDOM();
    };

    const onUp = () => {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      wrapRef.current?.classList.remove('pd-wrap--resizing');
      if (started) {
        interacting.current = false;
        persist();
      }
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [isEditing, disabled, applyDOM, persist, getAncestorScale]);

  // ── ROTATE — drag from the rotation handle ─────────────────
  const onRotateMouseDown = useCallback((e) => {
    if (!isEditing || disabled) return;
    e.preventDefault();
    e.stopPropagation();
    interacting.current = true;

    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width  / 2;
    const cy = rect.top  + rect.height / 2;
    // Starting angle between center and mouse, minus current rotation
    const startAngle = getAngle(cx, cy, e.clientX, e.clientY) - lr.current;

    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'crosshair';

    const onMove = (mv) => {
      const rawAngle = getAngle(cx, cy, mv.clientX, mv.clientY);
      let deg = rawAngle - startAngle;
      // Snap to 15° increments if Shift held
      if (mv.shiftKey) deg = Math.round(deg / 15) * 15;
      lr.current = deg;
      applyDOM();
    };

    const onUp = () => {
      interacting.current = false;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      persist();
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [isEditing, disabled, applyDOM, persist]);

  // ── Reset everything ───────────────────────────────────────
  const onReset = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    lx.current = 0; ly.current = 0;
    lw.current = null; lh.current = null;
    lr.current = 0;
    if (wrapRef.current) {
      wrapRef.current.style.width  = '';
      wrapRef.current.style.height = '';
    }
    applyDOM();
    onPositionChange?.(id, { offsetX:0, offsetY:0, width:null, height:null, rotation:0 });
    setSelected(false);
  }, [id, onPositionChange, applyDOM]);

  // ── Viewer ─────────────────────────────────────────────────
  if (!isEditing) {
    return (
      <div
        ref={wrapRef}
        className={`pd-wrap${width != null || height != null ? ' pd-wrap--sized' : ''} ${className}`}
        style={{
          display: 'block',
          transform: `translate(${offsetX}px, ${offsetY}px) rotate(${rotation}deg)`,
          ...(width  != null ? { width:  `${width}px`  } : {}),
          ...(height != null ? { height: `${height}px` } : {}),
          ...style,
        }}
      >
        {children}
      </div>
    );
  }

  // ── Editor ─────────────────────────────────────────────────
  const hasExplicitSize = width != null || height != null;
  
  return (
    <div
      ref={wrapRef}
      className={[
        'pd-wrap',
        'pd-wrap--editing',
        selected   ? 'pd-wrap--selected' : '',
        disabled   ? 'pd-wrap--locked'   : '',
        hasExplicitSize ? 'pd-wrap--sized' : '',
        className,
      ].filter(Boolean).join(' ')}
      style={{
        transform: `translate(${offsetX}px, ${offsetY}px) rotate(${rotation}deg)`,
        position: 'relative',
        cursor: selected ? 'move' : 'default',
        ...(width  != null ? { width:  `${width}px`  } : {}),
        ...(height != null ? { height: `${height}px` } : {}),
        ...style,
      }}
      onClick={handleWrapClick}
      onDoubleClick={handleWrapDblClick}
    >
      {children}

      {/* ── Handles + toolbar — always in DOM, shown via CSS when selected ── */}
      {!disabled && (
        <>
          {/* ── Dedicated drag-to-move handle — hold to move the frame ── */}
          <div
            className="pd-drag-handle"
            title="Hold to drag &amp; move"
            aria-label="Drag to move"
            onPointerDown={(e) => startMoveDrag(e, { selectOnStart: true })}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M12 3v18M3 12h18"/>
            </svg>
          </div>

          <div
            className="pd-move-overlay"
            onDoubleClick={(e) => {
              e.stopPropagation();
              // Pass dblclick through to photo placeholders etc.
              const els = document.elementsFromPoint(e.clientX, e.clientY);
              const fallbackEl = els.find(el => el !== e.currentTarget && wrapRef.current?.contains(el));
              if (fallbackEl) {
                setSelected(false);
                fallbackEl.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true, clientX: e.clientX, clientY: e.clientY }));
              }
            }}
            style={{ pointerEvents: 'none' }}
            aria-hidden="true"
          />

          {HANDLES.map(h => (
            <div
              key={h.id}
              className={`pd-resize-handle pd-rh-${h.id}`}
              style={{ cursor: h.cur, pointerEvents: selected ? 'all' : 'none' }}
              onMouseDown={e => { e.stopPropagation(); onResizeMouseDown(e, h.id); }}
              aria-label={`Resize ${h.id}`}
              role="button"
              tabIndex={-1}
            />
          ))}

          <div
            className="pd-rotate-handle"
            onMouseDown={e => { e.stopPropagation(); onRotateMouseDown(e); }}
            style={{ pointerEvents: selected ? 'all' : 'none' }}
            title="Drag to rotate  ·  Shift = snap 15°"
            aria-label="Rotate"
            role="button"
            tabIndex={-1}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 2v6h-6"/>
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8"/>
            </svg>
          </div>

          <div className="pd-toolbar" onMouseDown={e => e.stopPropagation()} style={{ pointerEvents: selected ? 'all' : 'none' }}>
            <span className="pd-toolbar-label">{label}</span>
            <span className="pd-toolbar-sep"/>
            <button
              className="pd-toolbar-btn"
              title="Reset position, size and rotation"
              onMouseDown={e => e.stopPropagation()}
              onClick={onReset}
            >↺ Reset</button>
            <button
              className="pd-toolbar-btn pd-toolbar-btn--close"
              title="Deselect (Esc)"
              onMouseDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); setSelected(false); }}
            >✕</button>
          </div>

          <div className="pd-size-label" aria-hidden="true"/>
        </>
      )}

      {/* Unselected hint badge */}
      {!disabled && (
        <div className="pd-select-hint" aria-hidden="true">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l-2.5 4h5L12 2zm0 20l2.5-4h-5L12 22zM2 12l4 2.5V9.5L2 12zm20 0l-4-2.5v5L22 12z"/><circle cx="12" cy="12" r="2.5"/></svg>
          Click to select
        </div>
      )}

      {disabled && (
        <div className="pd-locked-badge" title="Locked">🔒</div>
      )}
    </div>
  );
}
