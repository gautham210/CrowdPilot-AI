import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';

// ─── Constants ────────────────────────────────────────────────────────────────
const ZONE_ICONS = { gate: '🚪', food: '🍔', washroom: '🚻', shop: '🛍️',
  grandstand: '🏟️', fanzone: '🎉', parking: '🅿️', transport: '🚌',
  vip: '⭐', experience: '🎮' };
const TREND_ICONS = {
  increasing: { icon: '↑', cls: 'trend-increasing' },
  decreasing: { icon: '↓', cls: 'trend-decreasing' },
  stable:     { icon: '→', cls: 'trend-stable' },
};
const LEVEL_COLOR = { low: '#22c55e', medium: '#f59e0b', high: '#ef4444' };

// ─── SVG ViewBox & Track ──────────────────────────────────────────────────────
// viewBox: "0 0 620 370" — Miami International Autodrome — wider, asymmetric layout
// Track runs clockwise from S/F line (top-left of main straight)

// FULL TRACK (closed loop, clockwise)
const TRACK_FULL =
  // Main straight: left → right (west to east along top)
  'M 62,58 L 310,52 ' +
  // T1 — sweeping right-hander entry
  'C 348,51 370,62 376,85 ' +
  // T2 — tight infield chicane (going down)
  'C 382,110 370,126 352,130 ' +
  // T3 hairpin-like left
  'L 318,130 C 298,130 288,118 290,100 ' +
  // T4 — back out right
  'C 292,82 306,72 326,72 L 350,72 ' +
  'C 372,72 385,88 385,112 ' +
  // T5–T6 sweeper complex going south
  'C 386,145 374,172 354,186 ' +
  'C 336,198 312,204 286,204 ' +
  // Back section → left (wide curve)
  'L 228,204 C 194,204 172,216 158,234 ' +
  'C 144,252 138,272 136,292 ' +
  // T11 — wide hairpin bottom-left
  'C 134,314 118,326 100,318 ' +
  'C 82,310 72,294 80,276 ' +
  // T12 return — climbing back up left side
  'C 88,258 106,250 126,248 ' +
  'C 148,246 166,236 174,216 ' +
  'C 182,196 182,172 178,148 ' +
  // T13–T14 return sweeper left side
  'C 174,124 164,102 158,78 ' +
  'C 154,60 72,62 62,58 Z';

// Sector 1: main straight + T1-T6 complex (red)
const SECTOR_1_PATH =
  'M 62,58 L 310,52 ' +
  'C 348,51 370,62 376,85 ' +
  'C 382,110 370,126 352,130 ' +
  'L 318,130 C 298,130 288,118 290,100 ' +
  'C 292,82 306,72 326,72 L 350,72 ' +
  'C 372,72 385,88 385,112';

// Sector 2: T7–T10 sweepers + back straight + approach (amber)
const SECTOR_2_PATH =
  'M 385,112 ' +
  'C 386,145 374,172 354,186 ' +
  'C 336,198 312,204 286,204 ' +
  'L 228,204 C 194,204 172,216 158,234 ' +
  'C 144,252 138,272 136,292';

// Sector 3: T11 hairpin + left-side return climb (purple)
const SECTOR_3_PATH =
  'M 136,292 ' +
  'C 134,314 118,326 100,318 ' +
  'C 82,310 72,294 80,276 ' +
  'C 88,258 106,250 126,248 ' +
  'C 148,246 166,236 174,216 ' +
  'C 182,196 182,172 178,148 ' +
  'C 174,124 164,102 158,78 ' +
  'C 154,60 72,62 62,58';

// Pit lane: parallel inside the main straight
const PIT_LANE_PATH = 'M 68,70 L 304,65';

// Paddock zone: infield behind main straight
const PADDOCK_RECT = { x: 90, y: 72, w: 186, h: 60 };

// DRS detection zone over most of main straight
const DRS_PATH = 'M 70,58 L 305,52';

