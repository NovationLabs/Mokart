import React from 'react';
import Reveal from '../Reveal';
import useSectionProgress from '../../hooks/useSectionProgress';
import { Eyebrow } from './Section';

/**
 * "The unit" — the hardware story, told like an engineering drawing.
 *
 * 1. Exploded view: a pinned blueprint SVG whose five layers separate as the
 *    visitor scrolls a 300vh runway. useSectionProgress('pin') writes `--p`
 *    on .unit-stage; every layer/annotation derives its own motion from it in
 *    CSS (translate/opacity only — see Main.css). Mobile & reduced-motion get
 *    the finished exploded state, unpinned.
 * 2. The working prototype photo, annotated with traced callout hairlines.
 * 3. The 360° CAD render.
 * 4. A datasheet grid — the raw numbers treated as design.
 */

const CX = 170;

/** Isometric plate outline: a diamond centred on the blueprint spine. */
const dia = (y: number, hw: number, hh: number) =>
    `M ${CX - hw} ${y} L ${CX} ${y - hh} L ${CX + hw} ${y} L ${CX} ${y + hh} Z`;

/** Plate thickness: the lower rim drawn t units below the outline. */
const rim = (y: number, hw: number, hh: number, t: number) =>
    `M ${CX - hw} ${y} L ${CX - hw} ${y + t} L ${CX} ${y + hh + t} L ${CX + hw} ${y + t} L ${CX + hw} ${y}`;

const HAIR = 'rgba(123,248,172,0.5)';
const HAIR_DIM = 'rgba(123,248,172,0.22)';
const FILL = 'rgba(123,248,172,0.045)';

// Exploded y-centres; --off collapses each plate into a closed stack at --p:0.
const LAYERS = [
    { y: 80, off: 192, nt: 0.12 },
    { y: 190, off: 96, nt: 0.25 },
    { y: 300, off: 0, nt: 0.38 },
    { y: 410, off: -96, nt: 0.51 },
    { y: 520, off: -192, nt: 0.64 },
];

const NOTES = [
    { n: '01', title: 'IP65 shell', desc: 'Gasketed, dust-tight enclosure. Rated against water jets, gravel and everything a wet outdoor session throws at it.', spec: 'sealed · SMA pass-through', nt: 0.10 },
    { n: '02', title: 'Delta display', desc: 'The number that matters, on the wheel: your live gap to the best lap, corner by corner.', spec: 'sunlight readable', nt: 0.24 },
    { n: '03', title: 'Compute board', desc: 'A quad-core Raspberry Pi Zero 2W runs sensor fusion, Kalman filtering and the network stack in real time.', spec: 'BCM2710A1 · 64-bit', nt: 0.38 },
    { n: '04', title: 'Sensor deck', desc: '3-axis IMU beside an RTK GNSS receiver fed by Point One and the Centipede network. Ten-centimeter truth.', spec: 'IMU · GNSS RTK · 10 cm', nt: 0.52 },
    { n: '05', title: 'Power & mount', desc: 'Eight-plus hours of endurance on a vibration-damped steering-wheel mount. Fit it and forget it.', spec: '8 h+ · anti-vibration', nt: 0.66 },
];

const layerStyle = (off: number) => ({ '--off': `${off}px` } as React.CSSProperties);
const ntStyle = (nt: number) => ({ '--nt': nt } as React.CSSProperties);

