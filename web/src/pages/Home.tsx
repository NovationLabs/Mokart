import React from 'react';
import '../styles/Main.css';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import Reveal from '../components/Reveal';
import Marquee from '../components/Marquee';
import { Section, Eyebrow } from '../components/home/Section';
import MagneticCTA from '../components/home/MagneticCTA';
import HeroCluster from '../components/home/HeroCluster';
import KpiBand from '../components/home/KpiBand';
import Pipeline from '../components/home/Pipeline';
import TelemetryPanel from '../components/home/TelemetryPanel';
import BentoCell from '../components/home/BentoCell';
import TheUnit from '../components/home/TheUnit';
import CompareTable from '../components/home/CompareTable';
import TeamCard from '../components/home/TeamCard';
import useParallax from '../hooks/useParallax';
import {
    MapPin,
    Timer,
    Activity,
    Cpu,
    Wifi,
    Smartphone,
    Gauge,
} from 'lucide-react';

const MARQUEE_ITEMS = [
    'Racing line', 'Sector delta', 'Apex speed', 'Braking point',
    'G-force', 'Top speed', 'Lap record', 'Trajectory',
];

// ─── Bento mini-stories (each cell carries one living datum) ─────────────────

const AuxFusion: React.FC = () => (
    <div className="flex items-baseline justify-between" aria-hidden="true">
        <span className="reel font-mono text-[10px] text-mokart-primary/70 h-4">
            <span className="reel-item">kalman.update() · 20 ms</span>
            <span className="reel-item" style={{ animationDelay: '2.2s' }}>gnss.correct() · rtk fix</span>
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/25">64-bit</span>
    </div>
);

const AuxRtk: React.FC = () => (
    <div aria-hidden="true">
        <div className="relative w-[130px]">
            <svg viewBox="0 0 130 60" className="w-full" fill="none">
                <line x1="65" y1="0" x2="65" y2="60" stroke="rgba(123,248,172,0.15)" />
                <line x1="0" y1="30" x2="130" y2="30" stroke="rgba(123,248,172,0.15)" />
                <circle cx="65" cy="30" r="17" stroke="rgba(123,248,172,0.2)" />
                <circle cx="65" cy="30" r="8" stroke="rgba(123,248,172,0.35)" />
            </svg>
            <span className="live-dot absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-mokart-primary" />
        </div>
        <p className="font-mono text-[9px] tracking-[0.15em] text-white/25 mt-2">45.7640° N · 4.8357° E · fix: rtk</p>
    </div>
);

const AuxDelta: React.FC = () => (
    <span className="reel font-mono text-lg font-bold text-mokart-primary tabular-nums h-6" aria-hidden="true">
        <span className="reel-item">-0.142</span>
        <span className="reel-item text-white/40" style={{ animationDelay: '2.2s' }}>+0.034</span>
    </span>
);

const AuxSync: React.FC = () => (
    <div aria-hidden="true">
        <div className="flex items-center justify-between font-mono text-[9px] text-white/25 mb-1.5">
            <span>session_247.mk</span>
            <span className="text-mokart-primary/60">2.4 MB</span>
        </div>
        <div className="h-1 rounded-full bg-mokart-primary/10 overflow-hidden">
            <div className="upload-fill h-full w-full rounded-full bg-mokart-primary/70" />
        </div>
    </div>
);

const AuxAnalysis: React.FC = () => (
    <div className="flex items-center gap-5" aria-hidden="true">
        <svg viewBox="0 0 180 30" className="w-40 shrink-0" fill="none">
            <path
                d="M0 22 C 16 21 22 7 38 8 C 52 9 60 25 80 22 C 98 20 106 5 128 7 C 147 9 156 21 180 18"
                stroke="rgba(123,248,172,0.18)" strokeWidth="1.5"
            />
            <path
                d="M0 22 C 16 21 22 7 38 8 C 52 9 60 25 80 22 C 98 20 106 5 128 7 C 147 9 156 21 180 18"
                stroke="#7bf8ac" strokeWidth="1.5" pathLength={100} className="track-comet-slow" strokeLinecap="round"
            />
        </svg>
        <div className="hidden sm:flex items-center gap-2 font-mono text-[9px] text-white/30">
            <span className="border border-mokart-primary/20 rounded-full px-2 py-0.5">S1 17.204</span>
            <span className="border border-mokart-primary/30 rounded-full px-2 py-0.5 text-mokart-primary">S2 16.892</span>
            <span className="border border-mokart-primary/20 rounded-full px-2 py-0.5">S3 17.751</span>
        </div>
    </div>
);

// ─── Page ────────────────────────────────────────────────────────────────────

