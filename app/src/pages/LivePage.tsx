// SIMULATION — Données entièrement synthétiques et animées.
// Inspiré du prototype.py (pygame HUD embarqué sur le Raspberry Pi).
// Aucune vraie donnée de télémétrie utilisée ici.
import React, { useState, useEffect, useRef } from 'react';
import { MOCK_DRIVER } from '../data/mock';
import { Radio } from 'lucide-react';

// ─── Track SVG ────────────────────────────────────────────────────────────────

const TRACK_POINTS = [
  [253,210],[229,174],[225,135],[251,116],[277,140],[260,181],
  [278,191],[396,119],[452,131],[451,168],[408,201],[353,194],
  [318,198],[299,221],[311,237],[367,231],[388,252],[364,272],
  [232,291],[221,278],[265,261],[272,242],
];

const trackPath = `M ${TRACK_POINTS.map(p => `${p[0]},${p[1]}`).join(' L ')} Z`;

// ─── SVG filter ids (static strings, no runtime cost) ─────────────────────────

const FILTER_NEON   = 'lp-neon';
const FILTER_DOT    = 'lp-dot';
const FILTER_TRACK  = 'lp-track';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmtTime = (t: number) => {
  const m = Math.floor(t / 60);
  const s = t % 60;
  return `${m}:${s.toFixed(3).padStart(6, '0')}`;
};

function simSpeed(t: number): number {
  return Math.round(55 + 20 * Math.abs(Math.sin(t * 0.4)) + 10 * Math.cos(t * 0.9));
}

function simGForce(t: number): { gx: number; gy: number } {
  return {
    gx: Math.sin(t * 0.9) * Math.cos(t * 0.4) * 0.85,
    gy: Math.sin(t * 1.3 + 1.2) * 0.65,
  };
}

function simDelta(lap: number, t: number): number {
  if (lap < 1) return 0;
  return parseFloat((Math.sin(t * 0.3) * 0.5 - 0.15).toFixed(3));
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const GForceMeter: React.FC<{ gx: number; gy: number; size?: number }> = ({ gx, gy, size = 90 }) => {
  const trailRef = useRef<Array<[number, number]>>([]);

  const c   = size / 2;
  const r   = size * 0.42;           // outer ring = 1 G
  const rHalf = r * 0.5;            // mid ring   = 0.5 G
  const dx  = c + gx * r * 0.88;
  const dy  = c - gy * r * 0.88;

  // Rolling trail — last 12 positions
  const trail = trailRef.current;
  trail.push([dx, dy]);
  if (trail.length > 12) trail.shift();

  // Tick marks: 12 positions on outer ring
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * Math.PI * 2;
    const inner = r - 2.5;
    return {
      x1: c + Math.cos(angle) * inner,
      y1: c + Math.sin(angle) * inner,
      x2: c + Math.cos(angle) * r,
      y2: c + Math.sin(angle) * r,
    };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
      <defs>
        {/* Neon grid glow */}
        <filter id={FILTER_NEON} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* Sharp dot glow */}
        <filter id={FILTER_DOT} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Grid ── */}
      {/* Outer ring (1 G) */}
      <circle cx={c} cy={c} r={r}
        fill="none" stroke="#7bf8ac" strokeWidth="0.65" strokeOpacity="0.25"
        filter={`url(#${FILTER_NEON})`} />
      {/* Mid ring (0.5 G) */}
      <circle cx={c} cy={c} r={rHalf}
        fill="none" stroke="#7bf8ac" strokeWidth="0.4" strokeOpacity="0.14" />
      {/* Crosshair axes */}
      <line x1={c - r} y1={c} x2={c + r} y2={c}
        stroke="#7bf8ac" strokeWidth="0.4" strokeOpacity="0.18"
        filter={`url(#${FILTER_NEON})`} />
      <line x1={c} y1={c - r} x2={c} y2={c + r}
        stroke="#7bf8ac" strokeWidth="0.4" strokeOpacity="0.18"
        filter={`url(#${FILTER_NEON})`} />
      {/* Diagonal cross — subtle tactical detail */}
      <line x1={c - r * 0.7} y1={c - r * 0.7} x2={c + r * 0.7} y2={c + r * 0.7}
        stroke="#7bf8ac" strokeWidth="0.3" strokeOpacity="0.08" />
      <line x1={c + r * 0.7} y1={c - r * 0.7} x2={c - r * 0.7} y2={c + r * 0.7}
        stroke="#7bf8ac" strokeWidth="0.3" strokeOpacity="0.08" />
      {/* Clock ticks */}
      {ticks.map((t, i) => (
        <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
          stroke="#7bf8ac" strokeWidth="0.5"
          strokeOpacity={i % 3 === 0 ? 0.3 : 0.12} />
      ))}

      {/* ── Scale labels ── */}
      <text x={c + rHalf + 2} y={c - 1}
        fill="rgba(148,163,184,0.6)" fontSize="4.5" fontFamily="monospace">0.5</text>
      <text x={c + r + 2} y={c - 1}
        fill="rgba(148,163,184,0.5)" fontSize="4.5" fontFamily="monospace">1G</text>
      <text x={c} y={5.5}
        fill="rgba(148,163,184,0.6)" fontSize="5" textAnchor="middle" fontFamily="monospace">FREIN</text>
      <text x={c} y={size - 1}
        fill="rgba(148,163,184,0.6)" fontSize="5" textAnchor="middle" fontFamily="monospace">ACCÉL</text>

      {/* ── Trail ── */}
      {trail.map(([tx, ty], i) => {
        const age     = i / trail.length;
        const trailR  = 0.8 + age * 2.2;
        const opacity = age * 0.55;
        return (
          <circle key={i} cx={tx} cy={ty} r={trailR}
            fill="#7bf8ac" fillOpacity={opacity} />
        );
      })}

      {/* ── Moving dot — white core + neon ring + glow ── */}
      {/* Outer aura */}
      <circle cx={dx} cy={dy} r={7} fill="rgba(123,248,172,0.07)" />
      {/* Neon border ring */}
      <circle cx={dx} cy={dy} r={4}
        fill="none" stroke="#7bf8ac" strokeWidth="0.9"
        filter={`url(#${FILTER_DOT})`} />
      {/* White core */}
      <circle cx={dx} cy={dy} r={2.2}
        fill="white"
        style={{ filter: 'drop-shadow(0 0 2px rgba(255,255,255,0.9))' }} />
    </svg>
  );
};

