import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useImageUrl } from '../utils/useImageUrl';
import ImageCropper    from './ImageCropper';
import { useCanvas } from '../context/CanvasContext';

/* ─── WidthResizeHandle — portalled to body, positioned via getBoundingClientRect ─ */
function WidthResizeHandle({ targetRef, onWidthChange }) {
  const dragging   = useRef(false);
  const startX     = useRef(0);
  const startW     = useRef(0);
  const [pos, setPos] = useState({ top: 0, right: 0, height: 0 });

  // Re-measure position whenever the target element exists
  useEffect(() => {
    const measure = () => {
      if (!targetRef.current) return;
      const r = targetRef.current.getBoundingClientRect();
      setPos({ top: r.top + window.scrollY, right: window.innerWidth - r.right, height: r.height });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [targetRef]);

  const onMouseDown = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragging.current = true;
    startX.current = e.clientX;
    startW.current = targetRef.current ? targetRef.current.offsetWidth : 200;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'ew-resize';

    const onMove = (mv) => {
      if (!dragging.current) return;
      const newW = Math.max(60, startW.current + (mv.clientX - startX.current));
      if (targetRef.current) {
        targetRef.current.style.width = `${newW}px`;
        // Update handle position live
        const r = targetRef.current.getBoundingClientRect();
        setPos({ top: r.top + window.scrollY, right: window.innerWidth - r.right, height: r.height });
      }
    };
    const onUp = () => {
      dragging.current = false;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      const finalW = targetRef.current ? targetRef.current.offsetWidth : null;
      onWidthChange?.(finalW);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [targetRef, onWidthChange]);

  // Touch support
  const onTouchStart = useCallback((e) => {
    e.stopPropagation();
    const t = e.touches[0];
    dragging.current = true;
    startX.current = t.clientX;
    startW.current = targetRef.current ? targetRef.current.offsetWidth : 200;
    document.body.style.userSelect = 'none';

    const onMove = (mv) => {
      if (!dragging.current) return;
      const touch = mv.touches[0];
      const newW = Math.max(60, startW.current + (touch.clientX - startX.current));
      if (targetRef.current) targetRef.current.style.width = `${newW}px`;
    };
    const onEnd = () => {
      dragging.current = false;
      document.body.style.userSelect = '';
      const finalW = targetRef.current ? targetRef.current.offsetWidth : null;
      onWidthChange?.(finalW);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd);
  }, [targetRef, onWidthChange]);

  return createPortal(
    <div
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      title="Drag ← → to resize text width"
      aria-label="Resize text width"
      style={{
        position: 'absolute',
        top: pos.top,
        right: pos.right - 10,
        width: 10,
        height: Math.max(24, pos.height),
        background: 'rgba(233,30,140,0.8)',
        borderRadius: '0 4px 4px 0',
        cursor: 'ew-resize',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2147483646,
        userSelect: 'none',
        boxShadow: '2px 0 8px rgba(233,30,140,0.4)',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(233,30,140,1)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(233,30,140,0.8)'; }}
    >
      <svg width="4" height="16" viewBox="0 0 4 16" fill="rgba(255,255,255,0.9)" aria-hidden="true">
        <circle cx="2" cy="2.5"  r="1.3"/>
        <circle cx="2" cy="8"    r="1.3"/>
        <circle cx="2" cy="13.5" r="1.3"/>
      </svg>
    </div>,
    document.body
  );
}

export function EditableText({
  value,
  onChange,
  isEditing   = false,
  as: Tag     = 'span',
  style       = {},
  className   = '',
  multiline   = false,
  placeholder = 'Click to edit…',
  // Optional: save width when user resizes
  savedWidth  = null,
  onWidthChange,
  // Optional: called with the full style object whenever toolbar changes a style prop
  // Use this to persist style changes (e.g. font size) to your data layer.
  onStyleSave = null,
}) {
  const ref = useRef(null);
  const { selected, select, deselect } = useCanvas();

  // Stable ID for canvas tracking
  const uid = useRef(`et-${Math.random().toString(36).slice(2, 9)}`).current;
  const isSelected = selected?.id === uid;

  // Text edit mode — requires double-click to activate
  const [textEditActive, setTextEditActive] = useState(false);

  // Live style — toolbar updates this in real time
  const [liveStyle, setLiveStyle] = useState(style);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setLiveStyle(style); }, [JSON.stringify(style)]);

  // Self-contained width persistence — stored by uid in component state
  // Falls back to savedWidth prop if provided
  const [liveWidth, setLiveWidth] = useState(savedWidth);

  // Sync savedWidth prop → local state (e.g. Supabase load)
  useEffect(() => {
    if (savedWidth != null) setLiveWidth(savedWidth);
  }, [savedWidth]);

  // Apply width to DOM when it changes
  useEffect(() => {
    if (ref.current && liveWidth != null) {
      ref.current.style.width = `${liveWidth}px`;
    }
  }, [liveWidth]);

  const handleWidthChange = useCallback((newW) => {
    setLiveWidth(newW);
    onWidthChange?.(newW);
  }, [onWidthChange]);

  useEffect(() => {
    if (ref.current && isEditing && ref.current.innerText !== value) {
      ref.current.innerText = value;
    }
  }, [value, isEditing]);

  // When text edit mode deactivates, save value
  useEffect(() => {
    if (!textEditActive && ref.current) {
      const newVal = ref.current.innerText?.trim();
      if (newVal !== undefined && newVal !== value) onChange(newVal);
    }
  }, [textEditActive]); // eslint-disable-line

  // Deactivate text edit when canvas selection moves away from this element
  useEffect(() => {
    // Only deactivate if we were active AND canvas selected something else (not null)
    // Clicking outside to a different element: selected?.id is set but !== uid
    // We do NOT deactivate when selected becomes null (that's handled by onBlur)
    if (textEditActive && selected !== null && selected?.id !== uid) {
      setTextEditActive(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  // Single click directly on the text → register with toolbar AND activate editing
  const handleClick = useCallback((e) => {
    if (!isEditing) return;
    e.stopPropagation();
    // Activate text editing immediately on click
    setTextEditActive(true);
    select({
      id: uid,
      type: 'text',
      value,
      style: liveStyle,
      onUpdate: onChange,
      onStyleChange: (newStyle) => {
        setLiveStyle(newStyle);
        if (ref.current) Object.assign(ref.current.style, newStyle);
        // Persist the style change so it survives page refresh
        onStyleSave?.(newStyle);
      },
      ref,
    });
    // Place cursor at click position
    requestAnimationFrame(() => {
      if (!ref.current) return;
      ref.current.focus();
    });
  }, [isEditing, uid, value, liveStyle, onChange, onStyleSave, select]);

  // Double click — select all text
  const handleDblClick = useCallback((e) => {
    if (!isEditing) return;
    e.stopPropagation();
    setTextEditActive(true);
    requestAnimationFrame(() => {
      if (!ref.current) return;
      ref.current.focus();
      const range = document.createRange();
      range.selectNodeContents(ref.current);
      window.getSelection()?.removeAllRanges();
      window.getSelection()?.addRange(range);
    });
  }, [isEditing]);

  // Deselect on Escape — exit text edit first, then deselect
  useEffect(() => {
    if (!isSelected) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        if (textEditActive) {
          if (ref.current) ref.current.innerText = value;
          setTextEditActive(false);
        } else {
          deselect();
        }
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isSelected, textEditActive, value, deselect]);

  if (!isEditing) {
    return (
      <Tag
        className={className}
        style={{
          ...style,
          ...liveStyle,
          ...(liveWidth != null ? { width: `${liveWidth}px`, whiteSpace: 'pre-wrap', wordBreak: 'break-word' } : {}),
        }}
      >
        {value}
      </Tag>
    );
  }

  const mergedStyle = {
    ...style,
    ...liveStyle,
    outline: 'none',
    cursor: textEditActive ? 'text' : 'pointer',
    borderBottom: textEditActive
      ? '1.5px solid rgba(233,30,140,0.85)'
      : isSelected
        ? '1.5px dashed rgba(233,30,140,0.35)'
        : '1.5px dashed rgba(233,30,140,0.0)',
    minWidth: 20,
    display: Tag === 'span' ? 'inline-block' : undefined,
    boxShadow: textEditActive
      ? '0 0 0 2px rgba(233,30,140,0.45), 0 0 0 4px rgba(233,30,140,0.12)'
      : undefined,
    borderRadius: '3px',
    ...(liveWidth != null ? { width: `${liveWidth}px` } : {}),
    ...(liveWidth != null ? { whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'break-word' } : {}),
    // Allow text selection only when editing
    userSelect: textEditActive ? 'text' : 'none',
    WebkitUserSelect: textEditActive ? 'text' : 'none',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
    // Pointer events: always receive clicks (the PD overlay routes them here)
    pointerEvents: 'auto',
  };

  return (
    <>
      <Tag
        ref={ref}
        data-et-wrap="1"
        className={className}
        style={mergedStyle}
        contentEditable={textEditActive}
        suppressContentEditableWarning
        spellCheck={false}
        onClick={handleClick}
        onDoubleClick={handleDblClick}
        onFocus={e => {
          if (!textEditActive) {
            // Focus was triggered programmatically by the click handler — proceed
            setTextEditActive(true);
          }
        }}
        onBlur={e => {
          if (!textEditActive) return;
          const newVal = e.currentTarget.innerText.trim();
          // Don't save empty string — restore previous value instead
          if (newVal === '') {
            e.currentTarget.innerText = value;
          } else if (newVal !== value) {
            onChange(newVal);
          }
          setTextEditActive(false);
        }}
        onKeyDown={e => {
          if (!textEditActive) return;
          if (e.key === 'Enter' && !multiline) { e.preventDefault(); e.currentTarget.blur(); }
          if (e.key === 'Escape') { e.currentTarget.innerText = value || ''; e.currentTarget.blur(); }
        }}
        data-placeholder={placeholder}
        aria-label={`Edit: ${value || placeholder}`}
        title={textEditActive ? 'Editing — Esc to cancel · click outside to save' : 'Click to edit text'}
      >
        {value}
      </Tag>
      {/* Resize handle portalled to body — only shown when in text edit mode */}
      {textEditActive && isSelected && (
        <WidthResizeHandle
          targetRef={ref}
          onWidthChange={handleWidthChange}
        />
      )}
    </>
  );
}

export function EditablePhoto({
  src,
  alt       = '',
  onReplace,
  isEditing = false,
  aspect    = 1,
  className = '',
  style     = {},
  imgStyle  = {},
}) {
  const fileRef    = useRef(null);
  const wrapRef    = useRef(null);
  const resolvedSrc = useImageUrl(src);
  const [cropSrc, setCropSrc] = useState(null);
  const [liveStyle, setLiveStyle] = useState(style);

  const { selected, select, deselect } = useCanvas();
  const uid = useRef(`ep-${Math.random().toString(36).slice(2, 9)}`).current;
  const isSelected = selected?.id === uid;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setLiveStyle(style); }, [JSON.stringify(style)]);

  const handleSelect = useCallback((e) => {
    if (!isEditing) return;
    e.stopPropagation();
    select({
      id: uid,
      type: 'image',
      value: src,
      style: liveStyle,
      onUpdate: onReplace,
      onStyleChange: (newStyle) => {
        setLiveStyle(newStyle);
        if (wrapRef.current) {
          // Apply filter changes directly on the img element
          const img = wrapRef.current.querySelector('img');
          if (img) {
            if (newStyle.filter !== undefined) img.style.filter = newStyle.filter;
            if (newStyle.opacity !== undefined) img.style.opacity = newStyle.opacity;
            if (newStyle.borderRadius !== undefined) wrapRef.current.style.borderRadius = newStyle.borderRadius;
            if (newStyle.borderWidth !== undefined) {
              wrapRef.current.style.borderWidth = newStyle.borderWidth;
              wrapRef.current.style.borderStyle = 'solid';
            }
            if (newStyle.borderColor !== undefined) wrapRef.current.style.borderColor = newStyle.borderColor;
            if (newStyle.boxShadow !== undefined) wrapRef.current.style.boxShadow = newStyle.boxShadow;
            if (newStyle.transform !== undefined) img.style.transform = newStyle.transform;
          }
        }
      },
      onAction: (action) => {
        if (action === 'replaceImage') fileRef.current?.click();
      },
      ref: wrapRef,
    });
  }, [isEditing, uid, src, liveStyle, onReplace, select]);

  // Deselect on Escape
  useEffect(() => {
    if (!isSelected) return;
    const handleEsc = (e) => { if (e.key === 'Escape') deselect(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isSelected, deselect]);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCropSrc(url);
    e.target.value = '';
  };

  const handleConfirm = (key) => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    onReplace(key);
  };

  const handleCancel = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  };

  if (!isEditing) {
    if (resolvedSrc) return <img src={resolvedSrc} alt={alt} className={className} style={{ ...style, ...liveStyle, ...imgStyle }}/>;
    return <div className={className} style={{ background:'rgba(80,0,30,0.3)', ...style }}/>;
  }

  return (
    <>
      <div
        ref={wrapRef}
        className={`${className}${isSelected ? ' ep-selected' : ''}`}
        style={{
          position:'relative', cursor:'pointer',
          outline: isSelected ? '2px solid rgba(233,30,140,0.9)' : '2px solid transparent',
          outlineOffset: 3,
          borderRadius: liveStyle.borderRadius || 'inherit',
          transition: 'outline 0.12s',
          ...style,
          ...liveStyle,
        }}
        onClick={handleSelect}
        title="Click to select · use toolbar to edit"
        aria-label={`Image: ${alt || 'photo'}`}
      >
        {resolvedSrc
          ? <img
              src={resolvedSrc} alt={alt}
              style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', ...imgStyle }}
            />
          : <div style={{ width:'100%', height:'100%', background:'rgba(80,0,30,0.35)', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,150,180,0.4)', fontSize:'1.5rem' }}>📷</div>
        }
        {/* Hover overlay */}
        <div className="ep-hover-overlay" style={{
          position:'absolute', inset:0,
          background: isSelected ? 'rgba(233,30,140,0.12)' : 'rgba(233,30,140,0.0)',
          display:'flex', alignItems:'center', justifyContent:'center',
          transition:'background .18s', borderRadius:'inherit',
          pointerEvents: 'none',
        }}>
          {isSelected && (
            <span style={{ background:'rgba(0,0,0,0.7)', color:'#fff', fontSize:'0.72rem', padding:'4px 10px', borderRadius:20, fontFamily:'system-ui,sans-serif', pointerEvents:'none' }}>
              🖼 Use toolbar below to edit
            </span>
          )}
        </div>
        {/* Replace button — visible on hover */}
        {!isSelected && (
          <button
            className="ep-replace-btn"
            onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
            title="Replace image"
            aria-label="Replace image"
            style={{
              position:'absolute', bottom:6, right:6,
              background:'rgba(0,0,0,0.72)', border:'1px solid rgba(255,150,180,0.3)',
              color:'#fff', borderRadius:20, padding:'4px 10px',
              fontSize:'0.7rem', cursor:'pointer', fontFamily:'system-ui,sans-serif',
              opacity:0, transition:'opacity 0.15s',
            }}
          >
            📷 Replace
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleFile}/>
      </div>

      {cropSrc && (
        <ImageCropper
          src={cropSrc}
          aspect={aspect}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </>
  );
}