const Home: React.FC = () => {
    const gridRef = useParallax<HTMLDivElement>(0.1);

    return (
        <div className="min-h-screen bg-mokart-bg text-white antialiased overflow-x-clip-safe page-enter">
            <Nav />

            {/* ── Hero (asymmetric split) ── */}
            <header className="pt-24 pb-12 md:pt-28 relative overflow-hidden bg-hero-glow">
                <div
                    ref={gridRef}
                    className="absolute -inset-y-24 inset-x-0 bg-grid-faint opacity-70 pointer-events-none [mask-image:radial-gradient(ellipse_70%_60%_at_50%_30%,black,transparent)]"
                />
                {/* floating ornaments */}
                <div className="absolute top-1/4 left-[8%] w-2 h-2 rounded-full bg-mokart-primary/40 float-slow pointer-events-none" aria-hidden="true" />
                <div className="absolute top-1/3 right-[12%] w-1.5 h-1.5 rounded-full bg-mokart-primary/30 float-slow pointer-events-none" style={{ animationDelay: '2s' }} aria-hidden="true" />

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
                                <a href="#system" className="btn-ghost w-full sm:w-auto">Meet the unit</a>
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
                <KpiBand />
            </Section>

            {/* ── Kinetic marquee (one per page) ── */}
            <div className="py-6 border-y border-mokart-primary/10 bg-mokart-bg2 relative overflow-hidden">
                <Marquee items={MARQUEE_ITEMS} />
            </div>

            {/* ── The data journey (kinetic statement + capture → transmit → analyze) ── */}
            <Section id="pipeline" className="divider-fade">
                <Pipeline />
            </Section>

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
                            <ul className="space-y-0 divide-y divide-mokart-primary/8 border-y border-mokart-primary/8">
                                {[
                                    { icon: Gauge, label: 'Speed & RPM', meta: '50 Hz' },
                                    { icon: Activity, label: '3-axis inertial data', meta: 'IMU' },
                                    { icon: MapPin, label: 'RTK GPS positioning', meta: '10 cm' },
                                    { icon: Timer, label: 'Lap & sector deltas', meta: 'Live' },
                                ].map(({ icon: Icon, label, meta }) => (
                                    <li key={label} className="flex items-center gap-4 py-3.5 group">
                                        <Icon size={16} strokeWidth={1.5} className="text-mokart-primary shrink-0 transition-transform duration-300 group-hover:scale-110" />
                                        <span className="text-sm text-white/70 flex-1">{label}</span>
                                        <span className="font-mono text-[11px] uppercase tracking-wider text-white/30">{meta}</span>
                                    </li>
                                ))}
                            </ul>
                        </Reveal>
                    </div>

                    <Reveal delay={150}>
                        <div className="relative">
                            <div className="absolute -inset-8 bg-mokart-primary/[0.05] blur-3xl rounded-[3rem] pointer-events-none" aria-hidden="true" />
                            <div className="relative"><TelemetryPanel /></div>
                        </div>
                    </Reveal>
                </div>
            </Section>

            {/* ── Features (bento — every cell tells one micro-story) ── */}
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
                            aux={<AuxFusion />}
                        />
                    </Reveal>
                    <Reveal className="md:row-span-2 h-full" delay={80}>
                        <BentoCell
                            icon={MapPin} tone="pattern"
                            title="RTK positioning"
                            desc="Powered by Point One Navigation and the Centipede RTK network. Ten-centimeter accuracy unlocks true racing-line analysis, where standard GPS drifts by five meters."
                            className="h-full"
                            aux={<AuxRtk />}
                        />
                    </Reveal>
                    <Reveal className="h-full" delay={120}>
                        <BentoCell
                            icon={Timer}
                            title="Live delta"
                            desc="The wheel display shows your gap to the best lap, corner by corner."
                            className="h-full"
                            aux={<AuxDelta />}
                        />
                    </Reveal>
                    <Reveal className="h-full" delay={160}>
                        <BentoCell
                            icon={Wifi}
                            title="Cloud sync"
                            desc="Sessions upload on pit entry and are processed within seconds."
                            className="h-full"
                            aux={<AuxSync />}
                        />
                    </Reveal>
                    <Reveal className="md:col-span-3 h-full" delay={100}>
                        <BentoCell
                            icon={Smartphone} tone="gradient" wide
                            title="Mobile analysis, league ready"
                            desc="Compare speed traces, braking points and corner speeds against the track record. APIs power live leaderboards, broadcast overlays and automated race direction."
                            className="h-full"
                            aux={<AuxAnalysis />}
                        />
                    </Reveal>
                </div>
            </Section>

            {/* ── The unit (exploded view → prototype → render → datasheet) ── */}
            <TheUnit />

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
                        <div className="absolute -inset-8 bg-mokart-primary/[0.04] blur-3xl rounded-[3rem] pointer-events-none" aria-hidden="true" />
                        <CompareTable />
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
                <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-[560px] h-[280px] bg-mokart-primary/[0.10] blur-[100px] rounded-full pointer-events-none" aria-hidden="true" />

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
                            {/* second read */}
                            <p className="font-mono text-[9px] tracking-[0.2em] text-white/20 mt-8 select-none" aria-hidden="true">
                                sector 3 · clean lap · Δ 0.000
                            </p>
                        </div>
                    </Reveal>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default Home;
