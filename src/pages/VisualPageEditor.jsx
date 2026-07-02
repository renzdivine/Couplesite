/**
 * VisualPageEditor — Full editable replica of all visitor butterfly pages.
 *
 * The client sees every page exactly as the visitor will.
 * Every photo = click to change via file picker or URL.
 * Every text = click to edit inline via popover.
 *
 * Pages:
 *   Cover     → ButterflyLetters slide 1 (dark red, stamps, big title)
 *   Letters   → ButterflyLetters slides 2–10 (scrapbook slides)
 *   Gallery   → ButterflyPhotos  (art gallery wall)
 *   Songs     → ButterflyStory   (vinyl scrapboard)
 *   Wishes    → ButterflyWish    (wish capsules)
 */
import { useState, useRef, useEffect } from 'react';
import { Edit3, X, FolderOpen, Camera, ChevronLeft, ChevronRight } from 'lucide-react';

/* ═══════════════════════════════════════
   HELPERS
═══════════════════════════════════════ */
function readFile(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = e => res(e.target.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

/* ═══════════════════════════════════════
   IMAGE PICKER POPOVER
═══════════════════════════════════════ */
function ImgPopover({ anchor, current, onSave, onClose }) {
  const [val, setVal] = useState(current || '');
  const ref = useRef();
  const fileRef = useRef();

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await readFile(file);
    setVal(url);
    e.target.value = '';
  };

  const left = Math.min(Math.max((anchor?.x || 100) - 140, 8), window.innerWidth - 316);
  const top  = Math.min(Math.max((anchor?.y || 100) + 8, 60), window.innerHeight - 340);

  return (
    <div ref={ref} style={{ position:'fixed', top, left, zIndex:99999, width:308, background:'rgba(10,0,20,0.97)', border:'1px solid rgba(233,30,140,0.5)', borderRadius:14, padding:16, boxShadow:'0 20px 60px rgba(0,0,0,0.9)', fontFamily:'system-ui,sans-serif' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <span style={{ fontSize:'0.7rem', color:'rgba(255,180,200,0.6)', textTransform:'uppercase', letterSpacing:0.8, fontWeight:600 }}>Change Photo</span>
        <button onClick={onClose} style={{ background:'none', border:'none', color:'rgba(255,180,200,0.4)', cursor:'pointer', padding:2, display:'flex' }}><X size={14}/></button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleFile}/>
      <button onClick={() => fileRef.current.click()} style={{ width:'100%', padding:'9px', marginBottom:10, background:'rgba(233,30,140,0.18)', border:'1px dashed rgba(233,30,140,0.5)', borderRadius:8, color:'#ff9ab5', cursor:'pointer', fontSize:'0.85rem', fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
        <FolderOpen size={13}/> Browse from device
      </button>
      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
        <div style={{ flex:1, height:1, background:'rgba(255,150,180,0.1)' }}/><span style={{ fontSize:'0.63rem', color:'rgba(255,180,200,0.28)' }}>or paste URL</span><div style={{ flex:1, height:1, background:'rgba(255,150,180,0.1)' }}/>
      </div>
      <input value={val.startsWith('data:') ? '' : val} onChange={e => setVal(e.target.value)} placeholder="https://..." style={{ width:'100%', padding:'8px 10px', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,150,180,0.2)', borderRadius:8, color:'#fff', fontSize:'0.83rem', outline:'none', boxSizing:'border-box', marginBottom:8 }}/>
      {val && <div style={{ position:'relative', borderRadius:6, overflow:'hidden', marginBottom:8 }}>
        <img src={val} alt="" style={{ width:'100%', height:80, objectFit:'cover', display:'block', borderRadius:6 }} onError={e=>e.target.style.display='none'}/>
        <button onClick={()=>setVal('')} style={{ position:'absolute', top:4, right:4, background:'rgba(220,30,80,0.85)', border:'none', borderRadius:'50%', width:20, height:20, color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><X size={9}/></button>
      </div>}
      <div style={{ display:'flex', gap:8 }}>
        <button onClick={()=>{onSave(val);onClose();}} style={{ flex:1, padding:'8px', background:'linear-gradient(135deg,#e91e8c,#9c27b0)', border:'none', borderRadius:8, color:'#fff', cursor:'pointer', fontSize:'0.85rem', fontWeight:600 }}>Save</button>
        <button onClick={onClose} style={{ padding:'8px 12px', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,150,180,0.15)', borderRadius:8, color:'#ff9ab5', cursor:'pointer', fontSize:'0.85rem' }}>Cancel</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   TEXT EDIT POPOVER
═══════════════════════════════════════ */
function TextPopover({ anchor, label, current, textarea, onSave, onClose }) {
  const [val, setVal] = useState(current || '');
  const ref = useRef();

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  const left = Math.min(Math.max((anchor?.x || 100) - 140, 8), window.innerWidth - 316);
  const top  = Math.min(Math.max((anchor?.y || 100) + 8, 60), window.innerHeight - 320);

  return (
    <div ref={ref} style={{ position:'fixed', top, left, zIndex:99999, width:308, background:'rgba(10,0,20,0.97)', border:'1px solid rgba(233,30,140,0.5)', borderRadius:14, padding:16, boxShadow:'0 20px 60px rgba(0,0,0,0.9)', fontFamily:'system-ui,sans-serif' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
        <span style={{ fontSize:'0.7rem', color:'rgba(255,180,200,0.6)', textTransform:'uppercase', letterSpacing:0.8, fontWeight:600 }}>{label}</span>
        <button onClick={onClose} style={{ background:'none', border:'none', color:'rgba(255,180,200,0.4)', cursor:'pointer', padding:2, display:'flex' }}><X size={14}/></button>
      </div>
      {textarea
        ? <textarea autoFocus value={val} onChange={e=>setVal(e.target.value)} rows={4} style={{ width:'100%', padding:'8px 10px', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,150,180,0.2)', borderRadius:8, color:'#fff', fontSize:'0.88rem', outline:'none', boxSizing:'border-box', resize:'vertical', lineHeight:1.6, marginBottom:10 }}/>
        : <input autoFocus value={val} onChange={e=>setVal(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){onSave(val);onClose();}if(e.key==='Escape')onClose();}} style={{ width:'100%', padding:'8px 10px', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,150,180,0.2)', borderRadius:8, color:'#fff', fontSize:'0.88rem', outline:'none', boxSizing:'border-box', marginBottom:10 }}/>
      }
      <div style={{ display:'flex', gap:8, marginTop: textarea?0:0 }}>
        <button onClick={()=>{onSave(val);onClose();}} style={{ flex:1, padding:'8px', background:'linear-gradient(135deg,#e91e8c,#9c27b0)', border:'none', borderRadius:8, color:'#fff', cursor:'pointer', fontSize:'0.85rem', fontWeight:600 }}>Save</button>
        <button onClick={onClose} style={{ padding:'8px 12px', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,150,180,0.15)', borderRadius:8, color:'#ff9ab5', cursor:'pointer', fontSize:'0.85rem' }}>Cancel</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   EDITABLE WRAPPERS
═══════════════════════════════════════ */

/* Clickable photo stamp — shows camera icon + edit ring on hover */
function EditablePhoto({ src, alt, onClick, style = {}, stampStyle = {}, innerStyle = {} }) {
  const [hov, setHov] = useState(false);
  const fallback = 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=400&q=60';
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onClick}
      style={{
        position:'relative', cursor:'pointer', display:'inline-block',
        outline: hov ? '3px solid rgba(233,30,140,0.9)' : '3px solid transparent',
        transition:'outline 0.14s',
        ...style
      }}
    >
      {/* stamp perforated border */}
      <div style={{
        display:'inline-block', background:'#fff',
        padding:'8px 8px 22px', position:'relative',
        boxShadow:'0 4px 18px rgba(0,0,0,0.3)',
        ...stampStyle
      }}>
        <div style={{ position:'absolute', inset:-1, background:'radial-gradient(circle at 0 50%,transparent 6px,#fff 6px) left/12px 12px repeat-y,radial-gradient(circle at 100% 50%,transparent 6px,#fff 6px) right/12px 12px repeat-y,radial-gradient(circle at 50% 0,transparent 6px,#fff 6px) top/12px 12px repeat-x,radial-gradient(circle at 50% 100%,transparent 6px,#fff 6px) bottom/12px 12px repeat-x', pointerEvents:'none', zIndex:1 }}/>
        <div style={{ position:'relative', zIndex:2, overflow:'hidden', ...innerStyle }}>
          <img src={src || fallback} alt={alt || ''} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} onError={e=>e.target.src=fallback}/>
        </div>
      </div>
      {/* hover overlay */}
      {hov && (
        <div style={{ position:'absolute', inset:0, background:'rgba(233,30,140,0.35)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:10, borderRadius:2 }}>
          <div style={{ background:'rgba(0,0,0,0.7)', borderRadius:8, padding:'8px 14px', display:'flex', alignItems:'center', gap:6, color:'#fff', fontSize:'0.78rem', fontFamily:'system-ui,sans-serif' }}>
            <Camera size={14}/> Change Photo
          </div>
        </div>
      )}
    </div>
  );
}

/* Clickable text — shows dashed outline on hover with edit badge */
function EditableText({ children, onClick, tag: Tag = 'span', style = {}, label = 'Edit' }) {
  const [hov, setHov] = useState(false);
  return (
    <Tag
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onClick}
      style={{
        cursor:'pointer', position:'relative', display:'inline-block',
        outline: hov ? '2px dashed rgba(233,30,140,0.85)' : '2px dashed transparent',
        outlineOffset:3, borderRadius:4, transition:'outline 0.12s',
        ...style
      }}
    >
      {children}
      {hov && (
        <span style={{ position:'absolute', top:-22, left:'50%', transform:'translateX(-50%)', background:'rgba(233,30,140,0.92)', color:'#fff', fontSize:'0.58rem', padding:'2px 8px', borderRadius:20, whiteSpace:'nowrap', pointerEvents:'none', zIndex:100, display:'flex', alignItems:'center', gap:3, fontFamily:'system-ui,sans-serif' }}>
          <Edit3 size={8}/> {label}
        </span>
      )}
    </Tag>
  );
}

/* ═══════════════════════════════════════
   STAMP PERFORATED BORDER (for non-photo-stamp elements)
═══════════════════════════════════════ */
function StampBorder({ bgColor = '#7b1828' }) {
  return (
    <div style={{
      position:'absolute', inset:-1, pointerEvents:'none', zIndex:1,
      background:`
        radial-gradient(circle at 0 50%,transparent 6px,${bgColor} 6px) left/12px 12px repeat-y,
        radial-gradient(circle at 100% 50%,transparent 6px,${bgColor} 6px) right/12px 12px repeat-y,
        radial-gradient(circle at 50% 0,transparent 6px,${bgColor} 6px) top/12px 12px repeat-x,
        radial-gradient(circle at 50% 100%,transparent 6px,${bgColor} 6px) bottom/12px 12px repeat-x
      `
    }}/>
  );
}

/* ═══════════════════════════════════════
   MAIN EXPORT
═══════════════════════════════════════ */
export default function VisualPageEditor({ couple, updateCouple, showToast }) {
  const pc = couple.pageContent || {};
  const [page,    setPage]    = useState('cover');   // which page/tab
  const [imgPop,  setImgPop]  = useState(null);      // { anchor, key, path }
  const [txtPop,  setTxtPop]  = useState(null);      // { anchor, label, key, path, textarea }

  const PAGES = [
    { id:'cover',   label:'Cover' },
    { id:'letters', label:'Letters' },
    { id:'gallery', label:'Gallery' },
    { id:'songs',   label:'Songs' },
    { id:'wishes',  label:'Wishes' },
  ];

  /* ── helpers to open popovers ── */
  const openImg = (e, pathArr, key) => {
    e.stopPropagation();
    const r = e.currentTarget.getBoundingClientRect();
    setImgPop({ anchor:{ x:r.left+r.width/2, y:r.bottom }, pathArr, key });
  };
  const openTxt = (e, pathArr, key, label, textarea=false) => {
    e.stopPropagation();
    const r = e.currentTarget.getBoundingClientRect();
    setTxtPop({ anchor:{ x:r.left+r.width/2, y:r.bottom }, pathArr, key, label, textarea });
  };

  /* ── deep read from couple data ── */
  const getVal = (pathArr, key) => {
    // pathArr = ['pageContent','login'] or ['photos',0,'url'] etc.
    let obj = couple;
    for (const p of pathArr) obj = obj?.[p];
    return obj?.[key] ?? '';
  };

  /* ── save helper ── */
  const saveVal = (pathArr, key, value) => {
    if (pathArr[0] === 'pageContent') {
      const section = pathArr[1];
      const cur = pc[section] || {};
      updateCouple(couple.slug, { pageContent:{ ...pc, [section]:{ ...cur, [key]:value } } });
    } else if (pathArr[0] === 'photos') {
      const idx = pathArr[1];
      const photos = [...(couple.photos || [])];
      if (photos[idx]) photos[idx] = { ...photos[idx], [key]:value };
      updateCouple(couple.slug, { photos });
    } else {
      updateCouple(couple.slug, { [key]:value });
    }
    showToast('Saved!');
  };

  /* ── photo shortcut ── */
  const photo = (i) => couple.photos?.[i]?.url || '';
  const caption = (i) => couple.photos?.[i]?.caption || '';

  /* ── login / home page content ── */
  const login = { titleTop:'Happy', titleBottom:'Anniversary', hintText:'Tap the scroll to open your love page', continueBtnText:'Continue', ...(pc.login||{}) };
  const letters0 = couple.letters?.[0] || {};
  const letters1 = couple.letters?.[1] || {};

  const fonts = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&display=swap');
  `;

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', minHeight:600, background:'#080010', fontFamily:"system-ui,sans-serif" }}>
      <style>{fonts}</style>

      {/* ── Top bar ── */}
      <div style={{ background:'rgba(233,30,140,0.14)', backdropFilter:'blur(10px)', borderBottom:'1px solid rgba(233,30,140,0.22)', padding:'8px 14px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        <span style={{ color:'#ff9ab5', fontSize:'0.75rem', fontWeight:600, display:'flex', alignItems:'center', gap:5 }}>
          <Edit3 size={11}/> Live Editor — <span style={{ fontWeight:400, opacity:0.7 }}>click any photo or text to edit it</span>
        </span>
        <span style={{ fontSize:'0.68rem', color:'rgba(255,180,200,0.4)' }}>{couple.name1} &amp; {couple.name2}</span>
      </div>

      {/* ── Page tabs ── */}
      <div style={{ display:'flex', background:'rgba(0,0,0,0.4)', borderBottom:'1px solid rgba(255,150,180,0.08)', padding:'0 4px', flexShrink:0, overflowX:'auto' }}>
        {PAGES.map(p => (
          <button key={p.id} onClick={() => setPage(p.id)} style={{ padding:'10px 18px', border:'none', background:'none', color: page===p.id ? '#ff9ab5' : 'rgba(255,180,200,0.38)', cursor:'pointer', fontSize:'0.8rem', fontFamily:'system-ui,sans-serif', borderBottom: page===p.id ? '2px solid #e91e8c' : '2px solid transparent', transition:'color 0.15s', whiteSpace:'nowrap' }}>
            {p.label}
          </button>
        ))}
      </div>

      {/* ── Page preview ── */}
      <div style={{ flex:1, overflowY:'auto', overflowX:'hidden' }}>
        {page === 'cover'   && <CoverPage   couple={couple} login={login} photo={photo} caption={caption} openImg={openImg} openTxt={openTxt} pc={pc}/>}
        {page === 'letters' && <LettersPage couple={couple} letters0={letters0} letters1={letters1} photo={photo} openImg={openImg} openTxt={openTxt}/>}
        {page === 'gallery' && <GalleryPage couple={couple} photo={photo} openImg={openImg} openTxt={openTxt} pc={pc}/>}
        {page === 'songs'   && <SongsPage   couple={couple} openImg={openImg} openTxt={openTxt}/>}
        {page === 'wishes'  && <WishesPage  couple={couple} openImg={openImg} openTxt={openTxt} pc={pc}/>}
      </div>

      {/* ── Popovers ── */}
      {imgPop && (
        <ImgPopover
          anchor={imgPop.anchor}
          current={getVal(imgPop.pathArr, imgPop.key)}
          onSave={v => saveVal(imgPop.pathArr, imgPop.key, v)}
          onClose={() => setImgPop(null)}
        />
      )}
      {txtPop && (
        <TextPopover
          anchor={txtPop.anchor}
          label={txtPop.label}
          current={getVal(txtPop.pathArr, txtPop.key)}
          textarea={txtPop.textarea}
          onSave={v => saveVal(txtPop.pathArr, txtPop.key, v)}
          onClose={() => setTxtPop(null)}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   PAGE: COVER  (ButterflyLetters slide 1)
═══════════════════════════════════════ */
function CoverPage({ couple, login, photo, caption, openImg, openTxt, pc }) {
  const home = { taglineOverride:'', coverPhotoUrl:'', coverPhotoCaption:'', ...(pc.home||{}) };
  const coverUrl = home.coverPhotoUrl || photo(0);

  return (
    <div style={{ fontFamily:"'Cormorant Garamond','Georgia',serif", background:'#7b1828', backgroundImage:'radial-gradient(ellipse at 30% 20%,#9b2232 0%,transparent 60%),radial-gradient(ellipse at 70% 80%,#5a1018 0%,transparent 60%)', minHeight:'100vh', position:'relative', overflow:'hidden', color:'#f0e8d8' }}>

      {/* Couple names top-left */}
      <EditableText onClick={e => openTxt(e,['pageContent','home'],'taglineOverride','Couple tagline')} style={{ position:'absolute', top:32, left:40, fontFamily:"'Playfair Display',Georgia,serif", fontStyle:'italic', fontSize:20, color:'#f0e8d8', zIndex:5 }}>
        {couple.name1} &amp; {couple.name2}
      </EditableText>

      {/* Top-right stamp photo */}
      <div style={{ position:'absolute', top:24, right:40, zIndex:4 }}
           onClick={e => openImg(e, ['photos',1], 'url')}>
        <EditablePhoto
          src={photo(1)} alt="stamp top right"
          style={{ background:'none', outline:'none' }}
          stampStyle={{ background:'#fff', padding:'8px 8px 22px' }}
          innerStyle={{ width:220, height:165 }}
        />
      </div>

      {/* Center title */}
      <div style={{ position:'absolute', left:'50%', top:'50%', transform:'translate(-50%,-50%)', textAlign:'center', zIndex:3, pointerEvents:'none' }}>
        <EditableText onClick={e => openTxt(e,['pageContent','login'],'titleTop','Top title')} style={{ display:'block', fontFamily:"'Playfair Display',Georgia,serif", fontStyle:'italic', fontWeight:400, fontSize:'clamp(52px,8vw,90px)', color:'#f0e8d8', lineHeight:1.05, pointerEvents:'all' }}>
          {login.titleTop}
        </EditableText>
        <EditableText onClick={e => openTxt(e,['pageContent','login'],'titleBottom','Bottom title')} style={{ display:'block', fontFamily:"'Playfair Display',Georgia,serif", fontStyle:'italic', fontWeight:400, fontSize:'clamp(52px,8vw,90px)', color:'#f0e8d8', lineHeight:1.05, pointerEvents:'all' }}>
          {login.titleBottom}
        </EditableText>
      </div>

      {/* Bottom-left stamp photo */}
      <div style={{ position:'absolute', bottom:80, left:32, zIndex:4 }}
           onClick={e => openImg(e, ['photos',0], 'url')}>
        <EditablePhoto
          src={coverUrl} alt="stamp bottom left"
          style={{ background:'none', outline:'none' }}
          stampStyle={{ background:'#fff', padding:'8px 8px 22px' }}
          innerStyle={{ width:180, height:230 }}
        />
      </div>

      {/* Curved line decoration */}
      <svg style={{ position:'absolute', bottom:60, left:0, width:'50%', opacity:0.4, pointerEvents:'none' }} viewBox="0 0 300 200" fill="none">
        <path d="M10 180 Q80 20 160 100 Q240 180 290 40" stroke="#f0e8d8" strokeWidth="1.5" fill="none"/>
      </svg>

      {/* Bottom-right subtitle */}
      <EditableText onClick={e => openTxt(e,['pageContent','login'],'hintText','Hint text')} tag="p" style={{ position:'absolute', bottom:40, right:40, fontFamily:"'Cormorant Garamond',Georgia,serif", fontSize:14, color:'rgba(240,232,216,0.65)', textAlign:'right', lineHeight:1.6, margin:0 }}>
        {login.hintText || 'A celebration of love, growth,\nand beautiful moments.'}
      </EditableText>
    </div>
  );
}

/* ═══════════════════════════════════════
   PAGE: LETTERS  (ButterflyLetters slides 2+)
═══════════════════════════════════════ */
function LettersPage({ couple, photo, openImg, openTxt }) {
  const [slide, setSlide] = useState(0);
  const slides = ['Our Journey', 'The Moments', 'What We Love', 'My Promise'];
  const total = slides.length;

  return (
    <div style={{ fontFamily:"'Cormorant Garamond','Georgia',serif" }}>
      {/* Slide nav */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 16px', background:'rgba(0,0,0,0.3)', borderBottom:'1px solid rgba(240,220,180,0.1)' }}>
        <button onClick={() => setSlide(s => (s-1+total)%total)} style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,220,180,0.2)', borderRadius:20, padding:'5px 12px', color:'rgba(240,220,180,0.7)', cursor:'pointer', display:'flex', alignItems:'center', gap:5, fontSize:'0.8rem' }}><ChevronLeft size={14}/></button>
        <span style={{ fontSize:'0.75rem', color:'rgba(240,220,180,0.55)', fontFamily:'system-ui,sans-serif' }}>{slides[slide]} ({slide+1}/{total})</span>
        <button onClick={() => setSlide(s => (s+1)%total)} style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,220,180,0.2)', borderRadius:20, padding:'5px 12px', color:'rgba(240,220,180,0.7)', cursor:'pointer', display:'flex', alignItems:'center', gap:5, fontSize:'0.8rem' }}><ChevronRight size={14}/></button>
      </div>

      {/* Slide 0 — Our Journey (cream background with stamps) */}
      {slide === 0 && (
        <div style={{ background:'#f0ebe0', minHeight:'80vh', display:'flex', alignItems:'stretch', gap:40, padding:'60px 48px', boxSizing:'border-box', position:'relative', color:'#5a3a2a', overflow:'hidden' }}>
          {/* compass */}
          <svg style={{ position:'absolute', top:24, right:40, opacity:0.6, width:60, height:60, pointerEvents:'none' }} viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="38" stroke="#b5956a" strokeWidth="1.5" strokeDasharray="4 3"/>
            <circle cx="40" cy="40" r="28" stroke="#b5956a" strokeWidth="1" strokeDasharray="3 4"/>
            <circle cx="40" cy="40" r="5" fill="#b5956a" opacity="0.6"/>
            <polygon points="40,8 43,22 40,18 37,22" fill="#b5956a" opacity="0.8"/>
          </svg>

          {/* Left stamp */}
          <div style={{ alignSelf:'flex-start', marginTop:40, flexShrink:0 }} onClick={e => openImg(e,['photos',2],'url')}>
            <EditablePhoto src={photo(2)} alt="journey photo" style={{ background:'none', outline:'none' }} stampStyle={{ background:'#fff', padding:'8px 8px 22px' }} innerStyle={{ width:200, height:250 }}/>
          </div>

          {/* Content */}
          <div style={{ flex:1, maxWidth:480, paddingTop:40 }}>
            <EditableText onClick={e => openTxt(e,['pageContent','memories'],'title','Section title')} tag="h2" style={{ fontFamily:"'Playfair Display',Georgia,serif", fontStyle:'italic', fontSize:'clamp(32px,4vw,56px)', color:'#7b1828', margin:'0 0 20px', lineHeight:1.1 }}>
              {couple.pageContent?.memories?.title || 'Our Journey'}
            </EditableText>
            <EditableText onClick={e => openTxt(e,['pageContent','memories'],'subtitle','Subtitle', false)} tag="p" style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontSize:16, lineHeight:1.75, color:'#5a3a2a', margin:'0 0 14px', maxWidth:500 }}>
              {couple.pageContent?.memories?.subtitle || 'Every love story starts somewhere, and ours began with a simple hello — the kind of moment that changed everything.'}
            </EditableText>
            <EditableText onClick={e => openTxt(e,['pageContent','letters'],'subtitle','Story text', true)} tag="p" style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontSize:16, lineHeight:1.75, color:'#5a3a2a', margin:'0 0 14px', maxWidth:500 }}>
              {couple.pageContent?.letters?.subtitle || 'What started as small moments slowly grew into something meaningful. Day by day, our connection strengthened in ways neither of us expected.'}
            </EditableText>
          </div>

          {/* Right stamp */}
          <div style={{ alignSelf:'flex-end', marginBottom:40, flexShrink:0 }} onClick={e => openImg(e,['photos',3],'url')}>
            <EditablePhoto src={photo(3)} alt="journey photo 2" style={{ background:'none', outline:'none' }} stampStyle={{ background:'#fff', padding:'8px 8px 22px' }} innerStyle={{ width:190, height:215 }}/>
          </div>
        </div>
      )}

      {/* Slide 1 — The Moments */}
      {slide === 1 && (
        <div style={{ background:'#f0ebe0', minHeight:'80vh', display:'flex', flexDirection:'column', alignItems:'center', gap:32, padding:'60px 48px', boxSizing:'border-box', color:'#5a3a2a' }}>
          <div style={{ display:'flex', alignItems:'center', gap:20 }}>
            <EditableText onClick={e => openTxt(e,['pageContent','memories'],'title','Section title')} tag="h2" style={{ fontFamily:"'Playfair Display',Georgia,serif", fontStyle:'italic', fontSize:'clamp(32px,4vw,56px)', color:'#7b1828', margin:0 }}>
              {couple.pageContent?.memories?.title || 'The Moments'}
            </EditableText>
          </div>
          <div style={{ display:'flex', gap:28, alignItems:'flex-start', justifyContent:'center', flexWrap:'wrap' }}>
            {[4,5,0].map((photoIdx,i) => (
              <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', maxWidth:220 }} onClick={e => openImg(e,['photos',photoIdx],'url')}>
                <EditablePhoto src={photo(photoIdx)} alt={`moment ${i}`} style={{ background:'none', outline:'none' }} stampStyle={{ background:'#fff', padding:'8px 8px 22px' }} innerStyle={{ width: i===0?220:190, height: i===0?270:210 }}/>
                <EditableText onClick={e => { e.stopPropagation(); openTxt(e,['photos',photoIdx],'caption','Photo caption'); }} tag="p" style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontSize:13, color:'#6a4030', marginTop:10, textAlign:'center', lineHeight:1.65 }}>
                  {couple.photos?.[photoIdx]?.caption || 'Click to add caption'}
                </EditableText>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Slide 2 — What We Love (dark) */}
      {slide === 2 && (
        <div style={{ background:'#2a1a10', backgroundImage:'radial-gradient(ellipse at 50% 0%,#4a2820 0%,#1a0e08 70%)', minHeight:'80vh', display:'flex', gap:48, alignItems:'center', padding:'60px 48px', boxSizing:'border-box', color:'#f0e8d8' }}>
          {/* Letter card */}
          <div style={{ flex:1, maxWidth:480, background:'#f5ede0', padding:'36px 44px', boxShadow:'0 8px 36px rgba(0,0,0,0.5)', position:'relative', border:'8px solid #f5ede0', outline:'2px solid rgba(180,140,100,0.35)', color:'#5a3a2a' }}>
            <EditableText onClick={e => openTxt(e,['pageContent','letters'],'title','Letter section title')} tag="h2" style={{ fontFamily:"'Playfair Display',Georgia,serif", fontStyle:'italic', fontSize:'clamp(28px,3.5vw,46px)', color:'#7b1828', margin:'0 0 20px' }}>
              {couple.pageContent?.letters?.title || 'What We Love'}
            </EditableText>
            <EditableText onClick={e => openTxt(e,['pageContent','letters'],'subtitle','Letter subtitle',true)} tag="p" style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontSize:16, lineHeight:1.75, color:'#5a3a2a', margin:'0 0 14px' }}>
              {couple.letters?.[0]?.content || couple.pageContent?.letters?.subtitle || 'What I love most about us is how naturally we understand each other. Even in silence, we feel connected.'}
            </EditableText>
          </div>
          {/* Stamps */}
          <div style={{ display:'flex', flexDirection:'column', gap:16, alignItems:'flex-end' }}>
            {[1,2].map((photoIdx,i) => (
              <div key={i} onClick={e => openImg(e,['photos',photoIdx],'url')}>
                <EditablePhoto src={photo(photoIdx)} alt={`love ${i}`} style={{ background:'none', outline:'none' }} stampStyle={{ background:'#fff', padding:'8px 8px 22px' }} innerStyle={{ width:180, height:158 }}/>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Slide 3 — My Promise (cream) */}
      {slide === 3 && (
        <div style={{ background:'#f0ebe0', minHeight:'80vh', display:'flex', flexDirection:'column', padding:'60px 48px', boxSizing:'border-box', color:'#5a3a2a', gap:28 }}>
          <EditableText onClick={e => openTxt(e,['pageContent','capsule'],'title','Promise title')} tag="h2" style={{ fontFamily:"'Playfair Display',Georgia,serif", fontStyle:'italic', fontSize:'clamp(32px,4vw,56px)', color:'#7b1828', margin:0 }}>
            {couple.pageContent?.capsule?.title || 'My Promise'}
          </EditableText>
          <div style={{ display:'flex', gap:48, alignItems:'flex-start' }}>
            <div style={{ flex:1, maxWidth:400, display:'flex', flexDirection:'column', gap:24 }}>
              <EditableText onClick={e => openTxt(e,['pageContent','capsule'],'subtitle','Promise text',true)} tag="p" style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontSize:16, lineHeight:1.75, color:'#5a3a2a', margin:0 }}>
                {couple.pageContent?.capsule?.subtitle || 'As we celebrate another year together, I want to make promises that come from the deepest part of my heart — promises I intend to keep, not just today, but for every season of our life.'}
              </EditableText>
              <div onClick={e => openImg(e,['photos',2],'url')}>
                <EditablePhoto src={photo(2)} alt="promise" style={{ background:'none', outline:'none' }} stampStyle={{ background:'#fff', padding:'8px 8px 22px' }} innerStyle={{ width:220, height:250 }}/>
              </div>
            </div>
            <div style={{ flex:1, display:'flex', flexDirection:'column', gap:20, alignItems:'flex-end' }}>
              <div onClick={e => openImg(e,['photos',3],'url')}>
                <EditablePhoto src={photo(3)} alt="promise 2" style={{ background:'none', outline:'none' }} stampStyle={{ background:'#fff', padding:'8px 8px 22px' }} innerStyle={{ width:220, height:250 }}/>
              </div>
              <EditableText onClick={e => openTxt(e,['pageContent','monthsary'],'defaultMessage','Closing message',true)} tag="p" style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontSize:16, lineHeight:1.75, color:'#5a3a2a', margin:0, maxWidth:340, textAlign:'right' }}>
                {couple.pageContent?.monthsary?.defaultMessage || 'Not just in the bright seasons, but in the cold ones too. I promise to love you through every moment we face.'}
              </EditableText>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   PAGE: GALLERY  (ButterflyPhotos style)
═══════════════════════════════════════ */
function GalleryPage({ couple, photo, openImg, openTxt, pc }) {
  const [slide, setSlide] = useState(0);
  const SLIDES = ['Gallery Wall', 'Our Story', 'Timeline', 'Collection'];

  return (
    <div style={{ fontFamily:"'Georgia','Times New Roman',serif" }}>
      {/* nav */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 16px', background:'rgba(0,0,0,0.5)', borderBottom:'1px solid rgba(210,170,100,0.1)' }}>
        <button onClick={() => setSlide(s => (s-1+SLIDES.length)%SLIDES.length)} style={{ background:'rgba(4,1,1,0.85)', border:'1px solid rgba(210,165,60,0.45)', borderRadius:20, padding:'5px 12px', color:'#f0d878', cursor:'pointer', display:'flex', alignItems:'center', gap:5, fontSize:'0.8rem' }}><ChevronLeft size={14}/></button>
        <span style={{ fontSize:'0.75rem', color:'rgba(240,210,140,0.55)', fontFamily:'system-ui,sans-serif' }}>{SLIDES[slide]} ({slide+1}/{SLIDES.length})</span>
        <button onClick={() => setSlide(s => (s+1)%SLIDES.length)} style={{ background:'rgba(4,1,1,0.85)', border:'1px solid rgba(210,165,60,0.45)', borderRadius:20, padding:'5px 12px', color:'#f0d878', cursor:'pointer', display:'flex', alignItems:'center', gap:5, fontSize:'0.8rem' }}><ChevronRight size={14}/></button>
      </div>

      {/* Gallery Wall */}
      {slide === 0 && (
        <div style={{ background:'url(/bggallery.png) center/cover no-repeat', backgroundImage:'url(/bggallery.png),linear-gradient(135deg,#1a0010,#2a0018)', minHeight:'75vh', display:'flex', alignItems:'center', justifyContent:'center', gap:20, padding:'40px 60px', boxSizing:'border-box' }}>
          <div style={{ flex:'0 0 18%', display:'flex', flexDirection:'column', gap:14 }}>
            {[0,2].map(i => (
              <div key={i} onClick={e => openImg(e,['photos',i],'url')} style={{ cursor:'pointer', position:'relative', transform: i===0?'rotate(-1.5deg)':'rotate(1deg)' }}>
                <div style={{ background:'rgba(6,1,1,0.85)', border:'2px solid rgba(210,165,60,0.5)', padding:8, boxShadow:'0 4px 20px rgba(0,0,0,0.8)' }}>
                  <img src={photo(i)||'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=300&q=60'} alt="" style={{ width:140, height:110, objectFit:'cover', display:'block' }} onError={e=>e.target.src='https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=300&q=60'}/>
                </div>
                <div style={{ position:'absolute', inset:0, background:'rgba(233,30,140,0)', transition:'background 0.15s', display:'flex', alignItems:'center', justifyContent:'center' }} onMouseEnter={e=>e.currentTarget.style.background='rgba(233,30,140,0.35)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(233,30,140,0)'}>
                  <Camera size={20} color="rgba(255,255,255,0.8)" style={{ opacity:0 }} className="gallery-cam"/>
                </div>
              </div>
            ))}
          </div>
          {/* Center large frame */}
          <div style={{ flex:'0 0 34%', maxWidth:320, position:'relative' }} onClick={e => openImg(e,['photos',4],'url')}>
            <div style={{ background:'rgba(6,1,1,0.85)', border:'2px solid rgba(210,165,60,0.5)', padding:10, boxShadow:'0 8px 40px rgba(0,0,0,0.9)', cursor:'pointer', position:'relative' }}>
              <img src={photo(4)||photo(0)} alt="" style={{ width:'100%', height:280, objectFit:'cover', display:'block' }} onError={e=>e.target.src='https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&q=60'}/>
              <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.42)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', gap:4 }}>
                <EditableText onClick={e => openTxt(e,['pageContent','memories'],'title','Gallery title')} tag="h1" style={{ fontFamily:"'Georgia',serif", fontSize:'clamp(28px,4vw,52px)', fontWeight:700, color:'#f5e8b0', margin:0, textShadow:'0 2px 12px rgba(0,0,0,0.8)', letterSpacing:'0.04em' }}>
                  {pc?.memories?.title || 'OUR MEMORIES'}
                </EditableText>
                <p style={{ fontFamily:"'Georgia',serif", fontSize:11, color:'rgba(240,210,140,0.7)', letterSpacing:'0.18em', textTransform:'uppercase', margin:0 }}>{couple.name1} &amp; {couple.name2}</p>
              </div>
              <div style={{ position:'absolute', inset:0, background:'rgba(233,30,140,0)', transition:'background 0.15s', display:'flex', alignItems:'center', justifyContent:'center' }} onMouseEnter={e=>e.currentTarget.style.background='rgba(233,30,140,0.25)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(233,30,140,0)'}/>
            </div>
          </div>
          <div style={{ flex:'0 0 18%', display:'flex', flexDirection:'column', gap:14 }}>
            {[1,3].map(i => (
              <div key={i} onClick={e => openImg(e,['photos',i],'url')} style={{ cursor:'pointer', transform: i===1?'rotate(1.5deg)':'rotate(-1deg)' }}>
                <div style={{ background:'rgba(6,1,1,0.85)', border:'2px solid rgba(210,165,60,0.5)', padding:8, boxShadow:'0 4px 20px rgba(0,0,0,0.8)' }}>
                  <img src={photo(i)||'https://images.unsplash.com/photo-1474552226712-ac0f0961a954?w=300&q=60'} alt="" style={{ width:140, height:110, objectFit:'cover', display:'block' }} onError={e=>e.target.src='https://images.unsplash.com/photo-1474552226712-ac0f0961a954?w=300&q=60'}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Our Story */}
      {slide === 1 && (
        <div style={{ background:'url(/bggallery.png) center/cover,linear-gradient(135deg,#1a0010,#2a0018)', minHeight:'75vh', display:'flex', alignItems:'center', justifyContent:'center', gap:28, padding:'40px 60px', boxSizing:'border-box', flexWrap:'wrap' }}>
          {[0,2,4].map((photoIdx,i) => (
            <div key={i} onClick={e => openImg(e,['photos',photoIdx],'url')} style={{ cursor:'pointer' }}>
              <div style={{ background:'rgba(6,1,1,0.85)', border:'2px solid rgba(210,165,60,0.45)', padding:8, boxShadow:'0 6px 30px rgba(0,0,0,0.85)', transform:`rotate(${[-1.5,0,1.5][i]}deg)` }}>
                <img src={photo(photoIdx)} alt="" style={{ width:160, height:200, objectFit:'cover', display:'block' }} onError={e=>e.target.src='https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=300&q=60'}/>
                <EditableText onClick={e => { e.stopPropagation(); openTxt(e,['photos',photoIdx],'caption','Caption'); }} tag="p" style={{ fontFamily:'system-ui,sans-serif', fontSize:11, color:'rgba(240,210,140,0.7)', letterSpacing:'0.14em', textTransform:'uppercase', margin:'8px 0 4px', textAlign:'center' }}>
                  {couple.photos?.[photoIdx]?.caption || 'Click to add caption'}
                </EditableText>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Timeline */}
      {slide === 2 && (
        <div style={{ background:'url(/bggallery.png) center/cover,linear-gradient(135deg,#1a0010,#2a0018)', minHeight:'75vh', display:'flex', alignItems:'center', justifyContent:'center', gap:0, padding:'40px 60px', boxSizing:'border-box' }}>
          <div style={{ flex:'0 0 30%', paddingRight:28 }}>
            <EditableText onClick={e => openTxt(e,['pageContent','memories'],'title','Title')} tag="h2" style={{ fontFamily:"'Georgia',serif", fontSize:'clamp(22px,3vw,38px)', fontWeight:700, color:'#fff8e8', margin:'0 0 10px', textShadow:'0 2px 10px rgba(0,0,0,0.95)' }}>
              {pc?.memories?.title || 'Moments in Time'}
            </EditableText>
            <EditableText onClick={e => openTxt(e,['pageContent','memories'],'subtitle','Subtitle')} tag="p" style={{ fontFamily:"'Georgia',serif", fontSize:13, lineHeight:1.7, color:'#f5edd8', margin:0, textShadow:'0 1px 6px rgba(0,0,0,0.95)' }}>
              {pc?.memories?.subtitle || 'Every photo tells our story'}
            </EditableText>
          </div>
          <div style={{ flex:'0 0 26%', padding:'0 8px', borderLeft:'1px solid rgba(180,140,70,0.2)', borderRight:'1px solid rgba(180,140,70,0.2)' }} onClick={e => openImg(e,['photos',2],'url')}>
            <div style={{ background:'rgba(6,1,1,0.85)', border:'2px solid rgba(210,165,60,0.45)', padding:8, boxShadow:'0 6px 30px rgba(0,0,0,0.85)' }}>
              <img src={photo(2)} alt="" style={{ width:'100%', height:220, objectFit:'cover', display:'block' }} onError={e=>e.target.src='https://images.unsplash.com/photo-1516589091380-5d8e87df6999?w=300&q=60'}/>
            </div>
          </div>
          <div style={{ flex:'0 0 30%', paddingLeft:28 }}>
            {(couple.timeline||[]).slice(0,3).map((item,i) => (
              <div key={i} style={{ padding:'12px 0', borderBottom:'1px solid rgba(180,140,70,0.12)' }}>
                <p style={{ fontFamily:"'Georgia',serif", fontSize:28, fontWeight:700, color:'#fff8e8', margin:'0 0 2px', textShadow:'0 2px 8px rgba(0,0,0,0.95)' }}>{item.date ? new Date(item.date).getFullYear() : '—'}</p>
                <p style={{ fontSize:11, letterSpacing:'0.2em', color:'#f5d878', margin:0, textTransform:'uppercase', textShadow:'0 1px 6px rgba(0,0,0,0.95)' }}>{item.title}</p>
              </div>
            ))}
            {(!couple.timeline||couple.timeline.length===0) && <p style={{ color:'rgba(240,210,140,0.4)', fontSize:13 }}>Add timeline events in the Timeline tab</p>}
          </div>
        </div>
      )}

      {/* Collection */}
      {slide === 3 && (
        <div style={{ background:'url(/bggallery.png) center/cover,linear-gradient(135deg,#1a0010,#2a0018)', minHeight:'75vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20, padding:'40px 60px', boxSizing:'border-box' }}>
          <EditableText onClick={e => openTxt(e,['pageContent','memories'],'title','Collection title')} tag="h2" style={{ fontFamily:"'Georgia',serif", fontSize:'clamp(22px,3vw,42px)', fontWeight:700, color:'#fff8e8', textAlign:'center', textShadow:'0 2px 10px rgba(0,0,0,0.95)', margin:0 }}>
            {pc?.memories?.title || 'Our Memories Collection'}
          </EditableText>
          <div style={{ display:'flex', gap:24, alignItems:'center', justifyContent:'center', flexWrap:'wrap' }}>
            {[0,2,4].map((photoIdx,i) => (
              <div key={i} onClick={e => openImg(e,['photos',photoIdx],'url')} style={{ cursor:'pointer' }}>
                <div style={{ background:'rgba(6,1,1,0.85)', border:'2px solid rgba(210,165,60,0.45)', padding:8, boxShadow:'0 6px 30px rgba(0,0,0,0.85)', transform:`rotate(${[-1,0,1.5][i]}deg)` }}>
                  <img src={photo(photoIdx)} alt="" style={{ width:180, height:i===1?240:200, objectFit:'cover', display:'block' }} onError={e=>e.target.src='https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=300&q=60'}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   PAGE: SONGS  (ButterflyStory style)
═══════════════════════════════════════ */
function SongsPage({ couple, openTxt }) {
  const song = couple.song || {};
  const songs = couple.songs?.length ? couple.songs : (song.title ? [song] : []);
  const [active, setActive] = useState(0);
  const cur = songs[active] || {};

  return (
    <div style={{ background:'#d6cfa8', padding:'24px 16px 40px', display:'flex', flexDirection:'column', alignItems:'center', minHeight:'75vh', fontFamily:"'Georgia',serif" }}>
      {/* outer cream frame */}
      <div style={{ width:'100%', maxWidth:860, background:'#e8e0c0', borderRadius:14, padding:10, boxShadow:'0 4px 24px rgba(0,0,0,0.25)', border:'1px solid rgba(180,160,100,0.4)' }}>
        {/* dark red board */}
        <div style={{ position:'relative', background:'#7a0c0c', borderRadius:10, display:'grid', gridTemplateColumns:'90px 1fr 200px', minHeight:360, overflow:'hidden' }}>
          {/* Board depth */}
          <div style={{ position:'absolute', inset:0, borderRadius:10, pointerEvents:'none', boxShadow:'inset 0 0 60px rgba(0,0,0,0.35)', zIndex:2 }}/>

          {/* Left stickers */}
          <div style={{ position:'relative', zIndex:3, display:'flex', flexDirection:'column', alignItems:'center', gap:6, padding:'16px 6px 60px 8px' }}>
            <div style={{ fontSize:44, filter:'drop-shadow(0 3px 6px rgba(0,0,0,0.55))', lineHeight:1 }}>🤍</div>
            <div style={{ fontSize:34, filter:'drop-shadow(0 3px 6px rgba(0,0,0,0.6))', transform:'rotate(-5deg)' }}>📼</div>
            <div style={{ fontSize:28, filter:'drop-shadow(0 3px 6px rgba(0,0,0,0.6))' }}>📷</div>
            <div style={{ fontSize:44, marginTop:'auto', filter:'drop-shadow(0 4px 10px rgba(0,0,0,0.6))', lineHeight:1 }}>🧸</div>
            <div style={{ fontSize:26, filter:'drop-shadow(0 2px 5px rgba(0,0,0,0.5))', transform:'rotate(-5deg)' }}>🍓</div>
          </div>

          {/* Center */}
          <div style={{ position:'relative', zIndex:3, padding:'22px 14px 18px 6px', display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ lineHeight:1.1, marginBottom:4 }}>
              <EditableText onClick={e => openTxt(e,['pageContent','song'],'title','Song section title')} tag="span" style={{ fontFamily:"'Georgia',serif", fontStyle:'italic', fontSize:'clamp(1.7rem,3.5vw,2.4rem)', color:'#fff', textShadow:'0 2px 10px rgba(0,0,0,0.4)' }}>
                {couple.pageContent?.song?.title?.split(' ')[0] || 'Songs'}
              </EditableText>
              <span style={{ fontFamily:"'Georgia',serif", fontSize:'clamp(1.2rem,2.5vw,1.7rem)', fontWeight:700, color:'#fff', marginLeft:8 }}>
                {(couple.pageContent?.song?.title||'Songs that Remind Me of You').split(' ').slice(1).join(' ')}
              </span>
            </div>

            {/* Song cards */}
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {songs.length > 0 ? songs.map((s,i) => (
                <div key={i} onClick={() => setActive(i)} style={{ display:'flex', alignItems:'center', gap:10, background: active===i ? 'rgba(130,30,50,0.75)' : 'rgba(55,55,65,0.88)', border:`1px solid ${active===i ? 'rgba(255,180,180,0.2)' : 'rgba(255,255,255,0.06)'}`, borderRadius:8, padding:'8px 10px', cursor:'pointer' }}>
                  <div style={{ width:48, height:48, borderRadius:5, background:'linear-gradient(135deg,#c97b84,#f2b8c0)', flexShrink:0 }}/>
                  <div style={{ flex:1, minWidth:0 }}>
                    <EditableText onClick={e => { e.stopPropagation(); openTxt(e,['song'],'title','Song title'); }} style={{ fontSize:'0.82rem', fontWeight:600, color:'rgba(255,235,235,0.92)', display:'block', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                      {s.title || 'Add song title'}
                    </EditableText>
                    <EditableText onClick={e => { e.stopPropagation(); openTxt(e,['song'],'artist','Artist name'); }} style={{ fontSize:'0.7rem', color:'rgba(200,180,180,0.55)', display:'block', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                      {s.artist || 'Artist'}
                    </EditableText>
                  </div>
                  <div style={{ width:26, height:26, borderRadius:'50%', background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.18)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <div style={{ width:0, height:0, borderTop:'4px solid transparent', borderBottom:'4px solid transparent', borderLeft:'7px solid rgba(255,230,230,0.85)', marginLeft:2 }}/>
                  </div>
                </div>
              )) : (
                <p style={{ color:'rgba(255,200,200,0.4)', fontSize:'0.85rem' }}>Add your song in the Song tab</p>
              )}
            </div>

            {/* Spotify embed */}
            {cur.embedUrl && (
              <div style={{ borderRadius:10, overflow:'hidden', border:'1px solid rgba(255,180,180,0.12)' }}>
                <iframe src={cur.embedUrl} width="100%" height="80" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media" loading="lazy" style={{ display:'block', borderRadius:10 }}/>
              </div>
            )}
          </div>

          {/* Right: vinyl */}
          <div style={{ position:'relative', zIndex:3, display:'flex', alignItems:'center', justifyContent:'center', padding:'12px 12px 12px 4px' }}>
            <div style={{ fontSize:52, position:'absolute', top:6, left:-2, filter:'drop-shadow(0 4px 8px rgba(0,0,0,0.5))', transform:'rotate(-10deg)', lineHeight:1, zIndex:5, pointerEvents:'none' }}>🌸</div>
            <div style={{ background:'#e8e0c6', borderRadius:4, padding:'10px 10px 32px', boxShadow:'5px 6px 22px rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', width:'100%', boxSizing:'border-box' }}>
              <svg viewBox="0 0 240 240" style={{ width:'100%', aspectRatio:'1', animation:'spin 7s linear infinite', filter:'drop-shadow(0 6px 20px rgba(0,0,0,0.85))' }}>
                <defs><radialGradient id="vg2" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#2a2a2a"/><stop offset="100%" stopColor="#0a0a0a"/></radialGradient></defs>
                <circle cx="120" cy="120" r="118" fill="url(#vg2)"/>
                {[108,100,92,84,76,68,60,52].map(r => <circle key={r} cx="120" cy="120" r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1.5"/>)}
                <circle cx="120" cy="120" r="38" fill="#a01515"/>
                <circle cx="120" cy="120" r="5" fill="#fff"/>
              </svg>
            </div>
            <div style={{ fontSize:30, position:'absolute', bottom:8, right:8, filter:'drop-shadow(0 3px 6px rgba(0,0,0,0.5))', transform:'rotate(10deg)', lineHeight:1, zIndex:5, pointerEvents:'none' }}>🌸🌷</div>
          </div>
          <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   PAGE: WISHES  (ButterflyWish style)
═══════════════════════════════════════ */
function WishesPage({ couple, openTxt, pc }) {
  const capsules = couple.timeCapsule || [];
  const today = new Date();

  return (
    <div style={{ minHeight:'75vh', background:'linear-gradient(160deg,#060010 0%,#0e0028 60%,#060010 100%)', padding:'0 0 60px', fontFamily:"'Georgia',serif", color:'#eee6fa' }}>
      <div style={{ textAlign:'center', padding:'40px 24px 28px', display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
        <EditableText onClick={e => openTxt(e,['pageContent','capsule'],'title','Wishes title')} tag="h1" style={{ fontSize:34, fontWeight:400, letterSpacing:'0.02em', color:'#e2d8f8', margin:0 }}>
          {pc?.capsule?.title || 'Wishes'}
        </EditableText>
        <EditableText onClick={e => openTxt(e,['pageContent','capsule'],'subtitle','Wishes subtitle')} tag="p" style={{ fontSize:14, color:'rgba(220,210,248,0.5)', margin:0, fontStyle:'italic' }}>
          {pc?.capsule?.subtitle || 'Little wishes sent to you on butterfly wings'}
        </EditableText>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:16, maxWidth:520, margin:'0 auto', padding:'0 24px' }}>
        {capsules.length > 0 ? capsules.map((item,i) => {
          const isLocked = new Date(item.unlockDate) > today;
          return (
            <div key={i} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(180,160,255,0.18)', borderRadius:16, padding:'24px 28px', boxShadow:'0 4px 20px rgba(0,0,0,0.3)' }}>
              <EditableText onClick={e => openTxt(e,['timeCapsule'],'dummy','Capsule title')} tag="h2" style={{ fontSize:20, fontWeight:400, color:'#e2d8f8', margin:'0 0 10px' }}>
                {isLocked ? '🔒 ' : '💌 '}{item.title}
              </EditableText>
              {isLocked
                ? <p style={{ fontSize:13, color:'rgba(180,160,255,0.45)', margin:0, fontStyle:'italic' }}>Opens on {item.unlockDate}</p>
                : <p style={{ fontSize:14, lineHeight:1.8, color:'rgba(238,230,250,0.78)', margin:0, fontStyle:'italic' }}>"{item.content}"</p>
              }
            </div>
          );
        }) : (
          <div style={{ background:'rgba(255,255,255,0.04)', border:'1px dashed rgba(180,160,255,0.15)', borderRadius:16, padding:'48px 24px', textAlign:'center' }}>
            <div style={{ fontSize:'2.5rem', marginBottom:12 }}>🦋</div>
            <EditableText onClick={e => openTxt(e,['pageContent','capsule'],'subtitle','Empty message')} tag="p" style={{ color:'rgba(220,210,248,0.4)', margin:0, fontSize:'0.9rem' }}>
              Add time capsule messages in the Time Capsule tab.
            </EditableText>
          </div>
        )}
      </div>
    </div>
  );
}
