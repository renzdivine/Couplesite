import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { EditableText } from '../components/EditableField';
import { saveImage }   from '../utils/imageStore';
import { useImageUrl } from '../utils/useImageUrl';
import '../styles/pages/ButterflyPhotos.css';


function FramedPhoto({ src, alt, frame = 'rect', className = '', animClass = '', animDelay = 0,
                        isEditing = false, onReplace, onRemove,
                        objectPosition = '50% 50%', onPositionChange,
                        objectScale = 1, onScaleChange }) {
  const frameRef    = useRef(null);
  const fileRef     = useRef(null);
  const imgRef      = useRef(null);
  const resolvedSrc = useImageUrl(src);
  const shapeClass  = { rect:'agv-fp--rect', square:'agv-fp--square', oval:'agv-fp--oval', heart:'agv-fp--heart' };

  
  
  const frozenAnimClass = useRef(isEditing ? '' : animClass);
  const frozenAnimDelay = useRef(isEditing ? undefined : animDelay);

  
  const translateRef = useRef({ x: 0, y: 0 });  
  const scaleRef   = useRef(Math.max(0.5, Math.min(4, objectScale || 1)));
  const zoomValRef = useRef(null);

  const dragging  = useRef(false);
  const dragStart = useRef({ mx: 0, my: 0, tx: 0, ty: 0 });

  
  const prevSrc = useRef(src);
  if (src !== prevSrc.current) {
    prevSrc.current = src;
    translateRef.current = { x: 0, y: 0 };
    scaleRef.current = 1;
  }

  
  const applyTransform = useCallback(() => {
    if (!imgRef.current) return;
    const { x, y } = translateRef.current;
    imgRef.current.style.transform = `translate(${x}px, ${y}px) scale(${scaleRef.current})`;
    if (zoomValRef.current) {
      zoomValRef.current.textContent = `${Math.round(scaleRef.current * 100)}%`;
    }
  }, []);

  
  const onMouseDown = useCallback((e) => {
    if (!isEditing || !resolvedSrc) return;
    e.preventDefault();
    e.stopPropagation();
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
      onPositionChange?.(`${translateRef.current.x}px ${translateRef.current.y}px`);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [isEditing, resolvedSrc, applyTransform, onPositionChange]);

  
  const onWheel = useCallback((e) => {
    if (!isEditing || !resolvedSrc) return;
    if (!e.ctrlKey && !e.metaKey) return; 
    e.preventDefault();
    e.stopPropagation();
    const next = Math.max(0.5, Math.min(4, scaleRef.current - e.deltaY * 0.002));
    scaleRef.current = parseFloat(next.toFixed(3));
    applyTransform();
    onScaleChange?.(scaleRef.current);
  }, [isEditing, resolvedSrc, applyTransform, onScaleChange]);

  
  const zoom = useCallback((delta) => {
    const next = Math.max(0.5, Math.min(4, parseFloat((scaleRef.current + delta).toFixed(3))));
    scaleRef.current = next;
    applyTransform();
    onScaleChange?.(next);
  }, [applyTransform, onScaleChange]);

  const handleFile = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    e.target.value = '';
    const key = await saveImage(file);
    onReplace?.(key);
    translateRef.current = { x: 0, y: 0 };
    scaleRef.current = 1;
    applyTransform();
  };

  const handleDrop = useCallback(async (e) => {
    if (!isEditing) return;
    e.preventDefault();
    e.stopPropagation();
    frameRef.current?.classList.remove('drag-over');
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const key = await saveImage(file);
    onReplace?.(key);
    translateRef.current = { x: 0, y: 0 };
    scaleRef.current = 1;
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

  const handleClick    = isEditing && !resolvedSrc ? () => fileRef.current?.click() : undefined;
  const handleDblClick = isEditing && resolvedSrc  ? () => fileRef.current?.click() : undefined;
  const isDraggable    = isEditing && !!resolvedSrc;

  return (
    <div
      ref={frameRef}
      className={`agv-fp ${shapeClass[frame]} ${className}${frozenAnimClass.current ? ` ${frozenAnimClass.current}` : ''}`}
      style={{ position:'relative', animationDelay: frozenAnimDelay.current != null ? `${frozenAnimDelay.current}ms` : undefined }}
      onClick={handleClick}
      onDoubleClick={handleDblClick}
      onDrop={isEditing ? handleDrop : undefined}
      onDragOver={isEditing ? handleDragOver : undefined}
      onDragEnter={isEditing ? handleDragEnter : undefined}
      onDragLeave={isEditing ? handleDragLeave : undefined}
      title={isEditing ? (resolvedSrc ? 'Scroll to zoom · Drag to reposition · Double-click to change · Drop image to replace' : 'Click or drop an image to add photo') : undefined}
    >
      <div style={{ width: '100%', height: '100%', pointerEvents: 'none' }}>
        <div
          className="agv-fp-inner"
          onWheel={isDraggable ? onWheel : undefined}
          style={{ pointerEvents: 'auto' }}
        >
        {resolvedSrc
          ? <img
              ref={imgRef}
              className="agv-fp-photo"
              src={resolvedSrc}
              alt={alt}
              loading="lazy"
              decoding="async"
              style={{
                transform: `translate(0px, 0px) scale(${scaleRef.current})`,
                transformOrigin: 'center center',
                cursor: isDraggable ? 'grab' : undefined,
              }}
              onMouseDown={isDraggable ? onMouseDown : undefined}
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
                  <span style={{ fontSize:'0.6rem', fontFamily:'system-ui,sans-serif', color:'rgba(233,30,140,0.9)', fontWeight:700, textAlign:'center', lineHeight:1.3, textTransform:'uppercase', letterSpacing:'0.06em', marginTop:4 }}>Click or drop image</span>
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
      </div>{}
      </div>{}

      {}
      {isDraggable && (
        <>
          <div className="agv-fp-zoom-btns" onClick={e => e.stopPropagation()}>
            <button className="agv-fp-zoom-btn" onMouseDown={e => { e.stopPropagation(); e.preventDefault(); zoom(0.1); }} aria-label="Zoom in">＋</button>
            <span ref={zoomValRef} className="agv-fp-zoom-val">{Math.round(scaleRef.current * 100)}%</span>
            <button className="agv-fp-zoom-btn" onMouseDown={e => { e.stopPropagation(); e.preventDefault(); zoom(-0.1); }} aria-label="Zoom out">－</button>
          </div>
          <div className="agv-fp-drag-hint" aria-hidden="true">✥ drag · ctrl+scroll to zoom · dbl-click to replace</div>
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


function Slide({ layout, photos, couple, frameAnim, textAnim, isEditing, onSaveText, onReplacePhoto, onSavePosition }) {
  
  
  
  const pg   = (n) => photos[n] ?? photos[n % photos.length] ?? { url: '', caption: '' };
  const pc   = couple?.pageContent?.photos || {};
  const s    = (field, fallback) => pc[field] ?? fallback;
  const ET   = ({ field, fallback, as='span', className='', multiline=false, style }) => (
    <EditableText as={as} className={className} style={style}
      value={s(field, fallback)} isEditing={isEditing}
      onChange={v => onSaveText?.(field, v)}/>
  );
  const FRAME_ASPECT = { rect: 3/4, square: 1, oval: 1, heart: 1 };
  const FP   = ({ idx, frame, animDelay=0, className='' }) => (
    <FramedPhoto src={pg(idx).url} alt={pg(idx).caption}
      frame={frame} animClass={frameAnim} animDelay={animDelay} className={className}
      objectPosition={pg(idx).objectPosition || '50% 50%'}
      objectScale={pg(idx).objectScale || 1}
      isEditing={isEditing}
      onReplace={url => onReplacePhoto?.(idx, url)}
      onRemove={() => onReplacePhoto?.(idx, '')}
      onPositionChange={pos => onSavePosition?.(idx, { pos })}
      onScaleChange={scale => onSavePosition?.(idx, { scale })}
    />
  );

  
  if (layout === 'hero') return (
    <div className="agv-slide agv-slide--hero">
      <div className="agv-hw-spotlight" aria-hidden="true"/>
      <div className="agv-hw-wall">
        <div className="agv-hw-col agv-hw-col--left">
          <div className="agv-hw-sm-frame agv-hw-sm-frame--tl"><FP idx={0} frame="square"/></div>
          <div className="agv-hw-sm-frame agv-hw-sm-frame--bl"><FP idx={2} frame="rect" animDelay={120}/></div>
        </div>
        <div className="agv-hw-center-frame">
          <FP idx={4} frame="square" animDelay={60}/>
          <div className={`agv-hw-title-overlay ${textAnim}`} style={{ animationDelay:'200ms' }}>
            <ET field="heroTitle1" fallback="Our" as="h1" className="agv-hw-title-script" style={{ pointerEvents:'auto' }}/>
            <ET field="heroTitle2" fallback="MEMORIES" as="h1" className="agv-hw-title-caps" style={{ pointerEvents:'auto' }}/>
          </div>
        </div>
        <div className="agv-hw-col agv-hw-col--right">
          <div className="agv-hw-sm-frame agv-hw-sm-frame--tr"><FP idx={1} frame="rect" animDelay={80}/></div>
          <div className="agv-hw-sm-frame agv-hw-sm-frame--br"><FP idx={3} frame="square" animDelay={160}/></div>
        </div>
      </div>
    </div>
  );

  
  if (layout === 'intro') { const p1=pg(5),p2=pg(6),p3=pg(7); return (
    <div className="agv-slide agv-slide--intro">
      <div className="agv-intro-left">
        <div className={`agv-placard ${textAnim}`} style={{ animationDelay:'0ms' }}>
          <p className="agv-meta">OUR STORY</p>
        </div>
        <div className="agv-intro-photo1">
          <FP idx={5} frame="rect" animDelay={80}/>
          <p className={`agv-photo-label ${textAnim}`} style={{ animationDelay:'180ms' }}>{p1.caption}</p>
        </div>
      </div>
      <div className="agv-intro-center">
        <ET field="slide2title" fallback="A Story of Love" as="h2" className={`agv-serif-lg ${textAnim}`}/>
        <div className="agv-intro-photo2">
          <FP idx={6} frame="square" animDelay={120}/>
        </div>
      </div>
      <div className="agv-intro-right">
        <div className="agv-intro-photo3">
          <FP idx={7} frame="oval" animDelay={160}/>
        </div>
        <div className={`agv-placard ${textAnim}`} style={{ marginTop:'12px', animationDelay:'240ms' }}>
          <p className="agv-section-title">BEGINNING</p>
          <p className="agv-body-text">{couple?.tagline || 'Two hearts beating as one, every moment a treasure.'}</p>
        </div>
      </div>
    </div>
  );}

  
  if (layout === 'timeline') {
    const items = couple?.timeline?.slice(0,3)||[{title:'First Meeting',date:couple?.relationshipDate},{title:'First Adventure',date:''},{title:'Together Forever',date:''}];
    return (
    <div className="agv-slide agv-slide--timeline">
      <div className="agv-tl-left">
        <ET field="slide3title" fallback="Moments in Time" as="h2" className={`agv-serif-lg ${textAnim}`}/>
        <div className={`agv-placard ${textAnim}`} style={{ animationDelay:'80ms' }}>
          <ET field="tagline" fallback="Every photo tells our story" as="p" className="agv-body-text"/>
        </div>
      </div>
      <div className="agv-tl-center-photo">
        <FP idx={8} frame="rect" animDelay={60}/>
      </div>
      <div className="agv-tl-right">
        {items.map((item,i)=>(
          <div className={`agv-tl-item ${textAnim}`} key={i} style={{ animationDelay:`${100+i*80}ms` }}>
            <p className="agv-tl-year">{item.date?new Date(item.date).getFullYear():'—'}</p>
            <p className="agv-tl-name">{item.title?.toUpperCase()}</p>
          </div>
        ))}
      </div>
    </div>
  );}

  
  if (layout === 'dual') { const p1=pg(9),p2=pg(10); return (
    <div className="agv-slide agv-slide--dual">
      <div className="agv-dual-left">
        <ET field="slide4title" fallback="Our Favourite Moments" as="h2" className={`agv-serif-lg ${textAnim}`}/>
        <div className="agv-dual-photo2">
          <FP idx={10} frame="oval" animDelay={100}/>
        </div>
      </div>
      <div className="agv-dual-right">
        <div className="agv-dual-photo1">
          <FP idx={9} frame="square" animDelay={40}/>
        </div>
        <div className="agv-dual-desc-row">
          <div className={`agv-dual-desc ${textAnim}`} style={{ animationDelay:'160ms' }}>
            <ET field="dual1caption" fallback={p1.caption || 'TOGETHER ALWAYS'} as="p" className="agv-section-title"/>
            <ET field="dual1body" fallback="A memory we will always treasure together." as="p" className="agv-body-text"/>
          </div>
          <div className={`agv-dual-desc agv-dual-desc--dark ${textAnim}`} style={{ animationDelay:'220ms' }}>
            <ET field="dual2caption" fallback={p2.caption || 'PURE HAPPINESS'} as="p" className="agv-section-title"/>
            <ET field="dual2body" fallback="Every smile captured, every laugh remembered." as="p" className="agv-body-text"/>
          </div>
        </div>
      </div>
    </div>
  );}

  
  if (layout === 'feature') { const p1=pg(11); return (
    <div className="agv-slide agv-slide--feature">
      <div className="agv-feat-left">
        <div className={`agv-placard ${textAnim}`}>
          <ET field="feat1label" fallback="TREASURED" as="p" className="agv-section-title"/>
          <ET field="feat1body" fallback="Every moment framed forever." as="p" className="agv-body-text"/>
        </div>
        <div className="agv-feat-photo1">
          <FP idx={11} frame="square" animDelay={80}/>
        </div>
        <p className={`agv-photo-label ${textAnim}`} style={{ animationDelay:'180ms' }}>{p1.caption}</p>
      </div>
      <div className="agv-feat-center-photo">
        <FP idx={12} frame="rect" animDelay={40}/>
      </div>
      <div className="agv-feat-right">
        <ET field="slide5title" fallback="Beautiful Together" as="h2" className={`agv-serif-lg ${textAnim}`}/>
        <div className={`agv-placard ${textAnim}`} style={{ animationDelay:'140ms' }}>
          <ET field="feat2body" fallback="From every adventure to quiet evenings, these are the frames of our love story." as="p" className="agv-body-text"/>
        </div>
        <div className="agv-feat-photo2">
          <FP idx={13} frame="heart" animDelay={200}/>
        </div>
      </div>
    </div>
  );}

  
  if (layout === 'bullets') { const moments=[pg(14),pg(15),pg(16)].map(p=>p?.caption).filter(Boolean); return (
    <div className="agv-slide agv-slide--bullets">
      <div className="agv-bul-left">
        <ET field="slide6title" fallback="The Story of Us" as="h2" className={`agv-serif-lg ${textAnim}`}/>
        <p className={`agv-section-title ${textAnim}`} style={{ marginTop:'24px', animationDelay:'80ms' }}>OUR HIGHLIGHTS</p>
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
        <FP idx={14} frame="rect" animDelay={60}/>
      </div>
    </div>
  );}

  
  if (layout === 'tech') { return (
    <div className="agv-slide agv-slide--tech">
      <div className="agv-tech-left">
        <ET field="tech1label" fallback="OUR ADVENTURES" as="p" className={`agv-section-title ${textAnim}`}/>
        <ET field="tech1body" fallback="Every trip, every outing — adventures that brought us closer every single day." as="p" className={`agv-body-text ${textAnim}`} style={{ animationDelay:'80ms' }}/>
      </div>
      <div className="agv-tech-center">
        <ET field="slide7title" fallback="Adventures Together" as="h2" className={`agv-serif-lg ${textAnim}`}/>
        <div className="agv-tech-photo">
          <FP idx={15} frame="square" animDelay={100}/>
        </div>
      </div>
      <div className="agv-tech-right">
        <ET field="tech2label" fallback="OUR JOURNEY" as="p" className={`agv-section-title ${textAnim}`}/>
        <ET field="tech2body" fallback="Hand in hand, we explore the world and find home in each other." as="p" className={`agv-body-text ${textAnim}`} style={{ animationDelay:'100ms' }}/>
      </div>
    </div>
  );}

  
  if (layout === 'role') { return (
    <div className="agv-slide agv-slide--role">
      <div className="agv-role-left">
        <ET field="role1label" fallback="LOVE" as="p" className={`agv-section-title ${textAnim}`}/>
        <div className={`agv-placard ${textAnim}`} style={{ animationDelay:'60ms' }}>
          <ET field="role1body" fallback="We don't just share moments; we build a life together." as="p" className="agv-body-text"/>
        </div>
        <ET field="role2label" fallback="LAUGHTER" as="p" className={`agv-section-title ${textAnim}`} style={{ marginTop:'16px', animationDelay:'120ms' }}/>
        <div className={`agv-placard ${textAnim}`} style={{ animationDelay:'180ms' }}>
          <ET field="role2body" fallback="Every laugh echoes through all the years to come." as="p" className="agv-body-text"/>
        </div>
        <ET field="slide8title" fallback="The Role of Love" as="h2" className={`agv-serif-lg ${textAnim}`} style={{ animationDelay:'80ms', marginTop:'12px' }}/>
      </div>
      <div className="agv-role-center-photo">
        <FP idx={16} frame="rect" animDelay={40}/>
      </div>
      <div className="agv-role-right">
        <div className="agv-role-photo2">
          <FP idx={17} frame="oval" animDelay={160}/>
        </div>
      </div>
    </div>
  );}

  
  return (
    <div className="agv-slide agv-slide--collection">
      <div className="agv-col-header">
        <ET field="slide9title" fallback="Our Memories Collection" as="h2" className={`agv-serif-lg ${textAnim}`}/>
      </div>
      <div className="agv-col-strip">
        <div className="agv-col-photo"><FP idx={18} frame="rect" animDelay={60}/></div>
        <div className="agv-col-photo"><FP idx={19} frame="square" animDelay={140}/></div>
        <div className="agv-col-photo"><FP idx={20} frame="rect" animDelay={220}/></div>
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

  
  const handleReplacePhoto = (idx, key) => {
    const updated = Array.from({ length: Math.max(photos.length, idx + 1) }, (_, i) => photos[i] ?? FALLBACK[i] ?? { id: Date.now() + i, url: '', caption: '' });
    updated[idx] = { ...(updated[idx] || {}), url: key };
    onContentChange?.('photosList', updated);
  };

  
  const handleSavePosition = (idx, patch) => {
    const updated = Array.from({ length: Math.max(photos.length, idx + 1) }, (_, i) => photos[i] ?? FALLBACK[i] ?? { id: Date.now() + i, url: '', caption: '' });
    updated[idx] = { ...(updated[idx] || {}), ...('pos' in patch ? { objectPosition: patch.pos } : {}), ...('scale' in patch ? { objectScale: patch.scale } : {}) };
    onContentChange?.('photosList', updated);
  };

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
