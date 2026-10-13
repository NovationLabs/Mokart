import { useEffect, useRef } from 'react';

/**
 * Drives a horizontal progress bar from page scroll. Returns a ref to apply to
 * the bar element; the hook scales it on the X axis via `transform` only
 * (rAF-throttled passive listener, no React state, no re-renders). Mirrors the
 * imperative pattern already used by useParallax in this codebase.
 */
export default function useScrollProgress<T extends HTMLElement>() {
    const ref = useRef<T>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        let raf = 0;
        const update = () => {
            const doc = document.documentElement;
            const max = doc.scrollHeight - doc.clientHeight;
            const p = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
            el.style.transform = `scaleX(${p})`;
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
    }, []);

    return ref;
}
