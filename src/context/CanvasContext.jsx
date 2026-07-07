/**
 * CanvasContext — Global selection & element registry for the Canva-style editor.
 *
 * Any editable element registers itself here when clicked. The bottom toolbar
 * reads the selected element and renders the appropriate tools.
 *
 * Element types:
 *   'text'    — EditableText / headings / paragraphs
 *   'image'   — EditablePhoto / DraggablePhoto
 *   'none'    — nothing selected (canvas controls shown)
 */

import { createContext, useContext, useState, useCallback, useRef } from 'react';

const CanvasContext = createContext(null);

export function CanvasProvider({ children }) {
  // Currently selected element descriptor
  // { id, type, value, style, ref, onUpdate, onStyleChange, onAction }
  const [selected, setSelected] = useState(null);

  // Always-fresh reference to the selected element (avoids stale closure in callbacks)
  const selectedRef = useRef(null);
  selectedRef.current = selected;

  // Undo/redo history: array of { id, style } snapshots
  const history = useRef([]);
  const historyIdx = useRef(-1);
  const MAX_HISTORY = 50;

  const select = useCallback((descriptor) => {
    setSelected(descriptor);
  }, []);

  const deselect = useCallback(() => {
    setSelected(null);
  }, []);

  /**
   * applyChange — merge styleUpdate into selected element's live style.
   * Calls onStyleChange so the DOM element updates immediately.
   */
  const applyChange = useCallback((styleUpdate) => {
    const cur = selectedRef.current;
    if (!cur) return;

    const newStyle = { ...cur.style, ...styleUpdate };

    // Push undo snapshot before change
    const snapshot = { id: cur.id, style: cur.style };
    const sliced = history.current.slice(0, historyIdx.current + 1);
    sliced.push(snapshot);
    if (sliced.length > MAX_HISTORY) sliced.shift();
    history.current = sliced;
    historyIdx.current = sliced.length - 1;

    // Tell the element to apply the style immediately
    if (cur.onStyleChange) cur.onStyleChange(newStyle);

    // Update our own state so toolbar reflects the new values
    setSelected(prev => prev ? { ...prev, style: newStyle } : prev);
  }, []);

  /**
   * applyValueChange — update element text value or image src.
   */
  const applyValueChange = useCallback((value) => {
    const cur = selectedRef.current;
    if (!cur) return;
    if (cur.onUpdate) cur.onUpdate(value);
    setSelected(prev => prev ? { ...prev, value } : prev);
  }, []);

  const undo = useCallback(() => {
    if (historyIdx.current < 0) return;
    const snapshot = history.current[historyIdx.current];
    historyIdx.current -= 1;
    const cur = selectedRef.current;
    if (!cur || cur.id !== snapshot.id) return;
    if (cur.onStyleChange) cur.onStyleChange(snapshot.style);
    setSelected(prev => prev ? { ...prev, style: snapshot.style } : prev);
  }, []);

  const redo = useCallback(() => {
    if (historyIdx.current >= history.current.length - 1) return;
    historyIdx.current += 1;
    const snapshot = history.current[historyIdx.current];
    const cur = selectedRef.current;
    if (!cur || cur.id !== snapshot.id) return;
    if (cur.onStyleChange) cur.onStyleChange(snapshot.style);
    setSelected(prev => prev ? { ...prev, style: snapshot.style } : prev);
  }, []);

  return (
    <CanvasContext.Provider value={{
      selected,
      select,
      deselect,
      applyChange,
      applyValueChange,
      undo,
      redo,
    }}>
      {children}
    </CanvasContext.Provider>
  );
}

export const useCanvas = () => useContext(CanvasContext);
