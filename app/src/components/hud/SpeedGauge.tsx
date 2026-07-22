import React from 'react';

// Jauge de vitesse — arc SVG néon. Extrait de LivePage pour partage Live/HUD.

const SpeedGauge: React.FC<{ speed: number; size?: number; max?: number }> = ({ speed, size = 100, max = 90 }) => {
  const pct = Math.min(Math.max(speed, 0) / max, 1);
  const r = size * 0.36;
  const circumference = 2 * Math.PI * r;
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(135deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7"
          strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`} strokeLinecap="round" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#7bf8ac" strokeWidth="7"
          strokeDasharray={`${circumference * 0.75 * pct} ${circumference * (1 - 0.75 * pct)}`}
          strokeLinecap="round"
          style={{ filter: 'drop-shadow(0 0 5px rgba(123,248,172,0.7))', transition: 'stroke-dasharray 0.1s' }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-2xl sm:text-3xl font-bold font-data text-[#7bf8ac] leading-none animate-value-glow">{Math.round(speed)}</div>
        <div className="text-[8px] text-[#94a3b8] uppercase tracking-widest mt-0.5">km/h</div>
      </div>
    </div>
  );
};

export default SpeedGauge;
