import React, { useEffect, useRef } from 'react';
import useInView from '../../hooks/useInView';
import useParallax from '../../hooks/useParallax';

// ─── Hero instrument cluster ─────────────────────────────────────────────────

const METRICS = ['Speed', 'G-force', 'Position', 'Lap delta'];

// Speedometer geometry: a 270° arc with a 90° gap centred at the bottom.
const MAX_SPEED = 120;
const ARC_START = 135;   // degrees — gauge minimum (bottom-left)
const ARC_SWEEP = 270;   // degrees of travel to the maximum (bottom-right)
const ARC_TRACK = 75;    // 270/360 of a pathLength=100 circle
const REDLINE = 100;     // km/h — start of the "hot" zone

const polar = (deg: number, r: number) => {
    const a = (deg * Math.PI) / 180;
    return { x: 50 + r * Math.cos(a), y: 50 + r * Math.sin(a) };
};

// One clean tick every 10 km/h, longer at each 20. No numbers — keeps it calm.
const TICKS = Array.from({ length: MAX_SPEED / 10 + 1 }, (_, k) => {
    const speed = k * 10;
    const ang = ARC_START + (speed / MAX_SPEED) * ARC_SWEEP;
    const major = speed % 20 === 0;
    const o = polar(ang, 47.5);
    const i = polar(ang, major ? 42 : 44);
    return { x1: o.x, y1: o.y, x2: i.x, y2: i.y, major, hot: speed >= REDLINE };
});

// Redline band on the track: one dash covering REDLINE..MAX_SPEED.
const HOT_GAP = (REDLINE / MAX_SPEED) * ARC_TRACK;
const HOT_LEN = ARC_TRACK - HOT_GAP;

