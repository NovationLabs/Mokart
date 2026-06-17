import React, { useEffect, useState } from 'react';
import '../styles/Main.css';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import Reveal from '../components/Reveal';
import CountUp from '../components/CountUp';
import useInView from '../hooks/useInView';
import useParallax from '../hooks/useParallax';
import useSpotlight from '../hooks/useSpotlight';
import {
    MapPin,
    Timer,
    Activity,
    Cpu,
    Wifi,
    Smartphone,
    Award,
    ShieldCheck,
    CheckCircle2,
    XCircle,
    ArrowRight,
    Gauge,
} from 'lucide-react';

// ─── Section primitives ──────────────────────────────────────────────────────

const Section: React.FC<{
    children: React.ReactNode;
    id?: string;
    className?: string;
}> = ({ children, id, className = '' }) => (
    <section id={id} className={`py-20 md:py-28 px-6 relative ${className}`}>
        <div className="max-w-6xl mx-auto relative z-10">{children}</div>
    </section>
);

const Eyebrow: React.FC<{ n: string; children: React.ReactNode }> = ({ n, children }) => (
    <div className="flex items-center gap-3 mb-5">
        <span className="font-mono text-[11px] text-[#7bf8ac]">{n}</span>
        <span className="h-px w-8 bg-white/15 eyebrow-line" />
        <span className="font-display text-[11px] font-light uppercase tracking-[0.25em] text-white/50">{children}</span>
    </div>
);

// ─── Animated racing line divider ────────────────────────────────────────────

const TrackLine: React.FC = () => (
    <div className="relative overflow-hidden pointer-events-none" aria-hidden="true">
        <svg viewBox="0 0 1200 160" className="w-full h-24 md:h-36" preserveAspectRatio="none" fill="none">
            {/* Second car: a fainter line on a slightly different trajectory, slower comet */}
            <path
                d="M -20 105 C 160 105 200 60 320 58 S 470 115 615 115 S 790 48 940 46 S 1110 85 1220 78"
                stroke="rgba(255,255,255,0.04)"
                strokeWidth="1"
            />
            <path
                d="M -20 105 C 160 105 200 60 320 58 S 470 115 615 115 S 790 48 940 46 S 1110 85 1220 78"
                stroke="rgba(123,248,172,0.3)"
                strokeWidth="1"
                pathLength={100}
                className="track-comet-slow"
                strokeLinecap="round"
            />
            <path
                d="M -20 120 C 150 120 180 40 310 40 S 480 130 620 130 S 780 30 930 30 S 1120 100 1220 90"
                stroke="rgba(255,255,255,0.07)"
                strokeWidth="1.5"
            />
            <path
                d="M -20 120 C 150 120 180 40 310 40 S 480 130 620 130 S 780 30 930 30 S 1120 100 1220 90"
                stroke="#7bf8ac"
                strokeWidth="1.5"
                pathLength={100}
                className="track-comet"
                strokeLinecap="round"
            />
        </svg>
    </div>
);

// ─── Finish readout: full-width "final lap" oscilloscope before the CTA ───────

const FINISH_TRACE =
    'M 0 86 C 60 85 80 30 140 26 C 190 22 212 72 270 80 C 322 86 346 28 410 24 C 472 20 496 74 560 82 C 610 88 642 26 705 22 C 762 18 790 68 855 76 C 906 82 936 30 1000 26 C 1056 23 1086 72 1150 78 C 1176 80 1190 60 1200 56';