// ─── Zone positions (SVG coords, around circuit) ──────────────────────────────
const ZONE_POSITIONS = {
  // Gates
  'gate-a':       { x: 30,  y: 130 },  // outer west, mid
  'gate-b':       { x: 200, y: 20  },  // outer north, above main straight
  'gate-c':       { x: 436, y: 100 },  // outer east, S1 area

  // Food
  'food-north':   { x: 30,  y: 200 },  // outer west, below gate-a
  'food-south':   { x: 436, y: 200 },  // outer east, mid

  // Washrooms
  'washroom-a':   { x: 30,  y: 265 },  // outer west, lower
  'washroom-b':   { x: 436, y: 268 },  // outer east, lower

  // Shops
  'shop-paddock': { x: 186, y: 102 },  // infield — paddock zone
  'shop-merch':   { x: 46,  y: 328 },  // outer SW

  // Grandstands — placed along each sector
  'stand-s1':     { x: 408, y: 148 },  // S1 grandstand, east outside main S1 complex (outer)
  'stand-s2':     { x: 408, y: 240 },  // S2 grandstand, east lower
  'stand-s3':     { x: 152, y: 340 },  // S3 grandstand, south

  // Fan Zones
  'fan-zone-a':   { x: 30,  y: 355 },  // outer SW corner
  'fan-zone-b':   { x: 250, y: 355 },  // outer south centre

  // Parking
  'parking-n':    { x: 250, y: 20  },  // outer north, near gate-b
  'parking-s':    { x: 350, y: 355 },  // outer south-east

  // Transport Hubs
  'transport-a':  { x: 30,  y: 80  },  // outer west, near gate-a
  'transport-b':  { x: 310, y: 20  },  // outer north-east

  // VIP / Paddock Club
  'vip-paddock':  { x: 140, y: 102 },  // infield — paddock area
  'vip-lounge':   { x: 186, y: 140 },  // infield — inside paddock rect

  // Experience Zones
  'exp-pitlane':  { x: 246, y: 102 },  // infield — pit lane end
  'exp-sim':      { x: 310, y: 140 },  // infield — east infield
};

// ─── Deterministic crowd dots (stable positions, density from level) ──────────
function buildStableDots(zoneId, count) {
  const seed = zoneId.split('').reduce((a, c, i) => a + c.charCodeAt(0) * (i + 1), 0);
  const pseudo = (n) => ((seed * 9301 + n * 49297 + 233995) % 1000) / 1000;

  return Array.from({ length: count }, (_, i) => {
    const angle    = (i / count) * Math.PI * 2 + pseudo(i * 7) * 0.9;
    const ring     = 0.3 + pseudo(i * 3) * 0.7;
    const duration = 2.4 + pseudo(i * 11) * 4.2;  // 2.4–6.6s
    const delay    = -(pseudo(i * 5) * 6);          // 0 to -6s
    const amp      = 3.0 + pseudo(i * 13) * 5.5;   // 3.0–8.5
    return {
      id: i,
      angle,
      ring,
      duration: duration.toFixed(1),
      delay: delay.toFixed(1),
      dx1: ((pseudo(i)     - 0.5) * amp * 2.2).toFixed(1),
      dy1: ((pseudo(i + 1) - 0.5) * amp * 1.8).toFixed(1),
      dx2: ((pseudo(i + 2) - 0.5) * amp * 2.0).toFixed(1),
      dy2: ((pseudo(i + 3) - 0.5) * amp * 2.2).toFixed(1),
      dx3: ((pseudo(i + 4) - 0.5) * amp * 1.6).toFixed(1),
      dy3: ((pseudo(i + 5) - 0.5) * amp * 1.8).toFixed(1),
    };
  });
}

