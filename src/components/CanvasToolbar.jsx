/**
 * CanvasToolbar — Canva-style fixed bottom toolbar.
 *
 * Renders contextually based on the currently selected element type:
 *   • 'text'   → font, size, color, bold, italic, alignment, effects…
 *   • 'image'  → replace, crop, opacity, flip, border, shadow…
 *   • 'none'   → canvas controls (add element, zoom, undo, save…)
 *
 * All tools communicate changes through CanvasContext.applyChange /
 * applyValueChange, which calls the element's own onUpdate / onStyleChange
 * callback, keeping updates real-time.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useCanvas } from '../context/CanvasContext';
import {
  Type, Image as ImageIcon, Square, AlignLeft, AlignCenter, AlignRight,
  AlignJustify, Bold, Italic, Underline, Strikethrough,
  RotateCw, Copy, Lock, EyeOff, Trash2, Layers, ArrowUp,
  ArrowDown, Plus, Minus, FlipHorizontal, FlipVertical,
  Palette, ZoomIn, ZoomOut, ALargeSmall,
  Undo2, Redo2, Save, Eye, Grid, Crosshair, Sparkles,
} from 'lucide-react';
import './CanvasToolbar.css';

/* ─────────────────────────────────────────────────────────────────
   Small sub-components used by tool groups
───────────────────────────────────────────────────────────────── */

/** A single toolbar button */
function ToolBtn({ icon: Icon, label, onClick, active, danger, disabled, color }) {
  return (
    <button
      className={`ctb-btn${active ? ' ctb-btn--active' : ''}${danger ? ' ctb-btn--danger' : ''}${disabled ? ' ctb-btn--disabled' : ''}`}
      onClick={disabled ? undefined : onClick}
      title={label}
      aria-label={label}
      style={color ? { '--ctb-accent': color } : undefined}
    >
      <Icon size={15} />
      <span style={{ fontSize: '0.5rem', fontFamily: 'system-ui', fontWeight: 600, letterSpacing: '0.3px', textTransform: 'uppercase', lineHeight: 1 }}>{label}</span>
    </button>
  );
}

/** A divider between tool groups */
function ToolDivider() {
  return <div className="ctb-divider" aria-hidden="true" />;
}

