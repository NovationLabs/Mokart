import React from 'react';
import { Activity, UploadCloud, LineChart } from 'lucide-react';
import Reveal from '../Reveal';
import useInView from '../../hooks/useInView';
import useSectionProgress from '../../hooks/useSectionProgress';
import { Eyebrow } from './Section';

/**
 * The data journey: an oversized statement that builds word by word from
 * scroll (useSectionProgress → --p, per-word windows in .kinetic-word), then
 * the capture → transmit → analyze schema revealed in sequence.
 */

const STATEMENT = 'One lap. Six thousand data points. Zero guesswork.';

const KineticStatement: React.FC = () => {
    const ref = useSectionProgress<HTMLHeadingElement>('cross');
    const words = STATEMENT.split(' ');
    return (
        <h2
            ref={ref}
            className="kinetic-line font-display text-4xl md:text-6xl xl:text-7xl font-bold tracking-tight leading-[1.05] max-w-4xl"
            style={{ '--wn': words.length } as React.CSSProperties}
        >
            {words.map((w, i) => (
                <React.Fragment key={i}>
                    <span className="kinetic-word" style={{ '--wi': i } as React.CSSProperties}>{w}</span>
                    {i < words.length - 1 ? ' ' : null}
                </React.Fragment>
            ))}
        </h2>
    );
};

const STEPS = [
    {
        n: '01',
        icon: Activity,
        title: 'Capture',
        desc: 'On the wheel, the unit fuses IMU and RTK GNSS readings fifty times a second — speed, g-force, position, delta.',
        meta: 'wheel unit · 50 Hz',
    },
    {
        n: '02',
        icon: UploadCloud,
        title: 'Transmit',
        desc: 'Roll into the pit lane and the session uploads itself. No cables, no SD cards, no forgotten laps.',
        meta: 'pit entry · Wi-Fi',
    },
    {
        n: '03',
        icon: LineChart,
        title: 'Analyze',
        desc: 'Seconds later the dashboard has your speed traces, sector splits and racing line, ready to compare.',
        meta: 'app.mokart.fr',
    },
];

/** Per-step living schema — each card carries one piece of moving data. */
const StepAux: React.FC<{ step: number }> = ({ step }) => {
    if (step === 0) {
        return (
            <div className="flex items-end gap-1 h-8" aria-hidden="true">
                {[0.2, 0.55, 0.1, 0.4, 0.7, 0.3, 0.62, 0.15].map((d, i) => (
                    <span
                        key={i}
                        className="eq-bar w-1 h-full rounded-full bg-mokart-primary/50"
                        style={{ animationDelay: `${d}s` }}
                    />
                ))}
                <span className="font-mono text-[9px] text-white/25 ml-3 mb-0.5">imu.raw · gnss.rtk</span>
            </div>
        );
    }
    if (step === 1) {
        return (
            <div aria-hidden="true">
                <div className="flex items-center justify-between font-mono text-[9px] text-white/25 mb-1.5">
                    <span>session_247.mk</span>
                    <span className="text-mokart-primary/60">→ cloud</span>
                </div>
                <div className="h-1 rounded-full bg-mokart-primary/10 overflow-hidden">
                    <div className="upload-fill h-full w-full rounded-full bg-mokart-primary/70" />
                </div>
            </div>
        );
    }
    return (
        <svg viewBox="0 0 160 32" className="w-full h-8" fill="none" aria-hidden="true">
            <path
                d="M0 24 C 14 23 20 8 34 9 C 47 10 54 26 72 24 C 88 22 95 6 116 8 C 133 10 140 22 160 19"
                stroke="#7bf8ac" strokeWidth="1.5" pathLength={100} className="track-comet-slow" strokeLinecap="round"
            />
            <path
                d="M0 24 C 14 23 20 8 34 9 C 47 10 54 26 72 24 C 88 22 95 6 116 8 C 133 10 140 22 160 19"
                stroke="rgba(123,248,172,0.18)" strokeWidth="1.5"
            />
        </svg>
    );
};

const Pipeline: React.FC = () => {
    const { ref, inView } = useInView<HTMLDivElement>(0.25);

    return (
        <>
            <Reveal>
                <Eyebrow>The data journey</Eyebrow>
            </Reveal>
            <KineticStatement />

            <div ref={ref} className="relative mt-16 md:mt-20">
                {/* connector hairline drawing across the three steps */}
                <svg
                    viewBox="0 0 100 1"
                    preserveAspectRatio="none"
                    className="hidden md:block absolute top-5 left-0 w-full h-px overflow-visible"
                    aria-hidden="true"
                >
                    <line
                        x1="0" y1="0.5" x2="100" y2="0.5"
                        stroke="rgba(123,248,172,0.25)" strokeWidth="1"
                        vectorEffect="non-scaling-stroke" pathLength={100}
                        className={inView ? 'spark-draw' : 'spark-wait'}
                    />
                </svg>

                <div className="grid md:grid-cols-3 gap-10 md:gap-8">
                    {STEPS.map(({ n, icon: Icon, title, desc, meta }, i) => (
                        <Reveal key={n} delay={i * 160}>
                            <div className="relative flex flex-col h-full">
                                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-mokart-primary/25 bg-mokart-bg font-mono text-[11px] text-mokart-primary mb-6 relative z-10">
                                    {n}
                                </span>
                                <Icon size={20} strokeWidth={1.5} className="text-mokart-primary mb-4" />
                                <h3 className="font-display font-bold text-white text-lg mb-2">{title}</h3>
                                <p className="text-white/45 text-sm leading-relaxed mb-6 max-w-[40ch]">{desc}</p>
                                <div className="mt-auto">
                                    <StepAux step={i} />
                                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/25 mt-3">{meta}</p>
                                </div>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </div>
        </>
    );
};

export default Pipeline;
