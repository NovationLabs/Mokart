import React from 'react';

/** Standard page section: vertical rhythm + centered 6xl column. */
export const Section: React.FC<{
    children: React.ReactNode;
    id?: string;
    className?: string;
}> = ({ children, id, className = '' }) => (
    <section id={id} className={`py-20 md:py-28 px-6 relative ${className}`}>
        <div className="max-w-6xl mx-auto relative z-10">{children}</div>
    </section>
);

/** Small uppercase kicker with its animated hairline (see .eyebrow-line). */
export const Eyebrow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="flex items-center gap-3 mb-5">
        <span className="h-px w-8 bg-mokart-primary/40 eyebrow-line" />
        <span className="font-display text-[11px] font-light uppercase tracking-[0.28em] text-mokart-primary/80">{children}</span>
    </div>
);
