import React from 'react';
import '../styles/Main.css';
import { MoveLeft } from 'lucide-react';

const Soon: React.FC = () => {
    return (
        <div className="min-h-screen bg-mokart-bg text-white antialiased flex flex-col items-center justify-center relative overflow-hidden px-6 page-enter">
            <div className="absolute inset-0 bg-hero-glow pointer-events-none" />

            <div className="relative z-10 text-center max-w-2xl mx-auto">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="w-14 h-14 text-mokart-primary mx-auto mb-8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                >
                    <rect x="2" y="6" width="20" height="14" rx="4" />
                    <path d="M8 6V3a2 2 0 0 0-4 0v3" />
                </svg>

                <div className="inline-flex items-center gap-3 mb-8">
                    <span className="h-px w-8 bg-mokart-primary/60" />
                    <span className="font-display text-[11px] font-light uppercase tracking-[0.25em] text-white/50">Under construction</span>
                    <span className="h-px w-8 bg-mokart-primary/60" />
                </div>

                <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-6">
                    Something big is <br />
                    <span className="text-white/40">in the works.</span>
                </h1>

                <p className="text-white/55 text-lg leading-relaxed mb-10">
                    We're currently building this page to bring you a better experience.
                    Check back soon for updates on our professional telemetry hardware.
                </p>

                <a href="/" className="btn-primary">
                    <MoveLeft size={16} />
                    Return Home
                </a>
            </div>

            {/* Racing line at the bottom */}
            <div className="absolute bottom-0 left-0 w-full pointer-events-none" aria-hidden="true">
                <svg viewBox="0 0 1200 100" className="w-full h-20" preserveAspectRatio="none" fill="none">
                    <path
                        d="M -20 70 C 200 70 250 25 450 25 S 700 80 900 80 S 1120 35 1220 40"
                        stroke="rgba(255,255,255,0.06)"
                        strokeWidth="1.5"
                    />
                    <path
                        d="M -20 70 C 200 70 250 25 450 25 S 700 80 900 80 S 1120 35 1220 40"
                        stroke="#7bf8ac"
                        strokeWidth="1.5"
                        pathLength={100}
                        className="track-comet"
                        strokeLinecap="round"
                    />
                </svg>
            </div>

            <div className="absolute bottom-6 text-white/25 text-[10px] font-light uppercase tracking-[0.3em]">
                Mokart Engineering &copy; 2026
            </div>
        </div>
    );
};

export default Soon;
