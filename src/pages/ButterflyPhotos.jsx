import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { EditableText } from '../components/EditableField';
import { saveImage }   from '../utils/imageStore';
import { useImageUrl } from '../utils/useImageUrl';
import '../styles/pages/ButterflyPhotos.css';

/* ── FramedPhoto ── */
function FramedPhoto({ src, alt, frame = 'rect', className = '', animClass = '', animDelay = 0,
                        isEditing = false, onReplace }) {
  const fileRef     = useRef(null);
  const resolvedSrc = useImageUrl(src);
  const shapeClass  = { rect:'agv-fp--rect', square:'agv-fp--square', oval:'agv-fp--oval', heart:'agv-fp--heart' };

  const handleFile = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    e.target.value = '';
    const key = await saveImage(file);
    onReplace?.(key);
  };

  return (
    <div className={`agv-fp ${shapeClass[frame]} ${className} ${animClass}`}
      style={{ animationDelay:`${animDelay}ms`, position:'relative' }}
      onDoubleClick={isEditing ? () => fileRef.current?.click() : undefined}
      title={isEditing ? 'Double-click to change photo' : undefined}
    >
      <div className="agv-fp-inner">
        {resolvedSrc && <img className="agv-fp-photo" src={resolvedSrc} alt={alt} loading="lazy" decoding="async"/>}
      </div>
      {isEditing && (
        <>
          <div style={{ position:'absolute', inset:0, background:'rgba(233,30,140,0.25)', display:'flex', alignItems:'center', justifyContent:'center', opacity:0, transition:'opacity .18s', cursor:'pointer', borderRadius:'inherit' }}
            className="ep-hover-overlay">
            <span style={{ background:'rgba(0,0,0,0.75)', color:'#fff', fontSize:'0.65rem', padding:'3px 8px', borderRadius:20, fontFamily:'system-ui,sans-serif', pointerEvents:'none' }}>📷 Double-click to change</span>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleFile}/>
        </>
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

/* ── Slide component — all text wired to pageContent, photos clickable in edit mode ── */
function Slide({ layout, photos, couple, frameAnim, textAnim, isEditing, onSaveText, onReplacePhoto }) {
  // Each slide has its own dedicated photo index range — no sharing between slides.
  // Slot map: hero=0-4  intro=5-7  timeline=8  dual=9-10
  //           feature=11-13  bullets=14  tech=15  role=16-17  collection=18-20
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
      isEditing={isEditing} onReplace={url => onReplacePhoto?.(idx, url)}/>
  );

  // ── slide 1: HERO — slots 0,1,2,3,4 ──
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
            <p className="agv-hw-eyebrow">{couple?.name1} &amp; {couple?.name2}</p>
            <ET field="heroTitle1" fallback="Our" as="h1" className="agv-hw-title-script"/>
            <ET field="heroTitle2" fallback="MEMORIES" as="h1" className="agv-hw-title-caps"/>
          </div>
        </div>
        <div className="agv-hw-col agv-hw-col--right">
          <div className="agv-hw-sm-frame agv-hw-sm-frame--tr"><FP idx={1} frame="rect" animDelay={80}/></div>
          <div className="agv-hw-sm-frame agv-hw-sm-frame--br"><FP idx={3} frame="square" animDelay={160}/></div>
        </div>
      </div>
    </div>
  );

  // ── slide 2: INTRO — slots 5,6,7 ──
  if (layout === 'intro') { const p1=pg(5),p2=pg(6),p3=pg(7); return (
    <div className="agv-slide agv-slide--intro">
      <div className="agv-intro-left">
        <div className={`agv-placard ${textAnim}`} style={{ animationDelay:'0ms' }}>
          <p className="agv-meta">OUR STORY</p>
          <p className="agv-meta">{couple?.name1} &amp; {couple?.name2}</p>
        </div>
        <div className="agv-intro-photo1">
          <FramedPhoto src={p1.url} alt={p1.caption} frame="rect" animClass={frameAnim} animDelay={80} aspect={3/4} isEditing={isEditing} onReplace={url=>onReplacePhoto?.(5,url)}/>
          <p className={`agv-photo-label ${textAnim}`} style={{ animationDelay:'180ms' }}>{p1.caption}</p>
        </div>
      </div>
      <div className="agv-intro-center">
        <ET field="slide2title" fallback="A Story of Love" as="h2" className={`agv-serif-lg ${textAnim}`}/>
        <div className="agv-intro-photo2">
          <FramedPhoto src={p2.url} alt={p2.caption} frame="square" animClass={frameAnim} animDelay={120} aspect={1} isEditing={isEditing} onReplace={url=>onReplacePhoto?.(6,url)}/>
        </div>
      </div>
      <div className="agv-intro-right">
        <div className="agv-intro-photo3">
          <FramedPhoto src={p3.url} alt={p3.caption} frame="oval" animClass={frameAnim} animDelay={160} aspect={1} isEditing={isEditing} onReplace={url=>onReplacePhoto?.(7,url)}/>
        </div>
        <div className={`agv-placard ${textAnim}`} style={{ marginTop:'12px', animationDelay:'240ms' }}>
          <p className="agv-section-title">BEGINNING</p>
          <p className="agv-body-text">{couple?.tagline || 'Two hearts beating as one, every moment a treasure.'}</p>
        </div>
      </div>
    </div>
  );}

  // ── slide 3: TIMELINE — slot 8 ──
  if (layout === 'timeline') { const p1=pg(8);
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
        <FramedPhoto src={p1.url} alt={p1.caption} frame="rect" animClass={frameAnim} animDelay={60} aspect={3/4} isEditing={isEditing} onReplace={url=>onReplacePhoto?.(8,url)}/>
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

  // ── slide 4: DUAL — slots 9,10 ──
  if (layout === 'dual') { const p1=pg(9),p2=pg(10); return (
    <div className="agv-slide agv-slide--dual">
      <div className="agv-dual-left">
        <ET field="slide4title" fallback="Our Favourite Moments" as="h2" className={`agv-serif-lg ${textAnim}`}/>
        <div className="agv-dual-photo2">
          <FramedPhoto src={p2.url} alt={p2.caption} frame="oval" animClass={frameAnim} animDelay={100} aspect={1} isEditing={isEditing} onReplace={url=>onReplacePhoto?.(10,url)}/>
        </div>
      </div>
      <div className="agv-dual-right">
        <div className="agv-dual-photo1">
          <FramedPhoto src={p1.url} alt={p1.caption} frame="square" animClass={frameAnim} animDelay={40} aspect={1} isEditing={isEditing} onReplace={url=>onReplacePhoto?.(9,url)}/>
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

  // ── slide 5: FEATURE — slots 11,12,13 ──
  if (layout === 'feature') { const p1=pg(11),p2=pg(12),p3=pg(13); return (
    <div className="agv-slide agv-slide--feature">
      <div className="agv-feat-left">
        <div className={`agv-placard ${textAnim}`}>
          <ET field="feat1label" fallback="TREASURED" as="p" className="agv-section-title"/>
          <ET field="feat1body" fallback="Every moment framed forever." as="p" className="agv-body-text"/>
        </div>
        <div className="agv-feat-photo1">
          <FramedPhoto src={p1.url} alt={p1.caption} frame="square" animClass={frameAnim} animDelay={80} aspect={1} isEditing={isEditing} onReplace={url=>onReplacePhoto?.(11,url)}/>
        </div>
        <p className={`agv-photo-label ${textAnim}`} style={{ animationDelay:'180ms' }}>{p1.caption}</p>
      </div>
      <div className="agv-feat-center-photo">
        <FramedPhoto src={p2.url} alt={p2.caption} frame="rect" animClass={frameAnim} animDelay={40} aspect={3/4} isEditing={isEditing} onReplace={url=>onReplacePhoto?.(12,url)}/>
        <p className={`agv-photo-label ${textAnim}`} style={{ animationDelay:'160ms' }}>{p2.caption}</p>
      </div>
      <div className="agv-feat-right">
        <ET field="slide5title" fallback="Beautiful Together" as="h2" className={`agv-serif-lg ${textAnim}`}/>
        <div className={`agv-placard ${textAnim}`} style={{ animationDelay:'140ms' }}>
          <ET field="feat2body" fallback="From every adventure to quiet evenings, these are the frames of our love story." as="p" className="agv-body-text"/>
        </div>
        <div className="agv-feat-photo2">
          <FramedPhoto src={p3.url} alt={p3.caption} frame="heart" animClass={frameAnim} animDelay={200} aspect={1} isEditing={isEditing} onReplace={url=>onReplacePhoto?.(13,url)}/>
        </div>
      </div>
    </div>
  );}

  // ── slide 6: BULLETS — slot 14 ──
  if (layout === 'bullets') { const p1=pg(14); const moments=[pg(14),pg(15),pg(16)].map(p=>p?.caption).filter(Boolean); return (
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
        <FramedPhoto src={p1.url} alt={p1.caption} frame="rect" animClass={frameAnim} animDelay={60} aspect={3/4} isEditing={isEditing} onReplace={url=>onReplacePhoto?.(14,url)}/>
      </div>
    </div>
  );}

  // ── slide 7: TECH — slot 15 ──
  if (layout === 'tech') { const p1=pg(15); return (
    <div className="agv-slide agv-slide--tech">
      <div className="agv-tech-left">
        <ET field="tech1label" fallback="OUR ADVENTURES" as="p" className={`agv-section-title ${textAnim}`}/>
        <ET field="tech1body" fallback="Every trip, every outing — adventures that brought us closer every single day." as="p" className={`agv-body-text ${textAnim}`} style={{ animationDelay:'80ms' }}/>
      </div>
      <div className="agv-tech-center">
        <ET field="slide7title" fallback="Adventures Together" as="h2" className={`agv-serif-lg ${textAnim}`}/>
        <div className="agv-tech-photo">
          <FramedPhoto src={p1.url} alt={p1.caption} frame="square" animClass={frameAnim} animDelay={100} aspect={1} isEditing={isEditing} onReplace={url=>onReplacePhoto?.(15,url)}/>
        </div>
      </div>
      <div className="agv-tech-right">
        <ET field="tech2label" fallback="OUR JOURNEY" as="p" className={`agv-section-title ${textAnim}`}/>
        <ET field="tech2body" fallback="Hand in hand, we explore the world and find home in each other." as="p" className={`agv-body-text ${textAnim}`} style={{ animationDelay:'100ms' }}/>
      </div>
    </div>
  );}

  // ── slide 8: ROLE — slots 16,17 ──
  if (layout === 'role') { const p1=pg(16),p2=pg(17); return (
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
        <FramedPhoto src={p1.url} alt={p1.caption} frame="rect" animClass={frameAnim} animDelay={40} aspect={3/4} isEditing={isEditing} onReplace={url=>onReplacePhoto?.(16,url)}/>
      </div>
      <div className="agv-role-right">
        <div className="agv-role-photo2">
          <FramedPhoto src={p2.url} alt={p2.caption} frame="oval" animClass={frameAnim} animDelay={160} aspect={1} isEditing={isEditing} onReplace={url=>onReplacePhoto?.(17,url)}/>
        </div>
      </div>
    </div>
  );}

  // ── slide 9: COLLECTION — slots 18,19,20 ──
  const p1=pg(18),p2=pg(19),p3=pg(20);
  return (
    <div className="agv-slide agv-slide--collection">
      <div className="agv-col-header">
        <ET field="slide9title" fallback="Our Memories Collection" as="h2" className={`agv-serif-lg ${textAnim}`}/>
      </div>
      <div className="agv-col-strip">
        <div className="agv-col-photo"><FramedPhoto src={p1.url} alt={p1.caption} frame="rect" animClass={frameAnim} animDelay={60} aspect={3/4} isEditing={isEditing} onReplace={url=>onReplacePhoto?.(18,url)}/></div>
        <div className="agv-col-photo"><FramedPhoto src={p2.url} alt={p2.caption} frame="square" animClass={frameAnim} animDelay={140} aspect={1} isEditing={isEditing} onReplace={url=>onReplacePhoto?.(19,url)}/></div>
        <div className="agv-col-photo"><FramedPhoto src={p3.url} alt={p3.caption} frame="rect" animClass={frameAnim} animDelay={220} aspect={3/4} isEditing={isEditing} onReplace={url=>onReplacePhoto?.(20,url)}/></div>
      </div>
    </div>
  );
}

/* ── main component ── */
export default function ButterflyPhotos({ isEditing = false, onContentChange }) {
  const navigate = useNavigate();
  const { getCoupleBySlug, coupleAuth, myCouple } = useApp();
  const couple = isEditing ? myCouple : getCoupleBySlug(coupleAuth?.slug);

  const FALLBACK = [
    // hero: 0-4
    { id:0,  url:'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800&q=80', caption:'Our first date' },
    { id:1,  url:'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&q=80', caption:'Summer adventure' },
    { id:2,  url:'https://images.unsplash.com/photo-1516589091380-5d8e87df6999?w=800&q=80', caption:'Coffee mornings' },
    { id:3,  url:'https://images.unsplash.com/photo-1474552226712-ac0f0961a954?w=800&q=80', caption:'Sunset walk' },
    { id:4,  url:'https://images.unsplash.com/photo-1596460107916-430662021049?w=800&q=80', caption:'Beach day' },
    // intro: 5-7
    { id:5,  url:'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80', caption:'Cooking together' },
    { id:6,  url:'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800&q=80', caption:'City lights' },
    { id:7,  url:'https://images.unsplash.com/photo-1494774157365-9e04c6720e47?w=800&q=80', caption:'Garden walk' },
    // timeline: 8
    { id:8,  url:'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80', caption:'Milestone moment' },
    // dual: 9-10
    { id:9,  url:'https://images.unsplash.com/photo-1529516548873-9ce57c8f155e?w=800&q=80', caption:'Together always' },
    { id:10, url:'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&q=80', caption:'Pure happiness' },
    // feature: 11-13
    { id:11, url:'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80', caption:'Favourite memory' },
    { id:12, url:'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=800&q=80', caption:'Beautiful together' },
    { id:13, url:'https://images.unsplash.com/photo-1543804091-c4d20b4e3c80?w=800&q=80', caption:'Heart to heart' },
    // bullets: 14
    { id:14, url:'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80', caption:'Our highlights' },
    // tech: 15
    { id:15, url:'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80', caption:'Adventures together' },
    // role: 16-17
    { id:16, url:'https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?w=800&q=80', caption:'The role of love' },
    { id:17, url:'https://images.unsplash.com/photo-1533038590840-1cde6e668a91?w=800&q=80', caption:'Every laugh' },
    // collection: 18-20
    { id:18, url:'https://images.unsplash.com/photo-1537535195739-e0d3d886f3f5?w=800&q=80', caption:'Collection I' },
    { id:19, url:'https://images.unsplash.com/photo-1504275107627-0c2ba7a43dba?w=800&q=80', caption:'Collection II' },
    { id:20, url:'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=800&q=80', caption:'Collection III' },
  ];
  // Merge couple photos with FALLBACK so slots always go up to index 20
  const photos = Array.from({ length: 21 }, (_, i) =>
    (couple?.photos?.[i]) ?? FALLBACK[i]
  );

  const [current, setCurrent] = useState(0);
  const [anims, setAnims] = useState({ frame:'agv-anim-rise', text:'agv-anim-fade-up' });
  const total = LAYOUTS.length;

  const go = (fn) => { setAnims({ frame:pickRandom(FRAME_ANIMS), text:pickRandom(TEXT_ANIMS) }); setCurrent(fn); };
  const prev = () => go(i => (i-1+total)%total);
  const next = () => go(i => (i+1)%total);

  // save a pageContent.photos field
  const handleSaveText = (field, val) => {
    const pc = couple?.pageContent?.photos || {};
    onContentChange?.('photos', { ...pc, [field]: val });
  };

  // replace a photo by index — each slot is independent
  const handleReplacePhoto = (idx, key) => {
    const updated = Array.from({ length: Math.max(photos.length, idx + 1) }, (_, i) => photos[i] ?? FALLBACK[i] ?? { id: Date.now() + i, url: '', caption: '' });
    updated[idx] = { ...(updated[idx] || {}), url: key };
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