const ExplodedUnit: React.FC = () => (
    <svg
        viewBox="0 0 340 600"
        className="mx-auto h-[52vh] md:h-[68vh] min-h-[360px] max-h-[620px] w-auto"
        fill="none"
        role="img"
        aria-label="Exploded view of the Mokart wheel unit: IP65 shell, delta display, compute board, sensor deck, battery and mount"
    >
        {/* assembly spine */}
        <line x1={CX} y1={44} x2={CX} y2={556} stroke={HAIR_DIM} strokeDasharray="2 7" className="unit-spine" />

        {/* 01 — IP65 shell */}
        <g className="unit-layer" style={layerStyle(LAYERS[0].off)}>
            <path d={rim(80, 120, 34, 7)} stroke={HAIR_DIM} strokeWidth="1" strokeLinejoin="round" />
            <path d={dia(80, 120, 34)} stroke={HAIR} strokeWidth="1.2" fill={FILL} strokeLinejoin="round" />
            <path d={dia(80, 100, 28)} stroke={HAIR_DIM} strokeWidth="0.8" strokeDasharray="4 5" strokeLinejoin="round" />
            {/* antenna stub on the top face */}
            <line x1={216} y1={72} x2={216} y2={46} stroke={HAIR} strokeWidth="1.2" />
            <circle cx={216} cy={72} r={3} stroke={HAIR} strokeWidth="1" />
            <circle cx={216} cy={43} r={2.6} fill={HAIR} />
            <text x={70} y={64} fontSize="8" fill="rgba(123,248,172,0.45)" fontFamily="'Fira Code', monospace">IP65</text>
            <g className="unit-callout" style={ntStyle(LAYERS[0].nt)}>
                <line x1={290} y1={80} x2={332} y2={80} stroke={HAIR} strokeWidth="0.8" />
                <circle cx={290} cy={80} r={1.8} fill={HAIR} />
            </g>
        </g>

        {/* 02 — display */}
        <g className="unit-layer" style={layerStyle(LAYERS[1].off)}>
            <path d={rim(190, 120, 34, 7)} stroke={HAIR_DIM} strokeWidth="1" strokeLinejoin="round" />
            <path d={dia(190, 120, 34)} stroke={HAIR} strokeWidth="1.2" fill={FILL} strokeLinejoin="round" />
            <path d={dia(190, 76, 21)} stroke="rgba(173,255,206,0.4)" strokeWidth="0.9" fill="#061a10" strokeLinejoin="round" />
            <text x={CX} y={194.5} fontSize="12" fill="#7bf8ac" textAnchor="middle" fontFamily="'Fira Code', monospace" fontWeight="bold">-0.184</text>
            <text x={70} y={174} fontSize="8" fill="rgba(123,248,172,0.45)" fontFamily="'Fira Code', monospace">Δ live</text>
            <g className="unit-callout" style={ntStyle(LAYERS[1].nt)}>
                <line x1={290} y1={190} x2={332} y2={190} stroke={HAIR} strokeWidth="0.8" />
                <circle cx={290} cy={190} r={1.8} fill={HAIR} />
            </g>
        </g>

        {/* 03 — compute board */}
        <g className="unit-layer" style={layerStyle(LAYERS[2].off)}>
            <path d={rim(300, 120, 34, 7)} stroke={HAIR_DIM} strokeWidth="1" strokeLinejoin="round" />
            <path d={dia(300, 120, 34)} stroke={HAIR} strokeWidth="1.2" fill={FILL} strokeLinejoin="round" />
            {/* SoC + memory */}
            <path d={dia(300, 26, 11)} stroke={HAIR} strokeWidth="0.9" fill="rgba(123,248,172,0.09)" strokeLinejoin="round" />
            <path d={`M 96 302 L 122 295 L 148 302 L 122 309 Z`} stroke={HAIR_DIM} strokeWidth="0.8" strokeLinejoin="round" />
            {/* traces */}
            <path d="M 196 300 L 226 300 L 240 296" stroke={HAIR_DIM} strokeWidth="0.7" />
            <path d="M 196 304 L 220 304 L 236 309" stroke={HAIR_DIM} strokeWidth="0.7" />
            {[204, 212, 220].map((x) => <circle key={x} cx={x} cy={312} r={1.1} fill={HAIR_DIM} />)}
            <text x={CX} y={326} fontSize="7" fill="rgba(123,248,172,0.45)" textAnchor="middle" fontFamily="'Fira Code', monospace">BCM2710A1</text>
            <g className="unit-callout" style={ntStyle(LAYERS[2].nt)}>
                <line x1={290} y1={300} x2={332} y2={300} stroke={HAIR} strokeWidth="0.8" />
                <circle cx={290} cy={300} r={1.8} fill={HAIR} />
            </g>
        </g>

        {/* 04 — sensor deck */}
        <g className="unit-layer" style={layerStyle(LAYERS[3].off)}>
            <path d={rim(410, 120, 34, 7)} stroke={HAIR_DIM} strokeWidth="1" strokeLinejoin="round" />
            <path d={dia(410, 120, 34)} stroke={HAIR} strokeWidth="1.2" fill={FILL} strokeLinejoin="round" />
            {/* IMU die */}
            <path d="M 112 410 L 132 404 L 152 410 L 132 416 Z" stroke={HAIR} strokeWidth="0.9" fill="rgba(123,248,172,0.09)" strokeLinejoin="round" />
            <text x={132} y={428} fontSize="7" fill="rgba(123,248,172,0.45)" textAnchor="middle" fontFamily="'Fira Code', monospace">IMU ×3</text>
            {/* GNSS patch antenna */}
            <ellipse cx={216} cy={408} rx={19} ry={8.5} stroke={HAIR} strokeWidth="0.9" fill="rgba(123,248,172,0.09)" />
            <circle cx={216} cy={408} r={1.6} fill={HAIR} />
            <text x={216} y={428} fontSize="7" fill="rgba(123,248,172,0.45)" textAnchor="middle" fontFamily="'Fira Code', monospace">GNSS RTK</text>
            <g className="unit-callout" style={ntStyle(LAYERS[3].nt)}>
                <line x1={290} y1={410} x2={332} y2={410} stroke={HAIR} strokeWidth="0.8" />
                <circle cx={290} cy={410} r={1.8} fill={HAIR} />
            </g>
        </g>

        {/* 05 — power & mount */}
        <g className="unit-layer" style={layerStyle(LAYERS[4].off)}>
            <path d={rim(520, 120, 34, 7)} stroke={HAIR_DIM} strokeWidth="1" strokeLinejoin="round" />
            <path d={dia(520, 120, 34)} stroke={HAIR} strokeWidth="1.2" fill={FILL} strokeLinejoin="round" />
            {/* battery pack */}
            <path d={dia(520, 58, 16)} stroke={HAIR} strokeWidth="0.9" fill="rgba(123,248,172,0.07)" strokeLinejoin="round" />
            <line x1={150} y1={520} x2={190} y2={520} stroke={HAIR_DIM} strokeWidth="0.8" />
            <text x={CX} y={545} fontSize="7" fill="rgba(123,248,172,0.45)" textAnchor="middle" fontFamily="'Fira Code', monospace">8h+ · damped mount</text>
            {/* mount points */}
            <circle cx={62} cy={520} r={2.2} stroke={HAIR_DIM} strokeWidth="0.8" />
            <circle cx={278} cy={520} r={2.2} stroke={HAIR_DIM} strokeWidth="0.8" />
            <g className="unit-callout" style={ntStyle(LAYERS[4].nt)}>
                <line x1={290} y1={520} x2={332} y2={520} stroke={HAIR} strokeWidth="0.8" />
                <circle cx={290} cy={520} r={1.8} fill={HAIR} />
            </g>
        </g>

        {/* second read: drawing frame annotation */}
        <text x={8} y={592} fontSize="7" fill="rgba(255,255,255,0.18)" fontFamily="'Fira Code', monospace">fig. 03 — MK-U1 exploded · 5 layers · scale 1:1</text>
    </svg>
);

