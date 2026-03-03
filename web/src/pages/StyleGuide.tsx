import React, { useState } from 'react';
import '../styles/Main.css';
import {
    MapPin,
    Timer,
    Activity,
    Cpu,
    Wifi,
    Smartphone,
    BarChart3,
    TrendingUp,
    Award,
    ShieldCheck,
    Search,
    ArrowRight,
    Zap,
    Star,
    Bell,
    Settings,
    ChevronDown,
    Check,
    AlertTriangle,
    Info,
    XCircle,
    CheckCircle2,
    Radio,
    Gauge,
    Copy,
} from 'lucide-react';

// ─── Section wrapper ────────────────────────────────────────────────────────

const Section: React.FC<{
    children: React.ReactNode;
    id?: string;
    className?: string;
    title: string;
    subtitle?: string;
}> = ({ children, id, className = '', title, subtitle }) => (
    <section id={id} className={`py-16 md:py-20 px-4 sm:px-6 lg:px-8 relative border-t border-white/5 ${className}`}>
        <div className="max-w-7xl mx-auto relative z-10">
            <div className="mb-12">
                <span className="font-mono text-[10px] tracking-widest uppercase text-[#A3E635] mb-2 block">Design System</span>
                <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{title}</h2>
                {subtitle && <p className="text-gray-400 mt-2 text-sm max-w-xl">{subtitle}</p>}
            </div>
            {children}
        </div>
    </section>
);

// ─── Color Swatch - click to copy hex ────────────────────────────────────────

const ColorSwatch: React.FC<{
    hex: string;
    name: string;
    role: string;
    border?: boolean;
    textClass?: string;
}> = ({ hex, name, role, border = false, textClass = 'text-white' }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(hex).catch(() => { });
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <button
            onClick={handleCopy}
            className="group text-left w-full focus:outline-none"
            title={`Copy ${hex}`}
        >
            {/* Color block */}
            <div
                className={`relative h-24 rounded-xl mb-3 overflow-hidden transition-all duration-200
                    ${copied ? 'shadow-[0_0_20px_rgba(163,230,53,0.35)]' : ''}
                    ${border ? 'border border-white/10' : ''}`}
                style={{ backgroundColor: hex }}
            >
                {/* Hover hint */}
                <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-150
                    ${copied ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}>
                    <div className="bg-black/40 backdrop-blur-sm rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
                        <Copy size={11} className="text-white" />
                        <span className="text-white text-[10px] font-bold uppercase tracking-widest">Copy</span>
                    </div>
                </div>

                {/* Copied confirmation */}
                <div className={`absolute inset-0 flex items-center justify-center transition-all duration-200
                    ${copied ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="bg-black/50 backdrop-blur-sm rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
                        <Check size={12} className="text-[#A3E635]" strokeWidth={3} />
                        <span className="text-[#A3E635] text-[10px] font-bold uppercase tracking-widest">Copied</span>
                    </div>
                </div>
            </div>

            {/* Labels */}
            <p className={`font-bold text-sm transition-colors duration-200 ${copied ? 'text-[#A3E635]' : textClass}`}>
                {name}
            </p>
            <p className={`text-xs font-mono mt-0.5 transition-colors duration-200 ${copied ? 'text-[#A3E635]/70' : 'text-gray-500'}`}>
                {hex}
            </p>
            <p className="text-gray-600 text-[10px] uppercase tracking-wider mt-1">{role}</p>
        </button>
    );
};

// ─── Opacity Tint - click to copy rgba ───────────────────────────────────────

const OpacityTint: React.FC<{ opacity: number }> = ({ opacity }) => {
    const [copied, setCopied] = useState(false);
    const value = `rgba(163,230,53,${opacity / 100})`;

    const handleCopy = () => {
        navigator.clipboard.writeText(value).catch(() => { });
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <button
            onClick={handleCopy}
            className="group focus:outline-none w-full"
            title={`Copy ${value}`}
        >
            <div
                className={`relative h-16 rounded-xl overflow-hidden transition-all duration-200
                    ${copied
                        ? 'border border-[#A3E635]/50 shadow-[0_0_14px_rgba(163,230,53,0.3)]'
                        : 'border border-white/5 group-hover:border-white/20'}`}
                style={{ backgroundColor: value }}
            >
                {/* Hover hint */}
                <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-150
                    ${copied ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}>
                    <Copy size={12} className="text-white/60" />
                </div>

                {/* Copied tick */}
                <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200
                    ${copied ? 'opacity-100' : 'opacity-0'}`}>
                    <Check size={14} className="text-[#A3E635]" strokeWidth={3} />
                </div>
            </div>

            <p className={`text-xs font-mono mt-2 text-center transition-colors duration-200
                ${copied ? 'text-[#A3E635]' : 'text-gray-400'}`}>
                {copied ? 'Copied!' : `${opacity}%`}
            </p>
        </button>
    );
};

