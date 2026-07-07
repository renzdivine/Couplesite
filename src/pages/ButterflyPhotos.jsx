import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useCanvas } from '../context/CanvasContext';
import { EditableText } from '../components/EditableField';
import PositionDraggable from '../components/PositionDraggable';
import { saveImage }   from '../utils/imageStore';
import { useImageUrl } from '../utils/useImageUrl';
import '../styles/pages/ButterflyPhotos.css';


/* ─── FramedPhoto — drag to pan, ctrl+scroll/buttons to zoom, ✕ to remove ── */
function FramedPhoto({ src, alt, frame = 'rect', className = '', animClass = '', animDelay = 0,
                        isEditing = false, onReplace, onRemove,
                        photoData, onTransformChange }) {
  const frameRef    = useRef(null);
  const fileRef     = useRef(null);
  const imgRef      = useRef(null);
  const resolvedSrc = useImageUrl(src);
  const shapeClass  = { rect:'agv-fp--rect', square:'agv-fp--square', oval:'agv-fp--oval', heart:'agv-fp--heart' };

  // Canvas toolbar integration
  const { selected, select } = useCanvas();
  const uid = useRef(`fp-${Math.random().toString(36).slice(2, 9)}`).current;
  const isSelected = selected?.id === uid;

  // Freeze animation class/delay so it never changes after mount (editing mode has no anims)
  const frozenAnimClass = useRef(isEditing ? '' : animClass);
  const frozenAnimDelay = useRef(isEditing ? undefined : animDelay);

  // Transform state stored in refs for perf (no re-renders on every drag pixel)
  const savedX     = photoData?.translateX ?? 0;
  const savedY     = photoData?.translateY ?? 0;
  const savedScale = Math.max(0.5, Math.min(4, photoData?.scale ?? 1));

  const translateRef = useRef({ x: savedX, y: savedY });
  const scaleRef     = useRef(savedScale);
  const zoomValRef   = useRef(null);

  const dragging  = useRef(false);
  const dragStart = useRef({ mx: 0, my: 0, tx: 0, ty: 0 });

  // When src changes (new image uploaded), reset transform to defaults
  const prevSrc = useRef(src);
  if (src !== prevSrc.current) {
    prevSrc.current = src;
    translateRef.current = { x: savedX, y: savedY };
    scaleRef.current = savedScale;
  }

  // Apply CSS transform to the img element
  const applyTransform = useCallback(() => {
    if (!imgRef.current) return;
    const { x, y } = translateRef.current;
    imgRef.current.style.transform = `translate(${x}px, ${y}px) scale(${scaleRef.current})`;
    if (zoomValRef.current) {
      zoomValRef.current.textContent = `${Math.round(scaleRef.current * 100)}%`;
    }
  }, []);

  // Restore saved transform when Supabase data loads (uses primitive deps to
  // avoid fighting with live drags on every render)
  useEffect(() => {
    if (dragging.current) return;
    translateRef.current = { x: savedX, y: savedY };
    scaleRef.current = savedScale;
    applyTransform();
  }, [savedX, savedY, savedScale, applyTransform]);

  // Persist transform back to parent
  const saveTransform = useCallback(() => {
    onTransformChange?.({
      translateX: translateRef.current.x,
      translateY: translateRef.current.y,
      scale: scaleRef.current,
    });
  }, [onTransformChange]);

  // Mouse drag to pan — fires directly (overlay passes through when cursor is over the photo)
  const onMouseDown = useCallback((e) => {
    if (!isEditing || !resolvedSrc) return;
    e.preventDefault();
    e.stopPropagation(); // don't bubble to PD overlay — this is a photo pan, not a frame move
    dragging.current = true;
    if (imgRef.current) imgRef.current.style.cursor = 'grabbing';
    dragStart.current = {
      mx: e.clientX, my: e.clientY,
      tx: translateRef.current.x, ty: translateRef.current.y,
    };

    const onMove = (mv) => {
      if (!dragging.current) return;
      translateRef.current = {
        x: dragStart.current.tx + (mv.clientX - dragStart.current.mx),
        y: dragStart.current.ty + (mv.clientY - dragStart.current.my),
      };
      applyTransform();
    };

    const onUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      if (imgRef.current) imgRef.current.style.cursor = 'grab';
      saveTransform();
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [isEditing, resolvedSrc, applyTransform, saveTransform]);

  // Ctrl+scroll to zoom
  const onWheel = useCallback((e) => {
    if (!isEditing || !resolvedSrc) return;
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    e.stopPropagation();
    scaleRef.current = Math.max(0.5, Math.min(4, parseFloat((scaleRef.current - e.deltaY * 0.002).toFixed(3))));
    applyTransform();
    saveTransform();
  }, [isEditing, resolvedSrc, applyTransform, saveTransform]);

  // +/- button zoom
  const zoom = useCallback((delta) => {
    scaleRef.current = Math.max(0.5, Math.min(4, parseFloat((scaleRef.current + delta).toFixed(3))));
    applyTransform();
    saveTransform();
  }, [applyTransform, saveTransform]);

  const handleFile = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    e.target.value = '';
    const key = await saveImage(file);
    // Reset transform for new image
    translateRef.current = { x: 0, y: 0 };
    scaleRef.current = 1;
    onReplace?.(key);
  };

  const handleDrop = useCallback(async (e) => {
    if (!isEditing) return;
    e.preventDefault();
    e.stopPropagation();
    frameRef.current?.classList.remove('drag-over');
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const key = await saveImage(file);
    translateRef.current = { x: 0, y: 0 };
    scaleRef.current = 1;
    onReplace?.(key);
    applyTransform();
  }, [isEditing, onReplace, applyTransform]);

  const handleDragOver = useCallback((e) => {
    if (!isEditing) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  }, [isEditing]);

  const handleDragEnter = useCallback((e) => {
    if (!isEditing) return;
    e.preventDefault();
    e.stopPropagation();
    frameRef.current?.classList.add('drag-over');
  }, [isEditing]);

  const handleDragLeave = useCallback((e) => {
    if (!isEditing) return;
    // only remove if leaving the frame entirely (not entering a child)
    if (!frameRef.current?.contains(e.relatedTarget)) {
      frameRef.current?.classList.remove('drag-over');
    }
  }, [isEditing]);

  const handleDblClick = useCallback(() => {
    if (!isEditing) return;
    fileRef.current?.click();
  }, [isEditing]);
  const isDraggable = isEditing && !!resolvedSrc;

  // Empty frame: double-click opens picker (single click is handled by PositionDraggable wrapper for selection)
  const handleEmptyClick = useCallback((e) => {
    // Do nothing on single click — let PositionDraggable handle selection
  }, []);

  // Register with canvas toolbar when clicked — do NOT stopPropagation so
  // the event still reaches the PositionDraggable wrapper for frame selection/move.
  const handleSelectForToolbar = useCallback((e) => {
    if (!isEditing || !resolvedSrc) return;
    if (dragging.current) return;
    // Don't stopPropagation — let it bubble to PositionDraggable so the frame
    // can be selected and dragged. Just register the image with the canvas toolbar.
    select({
      id: uid,
      type: 'image',
      value: src,
      style: {},
      onUpdate: onReplace,
      onStyleChange: (newStyle) => {
        if (!imgRef.current) return;
        if (newStyle.filter  !== undefined) imgRef.current.style.filter  = newStyle.filter;
        if (newStyle.opacity !== undefined) imgRef.current.style.opacity = newStyle.opacity;
        if (newStyle.transform !== undefined) {
          imgRef.current.style.transform =
            `translate(${translateRef.current.x}px,${translateRef.current.y}px) scale(${scaleRef.current}) ${newStyle.transform}`;
        }
      },
      onAction: (action) => {
        if (action === 'replaceImage') fileRef.current?.click();
        if (action === 'delete') onRemove?.();
      },
      ref: frameRef,
    });
  }, [isEditing, resolvedSrc, src, onReplace, onRemove, select, uid]);

  return (
    <div
      ref={frameRef}
      className={`agv-fp ${shapeClass[frame]} ${className}${frozenAnimClass.current ? ` ${frozenAnimClass.current}` : ''}${isSelected ? ' agv-fp--selected' : ''}`}
      style={{
        position:'relative',
        animationDelay: frozenAnimDelay.current != null ? `${frozenAnimDelay.current}ms` : undefined,
        outline: isSelected ? '2px solid rgba(233,30,140,0.9)' : undefined,
        outlineOffset: isSelected ? 3 : undefined,
      }}
      onClick={isEditing ? (resolvedSrc ? handleSelectForToolbar : undefined) : undefined}
      onDoubleClick={isEditing ? handleDblClick : undefined}
      onDrop={isEditing ? handleDrop : undefined}
      onDragOver={isEditing ? handleDragOver : undefined}
      onDragEnter={isEditing ? handleDragEnter : undefined}
      onDragLeave={isEditing ? handleDragLeave : undefined}
      title={isEditing ? (resolvedSrc ? 'Click to select · drag to pan · scroll to zoom · double-click to replace' : 'Double-click to add photo, or drop an image here') : undefined}
    >
      {/* Photo + inner clip — pointerEvents handled per-child */}
      <div
        className="agv-fp-inner"
        onWheel={isDraggable ? onWheel : undefined}
      >
        {resolvedSrc
          ? <img
              ref={imgRef}
              className="agv-fp-photo"
              src={resolvedSrc}
              alt={alt}
              loading="lazy"
              decoding="async"
              draggable={false}
              style={{
                transform: `translate(${translateRef.current.x}px, ${translateRef.current.y}px) scale(${scaleRef.current})`,
                transformOrigin: 'center center',
                cursor: isDraggable ? 'grab' : undefined,
              }}
              onMouseDown={isDraggable ? onMouseDown : undefined}
              onLoad={applyTransform}
            />
          : (
            <div className={`agv-fp-photo agv-fp-placeholder${isEditing ? ' agv-fp-placeholder--editing' : ''}`}>
              {isEditing ? (
                <>
                  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
                    <circle cx="18" cy="18" r="17" fill="rgba(233,30,140,0.15)" stroke="rgba(233,30,140,0.7)" strokeWidth="1.8" strokeDasharray="4 3"/>
                    <line x1="18" y1="10" x2="18" y2="26" stroke="rgba(233,30,140,1)" strokeWidth="2.5" strokeLinecap="round"/>
                    <line x1="10" y1="18" x2="26" y2="18" stroke="rgba(233,30,140,1)" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                  <span style={{
                    fontSize:'0.6rem', fontFamily:'system-ui,sans-serif',
                    color:'rgba(233,30,140,0.9)', fontWeight:700, textAlign:'center',
                    lineHeight:1.3, textTransform:'uppercase', letterSpacing:'0.06em', marginTop:4
                  }}>Double-click to add</span>
                </>
              ) : (
                <svg width="28" height="24" viewBox="0 0 28 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M10 4L8 7H3a2 2 0 00-2 2v11a2 2 0 002 2h22a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-3H10z" stroke="rgba(120,85,95,0.55)" strokeWidth="1.4" fill="rgba(180,140,150,0.18)" strokeLinejoin="round"/>
                  <circle cx="14" cy="14" r="4" stroke="rgba(120,85,95,0.55)" strokeWidth="1.4" fill="none"/>
                  <circle cx="14" cy="14" r="1.5" fill="rgba(120,85,95,0.4)"/>
                </svg>
              )}
            </div>
          )
        }
      </div>

      {/* zoom controls — always in DOM when editing, visibility via CSS hover */}
      {isEditing && resolvedSrc && (
        <>
          <div className="agv-fp-zoom-btns"
            onClick={e => e.stopPropagation()}
            onDoubleClick={e => e.stopPropagation()}
          >
            <button className="agv-fp-zoom-btn" onMouseDown={e => { e.stopPropagation(); e.preventDefault(); zoom(0.1); }} onClick={e => e.stopPropagation()} aria-label="Zoom in" title="Zoom in">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </button>
            <span ref={zoomValRef} className="agv-fp-zoom-val">{Math.round(scaleRef.current * 100)}%</span>
            <button className="agv-fp-zoom-btn" onMouseDown={e => { e.stopPropagation(); e.preventDefault(); zoom(-0.1); }} onClick={e => e.stopPropagation()} aria-label="Zoom out" title="Zoom out">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="8" y1="11" x2="14" y2="11"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </button>
          </div>
          <div className="agv-fp-drag-hint" aria-hidden="true">
            {isSelected ? '✥ drag · ctrl+scroll · toolbar below to style' : '✥ drag · ctrl+scroll · dbl-click to replace'}
          </div>
        </>
      )}

      {isEditing && resolvedSrc && (
        <button
          className="agv-fp-remove-btn"
          onClick={e => { e.stopPropagation(); onRemove?.(); }}
          title="Remove photo"
          aria-label="Remove photo"
        >✕</button>
      )}

      {isEditing && (
        <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleFile}/>
      )}
    </div>
  );
}