// ─── Photo callouts (traced hairlines over the working prototype) ────────────

const CALLOUTS = [
    { x: '45.5%', y: '17%', side: 'left' as const, label: 'RTK antenna · SMA', d: 0.15 },
    { x: '58.5%', y: '28.5%', side: 'right' as const, label: 'status LED', d: 0.4 },
    { x: '36.5%', y: '61%', side: 'left' as const, label: 'USB-C service port', d: 0.65 },
    { x: '64%', y: '73%', side: 'right' as const, label: 'damped corner bumpers', d: 0.9 },
];

const PhotoCallout: React.FC<typeof CALLOUTS[number]> = ({ x, y, side, label, d }) => (
    <div className="absolute hidden sm:block" style={{ left: x, top: y }}>
        <span className="absolute -left-1 -top-1 w-2 h-2 rounded-full border border-mokart-primary bg-mokart-bg/60" />
        <div
            className={`callout-line absolute top-0 w-16 md:w-24 ${side === 'right' ? 'left-2 origin-left' : 'right-2 origin-right'}`}
            style={{ '--d': `${d}s` } as React.CSSProperties}
        />
        <span
            className={`callout-label absolute -top-2.5 whitespace-nowrap font-mono text-[9px] md:text-[10px] tracking-[0.12em] text-mokart-glow/90 ${side === 'right' ? 'left-[4.7rem] md:left-[6.7rem]' : 'right-[4.7rem] md:right-[6.7rem]'}`}
            style={{ '--d2': `${d + 0.55}s` } as React.CSSProperties}
        >
            {label}
        </span>
    </div>
);

// ─── Datasheet ───────────────────────────────────────────────────────────────

