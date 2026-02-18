import React from 'react';
import '../styles/MokartMain.css';
import {
    BarChart3,
    MapPin,
    Timer,
    Activity,
    Cpu,
    Wifi,
    Smartphone,
    ArrowRight,
    TrendingUp,
    Award,
    ShieldCheck,
    CheckCircle2,
    XCircle
} from 'lucide-react';

const icons = {
    MapPin,
    Timer,
    Activity,
    Cpu,
    Wifi,
    Smartphone,
    BarChart3,
    TrendingUp,
    Award,
    ShieldCheck
}

// Reusable Components

const Section: React.FC<{
    children: React.ReactNode;
    id?: string;
    className?: string;
    bg?: string
}> = ({ children, id, className = "", bg = "" }) => (
    <section id={id} className={`py-16 md:py-24 px-4 sm:px-6 lg:px-8 relative ${bg}`}>
        <div className={`max-w-7xl mx-auto ${className} relative z-10`}>
            {children}
        </div>
    </section>
);

const FeatureCard: React.FC<{
    icon: keyof typeof icons;
    title: string;
    desc: string;
    badge?: string
}> = ({ icon, title, desc, badge }) => {
    const Icon = icons[icon];
    return (
        <div className="glass-panel p-6 md:p-8 rounded-xl hover:border-[#A3E635]/30 hover:bg-white/[0.05] transition-all duration-300 group">
            <div className="flex items-start justify-between mb-4">
                <div className="bg-white/5 p-3 rounded-lg text-[#A3E635] group-hover:bg-[#A3E635] group-hover:text-black transition-colors">
                    <Icon size={24} />
                </div>
                {badge && (
                    <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-[#A3E635]/10 text-[#A3E635] rounded-md border border-[#A3E635]/20">
                        {badge}
                    </span>
                )}
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
        </div>
    );
};

const Stat: React.FC<{ value: string; label: string }> = ({ value, label }) => (
    <div className="text-center p-4 border border-white/5 bg-white/[0.02] rounded-lg">
        <div className="text-3xl font-mono text-[#A3E635] font-bold mb-1">{value}</div>
        <div className="text-xs text-gray-400 uppercase tracking-widest">{label}</div>
    </div>
);

// Main Component

const Home: React.FC = () => {
    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-gray-100 font-display selection:bg-[#A3E635] selection:text-black antialiased overflow-x-hidden">

            {/* Navbar - Sticky & Clean */}
            <nav className="fixed w-full z-50 glass-header top-0 left-0">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6 text-[#A3E635]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="6" width="20" height="14" rx="4" />
                            <path d="M8 6V3a2 2 0 0 0-4 0v3" />
                        </svg>
                        MOKART
                    </div>
                    <div className="hidden md:flex gap-8 text-sm font-medium text-gray-300">
                        <button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors">Features</button>
                        <button onClick={() => scrollToSection('tech')} className="hover:text-white transition-colors">Technology</button>
                        <button onClick={() => scrollToSection('comparison')} className="hover:text-white transition-colors">Comparison</button>
                    </div>

                    <a href={process.env.REACT_APP_PLATFORM_URL || 'http://localhost:8000'} className="text-xs font-bold uppercase tracking-widest text-[#A3E635] border border-[#A3E635]/30 px-4 py-2 rounded hover:bg-[#A3E635]/10 transition-colors">
                        Get Access
                    </a>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="pt-32 pb-20 md:pt-48 md:pb-32 relative overflow-hidden bg-deep-space">
                <div className="absolute inset-0 bg-grid-minimal opacity-30 pointer-events-none"></div>
                <div className="max-w-4xl mx-auto text-center px-4 relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[#A3E635] text-xs font-medium mb-8">
                        Live Telemetry System v2.0
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-6 leading-[1.1]">
                        Race Data. <br className="hidden md:block" />
                        <span className="text-gray-500">Decimeter Precision.</span>
                    </h1>

                    <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed font-light">
                        Professional-grade telemetry for rental karting.
                        Real-time lap deltas, trajectory analysis, and cloud sync.
                        Designed for drivers who demand <span className="text-white">perfect laps</span>.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <button
                            onClick={() => scrollToSection('features')}
                            className="w-full sm:w-auto px-8 py-3 bg-[#A3E635] text-black font-semibold rounded-lg transition-all duration-300 hover:shadow-[0_0_18px_rgba(163,230,53,0.5),0_0_60px_rgba(163,230,53,0.3)]"
                        >
                            Explore Features
                        </button>
                        <button
                            onClick={() => scrollToSection('demo')}
                            className="w-full sm:w-auto px-8 py-3 bg-white/5 border border-white/10 text-white font-medium rounded-lg hover:bg-white/10 transition-all"
                        >
                            Watch Demo
                        </button>
                    </div>

                    <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto opacity-70">
                        <Stat value="10cm" label="GPS Precision" />
                        <Stat value="50Hz" label="Update Rate" />
                        <Stat value="0ms" label="Local Latency" />
                        <Stat value="IP65" label="Weather Proof" />
                    </div>
                </div>
            </header>

            {/* Feature Grid */}
            <Section id="features" className="border-t border-white/5">
                <div className="mb-16 md:text-center max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold text-white mb-4">Complete Telemetry Stack</h2>
                    <p className="text-gray-400">
                        Hardware and software integrated seamlessly. From the steering wheel to the cloud, every millisecond is captured.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <FeatureCard
                        icon="Cpu"
                        title="Embedded Unit"
                        desc="Raspberry Pi Zero 2W & ESP32 core working in tandem. Handles sensor fusion and high-frequency data logging autonomously."
                        badge="Hardware"
                    />
                    <FeatureCard
                        icon="MapPin"
                        title="RTK Positioning"
                        desc="Powered by Point One Navigation. Sub-decimeter accuracy (10cm) allows for true racing line analysis, unlike standard GPS (5m)."
                        badge="Precision"
                    />
                    <FeatureCard
                        icon="Timer"
                        title="Live Delta"
                        desc="Steering wheel display shows real-time gap vs best lap. Know instantly if you're green (improving) or red (losing time) in every corner."
                        badge="Interface"
                    />
                    <FeatureCard
                        icon="Wifi"
                        title="Cloud Sync"
                        desc="Instant upload to dedicated servers upon pit entry. Session data is processed and ready for analysis before you take your helmet off."
                    />
                    <FeatureCard
                        icon="Smartphone"
                        title="Mobile Analysis"
                        desc="Deep dive into your performance. Compare throttle traces, braking points, and corner speeds against the track record holder."
                    />
                    <FeatureCard
                        icon="Award"
                        title="League Ready"
                        desc="Built for competition. APIs for live leaderboards, broadcast overlays, and automated race direction tools."
                    />
                </div>
            </Section>

            {/* Technical Deep Dive */}
            <Section id="tech" className="bg-[#080808]">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div className="relative order-last md:order-first">
                        <div className="absolute inset-0 bg-[#A3E635]/5 blur-3xl rounded-full"></div>
                        <div className="glass-panel p-2 rounded-xl relative overflow-hidden border border-white/10 shadow-2xl">
                            {/* Image Placeholder with fallback */}
                            <div className="aspect-[4/3] bg-[#111] rounded-lg overflow-hidden relative">
                                <img
                                    src="/prototype/mokart_prototype.jpg"
                                    alt="Mokart Hardware Unit"
                                    className="w-full h-full object-cover z-10 relative"
                                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="inline-block text-[#A3E635] font-mono text-xs tracking-widest uppercase mb-4">Architecture</div>
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Built on proven technology.</h2>
                        <div className="space-y-8">
                            <div className="flex gap-4">
                                <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 border border-white/10">
                                    <Cpu size={24} className="text-[#A3E635]" />
                                </div>
                                <div>
                                    <h4 className="text-white font-bold mb-1">Quad-Core Processing</h4>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        The Raspberry Pi Zero 2W’s 64-bit quad-core processor handles real-time sensor polling (IMU, RPM), complex RTK corrections, and network stacks through optimized multithreading to ensure zero latency.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 border border-white/10">
                                    <Activity size={24} className="text-[#A3E635]" />
                                </div>
                                <div>
                                    <h4 className="text-white font-bold mb-1">Sensor Fusion</h4>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        Kalman filtering combines GPS, Accelerometer, and Gyroscope data to maintain precision even during high-G cornering or satellite occlusion.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 border border-white/10">
                                    <ShieldCheck size={24} className="text-[#A3E635]" />
                                </div>
                                <div>
                                    <h4 className="text-white font-bold mb-1">Rugged Design</h4>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        IP65 rated enclosure. Vibration dampened mounts. Battery endurance of 8+ hours continuous racing.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Section>

            {/* DEMO SECTION */}
            <Section id="demo" className="bg-[#050505] border-t border-white/5">
                <div className="max-w-5xl mx-auto text-center">
                    <div className="inline-block text-[#A3E635] font-mono text-xs tracking-widest uppercase mb-4">Live Demonstration</div>
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-10">System Test Preview</h2>
                    <div className="relative rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-black aspect-video group">
                        <video
                            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-500"
                            src="/prototype/mokart_protoype.mov"
                            autoPlay
                            loop
                            muted
                            playsInline
                        />
                        {/* Tech Overlay for video */}
                        <div className="absolute top-4 left-4 flex gap-2 pointer-events-none">
                            <div className="bg-black/50 backdrop-blur px-2 py-1 rounded text-[10px] font-mono text-[#A3E635] border border-[#A3E635]/20 flex items-center gap-1">
                                3D Prototype Model
                            </div>
                        </div>
                    </div>
                </div>
            </Section>

            {/* Comparison Table - Clean Functional */}
            <Section id="comparison">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-white mb-4">Why Mokart?</h2>
                        <p className="text-gray-400">Comparing market solutions for rental karting tracks.</p>
                    </div>

                    <div className="overflow-x-auto md:overflow-visible rounded-xl border border-white/10 bg-[#0a0a0a]">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/5 border-b border-white/10">
                                    <th className="p-2 md:p-6 text-[10px] md:text-sm font-bold text-gray-300">Feature</th>
                                    <th className="p-2 md:p-6 text-center text-[10px] md:text-sm font-medium text-gray-500">Apex</th>
                                    <th className="p-2 md:p-6 text-center text-[10px] md:text-sm font-medium text-gray-500">Sodi</th>
                                    <th className="p-2 md:p-6 text-center text-[10px] md:text-sm font-medium text-gray-500">Facer</th>
                                    <th className="p-2 md:p-6 text-center text-[10px] md:text-sm font-bold text-white bg-[#A3E635]/5 border-x border-[#A3E635]/10 ">MOKART</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {[
                                    { name: "Live Lap Timing", apex: true, sodi: true, racefacer: true, mokart: true },
                                    { name: "Steering Display", apex: false, sodi: true, racefacer: true, mokart: true },
                                    { name: "RTK Precision", apex: false, sodi: false, racefacer: false, mokart: true },
                                    { name: "Live Sector Delta", apex: false, sodi: false, racefacer: false, mokart: true },
                                    { name: "Trajectory Analysis", apex: false, sodi: false, racefacer: false, mokart: true },
                                    { name: "Hardware Cost", apex: "High", sodi: "High", racefacer: "High", mokart: "Low", text: true },
                                ].map((row, idx) => (
                                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="p-2 md:p-6 text-[10px] md:text-sm text-gray-300 font-medium border-r border-white/5">{row.name}</td>
                                        <td className="p-2 md:p-6 text-center border-r border-white/5">
                                            {row.text ? (
                                                <span className="text-gray-500 text-[10px] md:text-xs">{row.apex}</span>
                                            ) : row.apex ? (
                                                <CheckCircle2 size={16} className="mx-auto text-gray-600 w-4 h-4 md:w-5 md:h-5" />
                                            ) : (
                                                <XCircle size={16} className="mx-auto text-gray-800 w-4 h-4 md:w-5 md:h-5" />
                                            )}
                                        </td>
                                        <td className="p-2 md:p-6 text-center border-r border-white/5">
                                            {row.text ? (
                                                <span className="text-gray-500 text-[10px] md:text-xs">{row.sodi}</span>
                                            ) : row.sodi ? (
                                                <CheckCircle2 size={16} className="mx-auto text-gray-600 w-4 h-4 md:w-5 md:h-5" />
                                            ) : (
                                                <XCircle size={16} className="mx-auto text-gray-800 w-4 h-4 md:w-5 md:h-5" />
                                            )}
                                        </td>
                                        <td className="p-2 md:p-6 text-center border-r border-white/5">
                                            {row.text ? (
                                                <span className="text-gray-500 text-[10px] md:text-xs">{row.racefacer}</span>
                                            ) : row.racefacer ? (
                                                <CheckCircle2 size={16} className="mx-auto text-gray-600 w-4 h-4 md:w-5 md:h-5" />
                                            ) : (
                                                <XCircle size={16} className="mx-auto text-gray-800 w-4 h-4 md:w-5 md:h-5" />
                                            )}
                                        </td>
                                        <td className="p-2 md:p-6 text-center bg-[#A3E635]/5 border-x border-[#A3E635]/10">
                                            {row.text ? (
                                                <span className="text-[#A3E635] font-bold text-[10px] md:text-xs">{row.mokart}</span>
                                            ) : (
                                                <div className="flex justify-center">
                                                    <CheckCircle2 size={18} className="text-[#A3E635] w-5 h-5 md:w-6 md:h-6" strokeWidth={2.5} />
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Section>

            {/* Partners - Minimal */}
            <Section id="partners" className="py-12 border-t border-white/5 bg-[#050505]">
                <p className="text-center text-gray-600 uppercase tracking-widest text-[10px] font-bold mb-8">Trusted by</p>
                <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24">
                    {/* Logos with 'brightness-0 invert' to force white color */}
                    <a href="https://www.pointonenav.com/" target="_blank" rel="noopener noreferrer">
                        <img
                            src="/trusted_by/point_one.png"
                            alt="Point One Navigation"
                            className="h-8 md:h-10 object-contain brightness-0 invert opacity-50 hover:opacity-100 transition-all duration-300"
                        />
                    </a>
                    <a href="https://www.epitech.eu/" target="_blank" rel="noopener noreferrer">
                        <img
                            src="/trusted_by/epitech.png"
                            alt="Epitech"
                            className="h-8 md:h-10 object-contain brightness-0 invert opacity-50 hover:opacity-100 transition-all duration-300"
                        />
                    </a>
                    <a href="https://www.speedkart.fr/" target="_blank" rel="noopener noreferrer">
                        <img
                            src="/trusted_by/speedkart.png"
                            alt="Speedkart"
                            className="h-8 md:h-10 object-contain brightness-0 invert opacity-50 hover:opacity-100 transition-all duration-300"
                        />
                    </a>
                </div>
            </Section>

            {/* Footer */}
            <footer className="border-t border-white/10 bg-black pt-16 pb-8 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-4 gap-8 mb-12">
                        <div className="col-span-1 md:col-span-1">
                            <div className="text-xl font-bold text-white tracking-tight flex items-center gap-2 mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6 text-[#A3E635]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="2" y="6" width="20" height="14" rx="4" />
                                    <path d="M8 6V3a2 2 0 0 0-4 0v3" />
                                </svg>
                                MOKART
                            </div>
                            <p className="text-gray-500 text-sm leading-relaxed">
                                Empowering the next generation of drivers with professional data analysis tools.
                            </p>
                        </div>

                        <div className="col-span-2 md:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-8">
                            <div>
                                <h5 className="text-white font-bold mb-4 text-sm">Product</h5>
                                <ul className="space-y-2 text-sm text-gray-500">
                                    <li><a href="/soon" className="hover:text-[#A3E635]">Hardware</a></li>
                                    <li><a href="http://localhost:8000" className="hover:text-[#A3E635]">Software</a></li>
                                    <li><a href="/soon" className="hover:text-[#A3E635]">Pricing</a></li>
                                </ul>
                            </div>
                            <div>
                                <h5 className="text-white font-bold mb-4 text-sm">Company</h5>
                                <ul className="space-y-2 text-sm text-gray-500">
                                    <li><a href="/soon" className="hover:text-[#A3E635]">About</a></li>
                                    <li><a href="/soon" className="hover:text-[#A3E635]">Contact</a></li>
                                </ul>
                            </div>
                            <div className="col-span-2 md:col-span-2">
                                <h5 className="text-white font-bold mb-4 text-sm">Team</h5>
                                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                                    <a href="https://www.linkedin.com/in/leogregori" target="_blank" rel="noopener noreferrer" className="hover:text-[#A3E635] transition-colors">Léo GREGORI</a>
                                    <a href="https://www.linkedin.com/in/clement-dorge" target="_blank" rel="noopener noreferrer" className="hover:text-[#A3E635] transition-colors">Clément DORGE</a>
                                    <a href="https://www.linkedin.com/in/anthony-colombani-gailleur-8317032b6" target="_blank" rel="noopener noreferrer" className="hover:text-[#A3E635] transition-colors">Anthony COLOMBANI-GAILLEUR</a>
                                    <a href="https://www.linkedin.com/in/selim-bouasker" target="_blank" rel="noopener noreferrer" className="hover:text-[#A3E635] transition-colors">Selim BOUASKER</a>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-600">
                        <p>&copy; 2026 Mokart. All rights reserved.</p>
                        <div className="flex gap-4 mt-4 md:mt-0">
                            <a href="/privacy-policy" className="hover:text-white">Privacy Policy</a>
                            <a href="/terms-of-service" className="hover:text-white">Terms of Service</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;
