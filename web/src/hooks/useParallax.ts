import { useEffect, useRef } from 'react';

/**
 * Light vertical parallax: translates the element by scrollY * factor.
 * Disabled on mobile (<768px) and for reduced-motion users; transform-only
 * and rAF-throttled so it never touches layout.
 */
export default function useParallax<T extends HTMLElement>(factor: number) {
    const ref = useRef<T>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        if (window.innerWidth < 768) return;
        let raf = 0;
        const onScroll = () => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => {
                el.style.transform = `translate3d(0, ${window.scrollY * factor}px, 0)`;
            });
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', onScroll);
            cancelAnimationFrame(raf);
        };
    }, [factor]);

    return ref;
}