function Flourish({ className }) {
  return (
    <svg className={className} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 4 Q4 40 40 40 Q4 40 4 76" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.6"/>
      <path d="M4 4 C14 4 20 10 20 20 C20 30 14 36 4 36" stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.5"/>
      <circle cx="4" cy="4" r="2" fill="currentColor" opacity="0.7"/>
    </svg>
  );
}
function CenterBar() {
  return (
    <div className="agv-centerbar">
      <span className="agv-bar-line"/><span className="agv-bar-diamond">◆</span><span className="agv-bar-line"/>
    </div>
  );
}

const FRAME_ANIMS = ['agv-anim-rise','agv-anim-drop','agv-anim-swing-l','agv-anim-swing-r','agv-anim-zoom-in','agv-anim-tilt-in','agv-anim-blur-in'];
const TEXT_ANIMS  = ['agv-anim-fade-up','agv-anim-fade-left','agv-anim-fade-right','agv-anim-letter-pop','agv-anim-float-in'];
const LAYOUTS     = ['hero','intro','timeline','dual','feature','bullets','tech','role','collection'];
function pickRandom(arr) { return arr[Math.floor(Math.random()*arr.length)]; }

/* ── FP — FramedPhoto in a PositionDraggable, defined OUTSIDE Slide
   so React never unmounts it on parent re-renders ───────────────── */
