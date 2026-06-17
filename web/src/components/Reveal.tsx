import React, { useEffect, useRef } from 'react';

/**
 * Scroll-reveal wrapper. Adds `.is-visible` once the element enters the
 * viewport (IntersectionObserver, fires once). Animation lives in Main.css
 * and is disabled for prefers-reduced-motion users.
 */
const Reveal: React.FC<{
    children: React.ReactNode;
    delay?: number;
    className?: string;
}> = ({ children, delay = 0, className = '' }) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        if (!('IntersectionObserver' in window)) {
            el.classList.add('is-visible');
            return;
        }
        const io = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    el.classList.add('is-visible');
                    io.disconnect();
                }
            },
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
        );
        io.observe(el);
        return () => io.disconnect();
    }, []);

    return (
        <div ref={ref} className={`reveal ${className}`} style={delay ? { transitionDelay: `${delay}ms` } : undefined}>
            {children}
        </div>
    );
};

export default Reveal;
