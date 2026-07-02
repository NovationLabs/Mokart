import React from 'react';
import '../styles/Main.css';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import Reveal from '../components/Reveal';
import { Cpu, Users } from 'lucide-react';

const Eyebrow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="flex items-center gap-3 mb-5">
        <span className="h-px w-8 bg-[#7bf8ac]/60 eyebrow-line" />
        <span className="font-display text-[11px] font-light uppercase tracking-[0.25em] text-white/50">{children}</span>
    </div>
);

const About: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#04130c] text-white antialiased overflow-x-hidden page-enter">
            <Nav />

            <div className="max-w-6xl mx-auto px-6 pt-36 pb-24 relative z-10">
                {/* ── Mission ── */}
                <Reveal>
                    <div className="max-w-3xl mb-24">
                        <Eyebrow>Our mission</Eyebrow>
                        <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight leading-[1.05] mb-6">
                            Democratizing professional telemetry.
                        </h1>
                        <p className="text-lg md:text-xl text-white/55 leading-relaxed">
                            We bridge the gap between basic rental karting and professional racing analysis.
                            By leveraging sub-decimeter RTK positioning, we give every driver access to the
                            data they need to perfect their lap — millisecond by millisecond.
                        </p>
                    </div>
                </Reveal>

                {/* ── Partners ── */}
                <div className="grid md:grid-cols-2 gap-4 mb-24">
                    <Reveal>
                        <div className="hairline-card rounded-lg p-8 h-full">
                            <div className="mb-6 h-12 flex items-center">
                                <img src="/logo/epitech.png" alt="Epitech logo" loading="lazy" className="h-9 w-auto object-contain brightness-0 invert opacity-70" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Epitech</h3>
                            <p className="text-white/45 text-sm leading-relaxed">
                                Born at the heart of innovation. The Mokart project is developed by 4th-year
                                engineering students from Epitech Marseille, combining academic rigor with
                                real-world application.
                            </p>
                        </div>
                    </Reveal>

                    {/* SpeedKart — partenariat en pause
                    <div className="hairline-card rounded-lg p-8 h-full">
                        <h3 className="text-xl font-bold text-white mb-2">SpeedKart</h3>
                        <p className="text-white/45 text-sm leading-relaxed">
                            Our official testing ground in Hyères, France. SpeedKart provides the premier
                            tracks where our hardware is pushed to the limit in real racing conditions.
                        </p>
                    </div>
                    */}

                    <Reveal delay={100}>
                        <div className="hairline-card rounded-lg p-8 h-full">
                            <div className="mb-6 h-12 flex items-center">
                                <img src="/logo/point_one.png" alt="Point One Navigation logo" loading="lazy" className="h-9 w-auto object-contain brightness-0 invert opacity-70" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Point One Navigation</h3>
                            <p className="text-white/45 text-sm leading-relaxed">
                                Precision matters. Using Point One's Polaris RTK network, we achieve 10 cm
                                accuracy, enabling true trajectory analysis impossible with standard GPS.
                            </p>
                        </div>
                    </Reveal>
                </div>

                {/* ── Tech band ── */}
                <Reveal>
                    <div className="mb-24 rounded-xl border border-white/10 bg-[#0a2315] p-8 md:p-12 relative overflow-hidden">
                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                            <div className="flex-1">
                                <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight mb-6">Engineered for performance.</h2>
                                <p className="text-white/45 mb-5 leading-relaxed">
                                    At the core of our embedded unit lies the <strong className="text-white font-bold">Raspberry Pi Zero 2W</strong> (64-bit).
                                    Its quad-core power handles sensor fusion, RTK corrections, and high-frequency
                                    data logging simultaneously.
                                </p>
                                <p className="text-white/45 leading-relaxed">
                                    Data is synced instantly to our <strong className="text-white font-bold">cloud platform</strong>,
                                    where drivers can analyze their sessions on any device immediately after their race.
                                </p>
                            </div>
                            <div className="shrink-0">
                                <Cpu size={110} strokeWidth={1} className="text-[#7bf8ac]/80" />
                            </div>
                        </div>
                    </div>
                </Reveal>

                {/* ── Team ── */}
                <div>
                    <Reveal>
                        <div className="flex items-center gap-3 mb-12">
                            <Users size={20} strokeWidth={1.5} className="text-[#7bf8ac]" />
                            <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight">The team</h2>
                        </div>
                    </Reveal>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                        {[
                            { img: '/team/leo.png', name: 'Léo GREGORI' },
                            { img: '/team/clement.png', name: 'Clément DORGE' },
                            { img: '/team/anthony.png', name: 'Anthony COLOMBANI-GAILLEUR' },
                            { img: '/team/selim.png', name: 'Selim BOUASKER' },
                        ].map(({ img, name }, i) => (
                            <Reveal key={name} delay={i * 70}>
                                <div className="group">
                                    <div className="aspect-square rounded-lg overflow-hidden mb-4 border border-white/10 bg-white/[0.02]">
                                        <img
                                            src={img}
                                            alt={name}
                                            loading="lazy"
                                            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                                        />
                                    </div>
                                    <h3 className="text-white font-bold text-sm md:text-base">{name}</h3>
                                    <p className="text-white/35 text-[10px] font-light uppercase tracking-[0.2em] mt-1">Software Engineer</p>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default About;
