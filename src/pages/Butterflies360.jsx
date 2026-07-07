import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { useApp } from '../context/AppContext';
import { useImageUrl } from '../utils/useImageUrl';
import '../styles/pages/Butterflies360.css';


const SPECIES = [
  { id: 0, label: 'Letters', emoji: '💌', uOffset: 0.00 },
  { id: 1, label: 'Photos',  emoji: '📸', uOffset: 0.25 },
  { id: 2, label: 'Songs',   emoji: '🎵', uOffset: 0.50 },
  { id: 3, label: 'Wishes',  emoji: '⭐', uOffset: 0.75 },
];


const CFG = {
  count:            80,       
  wingsSpeed:       2.0,
  wingsDisp:        1.6,
  noiseCoordScale:  0.003,
  noiseTimeCoef:    0.002,
  noiseIntensity:   0.06,
  attractionR1:     180,
  attractionR2:     350,
  maxVelocity:      1.4,
  spread:           500,
  textureCount:     4,
};


function seededRand(seed) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}


function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
function lrp(a, b, t) { return a + t * (b - a); }
const P = new Uint8Array(512);
(function () {
  const base = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [base[i], base[j]] = [base[j], base[i]];
  }
  for (let i = 0; i < 512; i++) P[i] = base[i & 255];
})();
function grad(h, x, y, z) {
  const g = h & 15, u = g < 8 ? x : y, v = g < 4 ? y : g === 12 || g === 14 ? x : z;
  return ((g & 1) ? -u : u) + ((g & 2) ? -v : v);
}
function noise3(x, y, z) {
  const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
  x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
  const u = fade(x), v = fade(y), w = fade(z);
  const A = P[X] + Y, B = P[X + 1] + Y;
  return lrp(
    lrp(lrp(grad(P[A+Z],x,y,z),      grad(P[B+Z],x-1,y,z),      u),
        lrp(grad(P[A+Z+1],x,y-1,z),  grad(P[B+Z+1],x-1,y-1,z),  u), v),
    lrp(lrp(grad(P[A+Z+1],x,y,z-1), grad(P[B+Z+1],x-1,y,z-1),  u),
        lrp(grad(P[A+Z+2],x,y-1,z-1),grad(P[B+Z+2],x-1,y-1,z-1),u), v),
    w);
}


const VERT = `
  uniform float uTime;
  uniform float uSpeed;
  uniform float uDisp;
  uniform float uUOffset;

  varying vec2 vUv;
  varying vec3 vNormal;

  void main() {
    vUv     = vec2(uv.x * 0.25 + uUOffset, uv.y);
    vNormal = normalMatrix * normal;

    vec3 pos = position;

    // abs(sin) gives a snappy up-stroke and smooth down-stroke
    float beat = abs(sin(uTime * uSpeed * 3.14159265));

    // Both wings lift in the same Y direction (geometry is flat/horizontal)
    // abs(pos.x) = distance from body spine → tips move most, body stays fixed
    pos.y += abs(pos.x) * beat * uDisp;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;


const FRAG = `
  uniform sampler2D uTex;
  uniform vec3 uAmbient;
  uniform vec3 uDirLight;
  uniform vec3 uDirColor;

  varying vec2 vUv;
  varying vec3 vNormal;

  void main() {
    vec4 t = texture2D(uTex, vUv);
    if (t.a < 0.5) discard;
    vec3 n    = normalize(vNormal);
    float d   = max(dot(n, normalize(uDirLight)), 0.0);
    gl_FragColor = vec4(t.rgb * (uAmbient + uDirColor * d), t.a);
  }
