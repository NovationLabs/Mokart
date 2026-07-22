import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Maximize2, RotateCcw, Play, Pause, Smartphone } from 'lucide-react';
import GForceMeter from '../components/hud/GForceMeter';
import { useTelemetryFrames, HudSession } from '../hooks/useTelemetryFrames';

// HUD téléphone plein écran, paysage, épuré. Route PUBLIQUE (/hud/:sessionId),
// hors AppLayout et hors gate d'auth : ouverte par le tag NFC du volant.
// Rejoue une session enregistrée comme si elle était live.

const ACCENT = '#7bf8ac';

const fmtLap = (t: number | null | undefined) => {
  if (t === null || t === undefined) return '--:--.-';
  const m = Math.floor(t / 60);
  const s = t % 60;
  return `${m}:${s.toFixed(1).padStart(4, '0')}`;
};

const fmtDelta = (d: number) => {
  const c = Math.max(-9.9, Math.min(9.9, d)); // borne d'affichage
  return `${c >= 0 ? '+' : '−'}${Math.abs(c).toFixed(2)}`;
};

// ─── Tracé du circuit (tracé unique lissé fourni par le backend) ──────────────
const TrackMap: React.FC<{ meta: HudSession; x: number; y: number }> = ({ meta, x, y }) => {
  const pts = meta.track && meta.track.length > 2 ? meta.track : meta.frames.map((f) => [f.x, f.y]);
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const min_x = Math.min(...xs), max_x = Math.max(...xs);
  const min_y = Math.min(...ys), max_y = Math.max(...ys);
  const w = Math.max(max_x - min_x, 1);
  const h = Math.max(max_y - min_y, 1);
  const S = Math.max(w, h);
  const pad = S * 0.07;

  const path = useMemo(() => {
    if (!pts.length) return '';
    return 'M ' + pts.map((p) => `${p[0]},${p[1]}`).join(' L ') + ' Z';
  }, [pts]);

  const viewBox = `${min_x - pad} ${min_y - pad} ${w + pad * 2} ${h + pad * 2}`;
  const flip = `matrix(1 0 0 -1 0 ${min_y + max_y})`;
  const start = pts[0];

  return (
    <svg viewBox={viewBox} className="w-full h-full" style={{ overflow: 'visible' }} preserveAspectRatio="xMidYMid meet">
      <defs>
        <filter id="hud-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation={S * 0.012} result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <g transform={flip}>
        {/* asphalte : casing sombre épais */}
        <path d={path} fill="none" stroke="#20242c" strokeWidth={S * 0.05} strokeLinejoin="round" strokeLinecap="round" />
        {/* ligne néon */}
        <path d={path} fill="none" stroke={ACCENT} strokeWidth={S * 0.016} strokeOpacity="0.9"
          strokeLinejoin="round" strokeLinecap="round" filter="url(#hud-glow)" />
        {/* ligne d'arrivée */}
        {start && (
          <line x1={start[0]} y1={start[1] - S * 0.03} x2={start[0]} y2={start[1] + S * 0.03}
            stroke="#fff" strokeWidth={S * 0.012} strokeOpacity="0.85" strokeLinecap="round" />
        )}
        {/* kart */}
        <circle cx={x} cy={y} r={S * 0.05} fill={ACCENT} fillOpacity="0.14" />
        <circle cx={x} cy={y} r={S * 0.022} fill="#fff" stroke={ACCENT} strokeWidth={S * 0.01}
          style={{ filter: `drop-shadow(0 0 7px ${ACCENT})` }} />
      </g>
    </svg>
  );
};

const HudPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { loading, error, meta, frame, playing, setPlaying, restart } = useTelemetryFrames(sessionId);

  const [isPortrait, setIsPortrait] = useState(
    typeof window !== 'undefined' && window.matchMedia('(orientation: portrait)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia('(orientation: portrait)');
    const h = (e: MediaQueryListEvent) => setIsPortrait(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);

  const goFullscreen = () => {
    const el = document.documentElement as any;
    (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-xs uppercase tracking-[0.3em] animate-pulse" style={{ color: ACCENT }}>télémétrie…</div>
      </div>
    );
  }
  if (error || !meta || !frame) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-1 px-6 text-center">
        <div className="text-red-400 font-bold uppercase tracking-widest text-sm">Télémétrie indisponible</div>
        <div className="text-neutral-500 text-xs">{error || 'Aucune donnée'}</div>
        <div className="text-neutral-700 text-[10px] font-mono mt-2">{sessionId}</div>
      </div>
    );
  }

  const deltaGreen = frame.delta !== null && frame.delta < 0;
  const totalLaps = meta.frames[meta.frames.length - 1]?.lap ?? frame.lap;

  return (
    <div className="fixed inset-0 bg-black text-white overflow-hidden select-none font-data" style={{ letterSpacing: '-0.01em' }}>
      {/* halo discret */}
      <div className="absolute inset-x-0 top-0 h-1/2 pointer-events-none" style={{ background: `radial-gradient(60% 80% at 50% 0%, ${ACCENT}0d, transparent)` }} />

      {/* Bandeau haut ultra-fin */}
      <div className="relative z-10 h-8 px-4 flex items-center justify-between text-neutral-500">
        <span className="text-[10px] uppercase tracking-[0.25em] truncate max-w-[35vw]">{meta.kart}</span>
        <span className="text-[10px] uppercase tracking-[0.25em]">
          Tour <span className="text-white font-bold">{frame.lap}</span><span className="text-neutral-600"> / {totalLaps}</span>
        </span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: ACCENT }} /><span className="text-[10px] uppercase tracking-[0.2em]">Live</span></span>
          <button onClick={restart} className="text-neutral-500 hover:text-white"><RotateCcw size={13} /></button>
          <button onClick={() => setPlaying(!playing)} className="text-neutral-500 hover:text-white">{playing ? <Pause size={13} /> : <Play size={13} />}</button>
          <button onClick={goFullscreen} className="text-neutral-500 hover:text-white"><Maximize2 size={13} /></button>
        </div>
      </div>

      {/* Corps : 3 zones séparées par des filets discrets */}
      <div className="relative z-10 h-[calc(100%-2rem)] grid grid-cols-[0.9fr_1.8fr_0.9fr] divide-x divide-white/[0.06]">

        {/* Gauche : VITESSE + chrono */}
        <div className="flex flex-col items-center justify-center gap-6 px-3">
          <div className="text-center leading-none">
            <div className="font-bold tabular-nums" style={{ fontSize: 'min(18vw,140px)', color: ACCENT, textShadow: `0 0 30px ${ACCENT}55` }}>
              {Math.round(frame.speed)}
            </div>
            <div className="text-[11px] uppercase tracking-[0.35em] text-neutral-500 mt-1">km/h</div>
          </div>
          <div className="text-center leading-none">
            <div className="text-3xl sm:text-5xl font-bold tabular-nums text-white">{fmtLap(frame.lap_time)}</div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-neutral-500 mt-2">Temps tour</div>
          </div>
        </div>

        {/* Centre : tracé */}
        <div className="flex flex-col min-h-0 p-2">
          <div className="flex-1 min-h-0"><TrackMap meta={meta} x={frame.x} y={frame.y} /></div>
          <div className="flex gap-1.5 mt-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex-1 h-1 rounded-full transition-colors"
                style={{ background: frame.sector >= s ? ACCENT : 'rgba(255,255,255,0.08)', opacity: frame.sector === s ? 1 : frame.sector > s ? 0.5 : 1 }} />
            ))}
          </div>
        </div>

        {/* Droite : DELTA + meilleur tour + G */}
        <div className="flex flex-col items-center justify-between py-4 px-3">
          <div className="flex-1 flex flex-col items-center justify-center leading-none">
            <div className="text-[10px] uppercase tracking-[0.3em] text-neutral-500 mb-2">Δ meilleur</div>
            {frame.delta === null ? (
              <div className="text-4xl sm:text-6xl font-bold text-neutral-600">—</div>
            ) : (
              <div className="font-bold tabular-nums" style={{ fontSize: 'min(10vw,68px)', color: deltaGreen ? ACCENT : '#ff5c5c', textShadow: `0 0 26px ${deltaGreen ? ACCENT : '#ff5c5c'}55` }}>
                {fmtDelta(frame.delta)}
              </div>
            )}
            <div className="text-sm sm:text-lg font-bold tabular-nums text-white mt-3">{fmtLap(meta.best_lap)}</div>
            <div className="text-[9px] uppercase tracking-[0.3em] text-neutral-500 mt-1">Meilleur tour</div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <GForceMeter gx={frame.gx} gy={frame.gy} size={96} />
            <div className="flex gap-5 text-center">
              <div><div className="text-[9px] text-neutral-500 uppercase">Lat</div><div className="text-xs font-bold tabular-nums">{Math.abs(frame.gx).toFixed(2)}g</div></div>
              <div><div className="text-[9px] text-neutral-500 uppercase">Long</div><div className="text-xs font-bold tabular-nums">{Math.abs(frame.gy).toFixed(2)}g</div></div>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay rotation (portrait) */}
      {isPortrait && (
        <div className="absolute inset-0 z-50 bg-black/95 flex flex-col items-center justify-center gap-5 px-8 text-center">
          <Smartphone size={46} className="animate-pulse" style={{ color: ACCENT, transform: 'rotate(90deg)' }} />
          <div className="text-white font-bold text-lg">Tourne ton téléphone</div>
          <div className="text-neutral-500 text-sm">HUD optimisé en mode paysage</div>
          <button onClick={goFullscreen} className="mt-1 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2" style={{ background: `${ACCENT}1a`, border: `1px solid ${ACCENT}4d`, color: ACCENT }}>
            <Maximize2 size={14} /> Plein écran
          </button>
        </div>
      )}
    </div>
  );
};

export default HudPage;
