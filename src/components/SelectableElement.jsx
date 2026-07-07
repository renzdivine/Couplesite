/**
 * SelectableElement — Wraps any editable DOM element to make it
 * selectable in the Canva-style editor.
 *
 * When clicked (in editing mode), it registers itself with CanvasContext
 * so the bottom toolbar shows the appropriate tools.
 *
 * Usage:
 *   <SelectableElement
 *     id="cover-title"
 *     type="text"
 *     value={text}
 *     style={liveStyle}
 *     onUpdate={newVal => save(newVal)}
 *     onStyleChange={newStyle => applyStyle(newStyle)}
 *     isEditing={isEditing}
 *   >
 *     <h1 style={liveStyle}>{text}</h1>
 *   </SelectableElement>
 *
 * The `style` and `onStyleChange` props allow the toolbar to apply
 * real-time style changes directly to the element.
 */

import { useRef, useCallback, useEffect, useState } from 'react';
import { useCanvas } from '../context/CanvasContext';
import './SelectableElement.css';

export default function SelectableElement({
  id,
  type = 'text',      // 'text' | 'image' | 'shape'
  value,              // current text value or image src
  style: initialStyle = {},
  isEditing = false,
  onUpdate,           // (newValue) => void  — called when value changes
  onStyleChange,      // (newStyle)  => void  — called when toolbar changes a style prop
  onAction,           // (action)    => void  — called for delete/duplicate/lock etc.
  children,
  className = '',
  tag: Tag = 'div',   // wrapper element
  'aria-label': ariaLabel,
}) {
  const { selected, select, deselect } = useCanvas();
  const isSelected = selected?.id === id;
  const wrapRef = useRef(null);

  // Live style — starts from initialStyle, updated by toolbar in real-time
  const [liveStyle, setLiveStyle] = useState(initialStyle);

  // Keep liveStyle in sync if the parent updates initialStyle
  // (e.g. when re-fetching data from Supabase)
  useEffect(() => {
    setLiveStyle(initialStyle);
  }, [JSON.stringify(initialStyle)]); // eslint-disable-line

  const handleStyleChange = useCallback((newStyle) => {
    setLiveStyle(newStyle);
    onStyleChange?.(newStyle);
  }, [onStyleChange]);

  const handleClick = useCallback((e) => {
    if (!isEditing) return;
    e.stopPropagation();

    // Register with canvas context so toolbar knows what's selected
    select({
      id,
      type,
      value,
      style: liveStyle,
      onUpdate,
      onStyleChange: handleStyleChange,
      onAction,
      ref: wrapRef,
    });
  }, [isEditing, id, type, value, liveStyle, onUpdate, handleStyleChange, onAction, select]);

  // Deselect when clicking outside
  useEffect(() => {
    if (!isSelected) return;
    const handleOutside = (e) => {
      // Don't deselect if click is inside the toolbar
      if (e.target.closest('.ctb-root')) return;
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        deselect();
      }
    };
    const handleEsc = (e) => {
      if (e.key === 'Escape') deselect();
    };
    document.addEventListener('mousedown', handleOutside, true);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside, true);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isSelected, deselect]);

  if (!isEditing) {
    // In viewer mode, render children unwrapped
    return children;
  }

  return (
    <Tag
      ref={wrapRef}
      className={`se-wrap${isSelected ? ' se-wrap--selected' : ''} se-type-${type} ${className}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel || `Edit ${type}`}
      aria-pressed={isSelected}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(e); }}
      data-se-id={id}
      data-se-type={type}
    >
      {/* Selection handles overlay */}
      {isSelected && (
        <div className="se-selection-overlay" aria-hidden="true">
          <div className="se-handle se-handle-tl" />
          <div className="se-handle se-handle-tr" />
          <div className="se-handle se-handle-bl" />
          <div className="se-handle se-handle-br" />
          <div className="se-handle se-handle-tm" />
          <div className="se-handle se-handle-bm" />
          <div className="se-handle se-handle-ml" />
          <div className="se-handle se-handle-mr" />
          {/* Type badge */}
          <div className="se-badge">
            {type === 'text'  && 'T'}
            {type === 'image' && '🖼'}
            {type === 'shape' && '□'}
          </div>
        </div>
      )}

      {/* The actual element content, with live style potentially applied */}
      {typeof children === 'function'
        ? children(liveStyle, isSelected)
        : children
      }
    </Tag>
  );
}