const FinishLine: React.FC = () => {
    const { ref, inView } = useInView<HTMLDivElement>(0.4);
    return (
        <div ref={ref} className="relative overflow-hidden select-none" aria-hidden="true">
            <div className="max-w-6xl mx-auto px-6">
                <div className="flex items-center gap-4 mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-white/30">
                    <span className="text-[#7bf8ac]">Final lap</span>
                    <span className="h-px flex-1 bg-white/10" />
                    <span className="hidden sm:inline">S1 17.204</span>
                    <span className="hidden sm:inline">S2 16.892</span>
                    <span className="hidden sm:inline">S3 17.751</span>
                    <span className="text-[#7bf8ac]">51.847</span>
                </div>

                <svg viewBox="0 0 1200 120" className="w-full h-20 md:h-28" preserveAspectRatio="none" fill="none">
                    {/* baseline grid */}
                    {[30, 60, 90].map((y) => (
                        <line key={y} x1="0" y1={y} x2="1200" y2={y} stroke="rgba(255,255,255,0.04)" strokeDasharray="3 7" />
                    ))}
                    {/* sector dividers */}
                    {[300, 600, 900].map((x) => (
                        <line key={x} x1={x} y1="6" x2={x} y2="114" stroke="rgba(255,255,255,0.06)" />
                    ))}
                    {/* base trace */}
                    <path d={FINISH_TRACE} stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
                    {/* accent trace draws on view */}
                    <path
                        d={FINISH_TRACE}
                        stroke="#7bf8ac"
                        strokeWidth="1.5"
                        pathLength={100}
                        className={inView ? 'spark-draw' : 'spark-wait'}
                        strokeLinecap="round"
                    />
                    {/* a bright pulse keeps travelling the trace once drawn */}
                    {inView && (
                        <path
                            d={FINISH_TRACE}
                            stroke="rgba(123,248,172,0.9)"
                            strokeWidth="2"
                            pathLength={100}
                            className="track-comet-slow"
                            strokeLinecap="round"
                            style={{ animationDelay: '2.9s' }}
                        />
                    )}
                </svg>
            </div>
        </div>
    );
};

// ─── Live telemetry dashboard mockup ─────────────────────────────────────────

const DELTAS = [-0.142, -0.087, +0.034, -0.215, -0.058, +0.012];

const useDeltaTicker = (active: boolean) => {
    const [i, setI] = useState(0);
    useEffect(() => {
        if (!active) return;
        const id = setInterval(() => setI((v) => (v + 1) % DELTAS.length), 1100);
        return () => clearInterval(id);
    }, [active]);
    return DELTAS[i];
};

