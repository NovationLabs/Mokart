import React, { useEffect, useRef, useState } from 'react';
import '../styles/Main.css';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import Reveal from '../components/Reveal';
import CountUp from '../components/CountUp';
import Marquee from '../components/Marquee';
import useInView from '../hooks/useInView';
import useParallax from '../hooks/useParallax';
import useSpotlight from '../hooks/useSpotlight';
import useMagnetic from '../hooks/useMagnetic';
import useTilt from '../hooks/useTilt';
import {
    MapPin,
    Timer,
    Activity,
    Cpu,
    Wifi,
    Smartphone,
    ShieldCheck,
    Check,
    Minus,
    ArrowRight,
    Gauge,
} from 'lucide-react';

// ─── Primitives ──────────────────────────────────────────────────────────────

const Section: React.FC<{
    children: React.ReactNode;
    id?: string;
    className?: string;
}> = ({ children, id, className = '' }) => (
    <section id={id} className={`py-20 md:py-28 px-6 relative ${className}`}>
        <div className="max-w-6xl mx-auto relative z-10">{children}</div>
    </section>
);

const Eyebrow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="flex items-center gap-3 mb-5">
        <span className="h-px w-8 bg-[#7bf8ac]/40 eyebrow-line" />
        <span className="font-display text-[11px] font-light uppercase tracking-[0.28em] text-[#7bf8ac]/80">{children}</span>
    </div>
);

// ─── Magnetic primary CTA ────────────────────────────────────────────────────

const MagneticCTA: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => {
    const { ref, onMouseMove, onMouseLeave } = useMagnetic<HTMLAnchorElement>(10);
    return (
        <a
            ref={ref}
            href={href}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            className="btn-primary magnetic group w-full sm:w-auto"
        >
            {children}
            <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
        </a>
    );
};

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
            <div className="absolute -inset-10 bg-[#7bf8ac]/[0.07] blur-3xl rounded-[3rem] pointer-events-none" aria-hidden="true" />

            <div
                ref={ref}
                className="relative rounded-2xl border border-[#7bf8ac]/12 bg-[#0a2315]/80 backdrop-blur-sm overflow-hidden shadow-[0_30px_90px_-30px_rgba(0,0,0,0.7),0_0_70px_-24px_rgba(123,248,172,0.18)]"
            >
                {/* chrome */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#7bf8ac]/10 bg-[#7bf8ac]/[0.03]">
                    <span className="font-mono text-[11px] text-white/35">cluster · wheel unit</span>
                    <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#7bf8ac]">
                        <span className="live-dot w-1.5 h-1.5 rounded-full bg-[#7bf8ac]" />
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
                                <p className="font-mono text-xl font-bold text-[#7bf8ac] tabular-nums">-0.184</p>
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
            </div>
        </div>
    );
};

// ─── Full telemetry panel (the "pit wall") ───────────────────────────────────

const DELTAS = [-0.142, -0.087, +0.034, -0.215, -0.058, +0.012];

