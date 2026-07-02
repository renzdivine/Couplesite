// ─────────────────────────────────────────────────────────────
// EditableField.jsx
// EditableText  — inline contentEditable text node
// EditablePhoto — image with click-to-replace + crop modal
// ─────────────────────────────────────────────────────────────

import { useState, useRef, useEffect } from 'react';
import { useImageUrl } from '../utils/useImageUrl';
import ImageCropper    from './ImageCropper';

/* ══════════════════════════════════════════
   EditableText
══════════════════════════════════════════ */
export function EditableText({
  value,
  onChange,
  isEditing   = false,
  as: Tag     = 'span',
  style       = {},
  className   = '',
  multiline   = false,
  placeholder = 'Click to edit…',
}) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current && isEditing && ref.current.innerText !== value) {
      ref.current.innerText = value;
    }
  }, [value, isEditing]);

  if (!isEditing) {
    return <Tag className={className} style={style}>{value}</Tag>;
  }

  return (
    <Tag
      ref={ref}
      className={className}
      style={{
        ...style,
        outline: 'none',
        cursor: 'text',
        borderBottom: '1.5px dashed rgba(233,30,140,0.55)',
        minWidth: 20,
        display: Tag === 'span' ? 'inline-block' : undefined,
      }}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      onFocus={e => {
        const range = document.createRange();
        range.selectNodeContents(e.currentTarget);
        window.getSelection()?.removeAllRanges();
        window.getSelection()?.addRange(range);
      }}
      onBlur={e => onChange(e.currentTarget.innerText.trim())}
      onKeyDown={e => {
        if (e.key === 'Enter' && !multiline) { e.preventDefault(); e.currentTarget.blur(); }
        if (e.key === 'Escape') { e.currentTarget.innerText = value; e.currentTarget.blur(); }
      }}
      data-placeholder={placeholder}
    >
      {value}
    </Tag>
  );
}

/* ══════════════════════════════════════════
   EditablePhoto
   Opens ImageCropper after picking a file.
   onReplace receives an idb:// key.
══════════════════════════════════════════ */
export function EditablePhoto({
  src,
  alt       = '',
  onReplace,
  isEditing = false,
  aspect    = 1,       // crop aspect ratio
  className = '',
  style     = {},
  imgStyle  = {},
}) {
  const fileRef    = useRef(null);
  const resolvedSrc = useImageUrl(src);
  const [cropSrc, setCropSrc] = useState(null);  // raw object-URL while cropping

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Create a temporary object URL for the cropper (no base64, no IDB yet)
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
    if (resolvedSrc) return <img src={resolvedSrc} alt={alt} className={className} style={{ ...style, ...imgStyle }}/>;
    return <div className={className} style={{ background:'rgba(80,0,30,0.3)', ...style }}/>;
  }

  return (
    <>
      <div
        className={className}
        style={{ position:'relative', cursor:'pointer', ...style }}
        onClick={() => fileRef.current?.click()}
        title="Click to replace photo"
      >
        {resolvedSrc
          ? <img src={resolvedSrc} alt={alt} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', ...imgStyle }}/>
          : <div style={{ width:'100%', height:'100%', background:'rgba(80,0,30,0.35)', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,150,180,0.4)', fontSize:'1.5rem' }}>📷</div>
        }
        <div style={{
          position:'absolute', inset:0,
          background:'rgba(233,30,140,0.25)',
          display:'flex', alignItems:'center', justifyContent:'center',
          opacity:0, transition:'opacity .18s', borderRadius:'inherit',
        }} className="ep-hover-overlay">
          <span style={{ background:'rgba(0,0,0,0.7)', color:'#fff', fontSize:'0.72rem', padding:'4px 10px', borderRadius:20, fontFamily:'system-ui,sans-serif', pointerEvents:'none' }}>
            📷 Replace
          </span>
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleFile}/>
      </div>

      {/* Cropper modal — mounts over everything */}
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
