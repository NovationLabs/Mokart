import { useCallback, useRef } from 'react';

/**
 * Pointer-tracked 3D tilt. Writes `--rx`/`--ry` CSS variables consumed by the
 * `.tilt` class in Main.css. rAF-throttled, no React state, no layout cost.
 * Tilt is flattened on mobile and for reduced-motion users (see Main.css).
 *
 * @param max  maximum rotation in degrees (default 6)
 */
export default function useTilt<T extends HTMLElement>(max = 6) {
    const ref = useRef<T>(null);
    const raf = useRef(0);

    const onMouseMove = useCallback((e: React.MouseEvent<T>) => {
        const el = ref.current;
        if (!el) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const { clientX, clientY } = e;
        cancelAnimationFrame(raf.current);
        raf.current = requestAnimationFrame(() => {
            const r = el.getBoundingClientRect();
            const px = (clientX - r.left) / r.width - 0.5;
            const py = (clientY - r.top) / r.height - 0.5;
            el.style.setProperty('--ry', `${px * max * 2}deg`);
            el.style.setProperty('--rx', `${-py * max * 2}deg`);
        });
    }, [max]);

    const onMouseLeave = useCallback(() => {
        const el = ref.current;
        if (!el) return;
        cancelAnimationFrame(raf.current);
        el.style.setProperty('--rx', '0deg');
        el.style.setProperty('--ry', '0deg');
    }, []);

    return { ref, onMouseMove, onMouseLeave };
}