const TelemetryPanel: React.FC = () => {
    const { ref, inView } = useInView<HTMLDivElement>(0.35);
    const [i, setI] = useState(0);

    useEffect(() => {
        if (!inView) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const id = setInterval(() => setI((v) => (v + 1) % DELTAS.length), 1100);
        return () => clearInterval(id);
    }, [inView]);

    const delta = DELTAS[i];
    const gaining = delta < 0;

    return (
        <div ref={ref} className="rounded-2xl border border-[#7bf8ac]/12 bg-[#0a2315] overflow-hidden shadow-[0_28px_90px_-26px_rgba(0,0,0,0.7),0_0_70px_-22px_rgba(123,248,172,0.12)]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#7bf8ac]/10 bg-[#7bf8ac]/[0.03]">
                <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#7bf8ac]/15" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#7bf8ac]/15" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#7bf8ac]/15" />
                </div>
                <span className="font-mono text-[11px] text-white/30 hidden sm:block">app.mokart.fr · Session 247</span>
                <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#7bf8ac]">
                    <span className="live-dot w-1.5 h-1.5 rounded-full bg-[#7bf8ac]" />
                    Live
                </span>
            </div>

            <div className="grid md:grid-cols-5">
                <div className="md:col-span-3 p-5 md:p-6 border-b md:border-b-0 md:border-r border-[#7bf8ac]/10">
                    <p className="text-[10px] font-light uppercase tracking-[0.2em] text-white/40 mb-4">Speed trace, lap 14</p>
                    <svg viewBox="0 0 400 110" className="w-full" fill="none" aria-hidden="true">
                        {[22, 55, 88].map((y) => (
                            <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="rgba(123,248,172,0.06)" strokeDasharray="3 6" />
                        ))}
                        <path
                            d="M 0 85 C 25 84 35 30 60 26 C 80 23 90 60 115 70 C 135 78 150 35 175 28 C 195 23 205 55 230 62 C 255 69 270 20 300 18 C 325 17 335 50 360 58 C 378 63 390 40 400 36"
                            stroke="#7bf8ac" strokeWidth="1.5" pathLength={100}
                            className={inView ? 'spark-draw' : 'spark-wait'}
                        />
                        {inView && (
                            <path
                                d="M 0 85 C 25 84 35 30 60 26 C 80 23 90 60 115 70 C 135 78 150 35 175 28 C 195 23 205 55 230 62 C 255 69 270 20 300 18 C 325 17 335 50 360 58 C 378 63 390 40 400 36"
                                stroke="rgba(173,255,206,0.9)" strokeWidth="2" pathLength={100}
                                className="track-comet-slow" strokeLinecap="round" style={{ animationDelay: '2.9s' }}
                            />
                        )}
                        <path
                            d="M 0 88 C 25 87 38 38 62 34 C 82 31 92 66 117 75 C 137 82 152 42 177 36 C 197 31 207 61 232 68 C 257 74 272 28 302 26 C 327 25 337 56 362 63 C 380 68 392 47 400 44"
                            stroke="rgba(255,255,255,0.16)" strokeWidth="1"
                        />
                    </svg>
                    <div className="flex items-center gap-4 mt-2 text-[10px] font-mono text-white/30">
                        <span className="flex items-center gap-1.5"><span className="w-3 h-px bg-[#7bf8ac]" /> Current</span>
                        <span className="flex items-center gap-1.5"><span className="w-3 h-px bg-white/30" /> Best lap</span>
                    </div>

                    <div className="mt-6 grid grid-cols-3 gap-3">
                        {[
                            { s: 'S1', t: '17.204', best: false },
                            { s: 'S2', t: '16.892', best: true },
                            { s: 'S3', t: '17.751', best: false },
                        ].map(({ s, t, best }) => (
                            <div key={s} className={`rounded-xl border px-3 py-2 ${best ? 'border-[#7bf8ac]/30 bg-[#7bf8ac]/5 breathe' : 'border-[#7bf8ac]/10 bg-[#7bf8ac]/[0.02]'}`}>
                                <p className="text-[9px] font-light uppercase tracking-widest text-white/40">{s}</p>
                                <p className={`font-mono text-sm ${best ? 'text-[#7bf8ac]' : 'text-white/70'}`}>{t}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="md:col-span-2 p-5 md:p-6 flex flex-col justify-between gap-6">
                    <div>
                        <p className="text-[10px] font-light uppercase tracking-[0.2em] text-white/40 mb-2">Delta vs best</p>
                        <p className={`font-mono text-4xl md:text-5xl font-bold tabular-nums ${gaining ? 'text-[#7bf8ac]' : 'text-[#f59e8b]'}`}>
                            <span key={delta} className="tick-in">{gaining ? '' : '+'}{delta.toFixed(3)}</span>
                        </p>
                    </div>

                    <div className="space-y-1.5 font-mono text-xs">
                        {[
                            { lap: 'L12', t: '52.481', best: false },
                            { lap: 'L13', t: '52.190', best: false },
                            { lap: 'L14', t: '51.847', best: true },
                        ].map(({ lap, t, best }, idx) => (
                            <div
                                key={lap}
                                className={`flex items-center justify-between transition-all duration-500 ${inView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}
                                style={{ transitionDelay: `${400 + idx * 150}ms` }}
                            >
                                <span className="text-white/30">{lap}</span>
                                <span className={best ? 'text-[#7bf8ac]' : 'text-white/60'}>{t}{best ? ' best' : ''}</span>
                            </div>
                        ))}
                    </div>

                    <svg viewBox="0 0 200 110" className="w-full max-w-[180px] mx-auto" fill="none" aria-hidden="true">
                        <path
                            d="M 30 88 C 12 70 16 42 42 33 C 70 23 82 56 112 50 C 146 44 140 18 166 23 C 190 28 194 56 174 70 C 150 87 122 76 96 86 C 72 96 46 100 30 88 Z"
                            stroke="rgba(123,248,172,0.14)" strokeWidth="1.5"
                        />
                        <path
                            d="M 30 88 C 12 70 16 42 42 33 C 70 23 82 56 112 50 C 146 44 140 18 166 23 C 190 28 194 56 174 70 C 150 87 122 76 96 86 C 72 96 46 100 30 88 Z"
                            stroke="#7bf8ac" strokeWidth="1.5" pathLength={100}
                            className="track-comet-slow" strokeLinecap="round"
                        />
                    </svg>
                </div>
            </div>
        </div>
    );
};

// ─── Bento feature cell ──────────────────────────────────────────────────────

const BentoCell: React.FC<{
    icon: React.ElementType;
    title: string;
    desc: string;
    className?: string;
    tone?: 'plain' | 'gradient' | 'pattern';
    wide?: boolean;
}> = ({ icon: Icon, title, desc, className = '', tone = 'plain', wide = false }) => {
    const { ref, onMouseMove } = useSpotlight<HTMLDivElement>();

    const toneBg =
        tone === 'gradient'
            ? 'bg-gradient-to-br from-[#7bf8ac]/[0.10] via-[#0a2315] to-[#061a10]'
            : tone === 'pattern'
                ? 'bg-[#0a2315]'
                : 'bg-[#7bf8ac]/[0.018]';

    return (
        <div
            ref={ref}
            onMouseMove={onMouseMove}
            className={`hairline-card card-accent-green spotlight relative rounded-2xl p-7 group overflow-hidden ${toneBg} ${className}`}
        >
            {tone === 'pattern' && (
                <div className="absolute inset-0 bg-grid-faint opacity-50 pointer-events-none [mask-image:radial-gradient(ellipse_80%_70%_at_50%_120%,black,transparent)]" aria-hidden="true" />
            )}
            <div className="relative z-10 flex flex-col h-full">
                <Icon size={22} strokeWidth={1.5} className="text-[#7bf8ac] mb-5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110" />
                <h3 className={`font-display font-bold text-white mb-2 ${wide ? 'text-xl' : 'text-base'}`}>{title}</h3>
                <p className="text-white/45 text-sm leading-relaxed max-w-[42ch]">{desc}</p>
            </div>
        </div>
    );
};

// ─── Team tilt card ──────────────────────────────────────────────────────────

const TeamCard: React.FC<{ img: string; name: string; link: string }> = ({ img, name, link }) => {
    const { ref, onMouseMove, onMouseLeave } = useTilt<HTMLAnchorElement>(7);
    return (
        <a
            ref={ref}
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            className="tilt block group"
        >
            <div className="aspect-square rounded-2xl overflow-hidden mb-4 border border-[#7bf8ac]/12 bg-[#7bf8ac]/[0.02]">
                <img
                    src={img}
                    alt={name}
                    loading="lazy"
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-[1.05] transition-all duration-500"
                />
            </div>
            <h3 className="text-white font-bold font-display text-sm md:text-base group-hover:text-[#7bf8ac] transition-colors">{name}</h3>
            <p className="text-white/35 text-[10px] font-light uppercase tracking-[0.2em] mt-1">Software Engineer</p>
        </a>
    );
};

// ─── Page ────────────────────────────────────────────────────────────────────

const HERO_STATS = [
    { num: 10, suffix: ' cm', label: 'RTK precision' },
    { num: 50, suffix: ' Hz', label: 'Update rate' },
    { num: 1, prefix: '< ', suffix: ' ms', label: 'Local latency' },
    { num: 65, prefix: 'IP', label: 'Weather proof' },
];

const MARQUEE_ITEMS = [
    'Racing line', 'Sector delta', 'Apex speed', 'Braking point',
    'G-force', 'Top speed', 'Lap record', 'Trajectory',
];

const Home: React.FC = () => {
    const gridRef = useParallax<HTMLDivElement>(0.1);

    return (
        <div className="min-h-screen bg-[#04130c] text-white antialiased overflow-x-hidden page-enter">
            <Nav />

            {/* ── Hero (asymmetric split) ── */}
            <header className="pt-24 pb-12 md:pt-28 relative overflow-hidden bg-hero-glow">
                <div
                    ref={gridRef}
                    className="absolute -inset-y-24 inset-x-0 bg-grid-faint opacity-70 pointer-events-none [mask-image:radial-gradient(ellipse_70%_60%_at_50%_30%,black,transparent)]"
                />
                {/* floating ornaments */}
                <div className="absolute top-1/4 left-[8%] w-2 h-2 rounded-full bg-[#7bf8ac]/40 float-slow pointer-events-none" aria-hidden="true" />
                <div className="absolute top-1/3 right-[12%] w-1.5 h-1.5 rounded-full bg-[#7bf8ac]/30 float-slow pointer-events-none" style={{ animationDelay: '2s' }} aria-hidden="true" />

                <div className="max-w-6xl mx-auto px-6 relative z-10 grid lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-16 items-center min-h-[78vh]">
                    {/* left */}
                    <div>
                        <div className="boot boot-2">
                            <h1 className="font-display text-5xl md:text-6xl xl:text-7xl font-bold tracking-tight leading-[1.03] mb-6">
                                Racing data, down to <br className="hidden sm:block" />
                                the <span className="text-sweep">centimeter.</span>
                            </h1>
                        </div>

                        <div className="boot boot-3">
                            <p className="text-lg text-white/55 leading-relaxed max-w-xl mb-9">
                                Live lap deltas on the wheel. Full trajectory analysis in the cloud.
                                Ten-centimeter precision, fifty times a second.
                            </p>
                        </div>

                        <div className="boot boot-4">
                            <div className="flex flex-col sm:flex-row gap-4 items-center">
                                <MagneticCTA href="#telemetry">Explore the system</MagneticCTA>
                                <a href="#demo" className="btn-ghost w-full sm:w-auto">Watch the prototype</a>
                            </div>
                        </div>
                    </div>

                    {/* right */}
                    <div className="boot boot-5">
                        <HeroCluster />
                    </div>
                </div>
            </header>

            {/* ── KPI band ── */}
            <Section className="!py-10 md:!py-12 divider-fade">
                <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-[#7bf8ac]/10 border-y border-[#7bf8ac]/10">
                    {HERO_STATS.map(({ num, prefix, suffix, label }) => (
                        <div key={label} className="py-6 px-2 text-center">
                            <p className="font-display font-bold text-2xl md:text-3xl text-white">
                                <CountUp value={num} prefix={prefix} suffix={suffix} />
                            </p>
                            <p className="text-[10px] font-light uppercase tracking-[0.2em] text-white/35 mt-1.5">{label}</p>
                        </div>
                    ))}
                </div>
            </Section>

            {/* ── Kinetic marquee (one per page) ── */}
            <div className="py-6 border-y border-[#7bf8ac]/10 bg-[#061a10] relative overflow-hidden">
                <Marquee items={MARQUEE_ITEMS} />
            </div>

            {/* ── Telemetry (split-panel) ── */}
            <Section id="telemetry" className="divider-glow section-ambient">
                <div className="grid lg:grid-cols-[2fr_3fr] gap-12 lg:gap-16 items-center">
                    <div>
                        <Reveal>
                            <Eyebrow>Live telemetry</Eyebrow>
                            <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight mb-5 leading-[1.05]">
                                The pit wall, <span className="text-white/40">in your browser.</span>
                            </h2>
                            <p className="text-white/45 leading-relaxed mb-8 max-w-lg">
                                Every session streams to the Mokart dashboard in real time. Speed traces,
                                sector splits and lap deltas are ready before you take your helmet off.
                            </p>
                        </Reveal>

                        <Reveal delay={100}>
                            <ul className="space-y-0 divide-y divide-[#7bf8ac]/8 border-y border-[#7bf8ac]/8">
                                {[
                                    { icon: Gauge, label: 'Speed & RPM', meta: '50 Hz' },
                                    { icon: Activity, label: '3-axis inertial data', meta: 'IMU' },
                                    { icon: MapPin, label: 'RTK GPS positioning', meta: '10 cm' },
                                    { icon: Timer, label: 'Lap & sector deltas', meta: 'Live' },
                                ].map(({ icon: Icon, label, meta }) => (
                                    <li key={label} className="flex items-center gap-4 py-3.5 group">
                                        <Icon size={16} strokeWidth={1.5} className="text-[#7bf8ac] shrink-0 transition-transform duration-300 group-hover:scale-110" />
                                        <span className="text-sm text-white/70 flex-1">{label}</span>
                                        <span className="font-mono text-[11px] uppercase tracking-wider text-white/30">{meta}</span>
                                    </li>
                                ))}
                            </ul>
                        </Reveal>
                    </div>

                    <Reveal delay={150}>
                        <div className="relative">
                            <div className="absolute -inset-8 bg-[#7bf8ac]/[0.05] blur-3xl rounded-[3rem] pointer-events-none" aria-hidden="true" />
                            <div className="relative"><TelemetryPanel /></div>
                        </div>
                    </Reveal>
                </div>
            </Section>

            {/* ── Features (bento) ── */}
            <Section id="features" className="divider-fade">
                <Reveal>
                    <div className="max-w-2xl mb-12">
                        <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight mb-4 leading-[1.05]">Complete telemetry stack.</h2>
                        <p className="text-white/45 leading-relaxed">
                            Hardware and software built as one system. From the steering wheel to the cloud,
                            every millisecond is captured.
                        </p>
                    </div>
                </Reveal>

                <div className="grid md:grid-cols-3 gap-4 auto-rows-fr">
                    <Reveal className="md:col-span-2 h-full" delay={0}>
                        <BentoCell
                            icon={Cpu} tone="gradient" wide
                            title="Embedded unit"
                            desc="A 64-bit Raspberry Pi core orchestrates real-time sensor fusion and professional-grade GNSS processing for sub-decimeter trajectory accuracy, lap after lap."
                            className="h-full"
                        />
                    </Reveal>
                    <Reveal className="md:row-span-2 h-full" delay={80}>
                        <BentoCell
                            icon={MapPin} tone="pattern"
                            title="RTK positioning"
                            desc="Powered by Point One Navigation and the Centipede RTK network. Ten-centimeter accuracy unlocks true racing-line analysis, where standard GPS drifts by five meters."
                            className="h-full"
                        />
                    </Reveal>
                    <Reveal className="h-full" delay={120}>
                        <BentoCell
                            icon={Timer}
                            title="Live delta"
                            desc="The wheel display shows your gap to the best lap, corner by corner."
                            className="h-full"
                        />
                    </Reveal>
                    <Reveal className="h-full" delay={160}>
                        <BentoCell
                            icon={Wifi}
                            title="Cloud sync"
                            desc="Sessions upload on pit entry and are processed within seconds."
                            className="h-full"
                        />
                    </Reveal>
                    <Reveal className="md:col-span-3 h-full" delay={100}>
                        <div className="relative">
                            <BentoCell
                                icon={Smartphone} tone="gradient" wide
                                title="Mobile analysis, league ready"
                                desc="Compare speed traces, braking points and corner speeds against the track record. APIs power live leaderboards, broadcast overlays and automated race direction."
                                className="h-full"
                            />
                        </div>
                    </Reveal>
                </div>
            </Section>

            {/* ── System / architecture (image + text) ── */}
            <Section id="system" className="divider-fade section-ambient">
                <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
                    <Reveal className="order-last md:order-first">
                        <div className="relative">
                            <div className="absolute -inset-6 bg-[#7bf8ac]/[0.05] blur-3xl rounded-[3rem] pointer-events-none" aria-hidden="true" />
                            <div className="relative rounded-2xl border border-[#7bf8ac]/12 overflow-hidden bg-[#0a2315]">
                                <div className="aspect-[4/3] relative">
                                    <img
                                        src="/prototype/mokart_prototype.jpg"
                                        alt="Mokart steering-wheel telemetry unit"
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#04130c]/60 to-transparent pointer-events-none" />
                                </div>
                                <div className="flex items-center justify-between px-4 py-3 border-t border-[#7bf8ac]/10 font-mono text-[10px] text-white/40">
                                    <span>Working prototype</span>
                                    <span className="text-[#7bf8ac]">IP65 · Pi Zero 2W</span>
                                </div>
                            </div>
                        </div>
                    </Reveal>

                    <div>
                        <Reveal>
                            <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight mb-10 leading-[1.05]">
                                Built on proven technology.
                            </h2>
                        </Reveal>

                        <div className="space-y-0 divide-y divide-[#7bf8ac]/8">
                            {[
                                { icon: Cpu, title: 'Quad-core processing', desc: 'The Raspberry Pi Zero 2W handles sensor polling, RTK corrections and the network stack through optimized multithreading.' },
                                { icon: Activity, title: 'Sensor fusion', desc: 'Kalman filtering blends GPS, accelerometer and gyroscope data to hold precision through high-G corners and satellite occlusion.' },
                                { icon: ShieldCheck, title: 'Rugged design', desc: 'An IP65 enclosure, vibration-damped mounts and eight-plus hours of endurance in continuous racing conditions.' },
                            ].map(({ icon: Icon, title, desc }, idx) => (
                                <Reveal key={title} delay={idx * 80}>
                                    <div className="flex gap-5 py-6 group">
                                        <Icon size={20} strokeWidth={1.5} className="text-[#7bf8ac] shrink-0 mt-1 transition-transform duration-300 group-hover:scale-110" />
                                        <div>
                                            <h4 className="text-white font-bold font-display mb-1.5">{title}</h4>
                                            <p className="text-white/45 text-sm leading-relaxed">{desc}</p>
                                        </div>
                                    </div>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </div>
            </Section>

            {/* ── Demo (full-width media) ── */}
            <Section id="demo" className="divider-fade">
                <Reveal>
                    <div className="text-center max-w-2xl mx-auto mb-12">
                        <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight mb-4 leading-[1.05]">System test preview.</h2>
                        <p className="text-white/45 leading-relaxed">
                            A first look at the steering-wheel unit. Sensor housing, mount and display,
                            rendered straight from the working prototype.
                        </p>
                    </div>
                </Reveal>

                <Reveal delay={120}>
                    <div className="max-w-5xl mx-auto relative">
                        <div className="absolute -inset-8 bg-[#7bf8ac]/[0.05] blur-3xl rounded-[3rem] pointer-events-none" aria-hidden="true" />
                        <div className="relative rounded-2xl border border-[#7bf8ac]/12 bg-[#061a10] overflow-hidden shadow-[0_28px_90px_-26px_rgba(0,0,0,0.7)]">
                            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#7bf8ac]/10 bg-[#7bf8ac]/[0.03]">
                                <span className="font-mono text-[10px] text-[#7bf8ac] border border-[#7bf8ac]/20 rounded-full px-2.5 py-0.5">
                                    3D prototype model
                                </span>
                                <span className="hidden sm:flex items-center gap-4 font-mono text-[10px] text-white/30">
                                    <span>render · solid</span>
                                    <span className="flex items-center gap-1.5"><span className="live-dot w-1.5 h-1.5 rounded-full bg-[#7bf8ac]" /> 360</span>
                                </span>
                            </div>

                            <div className="relative aspect-video bg-black">
                                <video
                                    className="absolute inset-0 w-full h-full object-cover"
                                    src="/prototype/mokart_protoype.mov"
                                    autoPlay loop muted playsInline
                                />
                                <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
                                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[#7bf8ac]/[0.06]" />
                                    <div className="absolute top-1/2 left-0 right-0 h-px bg-[#7bf8ac]/[0.06]" />
                                    <span className="absolute top-4 left-4 w-5 h-5 border-l border-t border-[#7bf8ac]/40" />
                                    <span className="absolute top-4 right-4 w-5 h-5 border-r border-t border-[#7bf8ac]/40" />
                                    <span className="absolute bottom-4 left-4 w-5 h-5 border-l border-b border-[#7bf8ac]/40" />
                                    <span className="absolute bottom-4 right-4 w-5 h-5 border-r border-b border-[#7bf8ac]/40" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-[#7bf8ac]/8 border-t border-[#7bf8ac]/10">
                                {[
                                    { k: 'Enclosure', v: 'IP65' },
                                    { k: 'Core', v: 'Pi Zero 2W' },
                                    { k: 'Sensors', v: 'IMU · GNSS' },
                                    { k: 'Update', v: '50 Hz' },
                                ].map(({ k, v }) => (
                                    <div key={k} className="px-4 py-3.5">
                                        <p className="text-[9px] font-light uppercase tracking-[0.2em] text-white/35">{k}</p>
                                        <p className="font-mono text-sm text-white/75 mt-0.5">{v}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </Reveal>
            </Section>

            {/* ── Compare ── */}
            <Section id="compare" className="divider-fade section-ambient">
                <Reveal>
                    <div className="text-center max-w-2xl mx-auto mb-12">
                        <Eyebrow>Comparison</Eyebrow>
                        <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight mb-4 leading-[1.05]">Why Mokart.</h2>
                        <p className="text-white/45">How we stack up against market solutions for rental karting tracks.</p>
                    </div>
                </Reveal>

                <Reveal delay={120}>
                    <div className="max-w-4xl mx-auto relative">
                        <div className="absolute -inset-8 bg-[#7bf8ac]/[0.04] blur-3xl rounded-[3rem] pointer-events-none" aria-hidden="true" />
                        <div className="relative overflow-x-auto rounded-2xl border border-[#7bf8ac]/12 bg-[#0a2315]">
                            <table className="w-full text-left border-collapse min-w-[560px]">
                                <thead>
                                    <tr className="border-b border-[#7bf8ac]/12">
                                        <th className="p-4 md:p-5 text-xs font-bold text-white/60 font-display tracking-tight">Feature</th>
                                        {['Apex', 'Sodi', 'Facer'].map((c) => (
                                            <th key={c} className="p-4 md:p-5 text-center text-xs text-white/35">{c}</th>
                                        ))}
                                        <th className="p-4 md:p-5 text-center text-xs font-bold text-[#7bf8ac] bg-[#7bf8ac]/[0.06] font-display tracking-tight">Mokart</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#7bf8ac]/6">
                                    {[
                                        { name: 'Live lap timing', others: [true, true, true], mokart: true },
                                        { name: 'Steering display', others: [false, true, true], mokart: true },
                                        { name: 'RTK precision', others: [false, false, false], mokart: true },
                                        { name: 'Live sector delta', others: [false, false, false], mokart: true },
                                        { name: 'Trajectory analysis', others: [false, false, false], mokart: true },
                                    ].map((row) => (
                                        <tr key={row.name} className="hover:bg-[#7bf8ac]/[0.025] transition-colors">
                                            <td className="p-4 md:p-5 text-sm text-white/70">{row.name}</td>
                                            {row.others.map((has, idx) => (
                                                <td key={idx} className="p-4 md:p-5 text-center">
                                                    {has
                                                        ? <Check size={16} className="mx-auto text-white/30" />
                                                        : <Minus size={16} className="mx-auto text-white/12" />}
                                                </td>
                                            ))}
                                            <td className="p-4 md:p-5 text-center bg-[#7bf8ac]/[0.06]">
                                                <Check size={17} className="mx-auto text-[#7bf8ac]" strokeWidth={2.5} />
                                            </td>
                                        </tr>
                                    ))}
                                    <tr>
                                        <td className="p-4 md:p-5 text-sm text-white/70">Hardware cost</td>
                                        {['High', 'High', 'High'].map((c, idx) => (
                                            <td key={idx} className="p-4 md:p-5 text-center text-xs text-white/35">{c}</td>
                                        ))}
                                        <td className="p-4 md:p-5 text-center text-xs font-bold text-[#7bf8ac] bg-[#7bf8ac]/[0.06]">Low</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </Reveal>
            </Section>

            {/* ── Trusted by (logo wall) ── */}
            <Section className="!py-14 divider-fade">
                <Reveal>
                    <p className="text-center text-[10px] font-light uppercase tracking-[0.3em] text-white/30 mb-10">Trusted by</p>
                    <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20">
                        {[
                            { src: '/trusted_by/point_one.png', alt: 'Point One Navigation', href: 'https://www.pointonenav.com/' },
                            { src: '/trusted_by/epitech.png', alt: 'Epitech', href: 'https://www.epitech.eu/' },
                            { src: '/trusted_by/speedkart.png', alt: 'SpeedKart', href: 'https://www.speedkart.fr/' },
                        ].map(({ src, alt, href }) => (
                            <a key={alt} href={href} target="_blank" rel="noopener noreferrer">
                                <img
                                    src={src}
                                    alt={alt}
                                    loading="lazy"
                                    className="h-8 md:h-9 object-contain brightness-0 invert opacity-40 hover:opacity-90 transition-opacity duration-300"
                                />
                            </a>
                        ))}
                    </div>
                </Reveal>
            </Section>

            {/* ── Team (portfolio grid) ── */}
            <Section id="team" className="divider-fade">
                <Reveal>
                    <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight mb-14 leading-[1.05]">
                        Four engineers, <span className="text-white/40">one obsession.</span>
                    </h2>
                </Reveal>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                    {[
                        { img: '/team/leo.png', name: 'Léo GREGORI', link: 'https://www.linkedin.com/in/leogregori' },
                        { img: '/team/clement.png', name: 'Clément DORGE', link: 'https://www.linkedin.com/in/clement-dorge' },
                        { img: '/team/anthony.png', name: 'Anthony COLOMBANI-GAILLEUR', link: 'https://www.linkedin.com/in/anthony-colombani-gailleur-8317032b6' },
                        { img: '/team/selim.png', name: 'Selim BOUASKER', link: 'https://www.linkedin.com/in/selim-bouasker' },
                    ].map(({ img, name, link }, idx) => (
                        <Reveal key={name} delay={idx * 70}>
                            <TeamCard img={img} name={name} link={link} />
                        </Reveal>
                    ))}
                </div>
            </Section>

            {/* ── CTA (final lap, perspective floor) ── */}
            <section className="relative overflow-hidden py-24 md:py-36 px-6">
                <div className="iso-grid" aria-hidden="true" />
                <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-[560px] h-[280px] bg-[#7bf8ac]/[0.10] blur-[100px] rounded-full pointer-events-none" aria-hidden="true" />

                <div className="max-w-6xl mx-auto relative z-10">
                    <Reveal>
                        <div className="text-center max-w-3xl mx-auto">
                            <h2 className="font-display text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-[1.04]">
                                Ready to chase <span className="text-sweep whitespace-nowrap">the perfect lap</span>?
                            </h2>
                            <p className="text-white/50 leading-relaxed mb-10 max-w-xl mx-auto">
                                Get early access to the Mokart platform and bring professional telemetry to your track.
                            </p>
                            <div className="flex justify-center">
                                <MagneticCTA href="https://app.novationlabs.fr">Get access</MagneticCTA>
                            </div>
                        </div>
                    </Reveal>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default Home;