function FP({ idx, frame, animDelay=0, className='', layout, photos, frameAnim,
              isEditing, framePositions, onSaveFramePosition, onReplacePhoto, onSavePosition }) {
  const pg     = photos[idx] ?? { url: '', caption: '' };
  const posKey = `frame_${layout}_${idx}`;
  const pos    = framePositions?.[posKey] || { offsetX:0, offsetY:0, width:null, height:null, rotation:0 };
  return (
    <PositionDraggable
      id={`agv-${layout}-${idx}`}
      isEditing={isEditing}
      offsetX={pos.offsetX ?? 0}
      offsetY={pos.offsetY ?? 0}
      width={pos.width ?? null}
      height={pos.height ?? null}
      rotation={pos.rotation ?? 0}
      onPositionChange={(_, p) => onSaveFramePosition?.(posKey, p)}
      label="Move Frame"
    >
      <FramedPhoto
        src={pg.url} alt={pg.caption}
        frame={frame} animClass={frameAnim} animDelay={animDelay} className={className}
        photoData={pg}
        isEditing={isEditing}
        onReplace={url => onReplacePhoto?.(idx, url)}
        onRemove={() => onReplacePhoto?.(idx, '')}
        onTransformChange={transform => onSavePosition?.(idx, transform)}
      />
    </PositionDraggable>
  );
}

