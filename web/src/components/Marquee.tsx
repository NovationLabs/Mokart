import React from 'react';

/**
 * Single kinetic marquee band (one per page). The track is duplicated so the
 * -50% translate loops seamlessly. Pauses on hover. Motion collapses under
 * prefers-reduced-motion (see .marquee-track in Main.css).
 */
const Marquee: React.FC<{ items: string[]; className?: string }> = ({ items, className = '' }) => {
    const Row = () => (
        <div className="marquee-track" aria-hidden="true">
            {items.map((t, i) => (
                <React.Fragment key={i}>
                    <span className="font-display text-2xl md:text-4xl font-bold tracking-tight text-white/85 whitespace-nowrap">
                        {t}
                    </span>
                    <span className="text-mokart-primary text-xl md:text-2xl">/</span>
                </React.Fragment>
            ))}
        </div>
    );

    return (
        <div className={`marquee ${className}`}>
            <Row />
            <Row />
        </div>
    );
};

export default Marquee;
