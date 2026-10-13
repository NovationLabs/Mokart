import { useCallback, useRef } from 'react';

/**
 * Cursor-tracked spotlight. Writes the pointer position into `--mx`/`--my`
 * CSS variables on the element so a border/edge highlight can follow the
 * cursor (see `.spotlight` in styles/Main.css). Pure transform-free CSS vars,
 * rAF-throttled, no layout cost. Effect is gated behind hover in CSS and
 * disabled for reduced-motion users there too.
 */
export default function useSpotlight<T extends HTMLElement>() {
    const ref = useRef<T>(null);
    const raf = useRef(0);

    const onMouseMove = useCallback((e: React.MouseEvent<T>) => {
        const el = ref.current;
        if (!el) return;
        const { clientX, clientY } = e;
        cancelAnimationFrame(raf.current);
        raf.current = requestAnimationFrame(() => {
            const r = el.getBoundingClientRect();
            el.style.setProperty('--mx', `${clientX - r.left}px`);
            el.style.setProperty('--my', `${clientY - r.top}px`);
        });
    }, []);

    return { ref, onMouseMove };
}
