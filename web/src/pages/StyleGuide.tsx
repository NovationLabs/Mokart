import React, { useState } from 'react';
import '../styles/Main.css';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import CountUp from '../components/CountUp';
import {
    MapPin, Timer, Activity, Cpu, Wifi, Smartphone, Award, ShieldCheck,
    ArrowRight, Check, Copy, CheckCircle2, XCircle, Gauge, Radio, Search, Settings,
} from 'lucide-react';

// ─── Section wrapper ──────────────────────────────────────────────────────────

const Section: React.FC<{
    title: string;
    subtitle?: string;
    children: React.ReactNode;
}> = ({ title, subtitle, children }) => (
    <section className="py-16 md:py-20 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
            <div className="mb-12">
                <span className="font-display text-[11px] font-light uppercase tracking-[0.25em] text-[#7bf8ac] mb-2 block">Design System</span>
                <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight">{title}</h2>
                {subtitle && <p className="text-white/45 mt-2 text-sm max-w-xl">{subtitle}</p>}
            </div>
            {children}
        </div>
    </section>
);

// ─── Color swatch (click to copy) ─────────────────────────────────────────────

const ColorSwatch: React.FC<{
    hex: string;
    name: string;
    role: string;
    light?: boolean;
}> = ({ hex, name, role, light }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(hex).catch(() => { });
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <button onClick={handleCopy} className="group text-left w-full rounded-lg" title={`Copy ${hex}`}>
            <div
                className="relative h-24 rounded-lg mb-3 overflow-hidden border border-white/10 transition-shadow duration-200"
                style={{ backgroundColor: hex, boxShadow: copied ? '0 0 20px rgba(123,248,172,0.3)' : undefined }}
            >
                <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-150 ${copied ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}>
                    <span className={`flex items-center gap-1.5 rounded px-2 py-1 text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm ${light ? 'bg-black/30 text-black' : 'bg-black/40 text-white'}`}>
                        <Copy size={11} /> Copy
                    </span>
                </div>
                <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${copied ? 'opacity-100' : 'opacity-0'}`}>
                    <span className="flex items-center gap-1.5 rounded bg-black/50 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-[#7bf8ac] backdrop-blur-sm">
                        <Check size={11} strokeWidth={3} /> Copied
                    </span>
                </div>
            </div>
            <p className={`font-bold text-sm transition-colors ${copied ? 'text-[#7bf8ac]' : 'text-white'}`}>{name}</p>
            <p className="font-mono text-xs text-white/40 mt-0.5">{hex}</p>
            <p className="text-white/30 text-[10px] font-light uppercase tracking-wider mt-1">{role}</p>
        </button>
    );
};

// ─── Type specimen ────────────────────────────────────────────────────────────

const TypeSpecimen: React.FC<{
    label: string;
    className: string;
    text: string;
    meta?: string;
}> = ({ label, className, text, meta }) => (
    <div className="flex flex-col gap-1 py-5 border-b border-white/5 last:border-0">
        <div className="flex items-baseline justify-between gap-4">
            <span className={className}>{text}</span>
            <span className="text-white/25 font-mono text-[10px] shrink-0 hidden sm:block">{meta}</span>
        </div>
        <span className="text-white/30 text-[10px] font-light uppercase tracking-widest">{label}</span>
    </div>
);

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <p className="text-[10px] text-white/30 font-light uppercase tracking-widest text-center mt-3">{children}</p>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

const StyleGuide: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#04130c] text-white antialiased overflow-x-hidden page-enter">
            <Nav />

            {/* ── Hero ── */}
            <header className="pt-36 pb-16 relative overflow-hidden bg-hero-glow">
                <div className="max-w-4xl mx-auto text-center px-6 relative z-10">
                    <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-4">
                        Design system.<br />
                        <span className="text-white/40">Centimeter precision.</span>
                    </h1>
                    <p className="text-lg text-white/55 max-w-xl mx-auto leading-relaxed mt-4">
                        Canonical tokens, typography, and components for the Mokart product suite.
                        Dark-first. High-contrast. Built on Tailwind CSS.
                    </p>
                </div>
            </header>

            {/* ── 1. Colors ── */}
            <Section
                title="Color Palette"
                subtitle="Click any swatch to copy its value. Four core tokens — everything else is white at varying opacities. No secondary hue: depth comes from green at different opacities."
            >
                <div className="mb-10">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-6">Core Tokens</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <ColorSwatch hex="#04130c" name="Background" role="Page background" />
                        <ColorSwatch hex="#0a2315" name="Surface" role="Panels, mockups" />
                        <ColorSwatch hex="#ffffff" name="White" role="Headings, primary text" light />
                        <ColorSwatch hex="#7bf8ac" name="Mint Green" role="Accent — CTAs, data, live" light />
                    </div>
                </div>

                <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-6">White Opacity Scale — text & borders</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                        {[
                            { o: 'white/70', cls: 'text-white/70', role: 'Emphasized body' },
                            { o: 'white/60', cls: 'text-white/60', role: 'Legal body' },
                            { o: 'white/45', cls: 'text-white/45', role: 'Body copy' },
                            { o: 'white/40', cls: 'text-white/40', role: 'Muted headings' },
                            { o: 'white/30', cls: 'text-white/30', role: 'Captions' },
                            { o: 'white/10', cls: 'text-white/10', role: 'Hairline borders' },
                        ].map(({ o, cls, role }) => (
                            <div key={o} className="hairline-card rounded-lg p-4 text-center">
                                <p className={`font-bold text-lg ${cls}`}>Aa</p>
                                <p className="font-mono text-[10px] text-white/40 mt-1">{o}</p>
                                <p className="text-[9px] font-light uppercase tracking-wider text-white/25 mt-1">{role}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </Section>

            {/* ── 2. Typography ── */}
            <Section
                title="Typography"
                subtitle="Iliad is reserved for brand-essential elements: H1/H2 headings, wordmark, numbered eyebrows, stats and CTAs. Body copy, card text and UI chrome use the system sans stack. Mono for telemetry data."
            >
                <div className="grid md:grid-cols-3 gap-4 mb-12">
                    <div className="hairline-card rounded-lg p-6">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#7bf8ac] mb-4">Iliad Bold · 700</p>
                        <p className="font-display text-4xl font-bold tracking-tight leading-none mb-3">ABCDEFG</p>
                        <p className="text-white/40 text-sm">H1/H2 headings, wordmark, CTAs, stats</p>
                    </div>
                    <div className="hairline-card rounded-lg p-6">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#7bf8ac] mb-4">Iliad Light · 300</p>
                        <p className="font-display text-4xl font-light tracking-tight leading-none mb-3">ABCDEFG</p>
                        <p className="text-white/40 text-sm">Numbered section eyebrows only</p>
                    </div>
                    <div className="hairline-card rounded-lg p-6">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#7bf8ac] mb-4">System Sans · 400</p>
                        <p className="text-4xl font-normal tracking-tight leading-none mb-3">ABCDEFG</p>
                        <p className="text-white/40 text-sm">Body copy, card text, footer, UI chrome</p>
                    </div>
                </div>

                <div className="hairline-card rounded-lg p-6 md:p-8">
                    <TypeSpecimen label="Display / Hero H1 — Iliad Bold" className="font-display text-5xl md:text-6xl font-bold tracking-tight leading-none" text="Racing data." meta="64px · 700 · Iliad" />
                    <TypeSpecimen label="Section H2 — Iliad Bold" className="font-display text-3xl md:text-4xl font-bold tracking-tight" text="Complete telemetry stack" meta="36px · 700 · Iliad" />
                    <TypeSpecimen label="Card H3 — System Bold" className="text-base font-bold" text="RTK Positioning" meta="16px · 700 · system" />
                    <TypeSpecimen label="Body — System sans" className="text-base text-white/45 leading-relaxed" text="Professional-grade telemetry for rental karting. Real-time lap deltas, trajectory analysis, and cloud sync." meta="16px · 400 · system" />
                    <TypeSpecimen label="Eyebrow — Iliad Light tracked caps" className="font-display text-[11px] font-light uppercase tracking-[0.25em] text-white/50" text="Live Telemetry" meta="11px · 300 · Iliad" />
                    <TypeSpecimen label="Mono data" className="text-3xl font-mono text-[#7bf8ac] font-bold" text="-0.142 · 51.847 · 50Hz" meta="30px · mono · accent" />
                </div>
            </Section>

            {/* ── 3. Buttons ── */}
            <Section
                title="Buttons"
                subtitle="Two tiers only. Primary mint for the key CTA, ghost hairline for everything else."
            >
                <div className="flex flex-wrap gap-8 items-end">
                    <div className="flex flex-col items-center gap-3">
                        <button className="btn-primary">Get access <ArrowRight size={16} /></button>
                        <Label>.btn-primary</Label>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                        <button className="btn-ghost">Watch demo</button>
                        <Label>.btn-ghost</Label>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                        <button className="text-xs font-bold uppercase tracking-widest text-[#7bf8ac] border border-[#7bf8ac]/30 px-4 py-2 rounded-md hover:bg-[#7bf8ac]/10 transition-colors">
                            Get Access
                        </button>
                        <Label>Nav outline accent</Label>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                        <button disabled className="inline-flex items-center gap-2 bg-[#7bf8ac]/25 text-black/50 font-bold px-7 py-3 rounded-md text-sm cursor-not-allowed">
                            Disabled
                        </button>
                        <Label>Disabled primary</Label>
                    </div>
                </div>
            </Section>

            {/* ── 4. Labels & badges ── */}
            <Section
                title="Labels & Badges"
                subtitle="Numbered eyebrows structure the page. Status badges stay small, mono and tracked."
            >
                <div className="flex flex-wrap gap-10 items-start">
                    <div className="flex flex-col items-center gap-3">
                        <div className="flex items-center gap-3">
                            <span className="font-mono text-[11px] text-[#7bf8ac]">01</span>
                            <span className="h-px w-8 bg-white/15" />
                            <span className="text-[11px] font-light uppercase tracking-[0.25em] text-white/50">Live telemetry</span>
                        </div>
                        <Label>Numbered section eyebrow</Label>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                        <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#7bf8ac]">
                            <span className="live-dot w-1.5 h-1.5 rounded-full bg-[#7bf8ac]" />
                            Live
                        </span>
                        <Label>Live status — pulsing</Label>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                        <span className="bg-black/60 backdrop-blur px-2.5 py-1 rounded font-mono text-[10px] text-[#7bf8ac] border border-[#7bf8ac]/20">
                            Prototype v1
                        </span>
                        <Label>Media overlay badge</Label>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                        <span className="font-mono text-[11px] text-white/30">app.novationlabs.fr — Session #247</span>
                        <Label>Mono metadata</Label>
                    </div>
                </div>
            </Section>

            {/* ── 5. Cards ── */}
            <Section
                title="Cards"
                subtitle="Hairline borders on near-transparent fills. Hover brightens the border; feature cards add a cursor-tracked spotlight edge (green ring, border-only — still no fills or glassmorphism)."
            >
                <div className="grid md:grid-cols-3 gap-4">
                    <div>
                        <div className="hairline-card rounded-lg p-7 h-full">
                            <MapPin size={20} strokeWidth={1.5} className="text-[#7bf8ac] mb-5" />
                            <h3 className="text-base font-bold mb-2">RTK Positioning</h3>
                            <p className="text-white/45 text-sm leading-relaxed">Sub-decimeter accuracy enables true racing-line analysis, unlike standard GPS.</p>
                        </div>
                        <Label>.hairline-card — feature</Label>
                    </div>
                    <div>
                        <div className="rounded-lg border border-white/10 bg-[#0a2315] p-7 h-full">
                            <p className="text-[10px] font-light uppercase tracking-[0.2em] text-white/40 mb-2">Delta vs Best</p>
                            <p className="font-mono text-4xl font-bold text-[#7bf8ac] tabular-nums">-0.142</p>
                            <div className="mt-4 space-y-1.5 font-mono text-xs">
                                <div className="flex justify-between"><span className="text-white/30">L13</span><span className="text-white/60">52.190</span></div>
                                <div className="flex justify-between"><span className="text-white/30">L14</span><span className="text-[#7bf8ac]">51.847 ●</span></div>
                            </div>
                        </div>
                        <Label>Surface panel — telemetry data</Label>
                    </div>
                    <div>
                        <div className="rounded-lg border border-[#7bf8ac]/25 bg-[#7bf8ac]/5 p-7 h-full">
                            <div className="flex items-center gap-2 mb-4">
                                <CheckCircle2 size={16} className="text-[#7bf8ac]" strokeWidth={2.5} />
                                <span className="font-bold text-sm">Mokart</span>
                            </div>
                            <div className="space-y-2">
                                {['RTK Precision', 'Live Sector Delta', 'Trajectory Analysis'].map((f) => (
                                    <div key={f} className="flex items-center gap-2 text-sm text-[#7bf8ac]">
                                        <Check size={13} /> {f}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <Label>Brand tint — comparison highlight</Label>
                    </div>
                </div>
            </Section>

            {/* ── 6. Motion ── */}
            <Section
                title="Motion"
                subtitle="CSS + IntersectionObserver, no animation library. Racing-line comets on SVG paths (pathLength=100), one-shot trace drawing, count-ups, staggered boot sequences and fade-up scroll reveals. All disabled under prefers-reduced-motion, simplified on mobile."
            >
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                        <div className="rounded-lg border border-white/10 bg-[#0a2315] p-6 text-center">
                            <p className="font-mono text-3xl text-white"><CountUp value={50} suffix=" Hz" /></p>
                            <p className="text-[10px] font-light uppercase tracking-[0.2em] text-white/35 mt-2">Update rate</p>
                        </div>
                        <Label>CountUp — ease-out-expo on view</Label>
                    </div>
                    <div>
                        <div className="rounded-lg border border-white/10 bg-[#0a2315] p-6 text-center">
                            <span className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#7bf8ac] h-full py-3">
                                <span className="live-dot w-1.5 h-1.5 rounded-full bg-[#7bf8ac]" />
                                Live session
                            </span>
                        </div>
                        <Label>.live-dot — telemetry pulse</Label>
                    </div>
                    <div>
                        <div className="rounded-lg border border-[#7bf8ac]/30 bg-[#7bf8ac]/5 breathe p-6 text-center">
                            <p className="font-mono text-sm text-[#7bf8ac]">S2 — 16.892</p>
                            <p className="text-[10px] font-light uppercase tracking-[0.2em] text-white/35 mt-2">Best sector</p>
                        </div>
                        <Label>.breathe — best-sector glow</Label>
                    </div>
                    <div>
                        <div className="rounded-lg border border-white/10 bg-[#0a2315] p-6 text-center">
                            <p className="boot font-mono text-sm text-white/70 py-3">Boot sequence</p>
                        </div>
                        <Label>.boot — hero entrance (blur rise)</Label>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <div className="rounded-lg border border-white/10 bg-[#0a2315] p-6 overflow-hidden">
                            <svg viewBox="0 0 400 90" className="w-full" fill="none" aria-hidden="true">
                                <path d="M 0 60 C 70 60 80 20 140 20 S 220 70 280 70 S 360 25 400 30" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
                                <path d="M 0 60 C 70 60 80 20 140 20 S 220 70 280 70 S 360 25 400 30" stroke="#7bf8ac" strokeWidth="1.5" pathLength={100} className="track-comet" strokeLinecap="round" />
                            </svg>
                        </div>
                        <Label>.track-comet — traveling racing line</Label>
                    </div>
                    <div>
                        <div className="rounded-lg border border-white/10 bg-[#0a2315] p-6 overflow-hidden">
                            <svg viewBox="0 0 400 90" className="w-full" fill="none" aria-hidden="true">
                                {[20, 45, 70].map((y) => (
                                    <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 6" />
                                ))}
                                <path d="M 0 70 C 40 68 50 25 90 22 C 120 20 130 55 170 60 C 200 64 220 28 260 25 C 295 23 310 50 350 55 C 375 58 390 40 400 38" stroke="#7bf8ac" strokeWidth="1.5" pathLength={100} className="spark-draw" />
                            </svg>
                        </div>
                        <Label>.spark-draw — one-shot telemetry trace</Label>
                    </div>
                </div>
            </Section>

            {/* ── 7. Icons ── */}
            <Section
                title="Icon Library"
                subtitle="Lucide React, strokeWidth 1.5. Accent for functional icons, white/30 for decorative."
            >
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-4">
                    {[
                        { Icon: Cpu, name: 'Cpu' },
                        { Icon: MapPin, name: 'MapPin' },
                        { Icon: Timer, name: 'Timer' },
                        { Icon: Activity, name: 'Activity' },
                        { Icon: Wifi, name: 'Wifi' },
                        { Icon: Smartphone, name: 'Smartphone' },
                        { Icon: Award, name: 'Award' },
                        { Icon: ShieldCheck, name: 'ShieldCheck' },
                        { Icon: Gauge, name: 'Gauge' },
                        { Icon: Radio, name: 'Radio' },
                        { Icon: Search, name: 'Search' },
                        { Icon: Settings, name: 'Settings' },
                        { Icon: CheckCircle2, name: 'CheckCircle2' },
                        { Icon: XCircle, name: 'XCircle' },
                        { Icon: ArrowRight, name: 'ArrowRight' },
                        { Icon: Check, name: 'Check' },
                    ].map(({ Icon, name }) => (
                        <div key={name} className="flex flex-col items-center gap-2 group">
                            <div className="w-12 h-12 hairline-card rounded-lg flex items-center justify-center text-white/40 group-hover:text-[#7bf8ac] transition-colors">
                                <Icon size={18} strokeWidth={1.5} />
                            </div>
                            <span className="text-[9px] text-white/25 font-mono text-center leading-tight">{name}</span>
                        </div>
                    ))}
                </div>
            </Section>

            <Footer />
        </div>
    );
};

export default StyleGuide;
