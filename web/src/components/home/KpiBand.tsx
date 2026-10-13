import React, { useCallback, useEffect, useRef } from 'react';
import useInView from '../../hooks/useInView';

/**
 * Hero KPI band. Numeric stats count up on first view (ease-out-expo, like a
 * speedo settling) and re-tick like a chronometer when hovered. Digits are
 * written straight to the DOM via rAF — no React state on hover. Ratings such
 * as "IP65" are norms, not quantities: they render static.
 */

type Stat =
    | { kind: 'count'; num: number; prefix?: string; suffix?: string; label: string }
    | { kind: 'static'; value: string; label: string };

const STATS: Stat[] = [
    { kind: 'count', num: 10, suffix: ' cm', label: 'RTK precision' },
    { kind: 'count', num: 50, suffix: ' Hz', label: 'Update rate' },
    { kind: 'count', num: 1, prefix: '< ', suffix: ' ms', label: 'Local latency' },
    { kind: 'static', value: 'IP65', label: 'Weather rating' },
];

const CountCell: React.FC<{ num: number; prefix?: string; suffix?: string; label: string }> = ({
    num, prefix = '', suffix = '', label,
}) => {
    const { ref, inView } = useInView<HTMLDivElement>(0.6);
    const numRef = useRef<HTMLSpanElement>(null);
    const raf = useRef(0);

    // Chronometer run: sprint from 0 and brake into the final value.
    const run = useCallback((duration: number) => {
        const el = numRef.current;
        if (!el) return;
        cancelAnimationFrame(raf.current);
        const t0 = performance.now();
        const step = (t: number) => {
            const p = Math.min((t - t0) / duration, 1);
            const eased = 1 - Math.pow(2, -10 * p);
            el.textContent = `${prefix}${Math.round(num * eased)}${suffix}`;
            if (p < 1) raf.current = requestAnimationFrame(step);
        };
        raf.current = requestAnimationFrame(step);
    }, [num, prefix, suffix]);

    useEffect(() => {
        if (!inView) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            if (numRef.current) numRef.current.textContent = `${prefix}${num}${suffix}`;
            return;
        }
        run(1400);
        return () => cancelAnimationFrame(raf.current);
    }, [inView, run, num, prefix, suffix]);

    const onEnter = useCallback(() => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        run(550);
    }, [run]);

    return (
        <div ref={ref} onMouseEnter={onEnter} className="kpi-cell py-6 px-2 text-center">
            <p className="font-display font-bold text-2xl md:text-3xl text-white">
                <span ref={numRef} className="tabular-nums">{prefix}0{suffix}</span>
            </p>
            <p className="text-[10px] font-light uppercase tracking-[0.2em] text-white/35 mt-1.5">{label}</p>
        </div>
    );
};

const KpiBand: React.FC = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-mokart-primary/10 border-y border-mokart-primary/10">
        {STATS.map((s) =>
            s.kind === 'count' ? (
                <CountCell key={s.label} num={s.num} prefix={s.prefix} suffix={s.suffix} label={s.label} />
            ) : (
                <div key={s.label} className="kpi-cell py-6 px-2 text-center">
                    <p className="font-display font-bold text-2xl md:text-3xl text-white">{s.value}</p>
                    <p className="text-[10px] font-light uppercase tracking-[0.2em] text-white/35 mt-1.5">{s.label}</p>
                </div>
            )
        )}
    </div>
);

export default KpiBand;