const SPECS = [
    { k: 'Dimensions', v: '132 × 92 × 38 mm' },
    { k: 'Weight', v: '240 g' },
    { k: 'Enclosure', v: 'IP65 · gasketed' },
    { k: 'Compute', v: 'Pi Zero 2W · quad-core 64-bit' },
    { k: 'Positioning', v: 'RTK GNSS · 10 cm CEP' },
    { k: 'Corrections', v: 'Point One · Centipede · NTRIP' },
    { k: 'Inertial', v: '3-axis IMU · Kalman-fused' },
    { k: 'Sampling', v: '50 Hz, all channels' },
    { k: 'Display', v: 'live delta · sunlight readable' },
    { k: 'Link', v: 'Wi-Fi 802.11n · MQTT' },
    { k: 'Endurance', v: '8 h+ continuous' },
    { k: 'Mount', v: 'steering wheel · vibration-damped' },
];

const TheUnit: React.FC = () => {
    const stageRef = useSectionProgress<HTMLDivElement>('pin');

    return (
        <section id="system" className="relative divider-glow section-ambient">
            {/* ── 1 · Exploded view (pinned) ── */}
            <div ref={stageRef} className="unit-wrap unit-stage relative">
                <div className="unit-sticky overflow-hidden">
                    <div className="max-w-6xl mx-auto px-6 w-full pt-20 pb-10 md:pt-16 md:pb-0">
                        <div className="grid lg:grid-cols-[0.95fr_1.05fr] gap-8 lg:gap-14 items-center">
                            <div className="order-last lg:order-first">
                                <ExplodedUnit />
                            </div>

                            <div>
                                <Eyebrow>The unit</Eyebrow>
                                <h2 className="font-display text-2xl md:text-4xl font-bold tracking-tight mb-3 leading-[1.05]">
                                    Five layers, <span className="text-white/40">zero compromise.</span>
                                </h2>
                                <p className="text-white/45 leading-relaxed mb-6 max-w-lg text-sm">
                                    Everything a pro data logger does, packed into a sealed box on the
                                    steering wheel. Keep scrolling to take it apart.
                                </p>

                                <div className="relative pl-6">
                                    {/* progress rail */}
                                    <span className="absolute left-0 top-1 bottom-1 w-px bg-mokart-primary/12" aria-hidden="true" />
                                    <span className="unit-rail absolute left-0 top-1 bottom-1 w-px bg-mokart-primary/70" aria-hidden="true" />

                                    <ol className="space-y-3.5 md:space-y-4">
                                        {NOTES.map(({ n, title, desc, spec, nt }) => (
                                            <li key={n} className="unit-note" style={ntStyle(nt)}>
                                                <div className="flex items-baseline gap-3">
                                                    <span className="font-mono text-[10px] text-mokart-primary/60">{n}</span>
                                                    <h3 className="font-display font-bold text-white text-sm md:text-base">{title}</h3>
                                                    <span className="font-mono text-[9px] tracking-[0.12em] text-mokart-primary/50 ml-auto hidden sm:block">{spec}</span>
                                                </div>
                                                <p className="text-white/40 text-xs leading-relaxed mt-1 max-w-[52ch]">{desc}</p>
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── 2 · The real thing (annotated photo) ── */}
            <div className="max-w-6xl mx-auto px-6 pb-20 md:pb-28 pt-4">
                <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-10 lg:gap-14 items-center mb-16 md:mb-24">
                    <Reveal>
                        <div className="relative rounded-2xl border border-mokart-primary/12 overflow-hidden bg-mokart-surface">
                            <div className="aspect-video relative">
                                <img
                                    src="/prototype/mokart_prototype.jpg"
                                    alt="Mokart wheel unit prototype on the workbench"
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-mokart-bg/55 via-transparent to-mokart-bg/25 pointer-events-none" />
                                {CALLOUTS.map((c) => <PhotoCallout key={c.label} {...c} />)}
                                {/* blueprint corners */}
                                <span className="absolute top-3 left-3 w-4 h-4 border-l border-t border-mokart-primary/40" aria-hidden="true" />
                                <span className="absolute top-3 right-3 w-4 h-4 border-r border-t border-mokart-primary/40" aria-hidden="true" />
                                <span className="absolute bottom-3 left-3 w-4 h-4 border-l border-b border-mokart-primary/40" aria-hidden="true" />
                                <span className="absolute bottom-3 right-3 w-4 h-4 border-r border-b border-mokart-primary/40" aria-hidden="true" />
                            </div>
                            <div className="flex items-center justify-between px-4 py-3 border-t border-mokart-primary/10 font-mono text-[10px] text-white/40">
                                <span>Working prototype · bench 03</span>
                                <span className="text-mokart-primary">fig. 04</span>
                            </div>
                        </div>
                    </Reveal>

                    <div>
                        <Reveal>
                            <h3 className="font-display text-2xl md:text-4xl font-bold tracking-tight mb-4 leading-[1.06]">
                                Not a render.
                            </h3>
                            <p className="text-white/45 leading-relaxed mb-8">
                                The unit above is the one we race. Sealed, strapped to a rental-kart
                                wheel and logging every session at SpeedKart while you read this.
                            </p>
                        </Reveal>
                        <Reveal delay={120}>
                            <div className="relative rounded-2xl border border-mokart-primary/12 overflow-hidden bg-mokart-surface">
                                <div className="aspect-[3/2]">
                                    <img
                                        src="/prototype/mokart_prototype.png"
                                        alt="Mokart unit mounted on a kart steering wheel, on track"
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                </div>
                                <div className="flex items-center justify-between px-4 py-2.5 border-t border-mokart-primary/10 font-mono text-[10px] text-white/40">
                                    <span>On the wheel · track day</span>
                                    <span className="text-mokart-primary">fig. 05</span>
                                </div>
                            </div>
                        </Reveal>
                    </div>
                </div>

                {/* ── 3 · 360° render ── */}
                <Reveal>
                    <div className="max-w-5xl mx-auto relative mb-16 md:mb-24">
                        <div className="absolute -inset-8 bg-mokart-primary/[0.05] blur-3xl rounded-[3rem] pointer-events-none" aria-hidden="true" />
                        <div className="relative rounded-2xl border border-mokart-primary/12 bg-mokart-bg2 overflow-hidden shadow-[0_28px_90px_-26px_rgba(0,0,0,0.7)]">
                            <div className="flex items-center justify-between px-4 py-2.5 border-b border-mokart-primary/10 bg-mokart-primary/[0.03]">
                                <span className="font-mono text-[10px] text-mokart-primary border border-mokart-primary/20 rounded-full px-2.5 py-0.5">
                                    3D prototype model
                                </span>
                                <span className="hidden sm:flex items-center gap-4 font-mono text-[10px] text-white/30">
                                    <span>render · solid</span>
                                    <span className="flex items-center gap-1.5"><span className="live-dot w-1.5 h-1.5 rounded-full bg-mokart-primary" /> 360</span>
                                </span>
                            </div>

                            <div className="relative aspect-video bg-black">
                                <video
                                    className="absolute inset-0 w-full h-full object-cover"
                                    src="/prototype/mokart_prototype.mov"
                                    autoPlay loop muted playsInline
                                />
                                <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
                                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-mokart-primary/[0.06]" />
                                    <div className="absolute top-1/2 left-0 right-0 h-px bg-mokart-primary/[0.06]" />
                                    <span className="absolute top-4 left-4 w-5 h-5 border-l border-t border-mokart-primary/40" />
                                    <span className="absolute top-4 right-4 w-5 h-5 border-r border-t border-mokart-primary/40" />
                                    <span className="absolute bottom-4 left-4 w-5 h-5 border-l border-b border-mokart-primary/40" />
                                    <span className="absolute bottom-4 right-4 w-5 h-5 border-r border-b border-mokart-primary/40" />
                                </div>
                            </div>
                        </div>
                    </div>
                </Reveal>

                {/* ── 4 · Datasheet ── */}
                <Reveal>
                    <div className="max-w-5xl mx-auto rounded-2xl border border-mokart-primary/12 bg-mokart-surface overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-3.5 border-b border-mokart-primary/12 bg-mokart-primary/[0.03]">
                            <span className="font-display font-bold text-sm text-white tracking-tight">Datasheet — MK-U1</span>
                            <span className="font-mono text-[10px] text-white/30">REV 2.4</span>
                        </div>
                        {/* hairline grid via 1px gaps over a line-toned backdrop */}
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-px bg-mokart-line/35">
                            {SPECS.map(({ k, v }) => (
                                <div key={k} className="px-5 py-4 bg-mokart-surface hover:bg-mokart-surface2 transition-colors">
                                    <p className="text-[9px] font-light uppercase tracking-[0.2em] text-white/35">{k}</p>
                                    <p className="font-mono text-xs md:text-sm text-white/75 mt-1">{v}</p>
                                </div>
                            ))}
                        </div>
                        <p className="px-5 py-2.5 border-t border-mokart-primary/8 font-mono text-[9px] tracking-[0.15em] text-white/20 text-right select-none" aria-hidden="true">
                            specifications subject to change · mokart.fr
                        </p>
                    </div>
                </Reveal>
            </div>
        </section>
    );
};

export default TheUnit;
