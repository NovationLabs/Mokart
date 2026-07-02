import { useCallback, useRef } from 'react';

/**
 * Magnetic pull. The element eases toward the cursor while hovered and springs
 * back on leave. Writes `transform` directly (rAF-throttled, never React state)
 * so it stays off the render path and smooth on mobile. Pair with `.magnetic`
 * in Main.css for the eased return. Disabled for reduced-motion users.
 *
 * @param strength  px of travel at the element edge (default 14)
 */
export default function useMagnetic<T extends HTMLElement>(strength = 14) {
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
            const mx = (clientX - (r.left + r.width / 2)) / (r.width / 2);
            const my = (clientY - (r.top + r.height / 2)) / (r.height / 2);
            el.style.transform = `translate(${mx * strength}px, ${my * strength}px)`;
        });
    }, [strength]);

    const onMouseLeave = useCallback(() => {
        const el = ref.current;
        if (!el) return;
        cancelAnimationFrame(raf.current);
        el.style.transform = 'translate(0, 0)';
    }, []);

    return { ref, onMouseMove, onMouseLeave };
}