const HeroCluster: React.FC = () => {
    const { ref, inView } = useInView<HTMLDivElement>(0.3);
    const parallax = useParallax<HTMLDivElement>(-0.04);
    const numRef = useRef<HTMLSpanElement>(null);
    const arcRef = useRef<SVGCircleElement>(null);
    const markRef = useRef<SVGGElement>(null);

    useEffect(() => {
        if (!inView) return;

        // Push one speed reading to the digits, the lit arc and the riding marker.
        const apply = (v: number) => {
            const frac = Math.max(0, Math.min(v / MAX_SPEED, 1));
            if (numRef.current) numRef.current.textContent = String(Math.round(v));
            if (arcRef.current) {
                const len = frac * ARC_TRACK;
                arcRef.current.style.strokeDasharray = `${len} ${100 - len}`;
            }
            if (markRef.current) {
                const p = polar(ARC_START + frac * ARC_SWEEP, 40);
                markRef.current.setAttribute('transform', `translate(${p.x - 50} ${p.y - 50})`);
            }
        };

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            apply(74);
            return;
        }

        // Drive it like a real cluster: ease toward a target, then pick a new
        // plausible target every couple of seconds (accelerate / brake).
        let current = 0;
        let target = 84;
        let nextChange = 900;
        let last = performance.now();
        let raf = 0;
        const loop = (t: number) => {
            const dt = Math.min(t - last, 64);
            last = t;
            nextChange -= dt;
            if (nextChange <= 0) {
                target = 34 + Math.random() * 82;        // 34 .. 116 km/h
                nextChange = 1500 + Math.random() * 1400;
            }
            current += (target - current) * Math.min(dt / 240, 1);
            if (Math.abs(target - current) < 0.4) current = target;
            apply(current);
            raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(raf);
    }, [inView]);

    return (
        <div ref={parallax} className="relative">
            {/* halo */}
            <div className="absolute -inset-10 bg-mokart-primary/[0.07] blur-3xl rounded-[3rem] pointer-events-none" aria-hidden="true" />

            <div
                ref={ref}
                className="relative rounded-2xl border border-mokart-primary/12 bg-mokart-surface/80 backdrop-blur-sm overflow-hidden shadow-[0_30px_90px_-30px_rgba(0,0,0,0.7),0_0_70px_-24px_rgba(123,248,172,0.18)]"
            >
                {/* chrome */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-mokart-primary/10 bg-mokart-primary/[0.03]">
                    <span className="font-mono text-[11px] text-white/35">cluster · wheel unit</span>
                    <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-mokart-primary">
                        <span className="live-dot w-1.5 h-1.5 rounded-full bg-mokart-primary" />
                        Live
                    </span>
                </div>

                <div className="p-6 md:p-8 grid grid-cols-[auto_1fr] gap-6 items-center">
                    {/* speedometer */}
                    <div className="relative w-40 h-40 md:w-48 md:h-48 shrink-0">
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                            <defs>
                                <linearGradient id="mkArc" x1="0" y1="1" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#2f9d63" />
                                    <stop offset="55%" stopColor="#7bf8ac" />
                                    <stop offset="100%" stopColor="#adffce" />
                                </linearGradient>
                                <radialGradient id="mkFace" cx="50%" cy="46%" r="60%">
                                    <stop offset="0%" stopColor="rgba(123,248,172,0.05)" />
                                    <stop offset="75%" stopColor="rgba(0,0,0,0)" />
                                </radialGradient>
                            </defs>

                            {/* dial face */}
                            <circle cx="50" cy="50" r="46" fill="url(#mkFace)" />

                            {/* graduations */}
                            {TICKS.map((tk, k) => (
                                <line
                                    key={k}
                                    x1={tk.x1} y1={tk.y1} x2={tk.x2} y2={tk.y2}
                                    stroke={tk.hot ? 'rgba(173,255,206,0.7)' : tk.major ? 'rgba(123,248,172,0.42)' : 'rgba(123,248,172,0.2)'}
                                    strokeWidth={tk.major ? 1.5 : 1}
                                    strokeLinecap="round"
                                />
                            ))}

                            {/* track */}
                            <circle
                                cx="50" cy="50" r="40" fill="none"
                                stroke="rgba(123,248,172,0.10)" strokeWidth="4"
                                strokeLinecap="round" pathLength={100}
                                strokeDasharray="75 25"
                                transform="rotate(135 50 50)"
                            />
                            {/* redline band */}
                            <circle
                                cx="50" cy="50" r="40" fill="none"
                                stroke="#adffce" strokeWidth="4" opacity="0.3"
                                strokeLinecap="round" pathLength={100}
                                strokeDasharray={`0 ${HOT_GAP} ${HOT_LEN} 25`}
                                transform="rotate(135 50 50)"
                            />
                            {/* lit value arc (driven by rAF) */}
                            <circle
                                ref={arcRef}
                                cx="50" cy="50" r="40" fill="none"
                                stroke="url(#mkArc)" strokeWidth="4"
                                strokeLinecap="round" pathLength={100}
                                strokeDasharray="0 100"
                                transform="rotate(135 50 50)"
                            />

                            {/* riding marker */}
                            <g ref={markRef}>
                                <circle cx="50" cy="50" r="6.5" fill="rgba(173,255,206,0.2)" />
                                <circle cx="50" cy="50" r="3.1" fill="#eafff2" />
                            </g>
                        </svg>

                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span ref={numRef} className="font-display font-bold text-4xl md:text-5xl text-white tabular-nums tracking-tight leading-none">0</span>
                            <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/35 mt-2">km/h</span>
                        </div>
                    </div>

                    {/* readouts */}
                    <div className="space-y-4">
                        <div>
                            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40 mb-1">Measuring</p>
                            <span className="kw font-display font-bold text-2xl md:text-3xl h-8 md:h-9">
                                {METRICS.map((m, mi) => (
                                    <span key={m} className="kw-item" style={{ animationDelay: `${(mi * 9) / METRICS.length}s` }}>{m}</span>
                                ))}
                            </span>
                        </div>

                        <div className="flex items-end gap-6">
                            <div>
                                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40 mb-1">Delta</p>
                                <p className="font-mono text-xl font-bold text-mokart-primary tabular-nums">-0.184</p>
                            </div>
                            <div>
                                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40 mb-1">Lap</p>
                                <p className="font-mono text-xl font-bold text-white tabular-nums">14</p>
                            </div>
                        </div>

                        {/* mini sparkline */}
                        <svg viewBox="0 0 200 40" className="w-full" fill="none" aria-hidden="true">
                            <path
                                d="M0 30 C 20 28 26 10 44 12 C 60 14 70 32 92 30 C 112 28 120 8 146 10 C 168 12 176 28 200 24"
                                stroke="#7bf8ac" strokeWidth="1.5" pathLength={100}
                                className={inView ? 'spark-draw' : 'spark-wait'}
                            />
                        </svg>
                    </div>
                </div>

                {/* second read: fix annotation on the cluster baseline */}
                <p className="absolute bottom-2.5 right-4 font-mono text-[9px] tracking-[0.15em] text-white/20 pointer-events-none select-none" aria-hidden="true">
                    fig. 01 — MK-U1 · 50 Hz
                </p>
            </div>
        </div>
    );
};

export default HeroCluster;