const SpeedGauge: React.FC<{ speed: number; size?: number }> = ({ speed, size = 100 }) => {
  const pct = Math.min(speed / 90, 1);
  const r = size * 0.36;
  const circumference = 2 * Math.PI * r;
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(135deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7"
          strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`} strokeLinecap="round" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#7bf8ac" strokeWidth="7"
          strokeDasharray={`${circumference * 0.75 * pct} ${circumference * (1 - 0.75 * pct)}`}
          strokeLinecap="round"
          style={{ filter: 'drop-shadow(0 0 5px rgba(123,248,172,0.7))', transition: 'stroke-dasharray 0.1s' }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-xl sm:text-2xl font-bold font-data text-[#7bf8ac] leading-none animate-value-glow">{speed}</div>
        <div className="text-[8px] text-[#94a3b8] uppercase tracking-widest mt-0.5">km/h</div>
      </div>
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const LivePage: React.FC = () => {
  const [tick,      setTick]      = useState(0);
  const [lapCount,  setLapCount]  = useState(0);
  const [lapTime,   setLapTime]   = useState(0);
  const [lastLap,   setLastLap]   = useState<number | null>(null);
  const [trackIdx,  setTrackIdx]  = useState(0);
  const [isRunning, setIsRunning] = useState(true);

  const startRef = useRef(Date.now());
  const lapRef   = useRef(Date.now());
  const LAP_DURATION_MS = 49000;

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      const now        = Date.now();
      const elapsed    = (now - startRef.current) / 1000;
      const lapElapsed = (now - lapRef.current) / 1000;
      setTick(elapsed);
      setLapTime(lapElapsed);
      setTrackIdx(Math.round((now * 0.001) % TRACK_POINTS.length));
      if (now - lapRef.current >= LAP_DURATION_MS) {
        setLastLap(lapElapsed);
        lapRef.current = now;
        setLapCount(c => c + 1);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [isRunning]);

  const speed        = simSpeed(tick);
  const { gx, gy }   = simGForce(tick);
  const delta        = simDelta(lapCount, tick);
  const isDeltaGreen = delta < 0;
  const trackPos     = TRACK_POINTS[trackIdx] ?? TRACK_POINTS[0];
  const gear         = speed < 30 ? 1 : speed < 45 ? 2 : speed < 60 ? 3 : speed < 72 ? 4 : speed < 82 ? 5 : 6;

  return (
    <>
      <div className="absolute inset-0 bg-grid-minimal opacity-30 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-[#7bf8ac]/4 blur-[100px] rounded-full pointer-events-none" />

      <main className="flex-1 md:ml-64 ml-0 flex flex-col h-screen overflow-hidden relative z-10">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header className="shrink-0 px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 border-b border-[#262626] bg-[#0d0f12]/95 backdrop-blur-xl">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg bg-white/[0.04] border border-white/10">
              <Radio size={12} className="text-[#94a3b8] animate-pulse-dot" />
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-[#a3a3a3]">Live</span>
            </div>
            <h1 className="text-sm sm:text-base font-semibold tracking-tight">Mode Live</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.07] text-[#94a3b8] text-[10px] font-bold uppercase tracking-wider">
              Simulation
            </div>
            <button
              onClick={() => setIsRunning(r => !r)}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider border transition-all ${
                isRunning
                  ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'
                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
              }`}
            >
              {isRunning ? 'Pause' : 'Resume'}
            </button>
          </div>
        </header>

        {/* ── HUD Content ─────────────────────────────────────────────────── */}
        <div className="flex-1 p-3 sm:p-5 md:p-6 overflow-y-auto pb-24 md:pb-4">

          {/*
            Layout mobile  (< sm) : 2 colonnes — [Timer | Delta] [Speed | G-force] [Track full] [Info | Sectors]
            Layout desktop (lg)   : 3 colonnes classiques
          */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">

            {/* ── Col 1 (desktop): Timer + Delta ────────────────────────── */}

            {/* Timer — prend toute la largeur sur mobile (col-span-2), 1/3 sur desktop */}
            <div className="col-span-1 lg:col-span-1 card flex flex-col items-center justify-center text-center py-5 sm:py-8 lg:flex-1">
              <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-2">Temps actuel</div>
              <div className="text-2xl sm:text-4xl font-bold font-data text-[#7bf8ac] glow-brand-text animate-value-glow">
                {fmtTime(lapTime)}
              </div>
              <div className="mt-1 text-[10px] sm:text-[11px] text-[#94a3b8]">
                Tour <span className="text-white font-bold">{lapCount + 1}</span>
              </div>
              {lastLap !== null && (
                <div className="mt-3 px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/5">
                  <div className="text-[9px] text-[#94a3b8] mb-0.5">Dernier tour</div>
                  <div className="text-sm sm:text-lg font-bold font-data text-white">{fmtTime(lastLap)}</div>
                </div>
              )}
            </div>

            {/* Delta */}
            <div className={`col-span-1 lg:col-span-1 card text-center py-5 sm:py-8 border transition-all ${isDeltaGreen ? 'border-emerald-500/20 bg-emerald-500/[0.03]' : 'border-red-500/20 bg-red-500/[0.03]'}`}>
              <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-2">Delta</div>
              <div className={`text-2xl sm:text-3xl font-bold font-data ${isDeltaGreen ? 'text-emerald-400 glow-green-text' : 'text-red-400 glow-red-text'}`}>
                {isDeltaGreen ? '' : '+'}{delta.toFixed(3)}s
              </div>
              <div className={`text-[9px] sm:text-[10px] mt-1 font-medium ${isDeltaGreen ? 'text-emerald-400/60' : 'text-red-400/60'}`}>
                {isDeltaGreen ? '▼ En avance' : '▲ En retard'}
              </div>
            </div>

            {/* ── Speed + Gear — col 1 on mobile, col 2 on desktop ────────── */}
            <div className="col-span-1 card flex flex-col items-center justify-center gap-3 py-4 sm:py-6">
              <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">Vitesse</div>
              <SpeedGauge speed={speed} size={80} />
              {/* Gears */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {[1,2,3,4,5,6].map(g => (
                  <div key={g} className={`w-5 h-5 sm:w-6 sm:h-6 rounded flex items-center justify-center text-[10px] sm:text-xs font-bold font-data transition-all ${
                    gear === g ? 'bg-white/10 text-white' : 'bg-white/[0.03] text-[#94a3b8]'
                  }`}>{g}</div>
                ))}
              </div>
            </div>

            {/* ── G-Force ───────────────────────────────────────────────── */}
            <div className="col-span-1 card flex flex-col items-center gap-2 py-4 sm:py-5">
              <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">G-Force</div>
              <GForceMeter gx={gx} gy={gy} size={88} />
              <div className="grid grid-cols-2 gap-3 text-center w-full">
                <div>
                  <div className="text-[9px] text-[#94a3b8] mb-0.5">Lat.</div>
                  <div className="text-xs sm:text-sm font-bold font-data text-white">{Math.abs(gx).toFixed(2)} G</div>
                </div>
                <div>
                  <div className="text-[9px] text-[#94a3b8] mb-0.5">Long.</div>
                  <div className="text-xs sm:text-sm font-bold font-data text-white">{Math.abs(gy).toFixed(2)} G</div>
                </div>
              </div>
            </div>

            {/* ── Track map — full width on mobile, right col on desktop ─── */}
            <div className="col-span-2 lg:col-span-1 card">
              <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-2">Circuit</div>
              <div className="flex items-center justify-center">
                <svg viewBox="175 95 310 215" className="w-full max-h-36 sm:max-h-44" style={{ overflow: 'visible' }}>
                  <defs>
                    <filter id={FILTER_TRACK} x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur in="SourceGraphic" stdDeviation="1.8" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Track surface — very faint fill for depth */}
                  <path d={trackPath} fill="rgba(123,248,172,0.025)" stroke="none" />

                  {/* Track line — thin, sharp, glowing neon */}
                  <path d={trackPath} fill="none"
                    stroke="#7bf8ac" strokeWidth="1.4" strokeLinejoin="round"
                    filter={`url(#${FILTER_TRACK})`} />

                  {/* Start / finish — double tick */}
                  <line x1={TRACK_POINTS[0][0] - 6} y1={TRACK_POINTS[0][1] - 1}
                        x2={TRACK_POINTS[0][0] + 6} y2={TRACK_POINTS[0][1] - 1}
                        stroke="white" strokeWidth="1.5" strokeOpacity="0.7" />
                  <line x1={TRACK_POINTS[0][0] - 6} y1={TRACK_POINTS[0][1] + 2}
                        x2={TRACK_POINTS[0][0] + 6} y2={TRACK_POINTS[0][1] + 2}
                        stroke="rgba(123,248,172,0.5)" strokeWidth="0.8" />

                  {/* Car — white dot + neon green border + glow */}
                  {/* Outer pulse aura */}
                  <circle cx={trackPos[0]} cy={trackPos[1]} r="8"
                    fill="rgba(123,248,172,0.08)"
                    style={{ filter: 'drop-shadow(0 0 4px rgba(123,248,172,0.4))' }} />
                  {/* Green border ring */}
                  <circle cx={trackPos[0]} cy={trackPos[1]} r="4"
                    fill="white" stroke="#7bf8ac" strokeWidth="1.2"
                    style={{ filter: 'drop-shadow(0 0 4px rgba(123,248,172,0.9))' }} />
                  {/* White core highlight */}
                  <circle cx={trackPos[0] - 1} cy={trackPos[1] - 1} r="1.2"
                    fill="rgba(255,255,255,0.8)" />
                </svg>
              </div>
              <div className="text-center text-[10px] text-[#94a3b8] mt-1">SpeedKart Hyères</div>
            </div>

            {/* ── Session info + Sectors — side by side on mobile ─────────── */}
            <div className="col-span-1 card">
              <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-3">Session</div>
              <div className="divide-y divide-[#181b21]">
                {[
                  { label: 'Pilote',    value: MOCK_DRIVER.initials + ' · ' + MOCK_DRIVER.name.split(' ')[0] },
                  { label: 'Kart',      value: MOCK_DRIVER.kart },
                  { label: 'Tours',     value: `${lapCount + 1}` },
                  { label: 'Best',      value: '0:48.234', accent: true },
                  { label: 'CPU_TEMP',  value: '47°C', badge: 'IP65' },
                ].map(({ label, value, accent, badge }) => (
                  <div key={label} className="flex justify-between items-center gap-2 py-2.5">
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] text-[#94a3b8]">{label}</span>
                      {badge && (
                        <span className="text-[8px] font-bold uppercase tracking-wider px-1 py-0.5 rounded bg-white/[0.04] border border-white/[0.07] text-[#94a3b8]">{badge}</span>
                      )}
                    </div>
                    <span className={`text-[10px] sm:text-xs font-data font-bold truncate text-right ${accent ? 'text-[#7bf8ac]' : 'text-white'}`}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sectors live */}
            <div className="col-span-1 card">
              <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-3">Secteurs</div>
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                {['S1', 'S2', 'S3'].map((s, i) => {
                  const progress = (lapTime / 49) * 3;
                  const isActive = Math.floor(progress) === i;
                  const isDone   = Math.floor(progress) > i;
                  return (
                    <div key={s} className={`text-center py-2 sm:py-2.5 rounded-lg border transition-all ${
                      isActive ? 'border-white/15 bg-white/[0.05]' :
                      isDone   ? 'border-white/8 bg-white/[0.02]' :
                                 'border-white/5 bg-white/[0.01]'
                    }`}>
                      <div className={`text-[10px] sm:text-xs font-bold font-data ${
                        isActive ? 'text-white' : isDone ? 'text-[#a3a3a3]' : 'text-[#94a3b8]'
                      }`}>{s}</div>
                      <div className={`text-[9px] mt-0.5 font-data ${
                        isActive ? 'text-[#a3a3a3] animate-pulse-dot' : isDone ? 'text-[#94a3b8]' : 'text-[#94a3b8]'
                      }`}>
                        {isDone ? '✓' : isActive ? '···' : '--'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </main>
    </>
  );
};

export default LivePage;
