import React, { useEffect, useState } from 'react';
import useInView from '../../hooks/useInView';

// ─── Full telemetry panel (the "pit wall") ───────────────────────────────────

const DELTAS = [-0.142, -0.087, +0.034, -0.215, -0.058, +0.012];

const TelemetryPanel: React.FC = () => {
    const { ref, inView } = useInView<HTMLDivElement>(0.35);
    const [i, setI] = useState(0);

    useEffect(() => {
        if (!inView) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const id = setInterval(() => setI((v) => (v + 1) % DELTAS.length), 1100);
        return () => clearInterval(id);
    }, [inView]);

    const delta = DELTAS[i];
    const gaining = delta < 0;

    return (
        <div ref={ref} className="rounded-2xl border border-mokart-primary/12 bg-mokart-surface overflow-hidden shadow-[0_28px_90px_-26px_rgba(0,0,0,0.7),0_0_70px_-22px_rgba(123,248,172,0.12)]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-mokart-primary/10 bg-mokart-primary/[0.03]">
                <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-mokart-primary/15" />
                    <span className="w-2.5 h-2.5 rounded-full bg-mokart-primary/15" />
                    <span className="w-2.5 h-2.5 rounded-full bg-mokart-primary/15" />
                </div>
                <span className="font-mono text-[11px] text-white/30 hidden sm:block">app.mokart.fr · Session 247</span>
                <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-mokart-primary">
                    <span className="live-dot w-1.5 h-1.5 rounded-full bg-mokart-primary" />
                    Live
                </span>
            </div>

            <div className="grid md:grid-cols-5">
                <div className="md:col-span-3 p-5 md:p-6 border-b md:border-b-0 md:border-r border-mokart-primary/10">
                    <p className="text-[10px] font-light uppercase tracking-[0.2em] text-white/40 mb-4">Speed trace, lap 14</p>
                    <svg viewBox="0 0 400 110" className="w-full" fill="none" aria-hidden="true">
                        {[22, 55, 88].map((y) => (
                            <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="rgba(123,248,172,0.06)" strokeDasharray="3 6" />
                        ))}
                        <path
                            d="M 0 85 C 25 84 35 30 60 26 C 80 23 90 60 115 70 C 135 78 150 35 175 28 C 195 23 205 55 230 62 C 255 69 270 20 300 18 C 325 17 335 50 360 58 C 378 63 390 40 400 36"
                            stroke="#7bf8ac" strokeWidth="1.5" pathLength={100}
                            className={inView ? 'spark-draw' : 'spark-wait'}
                        />
                        {inView && (
                            <path
                                d="M 0 85 C 25 84 35 30 60 26 C 80 23 90 60 115 70 C 135 78 150 35 175 28 C 195 23 205 55 230 62 C 255 69 270 20 300 18 C 325 17 335 50 360 58 C 378 63 390 40 400 36"
                                stroke="rgba(173,255,206,0.9)" strokeWidth="2" pathLength={100}
                                className="track-comet-slow" strokeLinecap="round" style={{ animationDelay: '2.9s' }}
                            />
                        )}
                        <path
                            d="M 0 88 C 25 87 38 38 62 34 C 82 31 92 66 117 75 C 137 82 152 42 177 36 C 197 31 207 61 232 68 C 257 74 272 28 302 26 C 327 25 337 56 362 63 C 380 68 392 47 400 44"
                            stroke="rgba(255,255,255,0.16)" strokeWidth="1"
                        />
                    </svg>
                    <div className="flex items-center gap-4 mt-2 text-[10px] font-mono text-white/30">
                        <span className="flex items-center gap-1.5"><span className="w-3 h-px bg-mokart-primary" /> Current</span>
                        <span className="flex items-center gap-1.5"><span className="w-3 h-px bg-white/30" /> Best lap</span>
                    </div>

                    <div className="mt-6 grid grid-cols-3 gap-3">
                        {[
                            { s: 'S1', t: '17.204', best: false },
                            { s: 'S2', t: '16.892', best: true },
                            { s: 'S3', t: '17.751', best: false },
                        ].map(({ s, t, best }) => (
                            <div key={s} className={`rounded-xl border px-3 py-2 ${best ? 'border-mokart-primary/30 bg-mokart-primary/5 breathe' : 'border-mokart-primary/10 bg-mokart-primary/[0.02]'}`}>
                                <p className="text-[9px] font-light uppercase tracking-widest text-white/40">{s}</p>
                                <p className={`font-mono text-sm ${best ? 'text-mokart-primary' : 'text-white/70'}`}>{t}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="md:col-span-2 p-5 md:p-6 flex flex-col justify-between gap-6">
                    <div>
                        <p className="text-[10px] font-light uppercase tracking-[0.2em] text-white/40 mb-2">Delta vs best</p>
                        <p className={`font-mono text-4xl md:text-5xl font-bold tabular-nums ${gaining ? 'text-mokart-primary' : 'text-white/45'}`}>
                            <span key={delta} className="tick-in">{gaining ? '' : '+'}{delta.toFixed(3)}</span>
                        </p>
                    </div>

                    <div className="space-y-1.5 font-mono text-xs">
                        {[
                            { lap: 'L12', t: '52.481', best: false },
                            { lap: 'L13', t: '52.190', best: false },
                            { lap: 'L14', t: '51.847', best: true },
                        ].map(({ lap, t, best }, idx) => (
                            <div
                                key={lap}
                                className={`flex items-center justify-between transition-all duration-500 ${inView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}
                                style={{ transitionDelay: `${400 + idx * 150}ms` }}
                            >
                                <span className="text-white/30">{lap}</span>
                                <span className={best ? 'text-mokart-primary' : 'text-white/60'}>{t}{best ? ' best' : ''}</span>
                            </div>
                        ))}
                    </div>

                    <svg viewBox="0 0 200 110" className="w-full max-w-[180px] mx-auto" fill="none" aria-hidden="true">
                        <path
                            d="M 30 88 C 12 70 16 42 42 33 C 70 23 82 56 112 50 C 146 44 140 18 166 23 C 190 28 194 56 174 70 C 150 87 122 76 96 86 C 72 96 46 100 30 88 Z"
                            stroke="rgba(123,248,172,0.14)" strokeWidth="1.5"
                        />
                        <path
                            d="M 30 88 C 12 70 16 42 42 33 C 70 23 82 56 112 50 C 146 44 140 18 166 23 C 190 28 194 56 174 70 C 150 87 122 76 96 86 C 72 96 46 100 30 88 Z"
                            stroke="#7bf8ac" strokeWidth="1.5" pathLength={100}
                            className="track-comet-slow" strokeLinecap="round"
                        />
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default TelemetryPanel;
