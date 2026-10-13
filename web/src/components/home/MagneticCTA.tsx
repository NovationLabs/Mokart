import React from 'react';
import { ArrowRight } from 'lucide-react';
import useMagnetic from '../../hooks/useMagnetic';

/** Primary CTA: magnetic pull (useMagnetic) + sheen sweep (.btn-primary). */
const MagneticCTA: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => {
    const { ref, onMouseMove, onMouseLeave } = useMagnetic<HTMLAnchorElement>(10);
    return (
        <a
            ref={ref}
            href={href}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            className="btn-primary magnetic group w-full sm:w-auto"
        >
            {children}
            <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
        </a>
    );
};

export default MagneticCTA;
