import { useEffect, useRef } from 'react';

/**
 * Writes the element's scroll progress (0..1) into its `--p` CSS variable so
 * stylesheets can drive transforms/opacity from scroll (see Main.css).
 * rAF-throttled passive listener, no React state — same pattern as useParallax.
 * Disabled on mobile (<768px) and for reduced-motion users; CSS falls back to
 * the finished state (`--p: 1`) for both via media queries.
 *
 * @param mode 'pin'   — progress of a tall wrapper hosting a sticky child:
 *                       0 when its top pins, 1 when its bottom releases.
 *             'cross' — progress of a block crossing the viewport: starts as
 *                       it enters the lower quarter, completes near center.
 */
export default function useSectionProgress<T extends HTMLElement>(mode: 'pin' | 'cross' = 'pin') {
    const ref = useRef<T>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        if (window.innerWidth < 768) return;
        let raf = 0;
        const update = () => {
            const r = el.getBoundingClientRect();
            const vh = window.innerHeight;
            const p = mode === 'pin'
                ? -r.top / Math.max(r.height - vh, 1)
                : (vh * 0.92 - r.top) / (vh * 0.55);
            el.style.setProperty('--p', Math.max(0, Math.min(p, 1)).toFixed(4));
        };
        const onScroll = () => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(update);
        };
        update();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
            cancelAnimationFrame(raf);
        };
    }, [mode]);

    return ref;
}
