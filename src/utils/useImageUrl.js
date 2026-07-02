// ─────────────────────────────────────────────────────────────
// useImageUrl.js — resolves idb:// keys to object URLs.
// Returns the raw value immediately for plain URLs.
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { getImageUrl } from './imageStore';

/**
 * @param {string | null | undefined} value  idb:// key or plain URL
 * @returns {string | null}  usable URL for an <img src>
 */
export function useImageUrl(value) {
  const [resolved, setResolved] = useState(() =>
    // plain URLs resolve synchronously
    value && !value.startsWith('idb://') ? value : null
  );

  useEffect(() => {
    if (!value) { setResolved(null); return; }
    if (!value.startsWith('idb://')) { setResolved(value); return; }

    let cancelled = false;
    getImageUrl(value).then(url => {
      if (!cancelled) setResolved(url);
    });
    return () => { cancelled = true; };
  }, [value]);

  return resolved;
}
