// ─────────────────────────────────────────────────────────────
// LoveScroll.jsx
//
// Draws the decorative scroll (parchment + rollers + ribbon bow)
// using SVG. When clicked it "unrolls" to reveal a photo.
//
// Props:
//   unrolling - boolean: has the user clicked? if yes, open it
//   done      - boolean: unroll animation finished?
//   photoUrl  - optional image URL to show inside the scroll
// ─────────────────────────────────────────────────────────────

export default function LoveScroll({ unrolling, done, photoUrl }) {
  // ── Scroll size values that change when opening ──
  const bodyH    = unrolling ? 160 : 60;   // scroll body height
  const topRollY = unrolling ? -10 : 10;   // top roller slides up
  const botRollY = unrolling ? bodyH + 10 : bodyH - 10; // bottom slides down

  // Photo area dimensions (must match the parchment rect below)
  const photoX = 18;
  const photoY = 30;
  const photoW = 164;

  return (
    <div style={{ position: 'relative', width: 'min(340px, 48vw, 44vh)', height: 'min(408px, 57.6vw, 52.8vh)', margin: '0 auto' }}>
      <svg
        viewBox="50 0 100 190"
        style={{
          width: '100%',
          height: '100%',
          filter: 'drop-shadow(0 16px 48px rgba(233,30,140,0.5))',
          overflow: 'visible',
        }}
      >
        <defs>
          {/* Clip path: limits the photo to inside the parchment area */}
          <clipPath id="scrollPhotoClip">
            <rect x={photoX} y={photoY} width={photoW} height={bodyH} rx="4" />
          </clipPath>

          {/* Color gradients used below */}
          <linearGradient id="parchment" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2d0a1e" />
            <stop offset="100%" stopColor="#1a0616" />
          </linearGradient>
          <linearGradient id="roller" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#c2185b" />
            <stop offset="100%" stopColor="#880e4f" />
          </linearGradient>
          <radialGradient id="knob" cx="40%" cy="35%">
            <stop offset="0%" stopColor="#f48fb1" />
            <stop offset="100%" stopColor="#880e4f" />
          </radialGradient>
          <linearGradient id="ribbon" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f06292" />
            <stop offset="100%" stopColor="#ad1457" />
          </linearGradient>
          <linearGradient id="heartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff9ab5" />
            <stop offset="100%" stopColor="#e91e8c" />
          </linearGradient>
        </defs>

        {/* ── Parchment body (dark rectangle) ── */}
        <rect
          x="18" y="30"
          width="164"
          height={bodyH}
          rx="4"
          fill="url(#parchment)"
          style={{ transition: 'height 0.7s cubic-bezier(0.4,0,0.2,1)' }}
        />

        {/* ── Photo inside the scroll (only shows after opening) ── */}
        {unrolling && photoUrl && (
          <image
            href={photoUrl}
            x={photoX} y={photoY}
            width={photoW} height={bodyH}
            preserveAspectRatio="xMidYMid slice"
            clipPath="url(#scrollPhotoClip)"
            style={{ opacity: done ? 1 : 0, transition: 'opacity 0.8s ease 0.3s' }}
          />
        )}

        {/* ── Dark overlay on photo so rollers look clean on top ── */}
        {unrolling && photoUrl && (
          <rect
            x={photoX} y={photoY} width={photoW} height={bodyH} rx="4"
            fill="rgba(0,0,0,0.18)"
            clipPath="url(#scrollPhotoClip)"
            style={{ transition: 'height 0.7s cubic-bezier(0.4,0,0.2,1)', pointerEvents: 'none' }}
          />
        )}

        {/* ── Decorative lines (shown when no photo) ── */}
        {unrolling && !photoUrl &&
          [50, 65, 80, 95, 110, 125, 140, 155].map((ly, i) => (
            <line
              key={i}
              x1="32" y1={ly} x2="168" y2={ly}
              stroke="rgba(233,30,140,0.2)" strokeWidth="1"
              style={{
                opacity: done ? 1 : 0,
                transition: `opacity 0.3s ease ${0.4 + i * 0.05}s`,
              }}
            />
          ))
        }

        {/* ── Heart shape on the scroll when it's still closed ── */}
        {!unrolling && (
          <path
            d="M100 85 C100 85 84 74 84 64 C84 57 89 53 94 56
               C97 57.5 99 61 100 63 C101 61 103 57.5 106 56
               C111 53 116 57 116 64 C116 74 100 85 100 85Z"
            fill="url(#heartGrad)"
          />
        )}

        {/* ── "Love letter" text lines (no photo version) ── */}
        {unrolling && !photoUrl && (
          <>
            <text
              x="100" y="72"
              textAnchor="middle"
              fill="rgba(233,30,140,0.8)"
              fontSize="11" fontFamily="Georgia, serif" fontStyle="italic"
              style={{ opacity: done ? 1 : 0, transition: 'opacity 0.5s ease 0.8s' }}
            >
              To my forever love...
            </text>
            <text
              x="100" y="110"
              textAnchor="middle"
              fill="rgba(255,180,200,0.6)"
              fontSize="9" fontFamily="Georgia, serif"
              style={{ opacity: done ? 1 : 0, transition: 'opacity 0.5s ease 1s' }}
            >
              ♥ ♥ ♥
            </text>
          </>
        )}

        {/* ── Heart emoji at the bottom of the photo ── */}
        {unrolling && photoUrl && done && (
          <text
            x="100" y={photoY + bodyH - 12}
            textAnchor="middle"
            fill="rgba(255,220,240,0.95)"
            fontSize="10" fontFamily="Georgia, serif" fontWeight="bold"
            style={{
              opacity: 1,
              transition: 'opacity 0.6s ease 0.8s',
              filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.8))',
            }}
          >
            💕
          </text>
        )}

        {/* ── Top roller bar ── */}
        <rect
          x="10" y={topRollY + 28} width="180" height="20" rx="10"
          fill="url(#roller)"
          style={{ transition: 'y 0.7s cubic-bezier(0.4,0,0.2,1)' }}
        />
        <rect
          x="10" y={topRollY + 28} width="180" height="20" rx="10"
          fill="none" stroke="rgba(255,150,180,0.5)" strokeWidth="1"
          style={{ transition: 'y 0.7s cubic-bezier(0.4,0,0.2,1)' }}
        />
        {/* Top roller knobs (the round ends) */}
        <circle cx="16"  cy={topRollY + 38} r="7" fill="url(#knob)" style={{ transition: 'cy 0.7s cubic-bezier(0.4,0,0.2,1)' }} />
        <circle cx="184" cy={topRollY + 38} r="7" fill="url(#knob)" style={{ transition: 'cy 0.7s cubic-bezier(0.4,0,0.2,1)' }} />

        {/* ── Bottom roller bar ── */}
        <rect
          x="10" y={botRollY + 10} width="180" height="20" rx="10"
          fill="url(#roller)"
          style={{ transition: 'y 0.7s cubic-bezier(0.4,0,0.2,1)' }}
        />
        <rect
          x="10" y={botRollY + 10} width="180" height="20" rx="10"
          fill="none" stroke="rgba(255,150,180,0.5)" strokeWidth="1"
          style={{ transition: 'y 0.7s cubic-bezier(0.4,0,0.2,1)' }}
        />
        {/* Bottom roller knobs */}
        <circle cx="16"  cy={botRollY + 20} r="7" fill="url(#knob)" style={{ transition: 'cy 0.7s cubic-bezier(0.4,0,0.2,1)' }} />
        <circle cx="184" cy={botRollY + 20} r="7" fill="url(#knob)" style={{ transition: 'cy 0.7s cubic-bezier(0.4,0,0.2,1)' }} />

        {/* ── Ribbon bow (visible only when scroll is closed) ── */}
        {!unrolling && (
          <g>
            {/* Vertical ribbon strip */}
            <rect x="95" y="40" width="10" height={bodyH + 8} fill="url(#ribbon)" opacity="0.85" />
            {/* Horizontal ribbon strip */}
            <rect x="18" y="62" width="164" height="10" fill="url(#ribbon)" opacity="0.85" />
            {/* Left bow loop */}
            <ellipse cx="86" cy="67" rx="14" ry="8" fill="url(#ribbon)" transform="rotate(-30 86 67)" />
            {/* Right bow loop */}
            <ellipse cx="114" cy="67" rx="14" ry="8" fill="url(#ribbon)" transform="rotate(30 114 67)" />
            {/* Center knot */}
            <circle cx="100" cy="67" r="6" fill="#e91e8c" />
          </g>
        )}
      </svg>
    </div>
  );
}
