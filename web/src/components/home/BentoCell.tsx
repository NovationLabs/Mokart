import React from 'react';
import useSpotlight from '../../hooks/useSpotlight';

/**
 * Bento feature cell. `aux` hosts the cell's mini-story — a small living
 * visual (sparkline, reel, equalizer…) pinned to the bottom so every cell
 * carries one piece of moving data instead of being a dead card.
 */
const BentoCell: React.FC<{
    icon: React.ElementType;
    title: string;
    desc: string;
    className?: string;
    tone?: 'plain' | 'gradient' | 'pattern';
    wide?: boolean;
    aux?: React.ReactNode;
}> = ({ icon: Icon, title, desc, className = '', tone = 'plain', wide = false, aux }) => {
    const { ref, onMouseMove } = useSpotlight<HTMLDivElement>();

    const toneBg =
        tone === 'gradient'
            ? 'bg-gradient-to-br from-mokart-primary/[0.10] via-mokart-surface to-mokart-bg2'
            : tone === 'pattern'
                ? 'bg-mokart-surface'
                : 'bg-mokart-primary/[0.018]';

    return (
        <div
            ref={ref}
            onMouseMove={onMouseMove}
            className={`hairline-card card-accent-green spotlight relative rounded-2xl p-7 group overflow-hidden ${toneBg} ${className}`}
        >
            {tone === 'pattern' && (
                <div className="absolute inset-0 bg-grid-faint opacity-50 pointer-events-none [mask-image:radial-gradient(ellipse_80%_70%_at_50%_120%,black,transparent)]" aria-hidden="true" />
            )}
            <div className="relative z-10 flex flex-col h-full">
                <Icon size={22} strokeWidth={1.5} className="text-mokart-primary mb-5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110" />
                <h3 className={`font-display font-bold text-white mb-2 ${wide ? 'text-xl' : 'text-base'}`}>{title}</h3>
                <p className="text-white/45 text-sm leading-relaxed max-w-[42ch]">{desc}</p>
                {aux && <div className="mt-auto pt-5" aria-hidden="true">{aux}</div>}
            </div>
        </div>
    );
};

export default BentoCell;
