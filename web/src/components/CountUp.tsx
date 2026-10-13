import React, { useEffect, useState } from 'react';
import useInView from '../hooks/useInView';

/**
 * Counts from 0 to `value` with an ease-out-expo curve (fast start, braking
 * at the end — like a speedo settling). Starts when scrolled into view;
 * renders the final value immediately for reduced-motion users.
 */
const CountUp: React.FC<{
    value: number;
    prefix?: string;
    suffix?: string;
    duration?: number;
}> = ({ value, prefix = '', suffix = '', duration = 1400 }) => {
    const { ref, inView } = useInView<HTMLSpanElement>(0.6);
    const [n, setN] = useState(0);

    useEffect(() => {
        if (!inView) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            setN(value);
            return;
        }
        let raf = 0;
        const t0 = performance.now();
        const step = (t: number) => {
            const p = Math.min((t - t0) / duration, 1);
            const eased = 1 - Math.pow(2, -10 * p);
            setN(Math.round(value * eased));
            if (p < 1) raf = requestAnimationFrame(step);
            else setN(value);
        };
        raf = requestAnimationFrame(step);
        return () => cancelAnimationFrame(raf);
    }, [inView, value, duration]);

    return <span ref={ref} className="tabular-nums">{prefix}{n}{suffix}</span>;
};

export default CountUp;