/* ── TP — text block in a PositionDraggable, defined OUTSIDE Slide ── */
function TP({ posKey, label='Move Text', style: tpStyle={}, children,
              layout, isEditing, framePositions, onSaveFramePosition }) {
  const pos = framePositions?.[posKey] || { offsetX:0, offsetY:0, width:null, height:null, rotation:0 };
  return (
    <PositionDraggable
      id={`agv-txt-${layout}-${posKey}`}
      isEditing={isEditing}
      offsetX={pos.offsetX ?? 0}
      offsetY={pos.offsetY ?? 0}
      width={pos.width ?? null}
      height={pos.height ?? null}
      rotation={pos.rotation ?? 0}
      onPositionChange={(_, p) => onSaveFramePosition?.(posKey, p)}
      label={label}
      style={tpStyle}
      className="pd-inline"
    >
      {children}
    </PositionDraggable>
  );
}


function Slide({ layout, photos, couple, frameAnim, textAnim, isEditing, onSaveText, onReplacePhoto, onSavePosition, framePositions, onSaveFramePosition }) {
  const pg  = (n) => photos[n] ?? photos[n % photos.length] ?? { url: '', caption: '' };
  const pc  = couple?.pageContent?.photos || {};
  const s   = (field, fallback) => pc[field] ?? fallback;

  // et() — renders EditableText directly (NOT as a component) to preserve focus/state
  const et = (field, fallback, as = 'span', className = '', extraStyle, multiline = false) => (
    <EditableText
      as={as}
      className={className}
      style={{ ...(extraStyle || {}), ...(pc[`style_${field}`] || {}) }}
      value={s(field, fallback)}
      isEditing={isEditing}
      multiline={multiline}
      onChange={v => onSaveText?.(field, v)}
      onStyleSave={st => onSaveText?.(`style_${field}`, st)}
    />
  );

  // Shared props passed to every FP and TP
  const fpProps = { layout, photos, frameAnim, isEditing, framePositions, onSaveFramePosition, onReplacePhoto, onSavePosition };
  const tpProps = { layout, isEditing, framePositions, onSaveFramePosition };
  if (layout === 'hero') return (
    <div className="agv-slide agv-slide--hero">
      <div className="agv-hw-spotlight" aria-hidden="true"/>
      <div className="agv-hw-wall">
        <div className="agv-hw-col agv-hw-col--left">
          <div className="agv-hw-sm-frame agv-hw-sm-frame--tl"><FP {...fpProps} idx={0} frame="square"/></div>
          <div className="agv-hw-sm-frame agv-hw-sm-frame--bl"><FP {...fpProps} idx={2} frame="rect" animDelay={120}/></div>
        </div>
        <div className="agv-hw-center-frame" style={{ position: 'relative' }}>
          <FP {...fpProps} idx={4} frame="square" animDelay={60}/>
          {/* Title overlay — positioned by CSS, TP allows free-moving in edit mode */}
          <div style={{ position: 'absolute', top: '14%', left: '13%', width: '74%', height: '72%', zIndex: 60, pointerEvents: 'none' }}>
            <div style={{ pointerEvents: 'auto', display: 'inline-block' }}>
              <TP {...tpProps} posKey="txt_hero_title" label="Move Title">
                <div className={`agv-hw-title-overlay ${textAnim}`} style={{ animationDelay: '200ms' }}>
                  {et('heroTitle1', 'Our',      'h1', 'agv-hw-title-script')}
                  {et('heroTitle2', 'MEMORIES', 'h1', 'agv-hw-title-caps')}
                </div>
              </TP>
            </div>
          </div>
        </div>
        <div className="agv-hw-col agv-hw-col--right">
          <div className="agv-hw-sm-frame agv-hw-sm-frame--tr"><FP {...fpProps} idx={1} frame="rect" animDelay={80}/></div>
          <div className="agv-hw-sm-frame agv-hw-sm-frame--br"><FP {...fpProps} idx={3} frame="square" animDelay={160}/></div>
        </div>
      </div>
    </div>
  );

  if (layout === 'intro') { const p1=pg(5); return (
    <div className="agv-slide agv-slide--intro">
      <div className="agv-intro-left">
        <TP {...tpProps} posKey="txt_intro_label1" label="Move Text">
          <div className={`agv-placard ${textAnim}`} style={{ animationDelay:'0ms' }}>
            {et('intro1label', 'OUR STORY', 'p', 'agv-meta')}
          </div>
        </TP>
        <div className="agv-intro-photo1">
          <FP {...fpProps} idx={5} frame="rect" animDelay={80}/>
          <TP {...tpProps} posKey="txt_intro_caption1" label="Move Caption">
            {et('intro1caption', p1.caption || 'Our first chapter', 'p', `agv-photo-label ${textAnim}`)}
          </TP>
        </div>
      </div>
      <div className="agv-intro-center">
        <TP {...tpProps} posKey="txt_intro_title" label="Move Title">
          {et('slide2title', 'A Story of Love', 'h2', `agv-serif-lg ${textAnim}`)}
        </TP>
        <div className="agv-intro-photo2">
          <FP {...fpProps} idx={6} frame="square" animDelay={120}/>
        </div>
      </div>
      <div className="agv-intro-right">
        <div className="agv-intro-photo3">
          <FP {...fpProps} idx={7} frame="oval" animDelay={160}/>
        </div>
        <TP {...tpProps} posKey="txt_intro_label2" label="Move Text">
          <div className={`agv-placard ${textAnim}`} style={{ marginTop:'12px', animationDelay:'240ms' }}>
            {et('intro2label', 'BEGINNING', 'p', 'agv-section-title')}
            {et('intro2body', couple?.tagline || 'Two hearts beating as one, every moment a treasure.', 'p', 'agv-body-text')}
          </div>
        </TP>
      </div>
    </div>
  );}

  if (layout === 'timeline') {
    const items = couple?.timeline?.slice(0,3)||[{title:'First Meeting',date:couple?.relationshipDate},{title:'First Adventure',date:''},{title:'Together Forever',date:''}];
    return (
    <div className="agv-slide agv-slide--timeline">
      <div className="agv-tl-left">
        <TP {...tpProps} posKey="txt_tl_title" label="Move Title">
          {et('slide3title', 'Moments in Time', 'h2', `agv-serif-lg ${textAnim}`)}
        </TP>
        <TP {...tpProps} posKey="txt_tl_tagline" label="Move Text">
          <div className={`agv-placard ${textAnim}`} style={{ animationDelay:'80ms' }}>
            {et('tagline', 'Every photo tells our story', 'p', 'agv-body-text')}
          </div>
        </TP>
      </div>
      <div className="agv-tl-center-photo">
        <FP {...fpProps} idx={8} frame="rect" animDelay={60}/>
      </div>
      <div className="agv-tl-right">
        {items.map((item,i)=>(
          <TP {...tpProps} key={i} posKey={`txt_tl_item_${i}`} label="Move Item">
            <div className={`agv-tl-item ${textAnim}`} style={{ animationDelay:`${100+i*80}ms` }}>
              {et(`tl_year_${i}`, item.date ? String(new Date(item.date).getFullYear()) : '—', 'p', 'agv-tl-year')}
              {et(`tl_name_${i}`, item.title?.toUpperCase() || 'MILESTONE', 'p', 'agv-tl-name')}
            </div>
          </TP>
        ))}
      </div>
    </div>
  );}

  if (layout === 'dual') { const p1=pg(9),p2=pg(10); return (
    <div className="agv-slide agv-slide--dual">
      <div className="agv-dual-left">
        <TP {...tpProps} posKey="txt_dual_title" label="Move Title">
          {et('slide4title', 'Our Favourite Moments', 'h2', `agv-serif-lg ${textAnim}`)}
        </TP>
        <div className="agv-dual-photo2">
          <FP {...fpProps} idx={10} frame="oval" animDelay={100}/>
        </div>
      </div>
      <div className="agv-dual-right">
        <div className="agv-dual-photo1">
          <FP {...fpProps} idx={9} frame="square" animDelay={40}/>
        </div>
        <div className="agv-dual-desc-row">
          <TP {...tpProps} posKey="txt_dual_desc1" label="Move Text">
            <div className={`agv-dual-desc ${textAnim}`} style={{ animationDelay:'160ms' }}>
              {et('dual1caption', p1.caption || 'TOGETHER ALWAYS', 'p', 'agv-section-title')}
              {et('dual1body', 'A memory we will always treasure together.', 'p', 'agv-body-text')}
            </div>
          </TP>
          <TP {...tpProps} posKey="txt_dual_desc2" label="Move Text">
            <div className={`agv-dual-desc agv-dual-desc--dark ${textAnim}`} style={{ animationDelay:'220ms' }}>
              {et('dual2caption', p2.caption || 'PURE HAPPINESS', 'p', 'agv-section-title')}
              {et('dual2body', 'Every smile captured, every laugh remembered.', 'p', 'agv-body-text')}
            </div>
          </TP>
        </div>
      </div>
    </div>
  );}

  if (layout === 'feature') { const p1=pg(11); return (
    <div className="agv-slide agv-slide--feature">
      <div className="agv-feat-left">
        <TP {...tpProps} posKey="txt_feat_label1" label="Move Text">
          <div className={`agv-placard ${textAnim}`}>
            {et('feat1label', 'TREASURED', 'p', 'agv-section-title')}
            {et('feat1body', 'Every moment framed forever.', 'p', 'agv-body-text')}
          </div>
        </TP>
        <div className="agv-feat-photo1">
          <FP {...fpProps} idx={11} frame="square" animDelay={80}/>
        </div>
        <TP {...tpProps} posKey="txt_feat_caption1" label="Move Caption">
          {et('feat1caption', p1.caption || 'A precious memory', 'p', `agv-photo-label ${textAnim}`)}
        </TP>
      </div>
      <div className="agv-feat-center-photo">
        <FP {...fpProps} idx={12} frame="rect" animDelay={40}/>
      </div>
      <div className="agv-feat-right">
        <TP {...tpProps} posKey="txt_feat_title" label="Move Title">
          {et('slide5title', 'Beautiful Together', 'h2', `agv-serif-lg ${textAnim}`)}
        </TP>
        <TP {...tpProps} posKey="txt_feat_body2" label="Move Text">
          <div className={`agv-placard ${textAnim}`} style={{ animationDelay:'140ms' }}>
            {et('feat2body', 'From every adventure to quiet evenings, these are the frames of our love story.', 'p', 'agv-body-text')}
          </div>
        </TP>
        <div className="agv-feat-photo2">
          <FP {...fpProps} idx={13} frame="heart" animDelay={200}/>
        </div>
      </div>
    </div>
  );}

  if (layout === 'bullets') { const moments=[pg(14),pg(15),pg(16)].map(p=>p?.caption).filter(Boolean); return (
    <div className="agv-slide agv-slide--bullets">
      <div className="agv-bul-left">
        <TP {...tpProps} posKey="txt_bul_title" label="Move Title">
          {et('slide6title', 'The Story of Us', 'h2', `agv-serif-lg ${textAnim}`)}
        </TP>
        <TP {...tpProps} posKey="txt_bul_label" label="Move Text">
          {et('bul1label', 'OUR HIGHLIGHTS', 'p', `agv-section-title ${textAnim}`)}
        </TP>
        <div className={`agv-bul-divider ${textAnim}`} style={{ animationDelay:'120ms' }}/>
        <ul className="agv-bul-list">
          {moments.map((m,i)=>(
            <li key={i} className={`agv-bul-item ${textAnim}`} style={{ animationDelay:`${160+i*70}ms` }}>
              <span className="agv-bul-dot"/><span>{m}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="agv-bul-photo">
        <FP {...fpProps} idx={14} frame="rect" animDelay={60}/>
      </div>
    </div>
  );}

  if (layout === 'tech') { return (
    <div className="agv-slide agv-slide--tech">
      <div className="agv-tech-left">
        <TP {...tpProps} posKey="txt_tech_left" label="Move Text">
          <div>
            {et('tech1label', 'OUR ADVENTURES', 'p', `agv-section-title ${textAnim}`)}
            {et('tech1body', 'Every trip, every outing — adventures that brought us closer every single day.', 'p', `agv-body-text ${textAnim}`)}
          </div>
        </TP>
      </div>
      <div className="agv-tech-center">
        <TP {...tpProps} posKey="txt_tech_title" label="Move Title">
          {et('slide7title', 'Adventures Together', 'h2', `agv-serif-lg ${textAnim}`)}
        </TP>
        <div className="agv-tech-photo">
          <FP {...fpProps} idx={15} frame="square" animDelay={100}/>
        </div>
      </div>
      <div className="agv-tech-right">
        <TP {...tpProps} posKey="txt_tech_right" label="Move Text">
          <div>
            {et('tech2label', 'OUR JOURNEY', 'p', `agv-section-title ${textAnim}`)}
            {et('tech2body', 'Hand in hand, we explore the world and find home in each other.', 'p', `agv-body-text ${textAnim}`)}
          </div>
        </TP>
      </div>
    </div>
  );}

  if (layout === 'role') { return (
    <div className="agv-slide agv-slide--role">
      <div className="agv-role-left">
        <TP {...tpProps} posKey="txt_role_label1" label="Move Text">
          {et('role1label', 'LOVE', 'p', `agv-section-title ${textAnim}`)}
        </TP>
        <TP {...tpProps} posKey="txt_role_body1" label="Move Text">
          <div className={`agv-placard ${textAnim}`} style={{ animationDelay:'60ms' }}>
            {et('role1body', "We don't just share moments; we build a life together.", 'p', 'agv-body-text')}
          </div>
        </TP>
        <TP {...tpProps} posKey="txt_role_label2" label="Move Text">
          {et('role2label', 'LAUGHTER', 'p', `agv-section-title ${textAnim}`)}
        </TP>
        <TP {...tpProps} posKey="txt_role_body2" label="Move Text">
          <div className={`agv-placard ${textAnim}`} style={{ animationDelay:'180ms' }}>
            {et('role2body', 'Every laugh echoes through all the years to come.', 'p', 'agv-body-text')}
          </div>
        </TP>
        <TP {...tpProps} posKey="txt_role_title" label="Move Title">
          {et('slide8title', 'The Role of Love', 'h2', `agv-serif-lg ${textAnim}`)}
        </TP>
      </div>
      <div className="agv-role-center-photo">
        <FP {...fpProps} idx={16} frame="rect" animDelay={40}/>
      </div>
      <div className="agv-role-right">
        <div className="agv-role-photo2">
          <FP {...fpProps} idx={17} frame="oval" animDelay={160}/>
        </div>
      </div>
    </div>
  );}

  return (
    <div className="agv-slide agv-slide--collection">
      <TP {...tpProps} posKey="txt_col_title" label="Move Title">
        <div className="agv-col-header">
          {et('slide9title', 'Our Memories Collection', 'h2', `agv-serif-lg ${textAnim}`)}
        </div>
      </TP>
      <div className="agv-col-strip">
        <div className="agv-col-photo"><FP {...fpProps} idx={18} frame="rect" animDelay={60}/></div>
        <div className="agv-col-photo"><FP {...fpProps} idx={19} frame="square" animDelay={140}/></div>
        <div className="agv-col-photo"><FP {...fpProps} idx={20} frame="rect" animDelay={220}/></div>
      </div>
    </div>
  );
}


export default function ButterflyPhotos({ isEditing = false, onContentChange }) {
  const navigate = useNavigate();
  const { getCoupleBySlug, coupleAuth, myCouple } = useApp();
  const couple = isEditing ? myCouple : getCoupleBySlug(coupleAuth?.slug);
  const FALLBACK = [
    
    { id:0,  url:'', caption:'' },
    { id:1,  url:'', caption:'' },
    { id:2,  url:'', caption:'' },
    { id:3,  url:'', caption:'' },
    { id:4,  url:'', caption:'' },
    
    { id:5,  url:'', caption:'' },
    { id:6,  url:'', caption:'' },
    { id:7,  url:'', caption:'' },
    
    { id:8,  url:'', caption:'' },
    
    { id:9,  url:'', caption:'' },
    { id:10, url:'', caption:'' },
    
    { id:11, url:'', caption:'' },
    { id:12, url:'', caption:'' },
    { id:13, url:'', caption:'' },
    
    { id:14, url:'', caption:'' },
    
    { id:15, url:'', caption:'' },
    
    { id:16, url:'', caption:'' },
    { id:17, url:'', caption:'' },
    
    { id:18, url:'', caption:'' },
    { id:19, url:'', caption:'' },
    { id:20, url:'', caption:'' },
  ];
  
  const photos = Array.from({ length: 21 }, (_, i) =>
    (couple?.photos?.[i]) ?? FALLBACK[i]
  );

  // Always-current ref so save callbacks never close over a stale photos array
  const photosRef = useRef(photos);
  photosRef.current = photos;

  const [current, setCurrent] = useState(0);
  const [anims, setAnims] = useState({ frame:'agv-anim-rise', text:'agv-anim-fade-up' });
  const total = LAYOUTS.length;

  const go = (fn) => { setAnims({ frame:pickRandom(FRAME_ANIMS), text:pickRandom(TEXT_ANIMS) }); setCurrent(fn); };
  const prev = () => go(i => (i-1+total)%total);
  const next = () => go(i => (i+1)%total);

  
  const handleSaveText = (field, val) => {
    const pc = couple?.pageContent?.photos || {};
    onContentChange?.('photos', { ...pc, [field]: val });
  };

  // Replace/remove a photo URL; reset transform for new uploads
  const handleReplacePhoto = (idx, key) => {
    const cur = photosRef.current;
    const updated = Array.from({ length: Math.max(cur.length, idx + 1) }, (_, i) => cur[i] ?? FALLBACK[i] ?? { id: Date.now() + i, url: '', caption: '' });
    if (key) {
      updated[idx] = { ...(updated[idx] || {}), url: key, translateX: 0, translateY: 0, scale: 1 };
    } else {
      updated[idx] = { ...(updated[idx] || {}), url: '' };
    }
    onContentChange?.('photosList', updated);
  };

  // Save photo transform (translateX, translateY, scale) back to couple data
  const handleSavePosition = (idx, transform) => {
    const cur = photosRef.current;
    const updated = Array.from({ length: Math.max(cur.length, idx + 1) }, (_, i) => cur[i] ?? FALLBACK[i] ?? { id: Date.now() + i, url: '', caption: '' });
    updated[idx] = { ...(updated[idx] || {}), ...transform };
    onContentChange?.('photosList', updated);
  };

  // Save free-move frame position to pageContent.photos
  const handleSaveFramePosition = (posKey, pos) => {
    const pc = couple?.pageContent?.photos || {};
    onContentChange?.('photos', { ...pc, [posKey]: pos });
  };

  const framePositions = couple?.pageContent?.photos || {};

  return (
    <div className="agv-root" role="main">
      <div className={`agv-stage${current === 0 ? ' is-hero' : ''}`}>
        <Flourish className="agv-flourish agv-flourish--tl"/>
        <Flourish className="agv-flourish agv-flourish--tr"/>
        <Flourish className="agv-flourish agv-flourish--bl"/>
        <Flourish className="agv-flourish agv-flourish--br"/>

        <div className="agv-topbar">
          <CenterBar/>
          <span className="agv-meta-tag agv-meta-tag--right">{current+1} / {total}</span>
        </div>

        <div className="agv-content" key={current}>
          <Slide
            layout={LAYOUTS[current]} photos={photos} couple={couple}
            frameAnim={anims.frame} textAnim={anims.text}
            isEditing={isEditing}
            onSaveText={handleSaveText}
            onReplacePhoto={handleReplacePhoto}
            onSavePosition={handleSavePosition}
            framePositions={framePositions}
            onSaveFramePosition={handleSaveFramePosition}
          />
        </div>

        <div className="agv-bottombar"><CenterBar/></div>

        <button className="agv-nav agv-nav--prev" onClick={prev} aria-label="Previous slide">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <button className="agv-nav agv-nav--next" onClick={next} aria-label="Next slide">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>

        <div className="agv-dots" role="tablist" aria-label="Slide navigation">
          {LAYOUTS.map((_,i) => (
            <button key={i} role="tab" aria-selected={i===current} aria-label={`Slide ${i+1}`}
              className={`agv-dot ${i===current?'agv-dot--active':''}`} onClick={()=>go(()=>i)}/>
          ))}
        </div>

        {!isEditing && (
          <button className="agv-back" onClick={()=>navigate(-1)} aria-label="Go back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Back
          </button>
        )}
      </div>
    </div>
  );
}
