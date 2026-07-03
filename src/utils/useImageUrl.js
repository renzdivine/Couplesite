import { useState, useEffect } from 'react';
import { getImageUrl } from './imageStore';

export function useImageUrl(value) {
  const [resolved, setResolved] = useState(() =>
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