// ─── Type Specimen ────────────────────────────────────────────────────────────

const TypeSpecimen: React.FC<{
    label: string;
    className: string;
    text: string;
    meta?: string;
}> = ({ label, className, text, meta }) => (
    <div className="flex flex-col gap-1 py-5 border-b border-white/5 last:border-0">
        <div className="flex items-baseline justify-between gap-4">
            <span className={className}>{text}</span>
            <span className="text-gray-600 font-mono text-[10px] shrink-0 hidden sm:block">{meta}</span>
        </div>
        <span className="text-gray-600 text-[10px] uppercase tracking-widest">{label}</span>
    </div>
);

// ─── Component label ──────────────────────────────────────────────────────────

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <p className="text-[10px] text-gray-600 uppercase tracking-widest text-center mt-3">{children}</p>
);

// ─── Demo card wrapper ────────────────────────────────────────────────────────

const DemoBox: React.FC<{ children: React.ReactNode; className?: string }> = ({
    children,
    className = '',
}) => (
    <div className={`glass-panel rounded-xl p-6 md:p-8 flex flex-col items-center justify-center min-h-[120px] ${className}`}>
        {children}
    </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

const StyleGuide: React.FC = () => {
    const [inputValue, setInputValue] = useState('');
    const [selectValue, setSelectValue] = useState('lap-delta');

    return (
        <div className="min-h-screen bg-[#050505] text-gray-100 font-display selection:bg-[#A3E635] selection:text-black antialiased overflow-x-hidden">

            {/* Persistent grid overlay */}
            <div className="fixed inset-0 bg-grid-minimal opacity-20 pointer-events-none z-0" />

            {/* ── Hero ── */}
            <header className="pt-36 pb-20 relative overflow-hidden bg-deep-space">
                <div className="absolute inset-0 bg-grid-minimal opacity-30 pointer-events-none" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#A3E635]/5 blur-[120px] rounded-full pointer-events-none" />
                <div className="max-w-4xl mx-auto text-center px-4 relative z-10">
                    <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-4 leading-[1.1]">
                        Design System.<br />
                        <span className="text-lime-gradient">Decimeter Precision.</span>
                    </h1>
                    <p className="text-lg text-gray-400 max-w-xl mx-auto leading-relaxed font-light mt-4">
                        Canonical tokens, typography, and components for the MoKart product suite.
                        Dark-first. High-contrast. Built on Tailwind CSS.
                    </p>
                </div>
            </header>

            {/* ═══════════════════════════════════════════════════════════
                1. COLOR PALETTE
            ═══════════════════════════════════════════════════════════ */}
            <Section
                id="colors"
                title="Color Palette"
                subtitle="Click any swatch to copy its value. All UI elements derive from this constrained palette."
            >
                {/* Backgrounds */}
                <div className="mb-10">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-6">Background Scale - Anthracite</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                        <ColorSwatch hex="#000000" name="Black" role="Absolute base" border />
                        <ColorSwatch hex="#050505" name="Darker" role="Page backgrounds" border />
                        <ColorSwatch hex="#0a0a0a" name="Dark" role="Card surfaces" border />
                        <ColorSwatch hex="#121212" name="Surface" role="Elevated cards" border />
                        <ColorSwatch hex="#1a1a1a" name="Lifted" role="Hero radial top" border />
                    </div>
                </div>

                {/* Brand accents */}
                <div className="mb-10">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-6">Brand Accents</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <ColorSwatch hex="#A3E635" name="Neon Green" role="Primary - CTAs, icons, glow" textClass="text-black" />
                        <ColorSwatch hex="#84cc16" name="Green Hover" role="Hover state for primary" textClass="text-black" />
                        <ColorSwatch hex="#bef264" name="Green Light" role="Gradient end (text)" textClass="text-black" />
                        <ColorSwatch hex="#22D3EE" name="Ice Cyan" role="Secondary accent / hover tint" textClass="text-black" />
                    </div>
                </div>

                {/* Opacity tints */}
                <div className="mb-10">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-6">Green Opacity Tints - Overlay Usage</h3>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                        {[5, 10, 15, 20, 30, 50].map((o) => (
                            <OpacityTint key={o} opacity={o} />
                        ))}
                    </div>
                </div>

                {/* Text scale */}
                <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-6">Text & Border Scale</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <ColorSwatch hex="#ffffff" name="White" role="Primary headings" border />
                        <ColorSwatch hex="#d1d5db" name="Gray-300" role="Emphasized body" border />
                        <ColorSwatch hex="#9ca3af" name="Gray-400" role="Body / descriptions" border />
                        <ColorSwatch hex="#6b7280" name="Gray-500" role="Muted / captions" border />
                    </div>
                </div>
            </Section>

            {/* ═══════════════════════════════════════════════════════════
                2. TYPOGRAPHY
            ═══════════════════════════════════════════════════════════ */}
            <Section
                id="typography"
                title="Typography"
                subtitle="Two font stacks - an Inter-based display sans and a JetBrains Mono for telemetry data. Weight and tracking are the primary levers."
            >
                <div className="grid md:grid-cols-2 gap-8 mb-12">
                    <div className="glass-panel rounded-xl p-6">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#A3E635] mb-4">Display · .font-display</p>
                        <p className="text-4xl font-bold text-white tracking-tight leading-none mb-3">ABCDEFG</p>
                        <p className="text-gray-400 text-sm">Inter - system-ui - Apple System</p>
                        <p className="text-gray-600 text-xs mt-2">letter-spacing: −0.02em</p>
                    </div>
                    <div className="glass-panel rounded-xl p-6">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#A3E635] mb-4">Mono / Data · .font-mono-data</p>
                        <p className="text-4xl font-bold text-white tracking-tight leading-none mb-3 font-mono">10.02 cm</p>
                        <p className="text-gray-400 text-sm">JetBrains Mono - Fira Code</p>
                        <p className="text-gray-600 text-xs mt-2">font-variant-numeric: tabular-nums</p>
                    </div>
                </div>

                <div className="glass-panel rounded-xl p-6 md:p-8 mb-8">
                    <TypeSpecimen label="Display / Hero H1" className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-none" text="Race Data." meta="72px · 700 · tight" />
                    <TypeSpecimen label="Section H2" className="text-3xl md:text-4xl font-bold text-white tracking-tight" text="Complete Telemetry Stack" meta="36px · 700 · tight" />
                    <TypeSpecimen label="Card H3" className="text-xl font-bold text-white" text="RTK Positioning" meta="20px · 700 · normal" />
                    <TypeSpecimen label="Subheading H4" className="text-base font-bold text-white" text="Quad-Core Processing" meta="16px · 700 · normal" />
                    <TypeSpecimen label="Body - relaxed" className="text-base text-gray-400 leading-relaxed" text="Professional-grade telemetry for rental karting. Real-time lap deltas, trajectory analysis, and cloud sync." meta="16px · 400 · relaxed" />
                    <TypeSpecimen label="Caption / small" className="text-sm text-gray-500" text="Built for competition. APIs for live leaderboards and broadcast overlays." meta="14px · 400" />
                    <TypeSpecimen label="Mono data - large" className="text-3xl font-mono text-[#A3E635] font-bold" text="10cm · 50Hz · 0ms" meta="30px · 700 · mono" />
                    <TypeSpecimen label="Label - uppercase tracked" className="text-[10px] font-bold uppercase tracking-widest text-gray-500" text="GPS Precision  ·  Update Rate" meta="10px · 700 · widest" />
                </div>

                <div className="grid sm:grid-cols-3 gap-6">
                    <div className="glass-panel rounded-xl p-6 text-center">
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">.text-lime-gradient</p>
                        <p className="text-4xl font-bold text-lime-gradient leading-tight">Decimeter<br />Precision</p>
                    </div>
                    <div className="glass-panel rounded-xl p-6 text-center">
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Gray-500 contrast heading</p>
                        <p className="text-4xl font-bold text-gray-500 leading-tight">Decimeter<br />Precision</p>
                    </div>
                    <div className="glass-panel rounded-xl p-6 text-center">
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Mono - Color accent</p>
                        <p className="text-4xl font-bold font-mono text-[#A3E635] leading-tight">10.00<br />cm</p>
                    </div>
                </div>
            </Section>

            {/* ═══════════════════════════════════════════════════════════
                3. BUTTONS
            ═══════════════════════════════════════════════════════════ */}
            <Section
                id="buttons"
                title="Buttons"
                subtitle="Three tiers of hierarchy. Primary for key CTAs, Secondary for supporting actions, Ghost/Icon for tertiary controls."
            >
                <div className="mb-10">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-6">Primary - Neon Green</h3>
                    <div className="flex flex-wrap gap-6 items-end">
                        <div className="flex flex-col items-center gap-3">
                            <button className="px-10 py-4 bg-[#A3E635] text-black font-bold rounded-lg transition-all duration-300 hover:shadow-[0_0_18px_rgba(163,230,53,0.5),0_0_60px_rgba(163,230,53,0.3)] text-base">
                                Large
                            </button>
                            <Label>px-10 py-4 · text-base</Label>
                        </div>
                        <div className="flex flex-col items-center gap-3">
                            <button className="px-8 py-3 bg-[#A3E635] text-black font-semibold rounded-lg transition-all duration-300 hover:shadow-[0_0_18px_rgba(163,230,53,0.5),0_0_60px_rgba(163,230,53,0.3)]">
                                Default
                            </button>
                            <Label>px-8 py-3 · Default</Label>
                        </div>
                        <div className="flex flex-col items-center gap-3">
                            <button className="px-5 py-2 bg-[#A3E635] text-black font-semibold rounded-lg text-sm transition-all duration-300 hover:shadow-[0_0_14px_rgba(163,230,53,0.4)]">
                                Small
                            </button>
                            <Label>px-5 py-2 · text-sm</Label>
                        </div>
                        <div className="flex flex-col items-center gap-3">
                            <button className="px-8 py-3 bg-[#A3E635] text-black font-semibold rounded-lg transition-all duration-300 hover:shadow-[0_0_18px_rgba(163,230,53,0.5)] flex items-center gap-2">
                                With Icon <ArrowRight size={16} />
                            </button>
                            <Label>With icon</Label>
                        </div>
                        <div className="flex flex-col items-center gap-3">
                            <button disabled className="px-8 py-3 bg-[#A3E635]/30 text-black/50 font-semibold rounded-lg cursor-not-allowed">
                                Disabled
                            </button>
                            <Label>opacity-30 · disabled</Label>
                        </div>
                    </div>
                </div>

                <div className="mb-10">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-6">Secondary - Glassmorphism</h3>
                    <div className="flex flex-wrap gap-6 items-end">
                        <div className="flex flex-col items-center gap-3">
                            <button className="px-8 py-3 bg-white/5 border border-white/10 text-white font-medium rounded-lg hover:bg-white/10 transition-all">
                                Watch Demo
                            </button>
                            <Label>bg-white/5 · Default</Label>
                        </div>
                        <div className="flex flex-col items-center gap-3">
                            <button className="px-8 py-3 glass-panel text-white font-medium rounded-lg hover:border-white/20 hover:bg-white/[0.07] transition-all flex items-center gap-2">
                                <Settings size={16} className="text-[#A3E635]" /> Settings
                            </button>
                            <Label>glass-panel · with icon</Label>
                        </div>
                        <div className="flex flex-col items-center gap-3">
                            <button className="px-8 py-3 border border-[#A3E635]/30 text-[#A3E635] text-xs font-bold uppercase tracking-widest rounded hover:bg-[#A3E635]/10 transition-colors">
                                Get Access
                            </button>
                            <Label>Outline accent - nav style</Label>
                        </div>
                        <div className="flex flex-col items-center gap-3">
                            <button disabled className="px-8 py-3 bg-white/5 border border-white/5 text-gray-600 font-medium rounded-lg cursor-not-allowed">
                                Disabled
                            </button>
                            <Label>Disabled secondary</Label>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-6">Icon Buttons</h3>
                    <div className="flex flex-wrap gap-6 items-end">
                        {[
                            { icon: <Bell size={18} />, label: 'Ghost' },
                            { icon: <Search size={18} />, label: 'Ghost' },
                            { icon: <ArrowRight size={18} />, label: 'Ghost' },
                        ].map(({ icon, label }, i) => (
                            <div key={i} className="flex flex-col items-center gap-3">
                                <button className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-[#A3E635] hover:border-[#A3E635]/30 hover:bg-[#A3E635]/5 transition-all">
                                    {icon}
                                </button>
                                <Label>{label}</Label>
                            </div>
                        ))}
                        <div className="flex flex-col items-center gap-3">
                            <button className="w-10 h-10 rounded-lg bg-[#A3E635] flex items-center justify-center text-black hover:shadow-[0_0_14px_rgba(163,230,53,0.5)] transition-all">
                                <Zap size={18} />
                            </button>
                            <Label>Primary fill</Label>
                        </div>
                        <div className="flex flex-col items-center gap-3">
                            <button className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:bg-[#A3E635] hover:text-black hover:border-transparent transition-all group">
                                <Cpu size={18} className="group-hover:scale-110 transition-transform" />
                            </button>
                            <Label>Morphing group</Label>
                        </div>
                    </div>
                </div>
            </Section>

            {/* ═══════════════════════════════════════════════════════════
                4. BADGES
            ═══════════════════════════════════════════════════════════ */}
            <Section
                id="badges"
                title="Badges & Labels"
                subtitle="Pill-style labels for status, categories, and system states. Always uppercase, always tracked."
            >
                <div className="flex flex-wrap gap-6 items-start">
                    <div className="flex flex-col items-center gap-3">
                        <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-[#A3E635]/10 text-[#A3E635] rounded-md border border-[#A3E635]/20">
                            Hardware
                        </span>
                        <Label>Feature card badge</Label>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[#A3E635] text-xs font-medium">
                            Live Telemetry System v2.0
                        </span>
                        <Label>Hero pill badge</Label>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#A3E635]/10 border border-[#A3E635]/20 text-[#A3E635] text-xs font-bold uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#A3E635] animate-pulse" />
                            Live
                        </span>
                        <Label>Live status</Label>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                        <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-[#A3E635]/10 text-[#A3E635] rounded-md border border-[#A3E635]/20">
                            Precision
                        </span>
                        <Label>Category badge</Label>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                        <span className="bg-black/50 backdrop-blur px-2 py-1 rounded text-[10px] font-mono text-[#A3E635] border border-[#A3E635]/20 flex items-center gap-1">
                            3D Prototype Model
                        </span>
                        <Label>Media overlay badge</Label>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                        <span className="text-[#A3E635] font-mono text-xs tracking-widest uppercase">
                            Architecture
                        </span>
                        <Label>Section label (no border)</Label>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                            <Check size={10} /> Active
                        </span>
                        <Label>Status · success</Label>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-bold uppercase tracking-wider">
                            <AlertTriangle size={10} /> Warning
                        </span>
                        <Label>Status · warning</Label>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-wider">
                            <XCircle size={10} /> Offline
                        </span>
                        <Label>Status · error</Label>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-bold uppercase tracking-wider">
                            <Info size={10} /> Beta
                        </span>
                        <Label>Status · info</Label>
                    </div>
                </div>
            </Section>

            {/* ═══════════════════════════════════════════════════════════
                5. CARDS
            ═══════════════════════════════════════════════════════════ */}
            <Section
                id="cards"
                title="Cards"
                subtitle="Glass panels are the primary surface for content. Interaction is communicated through border luminosity and background lightening on hover."
            >
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                    <div>
                        <div className="glass-panel p-6 md:p-8 rounded-xl hover:border-[#A3E635]/30 hover:bg-white/[0.05] transition-all duration-300 group h-full">
                            <div className="flex items-start justify-between mb-4">
                                <div className="bg-white/5 p-3 rounded-lg text-[#A3E635] group-hover:bg-[#A3E635] group-hover:text-black transition-colors">
                                    <MapPin size={24} />
                                </div>
                                <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-[#A3E635]/10 text-[#A3E635] rounded-md border border-[#A3E635]/20">
                                    Precision
                                </span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">RTK Positioning</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">Sub-decimeter accuracy (10cm) allows for true racing line analysis, unlike standard GPS (5m).</p>
                        </div>
                        <Label>Feature Card - glass-panel + hover glow border</Label>
                    </div>
                    <div>
                        <div className="glass-panel p-6 md:p-8 rounded-xl hover:border-[#A3E635]/30 hover:bg-white/[0.05] transition-all duration-300 group h-full">
                            <div className="flex items-start justify-between mb-4">
                                <div className="bg-white/5 p-3 rounded-lg text-[#A3E635] group-hover:bg-[#A3E635] group-hover:text-black transition-colors">
                                    <Wifi size={24} />
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Cloud Sync</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">Instant upload to dedicated servers upon pit entry. Session data is ready for analysis before you take your helmet off.</p>
                        </div>
                        <Label>Feature Card - no badge</Label>
                    </div>
                    <div>
                        <div className="text-center p-6 border border-white/5 bg-white/[0.02] rounded-xl h-full flex flex-col items-center justify-center">
                            <div className="text-5xl font-mono text-[#A3E635] font-bold mb-2">10cm</div>
                            <div className="text-xs text-gray-400 uppercase tracking-widest">GPS Precision</div>
                        </div>
                        <Label>Stat Card - mono value + label</Label>
                    </div>
                    <div>
                        <div className="glass-panel p-6 rounded-xl flex gap-4 items-start group hover:border-white/15 transition-all">
                            <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 border border-white/10 group-hover:border-[#A3E635]/30 transition-colors">
                                <Cpu size={24} className="text-[#A3E635]" />
                            </div>
                            <div>
                                <h4 className="text-white font-bold mb-1">Quad-Core Processing</h4>
                                <p className="text-gray-400 text-sm leading-relaxed">64-bit processor handles real-time sensor polling, RTK corrections, and network stacks through optimised multithreading.</p>
                            </div>
                        </div>
                        <Label>Technology list item card</Label>
                    </div>
                    <div>
                        <div className="rounded-xl border border-[#A3E635]/20 bg-[#A3E635]/5 p-6 h-full">
                            <div className="flex items-center gap-2 mb-4">
                                <CheckCircle2 size={18} className="text-[#A3E635]" strokeWidth={2.5} />
                                <span className="font-bold text-white text-sm">MOKART</span>
                            </div>
                            <div className="space-y-2">
                                {['RTK Precision', 'Live Sector Delta', 'Trajectory Analysis', 'Low Hardware Cost'].map((f) => (
                                    <div key={f} className="flex items-center gap-2 text-sm text-[#A3E635]">
                                        <Check size={14} /> {f}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <Label>Comparison highlight - brand tint</Label>
                    </div>
                    <div>
                        <div className="glass-panel p-2 rounded-xl border border-white/10 shadow-2xl relative overflow-hidden">
                            <div className="absolute inset-0 bg-[#A3E635]/5 blur-3xl rounded-full pointer-events-none" />
                            <div className="aspect-[4/3] bg-[#111] rounded-lg overflow-hidden relative flex items-center justify-center">
                                <div className="text-center">
                                    <Gauge size={40} className="text-[#A3E635]/30 mx-auto mb-2" />
                                    <p className="text-gray-700 text-xs font-mono">prototype image</p>
                                </div>
                                <div className="absolute top-3 left-3">
                                    <span className="bg-black/50 backdrop-blur px-2 py-1 rounded text-[10px] font-mono text-[#A3E635] border border-[#A3E635]/20">
                                        Live Preview
                                    </span>
                                </div>
                            </div>
                        </div>
                        <Label>Media card - glass wrapper + glow blur</Label>
                    </div>
                </div>
            </Section>

            {/* ═══════════════════════════════════════════════════════════
                6. INPUTS
            ═══════════════════════════════════════════════════════════ */}
            <Section
                id="inputs"
                title="Inputs & Forms"
                subtitle="Minimalist inputs that match the dark surface. Focus states use the neon green ring to signal activity."
            >
                <div className="grid md:grid-cols-2 gap-8 max-w-3xl">
                    <div>
                        <DemoBox className="!items-stretch gap-4 !p-6">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Driver Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Max Verstappen"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#A3E635]/50 focus:ring-1 focus:ring-[#A3E635]/30 transition-all"
                            />
                        </DemoBox>
                        <Label>Text input - glass bg + neon focus ring</Label>
                    </div>
                    <div>
                        <DemoBox className="!items-stretch gap-4 !p-6">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Search Sessions</label>
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Search by lap time, date…"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#A3E635]/50 focus:ring-1 focus:ring-[#A3E635]/30 transition-all"
                                />
                            </div>
                        </DemoBox>
                        <Label>Search input with leading icon</Label>
                    </div>
                    <div>
                        <DemoBox className="!items-stretch gap-4 !p-6">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Analysis Mode</label>
                            <div className="relative">
                                <select
                                    value={selectValue}
                                    onChange={(e) => setSelectValue(e.target.value)}
                                    className="w-full appearance-none bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#A3E635]/50 focus:ring-1 focus:ring-[#A3E635]/30 transition-all cursor-pointer"
                                >
                                    <option value="lap-delta" className="bg-[#0a0a0a]">Lap Delta Comparison</option>
                                    <option value="trajectory" className="bg-[#0a0a0a]">Trajectory Overlay</option>
                                    <option value="sectors" className="bg-[#0a0a0a]">Sector Analysis</option>
                                    <option value="raw" className="bg-[#0a0a0a]">Raw Telemetry</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                            </div>
                        </DemoBox>
                        <Label>Select - custom styled dropdown</Label>
                    </div>
                    <div>
                        <DemoBox className="!items-stretch gap-4 !p-6">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Track Entry Code</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="SPEEDKART-2026"
                                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#A3E635]/50 focus:ring-1 focus:ring-[#A3E635]/30 transition-all"
                                />
                                <button className="px-5 py-3 bg-[#A3E635] text-black font-bold text-sm rounded-lg hover:shadow-[0_0_14px_rgba(163,230,53,0.4)] transition-all shrink-0">
                                    Join
                                </button>
                            </div>
                        </DemoBox>
                        <Label>Input + primary action button combo</Label>
                    </div>
                </div>
            </Section>

            {/* ═══════════════════════════════════════════════════════════
                7. EFFECTS & ATMOSPHERE
            ═══════════════════════════════════════════════════════════ */}
            <Section
                id="effects"
                title="Atmospheric Effects"
                subtitle="All visual depth is achieved through opacity, blur, and constrained glow - never flat or harsh."
            >
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <div>
                        <div className="relative h-40 rounded-xl overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-[#A3E635]/10 to-[#22D3EE]/5" />
                            <div className="absolute inset-4 glass-panel rounded-lg flex items-center justify-center">
                                <span className="text-white text-xs font-mono">glass-panel</span>
                            </div>
                        </div>
                        <Label>Glassmorphism panel</Label>
                    </div>
                    <div>
                        <div className="h-40 rounded-xl bg-[#0a0a0a] border border-white/5 flex items-center justify-center">
                            <button className="px-6 py-3 bg-[#A3E635] text-black font-bold rounded-lg shadow-[0_0_18px_rgba(163,230,53,0.5),0_0_60px_rgba(163,230,53,0.3)]">
                                Glow Active
                            </button>
                        </div>
                        <Label>Neon glow - active state</Label>
                    </div>
                    <div>
                        <div className="relative h-40 rounded-xl bg-[#050505] border border-white/5 overflow-hidden">
                            <div className="absolute inset-0 bg-grid-minimal opacity-80" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-gray-600 text-xs font-mono relative z-10">.bg-grid-minimal</span>
                            </div>
                        </div>
                        <Label>40×40 pixel grid overlay</Label>
                    </div>
                    <div>
                        <div className="relative h-40 rounded-xl overflow-hidden bg-deep-space border border-white/5">
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-gray-600 text-xs font-mono">.bg-deep-space</span>
                            </div>
                        </div>
                        <Label>Radial hero gradient</Label>
                    </div>
                </div>
                <div className="grid sm:grid-cols-3 gap-6">
                    <div>
                        <div className="relative h-32 rounded-xl bg-[#080808] border border-white/5 overflow-hidden flex items-center justify-center">
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-24 h-24 bg-[#A3E635]/20 blur-3xl rounded-full" />
                            </div>
                            <span className="relative z-10 text-[#A3E635] text-xs font-mono">Green halo</span>
                        </div>
                        <Label>bg-[#A3E635]/5 blur-3xl · section ambience</Label>
                    </div>
                    <div>
                        <div className="relative h-32 rounded-xl bg-[#080808] border border-white/5 overflow-hidden flex items-center justify-center">
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-24 h-24 bg-[#22D3EE]/15 blur-3xl rounded-full" />
                            </div>
                            <span className="relative z-10 text-sky-400 text-xs font-mono">Cyan halo</span>
                        </div>
                        <Label>bg-[#22D3EE]/10 blur-3xl · secondary accent</Label>
                    </div>
                    <div>
                        <div className="relative h-32 rounded-xl bg-[#080808] border border-white/5 overflow-hidden flex items-center justify-center">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-16 bg-[#A3E635]/10 blur-2xl" />
                            <span className="relative z-10 text-gray-500 text-xs font-mono">Top-center beam</span>
                        </div>
                        <Label>Hero beam - top-center spotlight</Label>
                    </div>
                </div>
            </Section>

            {/* ═══════════════════════════════════════════════════════════
                8. ICON LIBRARY
            ═══════════════════════════════════════════════════════════ */}
            <Section
                id="icons"
                title="Icon Library"
                subtitle="Lucide React - 24px stroke icons. Always rendered at text-[#A3E635] for functional icons, text-gray-400 for decorative/inline."
            >
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4">
                    {[
                        { Icon: Cpu, name: 'Cpu' },
                        { Icon: MapPin, name: 'MapPin' },
                        { Icon: Timer, name: 'Timer' },
                        { Icon: Activity, name: 'Activity' },
                        { Icon: Wifi, name: 'Wifi' },
                        { Icon: Smartphone, name: 'Smartphone' },
                        { Icon: BarChart3, name: 'BarChart3' },
                        { Icon: TrendingUp, name: 'TrendingUp' },
                        { Icon: Award, name: 'Award' },
                        { Icon: ShieldCheck, name: 'ShieldCheck' },
                        { Icon: Search, name: 'Search' },
                        { Icon: ArrowRight, name: 'ArrowRight' },
                        { Icon: Zap, name: 'Zap' },
                        { Icon: Star, name: 'Star' },
                        { Icon: Bell, name: 'Bell' },
                        { Icon: Settings, name: 'Settings' },
                        { Icon: CheckCircle2, name: 'CheckCircle2' },
                        { Icon: XCircle, name: 'XCircle' },
                        { Icon: Radio, name: 'Radio' },
                        { Icon: Gauge, name: 'Gauge' },
                    ].map(({ Icon, name }) => (
                        <div key={name} className="flex flex-col items-center gap-2 group">
                            <div className="w-12 h-12 glass-panel rounded-xl flex items-center justify-center text-gray-500 group-hover:text-[#A3E635] group-hover:border-[#A3E635]/20 transition-all">
                                <Icon size={20} />
                            </div>
                            <span className="text-[9px] text-gray-700 font-mono text-center leading-tight">{name}</span>
                        </div>
                    ))}
                </div>
            </Section>

            {/* ── Footer ── */}
            <footer className="border-t border-white/5 bg-black pt-12 pb-8 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6 text-[#A3E635]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="6" width="20" height="14" rx="4" />
                            <path d="M8 6V3a2 2 0 0 0-4 0v3" />
                        </svg>
                        MOKART - Style Guide
                    </div>
                    <div className="flex gap-6 text-xs text-gray-600">
                        <a href="/" className="hover:text-[#A3E635] transition-colors">← Back to Home</a>
                        <span>Tailwind CSS · React 18 · Lucide Icons</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default StyleGuide;
