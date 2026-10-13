import { useEffect, useRef, useState } from 'react';

/**
 * Returns a ref and a boolean that flips to true (once) when the element
 * enters the viewport. Drives scroll-triggered animations.
 */
export default function useInView<T extends HTMLElement>(threshold = 0.3) {
    const ref = useRef<T>(null);
    const [inView, setInView] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        if (!('IntersectionObserver' in window)) {
            setInView(true);
            return;
        }
        const io = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setInView(true);
                    io.disconnect();
                }
            },
            { threshold }
        );
        io.observe(el);
        return () => io.disconnect();
    }, [threshold]);

    return { ref, inView };
}