const TelemetryPanel: React.FC = () => {
    const { ref, inView } = useInView<HTMLDivElement>(0.35);
    const delta = useDeltaTicker(inView);
    const gaining = delta < 0;

    return (
        <div ref={ref} className="rounded-xl border border-white/10 bg-[#11141a] overflow-hidden shadow-[0_24px_80px_-20px_rgba(0,0,0,0.6),0_0_60px_-18px_rgba(123,248,172,0.1)]">
            {/* Window chrome */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/[0.02]">
                <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
                    <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
                    <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
                </div>
                <span className="font-mono text-[11px] text-white/30 hidden sm:block">app.mokart.fr — Session #247</span>
                <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#7bf8ac]">
                    <span className="live-dot w-1.5 h-1.5 rounded-full bg-[#7bf8ac]" />
                    Live
                </span>
            </div>

            <div className="grid md:grid-cols-5">
                {/* Speed trace + sectors */}
                <div className="md:col-span-3 p-5 md:p-6 border-b md:border-b-0 md:border-r border-white/10">
                    <p className="text-[10px] font-light uppercase tracking-[0.2em] text-white/40 mb-4">Speed Trace — Lap 14</p>
                    <svg viewBox="0 0 400 110" className="w-full" fill="none" aria-hidden="true">
                        {[22, 55, 88].map((y) => (
                            <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 6" />
                        ))}
                        <path
                            d="M 0 85 C 25 84 35 30 60 26 C 80 23 90 60 115 70 C 135 78 150 35 175 28 C 195 23 205 55 230 62 C 255 69 270 20 300 18 C 325 17 335 50 360 58 C 378 63 390 40 400 36"
                            stroke="#7bf8ac"
                            strokeWidth="1.5"
                            pathLength={100}
                            className={inView ? 'spark-draw' : 'spark-wait'}
                        />
                        {/* Once drawn, a bright pulse keeps travelling the trace — live data flowing in */}
                        {inView && (
                            <path
                                d="M 0 85 C 25 84 35 30 60 26 C 80 23 90 60 115 70 C 135 78 150 35 175 28 C 195 23 205 55 230 62 C 255 69 270 20 300 18 C 325 17 335 50 360 58 C 378 63 390 40 400 36"
                                stroke="rgba(123,248,172,0.9)"
                                strokeWidth="2"
                                pathLength={100}
                                className="track-comet-slow"
                                strokeLinecap="round"
                                style={{ animationDelay: '2.9s' }}
                            />
                        )}
                        <path
                            d="M 0 88 C 25 87 38 38 62 34 C 82 31 92 66 117 75 C 137 82 152 42 177 36 C 197 31 207 61 232 68 C 257 74 272 28 302 26 C 327 25 337 56 362 63 C 380 68 392 47 400 44"
                            stroke="rgba(255,255,255,0.18)"
                            strokeWidth="1"
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
                            <div key={s} className={`rounded-md border px-3 py-2 ${best ? 'border-[#7bf8ac]/30 bg-[#7bf8ac]/5 breathe' : 'border-white/10 bg-white/[0.02]'}`}>
                                <p className="text-[9px] font-light uppercase tracking-widest text-white/40">{s}</p>
                                <p className={`font-mono text-sm ${best ? 'text-[#7bf8ac]' : 'text-white/70'}`}>{t}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Delta + laps + track map */}
                <div className="md:col-span-2 p-5 md:p-6 flex flex-col justify-between gap-6">
                    <div>
                        <p className="text-[10px] font-light uppercase tracking-[0.2em] text-white/40 mb-2">Delta vs Best</p>
                        <p className={`font-mono text-4xl md:text-5xl font-bold tabular-nums ${gaining ? 'text-[#7bf8ac]' : 'text-[#f87171]'}`}>
                            <span key={delta} className="tick-in">
                                {gaining ? '' : '+'}{delta.toFixed(3)}
                            </span>
                        </p>
                    </div>

                    <div className="space-y-1.5 font-mono text-xs">
                        {[
                            { lap: 'L12', t: '52.481', best: false },
                            { lap: 'L13', t: '52.190', best: false },
                            { lap: 'L14', t: '51.847', best: true },
                        ].map(({ lap, t, best }, i) => (
                            <div
                                key={lap}
                                className={`flex items-center justify-between transition-all duration-500 ${inView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}
                                style={{ transitionDelay: `${400 + i * 150}ms` }}
                            >
                                <span className="text-white/30">{lap}</span>
                                <span className={best ? 'text-[#7bf8ac]' : 'text-white/60'}>{t}{best && ' ●'}</span>
                            </div>
                        ))}
                    </div>

                    <svg viewBox="0 0 200 110" className="w-full max-w-[180px] mx-auto" fill="none" aria-hidden="true">
                        <path
                            d="M 30 88 C 12 70 16 42 42 33 C 70 23 82 56 112 50 C 146 44 140 18 166 23 C 190 28 194 56 174 70 C 150 87 122 76 96 86 C 72 96 46 100 30 88 Z"
                            stroke="rgba(255,255,255,0.12)"
                            strokeWidth="1.5"
                        />
                        <path
                            d="M 30 88 C 12 70 16 42 42 33 C 70 23 82 56 112 50 C 146 44 140 18 166 23 C 190 28 194 56 174 70 C 150 87 122 76 96 86 C 72 96 46 100 30 88 Z"
                            stroke="#7bf8ac"
                            strokeWidth="1.5"
                            pathLength={100}
                            className="track-comet-slow"
                            strokeLinecap="round"
                        />
                    </svg>
                </div>
            </div>
        </div>
    );
};

// ─── Feature card ─────────────────────────────────────────────────────────────

const FeatureCard: React.FC<{
    icon: React.ElementType;
    title: string;
    desc: string;
}> = ({ icon: Icon, title, desc }) => {
    const { ref, onMouseMove } = useSpotlight<HTMLDivElement>();
    return (
        <div
            ref={ref}
            onMouseMove={onMouseMove}
            className="hairline-card card-accent-green spotlight relative rounded-lg p-7 group h-full"
        >
            <Icon
                size={20}
                strokeWidth={1.5}
                className="text-[#7bf8ac] mb-5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110"
            />
            <h3 className="text-base font-bold text-white mb-2">{title}</h3>
            <p className="text-white/45 text-sm leading-relaxed">{desc}</p>
        </div>
    );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const HERO_STATS = [
    { num: 10, suffix: ' cm', label: 'RTK precision' },
    { num: 50, suffix: ' Hz', label: 'Update rate' },
    { num: 1, prefix: '< ', suffix: ' ms', label: 'Local latency' },
    { num: 65, prefix: 'IP', label: 'Weather proof' },
];

const Home: React.FC = () => {
    const gridRef = useParallax<HTMLDivElement>(0.12);

    return (
        <div className="min-h-screen bg-[#0d0f12] text-white antialiased overflow-x-hidden page-enter">
            <Nav />

            {/* ── Hero ── */}
            <header className="pt-36 pb-8 md:pt-48 relative overflow-hidden bg-hero-glow">
                <div
                    ref={gridRef}
                    className="absolute -inset-y-24 inset-x-0 bg-grid-faint opacity-60 pointer-events-none [mask-image:radial-gradient(ellipse_70%_60%_at_50%_30%,black,transparent)]"
                />
                <div className="max-w-4xl mx-auto text-center px-6 relative z-10">
                    <div className="boot boot-1">
                        <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-6">
                            Racing data, down to <br className="hidden md:block" />
                            the centimeter.
                        </h1>
                    </div>

                    <div className="boot boot-2">
                        <p className="text-lg md:text-xl text-white/55 leading-relaxed max-w-2xl mx-auto mb-10">
                            Mokart brings RTK-grade GPS and inertial telemetry to rental karting —
                            live lap deltas on the steering wheel, full trajectory analysis in the cloud.
                        </p>
                    </div>

                    <div className="boot boot-3">
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
                            <a href="#product" className="btn-primary group w-full sm:w-auto">
                                Explore the system
                                <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                            </a>
                            <a href="#demo" className="btn-ghost w-full sm:w-auto">
                                Watch demo
                            </a>
                        </div>
                    </div>

                    <div className="boot boot-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/10 border-y border-white/10 max-w-3xl mx-auto">
                            {HERO_STATS.map(({ num, prefix, suffix, label }) => (
                                <div key={label} className="py-5 px-2 text-center">
                                    <p className="font-display font-bold text-xl md:text-2xl text-white">
                                        <CountUp value={num} prefix={prefix} suffix={suffix} />
                                    </p>
                                    <p className="text-[10px] font-light uppercase tracking-[0.2em] text-white/35 mt-1">{label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <TrackLine />
            </header>

            {/* ── Product / dashboard ── */}
            <Section id="product" className="divider-glow">
                <div className="grid lg:grid-cols-[2fr_3fr] gap-12 lg:gap-16 items-center">
                    <div>
                        <Reveal>
                            <Eyebrow n="01">Live telemetry</Eyebrow>
                            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-5">
                                The pit wall, <span className="text-white/40">in your browser.</span>
                            </h2>
                            <p className="text-white/45 leading-relaxed mb-8">
                                Every session streams to the Mokart dashboard in real time.
                                Speed traces, sector splits and lap deltas are ready for analysis
                                before you take your helmet off.
                            </p>
                        </Reveal>

                        <Reveal delay={100}>
                            <ul className="space-y-0 divide-y divide-white/5 border-y border-white/5">
                                {[
                                    { icon: Gauge, label: 'Speed & RPM', meta: '50 Hz' },
                                    { icon: Activity, label: '3-axis inertial data', meta: 'IMU' },
                                    { icon: MapPin, label: 'RTK GPS positioning', meta: '10 cm' },
                                    { icon: Timer, label: 'Lap & sector deltas', meta: 'Live' },
                                ].map(({ icon: Icon, label, meta }) => (
                                    <li key={label} className="flex items-center gap-4 py-3.5">
                                        <Icon size={16} strokeWidth={1.5} className="text-[#7bf8ac] shrink-0" />
                                        <span className="text-sm text-white/70 flex-1">{label}</span>
                                        <span className="font-mono text-[11px] uppercase tracking-wider text-white/30">{meta}</span>
                                    </li>
                                ))}
                            </ul>
                        </Reveal>
                    </div>

                    <Reveal delay={150}>
                        <div className="relative">
                            {/* Soft halo grounding the panel */}
                            <div
                                className="absolute -inset-8 bg-[#7bf8ac]/[0.05] blur-3xl rounded-[3rem] pointer-events-none"
                                aria-hidden="true"
                            />
                            <div className="relative">
                                <TelemetryPanel />
                            </div>
                        </div>
                    </Reveal>
                </div>
            </Section>

            {/* ── Features ── */}
            <Section id="features" className="divider-fade section-ambient">
                <Reveal>
                    <Eyebrow n="02">The stack</Eyebrow>
                    <div className="max-w-2xl mb-14">
                        <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-4">Complete telemetry stack.</h2>
                        <p className="text-white/45 leading-relaxed">
                            Hardware and software integrated seamlessly — from the steering wheel to the cloud,
                            every millisecond is captured.
                        </p>
                    </div>
                </Reveal>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                        { icon: Cpu, title: 'Embedded Unit', desc: '64-bit Raspberry Pi core orchestrates real-time sensor fusion and professional-grade GNSS processing for sub-decimeter trajectory accuracy.' },
                        { icon: MapPin, title: 'RTK Positioning', desc: 'Powered by Point One Navigation and the Centipede RTK network. 10 cm accuracy enables true racing-line analysis, unlike standard GPS (5 m).' },
                        { icon: Timer, title: 'Live Delta', desc: 'The steering wheel display shows the real-time gap versus your best lap. Know instantly whether you are gaining or losing time, corner by corner.' },
                        { icon: Wifi, title: 'Cloud Sync', desc: 'Instant upload to dedicated servers on pit entry. Session data is processed and ready for analysis within seconds.' },
                        { icon: Smartphone, title: 'Mobile Analysis', desc: 'Deep-dive into your performance. Compare speed traces, braking points and corner speeds against the track record holder.' },
                        { icon: Award, title: 'League Ready', desc: 'Built for competition — APIs for live leaderboards, broadcast overlays and automated race direction tools.' },
                    ].map((f, i) => (
                        <Reveal key={f.title} delay={(i % 3) * 80} className="h-full">
                            <FeatureCard {...f} />
                        </Reveal>
                    ))}
                </div>
            </Section>

            {/* ── Technology ── */}
            <Section id="tech" className="divider-fade">
                <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
                    <Reveal className="order-last md:order-first">
                        <div className="relative">
                            <div
                                className="absolute -inset-6 bg-[#7bf8ac]/[0.04] blur-3xl rounded-[3rem] pointer-events-none"
                                aria-hidden="true"
                            />
                            <div className="relative rounded-xl border border-white/10 overflow-hidden bg-[#11141a]">
                            <div className="aspect-[4/3] relative">
                                <img
                                    src="/prototype/mokart_prototype.jpg"
                                    alt="Mokart hardware unit"
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                                <span className="absolute top-3 left-3 bg-black/60 backdrop-blur px-2.5 py-1 rounded font-mono text-[10px] text-[#7bf8ac] border border-[#7bf8ac]/20">
                                    Prototype v1
                                </span>
                            </div>
                            </div>
                        </div>
                    </Reveal>

                    <div>
                        <Reveal>
                            <Eyebrow n="03">Architecture</Eyebrow>
                            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-10">
                                Built on proven technology.
                            </h2>
                        </Reveal>

                        <div className="space-y-0 divide-y divide-white/5">
                            {[
                                { icon: Cpu, title: 'Quad-Core Processing', desc: 'The Raspberry Pi Zero 2W’s 64-bit quad-core processor handles real-time sensor polling (IMU, RPM), RTK corrections and network stacks through optimized multithreading.' },
                                { icon: Activity, title: 'Sensor Fusion', desc: 'Kalman filtering combines GPS, accelerometer and gyroscope data to maintain precision even during high-G cornering or satellite occlusion.' },
                                { icon: ShieldCheck, title: 'Rugged Design', desc: 'IP65-rated enclosure, vibration-dampened mounts, and 8+ hours of battery endurance in continuous racing conditions.' },
                            ].map(({ icon: Icon, title, desc }, i) => (
                                <Reveal key={title} delay={i * 80}>
                                    <div className="flex gap-5 py-6">
                                        <Icon size={20} strokeWidth={1.5} className="text-[#7bf8ac] shrink-0 mt-1" />
                                        <div>
                                            <h4 className="text-white font-bold mb-1.5">{title}</h4>
                                            <p className="text-white/45 text-sm leading-relaxed">{desc}</p>
                                        </div>
                                    </div>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </div>
            </Section>

            {/* ── Demo ── */}
            <Section id="demo" className="divider-fade section-ambient">
                <Reveal>
                    <div className="text-center max-w-2xl mx-auto mb-12">
                        <div className="flex justify-center"><Eyebrow n="04">Demonstration</Eyebrow></div>
                        <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-4">System test preview.</h2>
                        <p className="text-white/45 leading-relaxed">
                            A first look at the steering-wheel unit — sensor housing, mount and display,
                            rendered straight from the working prototype.
                        </p>
                    </div>
                </Reveal>

                <Reveal delay={120}>
                    <div className="max-w-5xl mx-auto relative">
                        <div
                            className="absolute -inset-8 bg-[#7bf8ac]/[0.04] blur-3xl rounded-[3rem] pointer-events-none"
                            aria-hidden="true"
                        />
                        <div className="relative rounded-xl border border-white/10 bg-[#0b0d10] overflow-hidden shadow-[0_24px_80px_-20px_rgba(0,0,0,0.6)]">
                            {/* Viewer chrome */}
                            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-white/[0.02]">
                                <span className="font-mono text-[10px] text-[#7bf8ac] border border-[#7bf8ac]/20 rounded px-2 py-0.5">
                                    3D Prototype Model
                                </span>
                                <span className="hidden sm:flex items-center gap-4 font-mono text-[10px] text-white/30">
                                    <span>render · solid</span>
                                    <span className="flex items-center gap-1.5">
                                        <span className="live-dot w-1.5 h-1.5 rounded-full bg-[#7bf8ac]" /> 360°
                                    </span>
                                </span>
                            </div>

                            {/* Inspection viewport */}
                            <div className="relative aspect-video bg-black">
                                <video
                                    className="absolute inset-0 w-full h-full object-cover"
                                    src="/prototype/mokart_protoype.mov"
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                />

                                {/* Faint crosshair + corner brackets — technical viewer framing */}
                                <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
                                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/[0.05]" />
                                    <div className="absolute top-1/2 left-0 right-0 h-px bg-white/[0.05]" />
                                    <span className="absolute top-4 left-4 w-5 h-5 border-l border-t border-[#7bf8ac]/40" />
                                    <span className="absolute top-4 right-4 w-5 h-5 border-r border-t border-[#7bf8ac]/40" />
                                    <span className="absolute bottom-4 left-4 w-5 h-5 border-l border-b border-[#7bf8ac]/40" />
                                    <span className="absolute bottom-4 right-4 w-5 h-5 border-r border-b border-[#7bf8ac]/40" />
                                    <span className="absolute bottom-4 right-7 font-mono text-[9px] tracking-widest text-white/25">
                                        X · Y · Z
                                    </span>
                                </div>
                            </div>

                            {/* Spec strip */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-white/5 border-t border-white/10">
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

            {/* ── Comparison ── */}
            <Section id="comparison" className="divider-fade section-ambient">
                <Reveal>
                    <div className="text-center max-w-2xl mx-auto mb-12">
                        <Eyebrow n="05">Comparison</Eyebrow>
                        <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-4">Why Mokart?</h2>
                        <p className="text-white/45">Comparing market solutions for rental karting tracks.</p>
                    </div>
                </Reveal>

                <Reveal delay={120}>
                    <div className="max-w-4xl mx-auto relative">
                        <div
                            className="absolute -inset-8 bg-[#7bf8ac]/[0.04] blur-3xl rounded-[3rem] pointer-events-none"
                            aria-hidden="true"
                        />
                        <div className="relative overflow-x-auto rounded-xl border border-white/10 bg-[#11141a]">
                        <table className="w-full text-left border-collapse min-w-[560px]">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="p-4 md:p-5 text-xs font-bold text-white/60">Feature</th>
                                    {['Apex', 'Sodi', 'Facer'].map((c) => (
                                        <th key={c} className="p-4 md:p-5 text-center text-xs text-white/35">{c}</th>
                                    ))}
                                    <th className="p-4 md:p-5 text-center text-xs font-bold text-[#7bf8ac] bg-[#7bf8ac]/5">Mokart</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {[
                                    { name: 'Live Lap Timing', others: [true, true, true], mokart: true },
                                    { name: 'Steering Display', others: [false, true, true], mokart: true },
                                    { name: 'RTK Precision', others: [false, false, false], mokart: true },
                                    { name: 'Live Sector Delta', others: [false, false, false], mokart: true },
                                    { name: 'Trajectory Analysis', others: [false, false, false], mokart: true },
                                ].map((row) => (
                                    <tr key={row.name} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="p-4 md:p-5 text-sm text-white/70">{row.name}</td>
                                        {row.others.map((has, i) => (
                                            <td key={i} className="p-4 md:p-5 text-center">
                                                {has
                                                    ? <CheckCircle2 size={16} className="mx-auto text-white/30" />
                                                    : <XCircle size={16} className="mx-auto text-white/10" />}
                                            </td>
                                        ))}
                                        <td className="p-4 md:p-5 text-center bg-[#7bf8ac]/5">
                                            <CheckCircle2 size={17} className="mx-auto text-[#7bf8ac]" strokeWidth={2.5} />
                                        </td>
                                    </tr>
                                ))}
                                <tr>
                                    <td className="p-4 md:p-5 text-sm text-white/70">Hardware Cost</td>
                                    {['High', 'High', 'High'].map((c, i) => (
                                        <td key={i} className="p-4 md:p-5 text-center text-xs text-white/35">{c}</td>
                                    ))}
                                    <td className="p-4 md:p-5 text-center text-xs font-bold text-[#7bf8ac] bg-[#7bf8ac]/5">Low</td>
                                </tr>
                            </tbody>
                        </table>
                        </div>
                    </div>
                </Reveal>
            </Section>

            {/* ── Trusted by ── */}
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

            {/* ── Team ── */}
            <Section id="team" className="divider-fade">
                <Reveal>
                    <Eyebrow n="06">The team</Eyebrow>
                    <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-14">
                        Four engineers, <span className="text-white/40">one obsession.</span>
                    </h2>
                </Reveal>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                    {[
                        { img: '/team/leo.png', name: 'Léo GREGORI', link: 'https://www.linkedin.com/in/leogregori' },
                        { img: '/team/clement.png', name: 'Clément DORGE', link: 'https://www.linkedin.com/in/clement-dorge' },
                        { img: '/team/anthony.png', name: 'Anthony COLOMBANI-GAILLEUR', link: 'https://www.linkedin.com/in/anthony-colombani-gailleur-8317032b6' },
                        { img: '/team/selim.png', name: 'Selim BOUASKER', link: 'https://www.linkedin.com/in/selim-bouasker' },
                    ].map(({ img, name, link }, i) => (
                        <Reveal key={name} delay={i * 70}>
                            <a href={link} target="_blank" rel="noopener noreferrer" className="block group">
                                <div className="aspect-square rounded-lg overflow-hidden mb-4 border border-white/10 bg-white/[0.02]">
                                    <img
                                        src={img}
                                        alt={name}
                                        loading="lazy"
                                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-[1.04] transition-all duration-500"
                                    />
                                </div>
                                <h3 className="text-white font-bold text-sm md:text-base group-hover:text-[#7bf8ac] transition-colors">{name}</h3>
                                <p className="text-white/35 text-[10px] font-light uppercase tracking-[0.2em] mt-1">Software Engineer</p>
                            </a>
                        </Reveal>
                    ))}
                </div>
            </Section>

            {/* Final-lap readout bridging team → CTA: the lap closing out */}
            <FinishLine />

            {/* ── CTA band: the "last lap" — perspective grid floor below ── */}
            <section className="relative overflow-hidden py-24 md:py-32 px-6">
                {/* Perspective floor, slowly scrolling toward the viewer */}
                <div className="iso-grid" aria-hidden="true" />

                {/* Glow behind the headline */}
                <div
                    className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-[560px] h-[280px] bg-[#7bf8ac]/[0.08] blur-[100px] rounded-full pointer-events-none"
                    aria-hidden="true"
                />

                <div className="max-w-6xl mx-auto relative z-10">
                    <Reveal>
                        <div className="text-center max-w-3xl mx-auto">
                            <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight mb-6">
                                Ready to chase <span className="text-[#7bf8ac] whitespace-nowrap">the perfect lap</span>?
                            </h2>
                            <p className="text-white/45 leading-relaxed mb-10 max-w-xl mx-auto">
                                Get early access to the Mokart platform and bring professional telemetry to your track.
                            </p>
                            <a href="https://app.novationlabs.fr" className="btn-primary group">
                                Get access
                                <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                            </a>
                        </div>
                    </Reveal>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default Home;