`;


function Overlay({ overlayHint }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => { const t = setTimeout(() => setVisible(false), 4000); return () => clearTimeout(t); }, []);
  return (
    <div className={`bf360-overlay ${visible ? '' : 'bf360-overlay--hidden'}`}>
      <div className="bf360-overlay-inner">
        <div className="bf360-overlay-heart">🦋</div>
        <p className="bf360-overlay-hint">{overlayHint}</p>
      </div>
    </div>
  );
}


function NoWebGL({ onNavigate }) {
  return (
    <div className="bf360-no-webgl">
      <div className="bf360-no-webgl-inner">
        <span style={{ fontSize: '3rem' }}>🦋</span>
        <h2>WebGL not available</h2>
        <p>Enable hardware acceleration or try a different browser.</p>
        <div className="bf360-no-webgl-nav">
          {SPECIES.map(sp => (
            <button key={sp.id} onClick={() => onNavigate(sp.id)}>{sp.emoji} {sp.label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}


export default function Butterflies360() {
  const navigate = useNavigate();
  const { coupleAuth, getCoupleBySlug } = useApp();
  const couple  = getCoupleBySlug(coupleAuth?.slug);
  const name1   = couple?.name1 || 'You';
  const name2   = couple?.name2 || 'Me';
  const bf360   = couple?.pageContent?.butterfly360;
  const overlayHint  = bf360?.overlayHint  || 'Drag to look around · tap a butterfly';
  const panoBgKey    = bf360?.bgImage      || '/Flower.png';
  const panoBg       = useImageUrl(panoBgKey) || panoBgKey; 

  const mountRef = useRef(null);
  const [noWebGL, setNoWebGL] = useState(false);

  const drag    = useRef(null);
  const lon     = useRef(0);
  const lat     = useRef(0);
  const fov     = useRef(75);
  const [hoverLabel, setHoverLabel] = useState(null); 

  const handleNavigate = useCallback(id => navigate(`/butterfly/${id}`), [navigate]);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    
    const tc = document.createElement('canvas');
    if (!tc.getContext('webgl') && !tc.getContext('experimental-webgl')) {
      setNoWebGL(true); return;
    }

    
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));  
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;';
    el.appendChild(renderer.domElement);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(fov.current, el.clientWidth / el.clientHeight, 0.1, 2000);
    camera.position.set(0, 0, 0.01);

    
    const panoGeo = new THREE.SphereGeometry(800, 64, 48);
    panoGeo.scale(-1, 1, 1);
    const loader  = new THREE.TextureLoader();
    const panoTex = loader.load(panoBg);
    panoTex.colorSpace       = THREE.SRGBColorSpace;
    panoTex.minFilter        = THREE.LinearMipmapLinearFilter;  
    panoTex.magFilter        = THREE.LinearFilter;
    panoTex.anisotropy       = renderer.capabilities.getMaxAnisotropy(); 
    panoTex.generateMipmaps  = true;
    const panoMat = new THREE.MeshBasicMaterial({ map: panoTex });
    scene.add(new THREE.Mesh(panoGeo, panoMat));

    
    const bfTex = new THREE.TextureLoader().load('/butterflies.png');
    bfTex.colorSpace = THREE.SRGBColorSpace;

    
    const makeBfly = (i, rng2, wingSize, radiusMin, radiusMax, elevRange, speedMult) => {
      const sp    = SPECIES[i % CFG.textureCount];
      const speed = CFG.wingsSpeed + (rng2() - 0.5) * 0.8;

      const geo = new THREE.PlaneGeometry(wingSize, wingSize * 0.5, 16, 16);
      geo.rotateX(-Math.PI / 2);

      const mat = new THREE.ShaderMaterial({
        uniforms: {
          uTime:    { value: 0 },
          uSpeed:   { value: speed },
          uDisp:    { value: CFG.wingsDisp },
          uUOffset: { value: sp.uOffset },
          uTex:     { value: bfTex },
          uAmbient: { value: new THREE.Color(0xffffff).multiplyScalar(0.65) },
          uDirLight:{ value: new THREE.Vector3(1, 2, 1).normalize() },
          uDirColor:{ value: new THREE.Color(0xffffff) },
        },
        vertexShader:   VERT,
        fragmentShader: FRAG,
        side:           THREE.DoubleSide,
        transparent:    true,
        depthWrite:     false,
      });

      const mesh         = new THREE.Mesh(geo, mat);
      const orbitRadius    = radiusMin + rng2() * (radiusMax - radiusMin);
      const orbitElevation = (rng2() - 0.5) * elevRange;
      const orbitSpeed     = (0.14 + rng2() * 0.18) * speedMult * (rng2() > 0.5 ? 1 : -1);
      const orbitAngle     = rng2() * Math.PI * 2;
      const wobbleAmp      = 15 + rng2() * 35;
      const wobbleSpeed    = 0.3 + rng2() * 0.7;
      const wobblePhase    = rng2() * Math.PI * 2;

      mesh.position.set(
        orbitRadius * Math.sin(orbitAngle),
        orbitElevation,
        orbitRadius * Math.cos(orbitAngle)
      );
      mesh.rotation.y = orbitAngle + Math.PI * 0.5;
      scene.add(mesh);

      return {
        mesh, mat, sp,
        orbitRadius, orbitElevation, orbitSpeed,
        orbitAngle, wobbleAmp, wobbleSpeed, wobblePhase,
        phaseOff: rng2() * 100,
      };
    };

    
    const rng  = seededRand(42);
    const rng2 = seededRand(137); 
    const bflies = [
      ...Array.from({ length: 40 }, (_, i) => makeBfly(i,    rng,  22, 60,  280, 160, 1.0)),
      ...Array.from({ length: 15 }, (_, i) => makeBfly(i+40, rng2,  9, 300, 650, 220, 0.6)),
    ];

    const meshToSp = new Map(bflies.map(b => [b.mesh, b.sp]));

    
    const onResize = () => {
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(el.clientWidth, el.clientHeight);
    };
    window.addEventListener('resize', onResize);

    
    const raycaster = new THREE.Raycaster();
    let rafId;

    const render = (ts) => {
      const time = ts * 0.001;

      
      const latR = THREE.MathUtils.degToRad(lat.current);
      const lonR = THREE.MathUtils.degToRad(lon.current);
      camera.lookAt(
        Math.cos(latR) * Math.sin(lonR),
        Math.sin(latR),
        Math.cos(latR) * Math.cos(lonR)
      );
      camera.fov = fov.current;
      camera.updateProjectionMatrix();

      
      bflies.forEach(b => {
        b.mat.uniforms.uTime.value = time + b.phaseOff;

        
        b.orbitAngle += b.orbitSpeed * 0.01;

        
        const wobbleY   = Math.sin(time * b.wobbleSpeed + b.wobblePhase) * b.wobbleAmp;
        const wobbleDy  = Math.cos(time * b.wobbleSpeed + b.wobblePhase) * b.wobbleAmp * b.wobbleSpeed;

        const x = b.orbitRadius * Math.sin(b.orbitAngle);
        const z = b.orbitRadius * Math.cos(b.orbitAngle);
        const y = b.orbitElevation + wobbleY;

        b.mesh.position.set(x, y, z);

        

        
        b.mesh.rotation.y = Math.atan2(x, z) + Math.PI * 0.5 * Math.sign(b.orbitSpeed) + Math.PI;

        
        b.mesh.rotation.z = b.orbitSpeed * 1.2;

        
        b.mesh.rotation.x = -wobbleDy * 0.018;
      });

      renderer.render(scene, camera);
      rafId = requestAnimationFrame(render);
    };
    rafId = requestAnimationFrame(render);

    
    const onDown = (e) => {
      if (e.button !== 0) return;
      drag.current = { startX: e.clientX, startY: e.clientY, startLon: lon.current, startLat: lat.current };
    };
    const onMove = (() => {
      let lastRaycast = 0;
      return (e) => {
      
      if (drag.current) {
        lon.current = drag.current.startLon + (e.clientX - drag.current.startX) * 0.15;
        
        lat.current = Math.max(-85, Math.min(85,
          drag.current.startLat + (e.clientY - drag.current.startY) * 0.15
        ));
      }
      
      const now = performance.now();
      if (now - lastRaycast < 50) return;
      lastRaycast = now;
      const rect = renderer.domElement.getBoundingClientRect();
      const ndcX =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
      const ndcY = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
      raycaster.setFromCamera({ x: ndcX, y: ndcY }, camera);
      const hits = raycaster.intersectObjects(bflies.map(b => b.mesh));
      if (hits.length > 0) {
        const sp = meshToSp.get(hits[0].object);
        if (sp) {
          setHoverLabel({ x: e.clientX, y: e.clientY, sp });
          renderer.domElement.style.cursor = 'pointer';
        }
      } else {
        setHoverLabel(null);
        renderer.domElement.style.cursor = drag.current ? 'grabbing' : 'grab';
      }
    };
    })();
    const onUp = (e) => {
      if (drag.current) {
        const moved = Math.hypot(e.clientX - drag.current.startX, e.clientY - drag.current.startY);
        if (moved < 10) {
          const rect = renderer.domElement.getBoundingClientRect();
          raycaster.setFromCamera({
            x:  ((e.clientX - rect.left) / rect.width)  * 2 - 1,
            y: -((e.clientY - rect.top)  / rect.height) * 2 + 1,
          }, camera);
          const hits = raycaster.intersectObjects(bflies.map(b => b.mesh));
          if (hits.length) { const sp = meshToSp.get(hits[0].object); if (sp) navigate(`/butterfly/${sp.id}`); }
        }
      }
      drag.current = null;
      renderer.domElement.style.cursor = 'grab';
    };
    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);

    
    const onWheel = (e) => {
      e.preventDefault();
      fov.current = Math.max(30, Math.min(110, fov.current + e.deltaY * 0.05));
    };
    el.addEventListener('wheel', onWheel, { passive: false });

    
    let td = null, lp = null;
    const onTS = (e) => {
      if (e.touches.length === 1) td = { startX: e.touches[0].clientX, startY: e.touches[0].clientY, startLon: lon.current, startLat: lat.current };
      if (e.touches.length === 2) lp = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    };
    const onTM = (e) => {
      e.preventDefault();
      if (e.touches.length === 1 && td) {
        lon.current = td.startLon + (e.touches[0].clientX - td.startX) * 0.15;
        lat.current = Math.max(-85, Math.min(85,
          td.startLat + (e.touches[0].clientY - td.startY) * 0.15
        ));
      }
      if (e.touches.length === 2 && lp !== null) {
        const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        fov.current = Math.max(30, Math.min(110, fov.current - (d - lp) * 0.1));
        lp = d;
      }
    };
    const onTE = (e) => {
      if (td) {
        const t = e.changedTouches[0];
        if (Math.hypot(t.clientX - td.startX, t.clientY - td.startY) < 10) {
          const rect = renderer.domElement.getBoundingClientRect();
          raycaster.setFromCamera({
            x:  ((t.clientX - rect.left) / rect.width)  * 2 - 1,
            y: -((t.clientY - rect.top)  / rect.height) * 2 + 1,
          }, camera);
          const hits = raycaster.intersectObjects(bflies.map(b => b.mesh));
          if (hits.length) { const sp = meshToSp.get(hits[0].object); if (sp) navigate(`/butterfly/${sp.id}`); }
        }
      }
      td = null; lp = null;
    };
    el.addEventListener('touchstart', onTS, { passive: true });
    el.addEventListener('touchmove',  onTM, { passive: false });
    el.addEventListener('touchend',   onTE);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTS);
      el.removeEventListener('touchmove', onTM);
      el.removeEventListener('touchend', onTE);
      renderer.dispose();
      bflies.forEach(b => { b.mesh.geometry.dispose(); b.mat.dispose(); });
      panoGeo.dispose(); panoMat.dispose(); panoTex.dispose(); bfTex.dispose();
      if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement);
    };
  }, [navigate, panoBg]);

  if (noWebGL) return <NoWebGL onNavigate={handleNavigate} />;

  return (
    <div className="bf360-root">
      <div ref={mountRef} className="bf360-mount" />
      <div className="bf360-vignette" />
      <Overlay overlayHint={overlayHint} />

      {}
      {hoverLabel && (
        <div className="bf360-hover-label" style={{ left: hoverLabel.x, top: hoverLabel.y }}>
          <span className="bf360-hover-emoji">{hoverLabel.sp.emoji}</span>
          <span className="bf360-hover-text">{hoverLabel.sp.label}</span>
        </div>
      )}

      <div className="bf360-hint">🦋 drag to look around · scroll to zoom · click a butterfly</div>
      <button className="bf360-back" onClick={() => navigate(-1)} aria-label="Go back">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
        Back
      </button>
    </div>
  );
}
