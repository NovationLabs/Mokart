import React from 'react';
import { MoveLeft, Cpu, Users } from 'lucide-react';

const About: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#0a0a0a] text-gray-100 font-display selection:bg-[#A3E635] selection:text-black antialiased overflow-x-hidden relative">
            {/* Background Texture */}
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff05_1px,transparent_1px)] [background-size:20px_20px] opacity-20 pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
                {/* Header */}
                <div className="mb-16">
                    <a href="/" className="inline-flex items-center gap-2 text-[#22D3EE] transition-colors mb-8">
                        <MoveLeft />
                        Back to Home
                    </a>
                    <div className="max-w-3xl">
                        <div className="inline-block text-[#A3E635] font-mono text-xs tracking-widest uppercase mb-4 border border-[#A3E635]/20 bg-[#A3E635]/5 px-3 py-1 rounded-full">
                            Our Mission
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
                            Democratizing Professional Telemetry.
                        </h1>
                        <p className="text-xl text-gray-400 leading-relaxed font-light">
                            We bridge the gap between basic rental karting and professional racing analysis. By leveraging sub-decimeter RTK positioning, we give every driver access to the data they need to perfect their lap—millisecond by millisecond.
                        </p>
                    </div>
                </div>

                {/* Partners / Ecosystem */}
                <div className="grid md:grid-cols-3 gap-6 mb-24">
                    <div className="glass-panel bg-white/[0.02] border border-white/10 p-8 rounded-xl transition-colors">
                        <div className="mb-6 p-3 rounded-lg bg-white/5 w-fit h-16 flex items-center justify-center">
                            <img src="/logo/epitech.png" alt="Epitech Logo" className="h-full w-auto object-contain brightness-0 invert opacity-80" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Epitech</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Born at the heart of innovation. The Mokart project is developed by 4th engineering students from Epitech Marseille, combining academic rigor with real-world application.
                        </p>
                    </div>

                    <div className="glass-panel bg-white/[0.02] border border-white/10 p-8 rounded-xl transition-colors">
                        <div className="mb-6 p-3 rounded-lg bg-red-500/10 text-red-500 w-fit">
                             <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                                <line x1="4" y1="22" x2="4" y2="15" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">SpeedKart</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Our official testing ground in Hyères, France. SpeedKart provides the premier tracks where our hardware is pushed to the limit in real racing conditions.
                        </p>
                    </div>

                    <div className="glass-panel bg-white/[0.02] border border-white/10 p-8 rounded-xl transition-colors">
                        <div className="mb-6 p-3 rounded-lg bg-white/5 w-fit h-16 flex items-center justify-center">
                              <img src="/logo/point_one.png" alt="Point One Navigation Logo" className="h-full w-auto object-contain brightness-0 invert opacity-80" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Point One Navigation</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Precision matters. Using Point One's Polaris RTK network, we achieve 10cm accuracy, enabling true trajectory analysis impossible with standard GPS.
                        </p>
                    </div>
                </div>

                {/* Tech Stack */}
                <div className="mb-24 bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 md:p-12 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#A3E635]/5 blur-[100px] rounded-full pointer-events-none"></div>

                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                        <div className="flex-1">
                            <h2 className="text-3xl font-bold text-white mb-6">Engineered for Performance</h2>
                            <p className="text-gray-400 mb-6 leading-relaxed">
                                At the core of our embedded unit lies the <strong className="text-white">Raspberry Pi Zero 2W</strong> (64-bit). Its quad-core power handles sensor fusion, RTK corrections, and high-frequency data logging simultaneously.
                            </p>
                            <p className="text-gray-400 leading-relaxed">
                                Data is synced instantly to our <strong className="text-white">Cloud SaaS Platform</strong>, where drivers can analyze their sessions on any device immediately after their race.
                            </p>
                        </div>
                        <div className="flex-1 flex justify-center">
                            <div className="relative">
                                <div className="absolute inset-0 bg-[#A3E635] blur-2xl opacity-20"></div>
                                <Cpu size={120} className="text-[#A3E635] relative z-10" strokeWidth={1} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Team Grid */}
                <div>
                    <div className="flex items-center gap-4 mb-12">
                         <div className="p-2 rounded-lg bg-[#A3E635]/10 text-[#A3E635]">
                            <Users size={24} />
                        </div>
                        <h2 className="text-3xl font-bold text-white">The Team</h2>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {/* Léo */}
                        <div>
                            <div className="aspect-square rounded-xl overflow-hidden mb-4 border border-white/10 bg-white/5">
                                <img src="/team/leo.png" alt="Léo Gregori" className="w-full h-full object-cover grayscale" />
                            </div>
                            <h3 className="text-white font-bold text-lg">Léo GREGORI</h3>
                            <p className="text-[#A3E635] text-xs uppercase tracking-widest font-mono">Software Engineer</p>
                        </div>

                        {/* Clément */}
                        <div>
                            <div className="aspect-square rounded-xl overflow-hidden mb-4 border border-white/10 bg-white/5">
                                <img src="/team/clement.png" alt="Clément Dorge" className="w-full h-full object-cover grayscale" />
                            </div>
                            <h3 className="text-white font-bold text-lg">Clément DORGE</h3>
                            <p className="text-[#A3E635] text-xs uppercase tracking-widest font-mono">Software Engineer</p>
                        </div>

                         {/* Anthony */}
                         <div>
                            <div className="aspect-square rounded-xl overflow-hidden mb-4 border border-white/10 bg-white/5">
                                <img src="/team/anthony.png" alt="Anthony Colombani" className="w-full h-full object-cover grayscale" />
                            </div>
                            <h3 className="text-white font-bold text-lg">Anthony COLOMBANI</h3>
                            <p className="text-[#A3E635] text-xs uppercase tracking-widest font-mono">Software Engineer</p>
                        </div>

                        {/* Selim */}
                        <div>
                            <div className="aspect-square rounded-xl overflow-hidden mb-4 border border-white/10 bg-white/5">
                                <img src="/team/selim.png" alt="Selim Bouasker" className="w-full h-full object-cover grayscale" />
                            </div>
                            <h3 className="text-white font-bold text-lg">Selim BOUASKER</h3>
                            <p className="text-[#A3E635] text-xs uppercase tracking-widest font-mono">Software Engineer</p>
                        </div>
                    </div>
                </div>

                {/* Footer Copy */}
                <div className="mt-24 pt-8 border-t border-white/10 text-center text-gray-600 text-xs uppercase tracking-widest">
                    Mokart Engineering &copy; 2026
                </div>
            </div>
        </div>
    );
};

export default About;
