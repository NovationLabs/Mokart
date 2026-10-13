import React from 'react';
import '../styles/Main.css';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import Reveal from '../components/Reveal';
import { Users } from 'lucide-react';

const About: React.FC = () => {
    return (
        <div className="min-h-screen bg-mokart-bg text-white antialiased overflow-x-hidden page-enter">
            <Nav />

            <div className="max-w-6xl mx-auto px-6 pt-36 pb-24 relative z-10">
                {/* ── Mission ── */}
                <Reveal>
                    <div className="max-w-3xl mb-24">
                        <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight leading-[1.05] mb-6">
                            Better data for every lap.
                        </h1>
                        <p className="text-lg md:text-xl text-white/55 leading-relaxed">
                            Mokart began as an Epitech engineering project in Marseille. We build a
                            wheel-mounted unit and a dashboard to make karting sessions easier to understand,
                            from lap time to trajectory.
                        </p>
                    </div>
                </Reveal>

                {/* ── Partners ── */}
                <div className="grid md:grid-cols-2 gap-4 mb-24">
                    <Reveal>
                        <div className="hairline-card rounded-xl p-8 h-full">
                            <div className="mb-6 h-12 flex items-center">
                                <img src="/logo/epitech.png" alt="Epitech logo" loading="lazy" className="h-9 w-auto object-contain brightness-0 invert opacity-70" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Epitech</h3>
                            <p className="text-white/45 text-sm leading-relaxed">
                                Mokart is developed by engineering students at Epitech Marseille.
                                The project brings software, electronics and track testing together.
                            </p>
                        </div>
                    </Reveal>

                    {/* SpeedKart — partenariat en pause
                    <div className="hairline-card rounded-xl p-8 h-full">
                        <h3 className="text-xl font-bold text-white mb-2">SpeedKart</h3>
                        <p className="text-white/45 text-sm leading-relaxed">
                            Our official testing ground in Hyères, France. SpeedKart provides the premier
                            tracks where our hardware is pushed to the limit in real racing conditions.
                        </p>
                    </div>
                    */}

                    <Reveal delay={100}>
                        <div className="hairline-card rounded-xl p-8 h-full">
                            <div className="mb-6 h-12 flex items-center">
                                <img src="/logo/point_one.png" alt="Point One Navigation logo" loading="lazy" className="h-9 w-auto object-contain brightness-0 invert opacity-70" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Point One Navigation</h3>
                            <p className="text-white/45 text-sm leading-relaxed">
                                Point One's Polaris RTK network supports the positioning work behind
                                our trajectory analysis.
                            </p>
                        </div>
                    </Reveal>
                </div>

                {/* ── Tech band ── */}
                <Reveal>
                    <div className="mb-24 rounded-xl border border-white/10 bg-mokart-surface p-8 md:p-12 relative overflow-hidden">
                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                            <div className="flex-1">
                                <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight mb-6">Engineered for performance.</h2>
                                <p className="text-white/45 mb-5 leading-relaxed">
                                    The current prototype uses a <strong className="text-white font-bold">Raspberry Pi Zero 2 W</strong>
                                    to bring positioning, motion data and local processing together.
                                </p>
                                <p className="text-white/45 leading-relaxed">
                                    We are developing the dashboard alongside the hardware so each session
                                    is useful after the kart comes back to the pits.
                                </p>
                            </div>
                            <div className="shrink-0 w-full md:w-56">
                                <img src="/prototype/mokart_prototype.png" alt="Mokart prototype mounted on the steering wheel" className="w-full aspect-square object-cover rounded-xl" loading="lazy" />
                            </div>
                        </div>
                    </div>
                </Reveal>

                {/* ── Team ── */}
                <div>
                    <Reveal>
                        <div className="flex items-center gap-3 mb-12">
                            <Users size={20} strokeWidth={1.5} className="text-mokart-primary" />
                            <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight">The team</h2>
                        </div>
                    </Reveal>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                        {[
                            { img: '/team/leo.png', name: 'Léo GREGORI', linkedin: 'https://www.linkedin.com/in/leogregori/' },
                            { img: '/team/clement.png', name: 'Clément DORGE', linkedin: 'https://www.linkedin.com/in/clement-dorge/' },
                            { img: '/team/anthony.png', name: 'Anthony COLOMBANI-GAILLEUR', linkedin: 'https://www.linkedin.com/in/anthony-colombani-gailleur-8317032b6/' },
                            { img: '/team/selim.png', name: 'Selim BOUASKER', linkedin: 'https://www.linkedin.com/in/selim-bouasker/' },
                        ].map(({ img, name, linkedin }, i) => (
                            <Reveal key={name} delay={i * 70}>
                                <a href={linkedin} target="_blank" rel="noopener noreferrer" className="group block" aria-label={`View ${name} on LinkedIn`}>
                                    <div className="aspect-square rounded-xl overflow-hidden mb-4 border border-white/10 bg-white/[0.02]">
                                        <img
                                            src={img}
                                            alt={name}
                                            loading="lazy"
                                            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                                        />
                                    </div>
                                    <h3 className="text-white font-bold text-sm md:text-base group-hover:text-mokart-primary transition-colors">{name}</h3>
                                    <p className="text-white/50 text-[10px] font-light uppercase tracking-[0.2em] mt-1">Software Engineer</p>
                                </a>
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