// ─── Crowd dots component ─────────────────────────────────────────────────────
function CrowdDotsLayer({ zones, activeSession }) {
  return zones.map(zone => {
    const pos = ZONE_POSITIONS[zone.id];
    if (!pos) return null;

    const isActive = activeSession && activeSession.type !== 'break';
    // Improved density: Low=6-8, Medium=12-15, High=22-28
    const base = zone.level === 'high' ? 26 : zone.level === 'medium' ? 13 : 7;
    // During spikes (active session with high crowd): push density higher
    const count = Math.min(isActive && zone.level === 'high' ? base + 4 : base, 30);
    const spread = zone.level === 'high' ? 14 : zone.level === 'medium' ? 9 : 6;
    // Rush: speed up when high during active
    const speedMult = zone.level === 'high' ? (isActive ? 0.45 : 0.55) : zone.level === 'medium' ? 0.72 : 1.0;
    const color = LEVEL_COLOR[zone.level] || '#22c55e';

    const dots = buildStableDots(zone.id, count);

    return dots.map(d => {
      const r = spread * d.ring;
      const cx = pos.x + Math.cos(d.angle) * r;
      const cy = pos.y + Math.sin(d.angle) * r;
      const dur = (parseFloat(d.duration) * speedMult).toFixed(1);

      return (
        <circle
          key={`${zone.id}-dot-${d.id}`}
          cx={cx} cy={cy} r={1.05}
          fill={color}
          opacity={0.75}
          style={{
            '--duration': `${dur}s`,
            '--delay': `${d.delay}s`,
            '--dx1': `${d.dx1}px`, '--dy1': `${d.dy1}px`,
            '--dx2': `${d.dx2}px`, '--dy2': `${d.dy2}px`,
            '--dx3': `${d.dx3}px`, '--dy3': `${d.dy3}px`,
          }}
          className="crowd-dot"
        />
      );
    });
  });
}

// ─── Zone blob on map ─────────────────────────────────────────────────────────
function ZoneBlob({ zone, isSelected, onClick }) {
  const pos = ZONE_POSITIONS[zone.id];
  if (!pos) return null;
  const color = LEVEL_COLOR[zone.level] || '#6366f1';
  const r = isSelected ? 9 : 7;

  return (
    <g style={{ cursor: 'pointer' }} onClick={onClick}>
      {/* Outer pulse ring when selected */}
      {isSelected && (
        <circle cx={pos.x} cy={pos.y} r={r + 5}
          fill="none" stroke={color} strokeWidth="0.8" opacity="0.3"
        />
      )}
      {/* Zone area */}
      <circle cx={pos.x} cy={pos.y} r={r}
        fill={`${color}20`}
        stroke={color}
        strokeWidth={isSelected ? 1.2 : 0.8}
        style={{ transition: 'r 0.25s ease, stroke-width 0.2s' }}
      />
      {/* Center dot */}
      <circle cx={pos.x} cy={pos.y} r={1.8} fill={color} opacity={0.95} />
      {/* Name label */}
      <text
        x={pos.x} y={pos.y + r + 4.5}
        textAnchor="middle"
        fill="rgba(255,255,255,0.75)"
        fontSize="3.2" fontWeight="600"
      >
        {zone.name.split(' ').slice(0, 2).join(' ')}
      </text>
    </g>
  );
}

// ─── Zone list card ───────────────────────────────────────────────────────────
function ZoneCard({ zone, isSelected, onClick }) {
  const trend = TREND_ICONS[zone.trend] || TREND_ICONS.stable;
  const color = LEVEL_COLOR[zone.level] || '#6366f1';
  return (
    <button
      onClick={onClick}
      className="zone-card-btn"
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '0.55rem 0.875rem', borderRadius: 10,
        background: isSelected ? `${color}14` : 'rgba(255,255,255,0.02)',
        border: `1px solid ${isSelected ? `${color}55` : 'var(--border)'}`,
        cursor: 'pointer', textAlign: 'left', width: '100%', fontFamily: 'inherit',
      }}
    >
      <span style={{ fontSize: '1rem', flexShrink: 0 }}>{ZONE_ICONS[zone.type] || '📍'}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {zone.name}
        </div>
        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 1 }}>
          Wait: ~{zone.waitTime}min
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
        <span className={`badge badge-${zone.level}`}>{zone.level}</span>
        <span className={trend.cls} style={{ fontSize: '0.68rem', fontWeight: 700 }}>{trend.icon}</span>
      </div>
    </button>
  );
}

