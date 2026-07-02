// ─────────────────────────────────────────────────────────────
// imageStore.js — stores binary image blobs in IndexedDB so
// they never touch localStorage (which has a ~5 MB limit).
//
// API:
//   saveImage(file | dataURL | blob)  → Promise<string>  (idb:// key)
//   getImageUrl(key)                  → Promise<string>  (object URL)
//   revokeImageUrl(objectUrl)         → void
//   isIdbKey(value)                   → boolean
// ─────────────────────────────────────────────────────────────

const DB_NAME    = 'heartlink_images';
const DB_VERSION = 1;
const STORE_NAME = 'blobs';

let _db = null;

function openDB() {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess  = (e) => { _db = e.target.result; resolve(_db); };
    req.onerror    = (e) => reject(e.target.error);
  });
}

/** Convert a dataURL string to a Blob */
function dataURLtoBlob(dataURL) {
  const [header, b64] = dataURL.split(',');
  const mime = header.match(/:(.*?);/)[1];
  const bin  = atob(b64);
  const arr  = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

/**
 * Save an image (File, Blob, or dataURL string) to IndexedDB.
 * Returns a stable `idb://KEY` reference string that is safe
 * to store in localStorage.
 */
export async function saveImage(input) {
  const db   = await openDB();
  const key  = `img_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const blob = input instanceof Blob ? input : dataURLtoBlob(input);

  await new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE_NAME, 'readwrite');
    const req = tx.objectStore(STORE_NAME).put(blob, key);
    req.onsuccess = resolve;
    req.onerror   = (e) => reject(e.target.error);
  });

  return `idb://${key}`;
}

// in-memory cache of object URLs so we don't create duplicates
const _urlCache = new Map();

/**
 * Resolve an `idb://KEY` reference to a usable object URL.
 * For plain URLs (http/https/data:) returns them as-is.
 */
export async function getImageUrl(value) {
  if (!value) return value;
  if (!value.startsWith('idb://')) return value;   // plain URL — pass through

  const key = value.slice(6);

  if (_urlCache.has(key)) return _urlCache.get(key);

  const db   = await openDB();
  const blob = await new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror   = (e) => reject(e.target.error);
  });

  if (!blob) return null;

  const url = URL.createObjectURL(blob);
  _urlCache.set(key, url);
  return url;
}

/** True if a value is an idb:// reference */
export function isIdbKey(value) {
  return typeof value === 'string' && value.startsWith('idb://');
}

/** Call when you no longer need an object URL (optional, browser GCs on unload) */
export function revokeImageUrl(objectUrl) {
  if (objectUrl?.startsWith('blob:')) URL.revokeObjectURL(objectUrl);
}

/**
 * Delete an image from IndexedDB by its idb:// key.
 */
export async function deleteImage(value) {
  if (!value?.startsWith('idb://')) return;
  const key = value.slice(6);
  _urlCache.delete(key);
  const db = await openDB();
  await new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE_NAME, 'readwrite');
    const req = tx.objectStore(STORE_NAME).delete(key);
    req.onsuccess = resolve;
    req.onerror   = (e) => reject(e.target.error);
  });
}
