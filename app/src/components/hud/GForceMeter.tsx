import React, { useRef } from 'react';

// Radar G-force — SVG autonome, props scalaires. Extrait de LivePage pour
// être partagé entre le Mode Live (simulation) et le HUD téléphone (données réelles).
// gx = G latéral, gy = G longitudinal (FREIN en haut, ACCÉL en bas).

const FILTER_NEON = 'gfm-neon';
const FILTER_DOT = 'gfm-dot';

const GForceMeter: React.FC<{ gx: number; gy: number; size?: number }> = ({ gx, gy, size = 90 }) => {
  const trailRef = useRef<Array<[number, number]>>([]);

  const c = size / 2;
  const r = size * 0.42;          // outer ring = 1 G
  const rHalf = r * 0.5;          // mid ring   = 0.5 G
  // Clamp la position dans l'anneau pour rester lisible même à >1 G
  const cgx = Math.max(-1.15, Math.min(1.15, gx));
  const cgy = Math.max(-1.15, Math.min(1.15, gy));
  const dx = c + cgx * r * 0.88;
  const dy = c - cgy * r * 0.88;

  const trail = trailRef.current;
  trail.push([dx, dy]);
  if (trail.length > 12) trail.shift();

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
        <filter id={FILTER_NEON} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={FILTER_DOT} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <circle cx={c} cy={c} r={r}
        fill="none" stroke="#7bf8ac" strokeWidth="0.65" strokeOpacity="0.25"
        filter={`url(#${FILTER_NEON})`} />
      <circle cx={c} cy={c} r={rHalf}
        fill="none" stroke="#7bf8ac" strokeWidth="0.4" strokeOpacity="0.14" />
      <line x1={c - r} y1={c} x2={c + r} y2={c}
        stroke="#7bf8ac" strokeWidth="0.4" strokeOpacity="0.18" filter={`url(#${FILTER_NEON})`} />
      <line x1={c} y1={c - r} x2={c} y2={c + r}
        stroke="#7bf8ac" strokeWidth="0.4" strokeOpacity="0.18" filter={`url(#${FILTER_NEON})`} />
      <line x1={c - r * 0.7} y1={c - r * 0.7} x2={c + r * 0.7} y2={c + r * 0.7}
        stroke="#7bf8ac" strokeWidth="0.3" strokeOpacity="0.08" />
      <line x1={c + r * 0.7} y1={c - r * 0.7} x2={c - r * 0.7} y2={c + r * 0.7}
        stroke="#7bf8ac" strokeWidth="0.3" strokeOpacity="0.08" />
      {ticks.map((t, i) => (
        <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
          stroke="#7bf8ac" strokeWidth="0.5" strokeOpacity={i % 3 === 0 ? 0.3 : 0.12} />
      ))}

      <text x={c + rHalf + 2} y={c - 1} fill="rgba(148,163,184,0.6)" fontSize="4.5" fontFamily="monospace">0.5</text>
      <text x={c + r + 2} y={c - 1} fill="rgba(148,163,184,0.5)" fontSize="4.5" fontFamily="monospace">1G</text>
      <text x={c} y={5.5} fill="rgba(148,163,184,0.6)" fontSize="5" textAnchor="middle" fontFamily="monospace">FREIN</text>
      <text x={c} y={size - 1} fill="rgba(148,163,184,0.6)" fontSize="5" textAnchor="middle" fontFamily="monospace">ACCÉL</text>

      {trail.map(([tx, ty], i) => {
        const age = i / trail.length;
        return <circle key={i} cx={tx} cy={ty} r={0.8 + age * 2.2} fill="#7bf8ac" fillOpacity={age * 0.55} />;
      })}

      <circle cx={dx} cy={dy} r={7} fill="rgba(123,248,172,0.07)" />
      <circle cx={dx} cy={dy} r={4} fill="none" stroke="#7bf8ac" strokeWidth="0.9" filter={`url(#${FILTER_DOT})`} />
      <circle cx={dx} cy={dy} r={2.2} fill="white" style={{ filter: 'drop-shadow(0 0 2px rgba(255,255,255,0.9))' }} />
    </svg>
  );
};

export default GForceMeter;