// ─── Main CrowdMap component ──────────────────────────────────────────────────
export default function CrowdMap() {
  const { crowdData, timeline } = useApp();
  const [selectedZone, setSelectedZone] = useState(null);
  const [filterType, setFilterType] = useState('all');

  const activeSession = timeline?.current;
  const isRaceActive  = activeSession && activeSession.type !== 'break';

  const crowdById = {};
  crowdData.forEach(z => { crowdById[z.id] = z; });

  const mapZones = useMemo(() =>
    crowdData.map(z => ({ ...z, color: LEVEL_COLOR[z.level] || '#6366f1' })),
    [crowdData]
  );

  const filteredList = filterType === 'all'
    ? crowdData
    : crowdData.filter(z => z.type === filterType);

  const selected = selectedZone ? crowdById[selectedZone] : null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 272px', gap: '1.25rem' }}>

      {/* ─── SVG MAP ──────────────────────────────────────────────────────────── */}
      <div className="glass-card" style={{ padding: '1.25rem', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
          <div>
            <div className="section-title" style={{ marginBottom: 2 }}>Venue Map</div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Miami International Autodrome
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 1 }}>
              Miami Gardens, Florida, USA · Live Crowd View
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {[['Low','#22c55e'],['Medium','#f59e0b'],['High','#ef4444']].map(([l,c]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: c }} />
                {l}
              </div>
            ))}
            {isRaceActive && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 99, padding: '2px 8px',
                fontSize: '0.65rem', fontWeight: 700, color: '#ef4444',
              }}>
                <span className="pulse-dot" style={{ width: 5, height: 5 }} />
                RACE LIVE
              </div>
            )}
          </div>
        </div>

        {/* ─── SVG Circuit ────────────────────────────────────────────────────── */}
        <svg
          viewBox="0 0 470 370"
          style={{ width: '100%', height: 'auto', maxHeight: 560 }}
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* ── Defs ── */}
          <defs>
            <radialGradient id="map-bg-grad" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#0d0d22" />
              <stop offset="100%" stopColor="#060610" />
            </radialGradient>

            {/* Track glow filter */}
            <filter id="track-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            {/* Zone glow */}
            <filter id="zone-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1.8" result="blur" />
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            {/* Car glow */}
            <filter id="car-glow" x="-150%" y="-150%" width="400%" height="400%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            {/* Sector S1 glow */}
            <filter id="s1-glow" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>

            {/* Hidden full-track path for animateMotion */}
            <path id="car-track-path" d={TRACK_FULL} />
          </defs>

          {/* Background */}
          <rect width="470" height="370" fill="url(#map-bg-grad)" rx="6" />

          {/* Subtle grid */}
          {[60,120,180,240,300,360,420].map(v => (
            <React.Fragment key={`gv${v}`}>
              <line x1={v} y1="0" x2={v} y2="370" stroke="rgba(255,255,255,0.015)" strokeWidth="0.3"/>
            </React.Fragment>
          ))}
          {[60,120,180,240,300,360].map(v => (
            <React.Fragment key={`gh${v}`}>
              <line x1="0" y1={v} x2="470" y2={v} stroke="rgba(255,255,255,0.015)" strokeWidth="0.3"/>
            </React.Fragment>
          ))}

          {/* ── TRACK GLOW LAYER (active race only) — per-sector different timings */}
          {isRaceActive && (
            <>
              <path d={SECTOR_1_PATH} fill="none" stroke="rgba(239,68,68,0.14)" strokeWidth="20"
                strokeLinejoin="round" filter="url(#track-glow)" className="sector-glow-s1"
              />
              <path d={SECTOR_2_PATH} fill="none" stroke="rgba(245,158,11,0.12)" strokeWidth="20"
                strokeLinejoin="round" filter="url(#track-glow)" className="sector-glow-s2"
              />
              <path d={SECTOR_3_PATH} fill="none" stroke="rgba(139,92,246,0.12)" strokeWidth="20"
                strokeLinejoin="round" filter="url(#track-glow)" className="sector-glow-s3"
              />
            </>
          )}

          {/* ── ASPHALT FILL (track interior) */}
          <path d={TRACK_FULL}
            fill="rgba(18,18,40,0.75)"
            stroke="none"
          />

          {/* ── TRACK KERB — outer white edge */}
          <path d={TRACK_FULL}
            fill="none"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="11"
            strokeLinejoin="round"
          />

          {/* ── TRACK SURFACE — main surface */}
          <path d={TRACK_FULL}
            fill="none"
            stroke="rgba(32,32,62,0.97)"
            strokeWidth="10"
            strokeLinejoin="round"
          />

          {/* ── SECTOR 1 — Red (main straight + T1-T6 infield complex) */}
          <path d={SECTOR_1_PATH}
            fill="none"
            stroke={isRaceActive ? 'rgba(239,68,68,0.8)' : 'rgba(239,68,68,0.38)'}
            strokeWidth="10"
            strokeLinecap="round"
            className={isRaceActive ? 'sector-glow-active sector-glow-s1' : undefined}
          />

          {/* ── SECTOR 2 — Amber (T7-T10 sweepers + back section) */}
          <path d={SECTOR_2_PATH}
            fill="none"
            stroke={isRaceActive ? 'rgba(245,158,11,0.8)' : 'rgba(245,158,11,0.38)'}
            strokeWidth="10"
            strokeLinecap="round"
            className={isRaceActive ? 'sector-glow-active' : undefined}
            style={{ animationDelay: '0.9s' }}
          />

          {/* ── SECTOR 3 — Purple (T11 hairpin + left-side return) */}
          <path d={SECTOR_3_PATH}
            fill="none"
            stroke={isRaceActive ? 'rgba(139,92,246,0.8)' : 'rgba(139,92,246,0.38)'}
            strokeWidth="10"
            strokeLinecap="round"
            className={isRaceActive ? 'sector-glow-active' : undefined}
            style={{ animationDelay: '1.8s' }}
          />

          {/* ── PIT LANE — dashed parallel to main straight */}
          <path d={PIT_LANE_PATH}
            fill="none"
            stroke="rgba(99,102,241,0.6)"
            strokeWidth="2.5"
            strokeDasharray="6 4"
            strokeLinecap="round"
          />
          <text x="186" y="64" textAnchor="middle" fill="rgba(99,102,241,0.6)" fontSize="3.2" fontWeight="700">
            PIT LANE
          </text>

          {/* ── PADDOCK ZONE — infield rectangle */}
          <rect
            x={PADDOCK_RECT.x} y={PADDOCK_RECT.y}
            width={PADDOCK_RECT.w} height={PADDOCK_RECT.h}
            rx="6"
            fill="rgba(99,102,241,0.05)"
            stroke="rgba(99,102,241,0.22)"
            strokeWidth="0.7"
            strokeDasharray="4 3"
          />
          <text x={PADDOCK_RECT.x + PADDOCK_RECT.w / 2} y={PADDOCK_RECT.y + 18}
            textAnchor="middle"
            fill="rgba(99,102,241,0.65)" fontSize="3.8" fontWeight="700"
          >PADDOCK ZONE</text>
          <text x={PADDOCK_RECT.x + PADDOCK_RECT.w / 2} y={PADDOCK_RECT.y + 25}
            textAnchor="middle"
            fill="rgba(99,102,241,0.35)" fontSize="2.6"
          >Restricted Access</text>

          {/* ── DRS ZONE — animated flowing dashes over main straight */}
          <path
            d={DRS_PATH}
            fill="none"
            stroke="rgba(56,189,248,0.7)"
            strokeWidth="3.5"
            strokeDasharray="12 7"
            strokeLinecap="round"
            className={isRaceActive ? 'drs-animated' : undefined}
            style={!isRaceActive ? { strokeDashoffset: 0, opacity: 0.35 } : undefined}
          />
          <text x="190" y="48" textAnchor="middle" fill="rgba(56,189,248,0.75)" fontSize="3" fontWeight="700">
            ── DRS DETECTION ──
          </text>

          {/* ── START / FINISH LINE */}
          <rect x="58" y="44" width="5" height="16" fill={isRaceActive ? '#f59e0b' : 'rgba(245,158,11,0.55)'} rx="0.5" />
          {[0,1,2,3,4,5].map(i => (
            <rect key={i}
              x={59 + (i % 2) * 1.2}
              y={45 + Math.floor(i / 2) * 2.5}
              width={1.2} height={2.5}
              fill={i % 2 === 0 ? '#ffffff' : '#000000'}
              opacity={0.92}
            />
          ))}
          <text x="53" y="41" textAnchor="middle" fill="rgba(245,158,11,0.9)" fontSize="3.2" fontWeight="800">S/F</text>

          {/* ── SECTOR BOUNDARY LABELS */}
          <text x="392" y="72"  fill="rgba(239,68,68,0.9)"    fontSize="4.2" fontWeight="800">S1</text>
          <text x="416" y="190" fill="rgba(245,158,11,0.9)"   fontSize="4.2" fontWeight="800">S2</text>
          <text x="106" y="348" fill="rgba(139,92,246,0.9)"   fontSize="4.2" fontWeight="800">S3</text>

          {/* ── TURN NUMBER LABELS at key corners */}
          {[
            { x: 364, y: 82,  label: 'T1',  color: 'rgba(239,68,68,0.6)' },
            { x: 380, y: 120, label: 'T2',  color: 'rgba(239,68,68,0.6)' },
            { x: 296, y: 118, label: 'T3',  color: 'rgba(239,68,68,0.6)' },
            { x: 342, y: 68,  label: 'T4',  color: 'rgba(239,68,68,0.6)' },
            { x: 393, y: 148, label: 'T6',  color: 'rgba(239,68,68,0.6)' },
            { x: 388, y: 178, label: 'T7',  color: 'rgba(245,158,11,0.6)' },
            { x: 344, y: 200, label: 'T8',  color: 'rgba(245,158,11,0.6)' },
            { x: 166, y: 222, label: 'T10', color: 'rgba(245,158,11,0.6)' },
            { x: 144, y: 260, label: 'T11', color: 'rgba(245,158,11,0.6)' },
            { x: 94,  y: 320, label: 'T12', color: 'rgba(139,92,246,0.6)' },
            { x: 140, y: 252, label: 'T13', color: 'rgba(139,92,246,0.6)' },
            { x: 170, y: 210, label: 'T14', color: 'rgba(139,92,246,0.6)' },
          ].map(t => (
            <text key={t.label} x={t.x} y={t.y}
              textAnchor="middle"
              fill={t.color}
              fontSize="3.2" fontWeight="700"
            >{t.label}</text>
          ))}

          {/* ── ZONE BLOBS ── */}
          {mapZones.map(zone => (
            <ZoneBlob
              key={zone.id}
              zone={zone}
              isSelected={selectedZone === zone.id}
              onClick={() => setSelectedZone(selectedZone === zone.id ? null : zone.id)}
            />
          ))}

          {/* ── CROWD DOTS ── */}
          <CrowdDotsLayer zones={mapZones} activeSession={activeSession} />

          {/* ── LIVE CAR — animateMotion along track (race sessions only) ── */}
          {isRaceActive && (
            <g filter="url(#car-glow)">
              {/* Trail glow */}
              <circle cx={0} cy={0} r={6} fill="rgba(250,250,255,0.06)">
                <animateMotion dur="11s" repeatCount="indefinite" rotate="auto">
                  <mpath href="#car-track-path" />
                </animateMotion>
              </circle>
              {/* Main car dot */}
              <circle cx={0} cy={0} r={3.2} fill="#ffffff" className="car-pulse">
                <animateMotion dur="11s" repeatCount="indefinite" rotate="auto">
                  <mpath href="#car-track-path" />
                </animateMotion>
              </circle>
              {/* Accent core */}
              <circle cx={0} cy={0} r={1.6} fill="#38bdf8">
                <animateMotion dur="11s" repeatCount="indefinite" rotate="auto">
                  <mpath href="#car-track-path" />
                </animateMotion>
              </circle>
            </g>
          )}
        </svg>

        {/* ── Selected zone detail panel ── */}
        {selected && (
          <div className="animate-fade-in" style={{
            marginTop: '0.875rem',
            padding: '0.875rem 1rem',
            background: `${LEVEL_COLOR[selected.level] || '#6366f1'}10`,
            border: `1px solid ${LEVEL_COLOR[selected.level] || '#6366f1'}30`,
            borderRadius: 10,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{selected.name}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                  {selected.type.charAt(0).toUpperCase() + selected.type.slice(1)} · Wait ~{selected.waitTime}min · trend {selected.trend}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className={`badge badge-${selected.level}`}>{selected.level}</span>
                <button onClick={() => setSelectedZone(null)} style={{
                  background: 'none', border: 'none', color: 'var(--text-muted)',
                  cursor: 'pointer', fontSize: '0.9rem', padding: 0,
                }}>✕</button>
              </div>
            </div>
            <div className="progress-bar">
              <div style={{
                height: '100%',
                width: `${Math.round(selected.occupancy * 100)}%`,
                background: LEVEL_COLOR[selected.level] || '#6366f1',
                borderRadius: 99, transition: 'width 0.6s ease',
              }} />
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              marginTop: 4, fontSize: '0.65rem', color: 'var(--text-muted)',
            }}>
              <span>Occupancy: {Math.round(selected.occupancy * 100)}%</span>
              <span>Trend: <span className={`trend-${selected.trend}`}>{selected.trend}</span></span>
            </div>
          </div>
        )}
      </div>

      {/* ─── ZONE LIST SIDEBAR ──────────────────────────────────────────────────── */}
      <div className="glass-card" style={{
        padding: '1.25rem',
        display: 'flex', flexDirection: 'column', gap: '0.75rem',
        overflowY: 'auto',
      }}>
        <div className="section-title">All Zones ({filteredList.length})</div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {[
            ['all','All'],
            ['gate','🚪'],
            ['food','🍔'],
            ['washroom','🚻'],
            ['shop','🛍️'],
            ['grandstand','🏟️'],
            ['fanzone','🎉'],
            ['parking','🅿️'],
            ['transport','🚌'],
            ['vip','⭐'],
            ['experience','🎮'],
          ].map(([t, icon]) => (
            <button key={t} onClick={() => setFilterType(t)} style={{
              padding: '3px 7px', borderRadius: 99, fontFamily: 'inherit',
              border: `1px solid ${filterType === t ? 'var(--accent)' : 'var(--border)'}`,
              background: filterType === t ? 'rgba(99,102,241,0.15)' : 'transparent',
              color: filterType === t ? 'var(--accent-bright)' : 'var(--text-muted)',
              fontSize: '0.68rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
            }}>
              {icon === 'All' ? icon : icon}
            </button>
          ))}
        </div>

        {/* Zone cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {filteredList.map(zone => (
            <ZoneCard
              key={zone.id}
              zone={zone}
              isSelected={selectedZone === zone.id}
              onClick={() => setSelectedZone(selectedZone === zone.id ? null : zone.id)}
            />
          ))}
        </div>

        {/* Track features legend */}
        <div style={{
          marginTop: 'auto', paddingTop: '0.875rem',
          borderTop: '1px solid var(--border)',
        }}>
          <div className="section-title" style={{ marginBottom: 8 }}>Track Features</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {[
              { label: 'Sector 1', color: '#ef4444', solid: true },
              { label: 'Sector 2', color: '#f59e0b', solid: true },
              { label: 'Sector 3', color: '#8b5cf6', solid: true },
              { label: 'DRS Zone', color: '#38bdf8', dash: true },
              { label: 'Pit Lane', color: '#6366f1', dash: true },
              { label: 'Paddock', color: '#6366f1', box: true },
            ].map(f => (
              <div key={f.label} style={{
                display: 'flex', alignItems: 'center', gap: 7,
                fontSize: '0.72rem', color: 'var(--text-secondary)',
              }}>
                {f.box ? (
                  <div style={{ width: 14, height: 8, borderRadius: 2, border: `1px dashed ${f.color}`, flexShrink: 0 }} />
                ) : f.dash ? (
                  <div style={{ width: 14, height: 2, borderRadius: 99, flexShrink: 0, borderBottom: `2px dashed ${f.color}` }} />
                ) : (
                  <div style={{ width: 14, height: 3, borderRadius: 99, background: f.color, flexShrink: 0 }} />
                )}
                {f.label}
              </div>
            ))}
            {isRaceActive && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 7,
                fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 4,
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: '#ffffff',
                  boxShadow: '0 0 6px #38bdf8',
                  flexShrink: 0,
                }} />
                Live Car Position
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