/** A number stepper (value ± buttons + manual input) */
function NumericStepper({ label, value, min, max, step = 1, unit = '', onChange }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef(null);

  const commit = (raw) => {
    const n = parseFloat(raw);
    if (!isNaN(n)) onChange(Math.min(max ?? 9999, Math.max(min ?? 0, n)));
    setEditing(false);
  };

  return (
    <div className="ctb-stepper">
      <span className="ctb-stepper-label">{label}</span>
      <div className="ctb-stepper-row">
        <button className="ctb-stepper-btn" onClick={() => onChange(Math.max(min ?? 0, (value || 0) - step))} aria-label={`Decrease ${label}`}>
          <Minus size={10} />
        </button>
        {editing ? (
          <input
            ref={inputRef}
            className="ctb-stepper-input"
            defaultValue={draft}
            onBlur={e => commit(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') commit(e.target.value); if (e.key === 'Escape') setEditing(false); }}
            autoFocus
            style={{ width: 36, background: 'transparent', border: 'none', color: '#fff', fontSize: '0.68rem', textAlign: 'center', outline: 'none', fontFamily: 'system-ui' }}
          />
        ) : (
          <span
            className="ctb-stepper-val"
            onClick={() => { setDraft(String(value ?? '')); setEditing(true); }}
            title="Click to type a value"
          >
            {value ?? '—'}{unit}
          </span>
        )}
        <button className="ctb-stepper-btn" onClick={() => onChange(Math.min(max ?? 9999, (value || 0) + step))} aria-label={`Increase ${label}`}>
          <Plus size={10} />
        </button>
      </div>
    </div>
  );
}

/** A colour swatch picker */
function ColorPicker({ label, value, onChange }) {
  const inputRef = useRef(null);
  return (
    <div className="ctb-color-wrap" title={label}>
      <span className="ctb-color-label">{label}</span>
      <div
        className="ctb-color-swatch"
        style={{ background: value || 'transparent' }}
      >
        {!value && <span style={{ fontSize: '0.75rem', color: 'rgba(255,180,200,0.5)' }}>∅</span>}
        <input
          ref={inputRef}
          type="color"
          className="ctb-color-input"
          value={value || '#ffffff'}
          onChange={e => onChange(e.target.value)}
          aria-label={label}
        />
      </div>
    </div>
  );
}

/** Font-family selector */
const FONTS = [
  { label: 'System',     value: 'system-ui, sans-serif' },
  { label: 'Georgia',    value: 'Georgia, serif' },
  { label: 'Playfair',   value: "'Playfair Display', Georgia, serif" },
  { label: 'Cormorant',  value: "'Cormorant Garamond', Georgia, serif" },
  { label: 'Courier',    value: "'Courier New', monospace" },
  { label: 'Arial',      value: 'Arial, sans-serif' },
  { label: 'Trebuchet',  value: "'Trebuchet MS', sans-serif" },
];

function FontPicker({ value, onChange }) {
  const current = FONTS.find(f => f.value === value) || FONTS[0];
  return (
    <div className="ctb-font-wrap">
      <span className="ctb-font-label">Font</span>
      <select
        className="ctb-font-select"
        value={value || FONTS[0].value}
        onChange={e => onChange(e.target.value)}
        aria-label="Font family"
      >
        {FONTS.map(f => (
          <option key={f.value} value={f.value}>{f.label}</option>
        ))}
      </select>
    </div>
  );
}

/** A slider control */
function SliderControl({ label, value, min = 0, max = 100, step = 1, unit = '', onChange }) {
  const pct = max === min ? 0 : Math.round(((value ?? (max / 2)) - min) / (max - min) * 100);
  return (
    <div className="ctb-slider-wrap">
      <span className="ctb-stepper-label">{label}</span>
      <input
        type="range"
        className="ctb-slider"
        min={min} max={max} step={step}
        value={value ?? (max / 2)}
        style={{ '--pct': `${pct}%` }}
        onChange={e => onChange(parseFloat(e.target.value))}
        aria-label={label}
      />
      <span className="ctb-slider-val">{Math.round(value ?? (max / 2))}{unit}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Tool groups by element type
───────────────────────────────────────────────────────────────── */

function TextTools({ selected, applyChange, applyValueChange, onAction }) {
  const s = selected?.style || {};
  const fontSize = parseInt(s.fontSize) || 16;
  const opacity  = s.opacity !== undefined ? Math.round(parseFloat(s.opacity) * 100) : 100;
  const letterSpacing = parseFloat(s.letterSpacing) || 0;
  const lineHeight = parseFloat(s.lineHeight) || 1.5;

  const set = (prop, val) => applyChange({ [prop]: val });

  return (
    <>
      {/* Font */}
      <FontPicker value={s.fontFamily} onChange={v => set('fontFamily', v)} />
      <ToolDivider />

      {/* Size */}
      <NumericStepper
        label="Size"
        value={fontSize} min={6} max={200} step={1} unit="px"
        onChange={v => set('fontSize', `${v}px`)}
      />
    </>
  );
}

function ImageTools({ selected, applyChange, onAction }) {
  const s = selected?.style || {};
  const opacity    = s.opacity !== undefined ? Math.round(parseFloat(s.opacity) * 100) : 100;
  const brightness = s['--img-brightness'] !== undefined ? Math.round(s['--img-brightness'] * 100) : 100;
  const contrast   = s['--img-contrast']   !== undefined ? Math.round(s['--img-contrast']   * 100) : 100;
  const saturation = s['--img-saturation'] !== undefined ? Math.round(s['--img-saturation']  * 100) : 100;
  const blur       = parseFloat(s['--img-blur']) || 0;
  const borderRadius = parseFloat(s.borderRadius) || 0;
  const borderWidth  = parseFloat(s.borderWidth)  || 0;

  const set = (prop, val) => applyChange({ [prop]: val });

  const applyImageFilter = (br, co, sa, bl) => {
    const bVal = (br ?? brightness) / 100;
    const cVal = (co ?? contrast)   / 100;
    const sVal = (sa ?? saturation) / 100;
    const blVal = bl ?? blur;
    applyChange({
      '--img-brightness': bVal,
      '--img-contrast':   cVal,
      '--img-saturation': sVal,
      '--img-blur':       blVal,
      filter: `brightness(${bVal}) contrast(${cVal}) saturate(${sVal}) blur(${blVal}px)`,
    });
  };

  return (
    <>
      {/* Replace image */}
      <ToolBtn icon={ImageIcon} label="Replace" onClick={() => onAction('replaceImage')} />
      <ToolDivider />

      {/* Flip */}
      <ToolBtn icon={FlipHorizontal} label="Flip H" active={s.transform?.includes('scaleX(-1)')} onClick={() => {
        const cur = s.transform || '';
        const hasH = cur.includes('scaleX(-1)');
        const base = cur.replace('scaleX(-1)', '').trim();
        set('transform', hasH ? base : `${base} scaleX(-1)`.trim());
      }} />
      <ToolBtn icon={FlipVertical} label="Flip V" active={s.transform?.includes('scaleY(-1)')} onClick={() => {
        const cur = s.transform || '';
        const hasV = cur.includes('scaleY(-1)');
        const base = cur.replace('scaleY(-1)', '').trim();
        set('transform', hasV ? base : `${base} scaleY(-1)`.trim());
      }} />
      <ToolDivider />

      {/* Opacity */}
      <SliderControl label="Opacity" value={opacity} min={0} max={100} unit="%" onChange={v => set('opacity', v / 100)} />
      <ToolDivider />

      {/* Image adjustments */}
      <SliderControl label="Brightness" value={brightness} min={0} max={200} unit="%" onChange={v => applyImageFilter(v, undefined, undefined, undefined)} />
      <SliderControl label="Contrast"   value={contrast}   min={0} max={200} unit="%" onChange={v => applyImageFilter(undefined, v, undefined, undefined)} />
      <SliderControl label="Saturate"   value={saturation} min={0} max={200} unit="%" onChange={v => applyImageFilter(undefined, undefined, v, undefined)} />
      <SliderControl label="Blur"       value={blur}        min={0} max={20}  unit="px" step={0.5} onChange={v => applyImageFilter(undefined, undefined, undefined, v)} />
      <ToolDivider />

      {/* Border */}
      <NumericStepper label="Radius" value={borderRadius} min={0} max={999} step={2} unit="px" onChange={v => set('borderRadius', `${v}px`)} />
      <NumericStepper label="Border" value={borderWidth}  min={0} max={20}  step={1} unit="px" onChange={v => set('borderWidth', `${v}px`)} />
      <ColorPicker label="Border Color" value={s.borderColor} onChange={v => set('borderColor', v)} />
      <ToolDivider />

      {/* Shadow */}
      <ToolBtn icon={Layers} label="Shadow" active={!!(s.boxShadow && s.boxShadow !== 'none')} onClick={() => set('boxShadow', s.boxShadow && s.boxShadow !== 'none' ? 'none' : '0 8px 32px rgba(0,0,0,0.5)')} />
    </>
  );
}

function ShapeTools({ selected, applyChange, onAction }) {
  const s = selected?.style || {};
  const opacity     = s.opacity !== undefined ? Math.round(parseFloat(s.opacity) * 100) : 100;
  const borderRadius = parseFloat(s.borderRadius) || 0;
  const borderWidth  = parseFloat(s.borderWidth)  || 0;

  const set = (prop, val) => applyChange({ [prop]: val });

  return (
    <>
      <NumericStepper label="Width"   value={parseFloat(s.width)  || 200} min={10} max={2000} step={4} unit="px" onChange={v => set('width',  `${v}px`)} />
      <NumericStepper label="Height"  value={parseFloat(s.height) || 200} min={10} max={2000} step={4} unit="px" onChange={v => set('height', `${v}px`)} />
      <NumericStepper label="Radius"  value={borderRadius} min={0} max={999} step={2} unit="px" onChange={v => set('borderRadius', `${v}px`)} />
      <NumericStepper label="Border"  value={borderWidth}  min={0} max={20}  step={1} unit="px" onChange={v => set('borderWidth', `${v}px`)} />
      <ToolDivider />
      <ColorPicker label="Fill"         value={s.backgroundColor} onChange={v => set('backgroundColor', v)} />
      <ColorPicker label="Border Color" value={s.borderColor}     onChange={v => set('borderColor', v)} />
      <ToolDivider />
      <SliderControl label="Opacity" value={opacity} min={0} max={100} unit="%" onChange={v => set('opacity', v / 100)} />
      <ToolDivider />
      <ToolBtn icon={Sparkles} label="Shadow" active={!!(s.boxShadow && s.boxShadow !== 'none')} onClick={() => set('boxShadow', s.boxShadow && s.boxShadow !== 'none' ? 'none' : '0 8px 32px rgba(0,0,0,0.4)')} />
    </>
  );
}

function CanvasControls({ onAction, onZoom, zoom = 100 }) {
  return (
    <>
      {/* Add elements */}
      <ToolBtn icon={Type}      label="Text"   onClick={() => onAction('addText')} />
      <ToolBtn icon={ImageIcon} label="Image"  onClick={() => onAction('addImage')} />
      <ToolBtn icon={Square}    label="Shape"  onClick={() => onAction('addShape')} />
      <ToolDivider />

      {/* Canvas */}
      <ToolBtn icon={Grid}      label="Grid"   onClick={() => onAction('toggleGrid')} />
      <ToolBtn icon={Crosshair} label="Snap"   onClick={() => onAction('toggleSnap')} />
      <ToolDivider />

      {/* Zoom */}
      <ToolBtn icon={ZoomOut}   label="Zoom Out"  onClick={() => onZoom(-10)} />
      <span className="ctb-zoom-val">{zoom}%</span>
      <ToolBtn icon={ZoomIn}    label="Zoom In"   onClick={() => onZoom(+10)} />
      <ToolDivider />

      {/* History */}
      <ToolBtn icon={Undo2}     label="Undo"  onClick={() => onAction('undo')} />
      <ToolBtn icon={Redo2}     label="Redo"  onClick={() => onAction('redo')} />
      <ToolDivider />

      {/* Save / Preview */}
      <ToolBtn icon={Save}  label="Save"    onClick={() => onAction('save')} />
      <ToolBtn icon={Eye}   label="Preview" onClick={() => onAction('preview')} />
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────
   MAIN TOOLBAR COMPONENT — floating popup above selected element
───────────────────────────────────────────────────────────────── */

export default function CanvasToolbar({ isEditing = false, onAction }) {
  const { selected, applyChange, applyValueChange, deselect } = useCanvas();
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const popupRef = useRef(null);

  // Reposition popup above the selected element whenever selection changes
  useEffect(() => {
    if (!selected?.ref?.current) return;
    const update = () => {
      const rect = selected.ref.current.getBoundingClientRect();
      setPos({
        top:  Math.max(8, rect.top + window.scrollY - 56),
        left: Math.max(8, Math.min(rect.left + window.scrollX, window.innerWidth - 280)),
      });
    };
    update();
  }, [selected]);

  // Auto-dismiss when clicking outside both the popup and the selected element
  useEffect(() => {
    if (!selected) return;
    const onOutside = (e) => {
      const inPopup   = popupRef.current?.contains(e.target);
      const inElement = selected?.ref?.current?.contains(e.target);
      if (!inPopup && !inElement) {
        deselect();
      }
    };
    document.addEventListener('mousedown', onOutside, true);
    return () => document.removeEventListener('mousedown', onOutside, true);
  }, [selected, deselect]);

  if (!isEditing || !selected || selected.type === 'none' || selected.type === 'image') return null;

  const popup = (
    <div
      ref={popupRef}
      className="ctb-popup"
      role="toolbar"
      aria-label="Element toolbar"
      style={{ position: 'absolute', top: pos.top, left: pos.left, zIndex: 2147483640 }}
      onMouseDown={e => e.stopPropagation()}
    >
      {selected.type === 'text' && (
        <TextTools
          selected={selected}
          applyChange={applyChange}
          applyValueChange={applyValueChange}
          onAction={onAction}
        />
      )}
      <button
        className="ctb-popup-dismiss"
        onClick={deselect}
        title="Dismiss (Esc)"
        aria-label="Dismiss"
      >✕</button>
    </div>
  );

  return createPortal(popup, document.body);
}