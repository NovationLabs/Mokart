import React from 'react';
import useTilt from '../../hooks/useTilt';

/** Team portrait with pointer-tracked 3D tilt (useTilt → .tilt). */
const TeamCard: React.FC<{ img: string; name: string; link: string }> = ({ img, name, link }) => {
    const { ref, onMouseMove, onMouseLeave } = useTilt<HTMLAnchorElement>(7);
    return (
        <a
            ref={ref}
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            className="tilt block group"
        >
            <div className="aspect-square rounded-2xl overflow-hidden mb-4 border border-mokart-primary/12 bg-mokart-primary/[0.02]">
                <img
                    src={img}
                    alt={name}
                    loading="lazy"
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-[1.05] transition-all duration-500"
                />
            </div>
            <h3 className="text-white font-bold font-display text-sm md:text-base group-hover:text-mokart-primary transition-colors">{name}</h3>
            <p className="text-white/35 text-[10px] font-light uppercase tracking-[0.2em] mt-1">Software Engineer</p>
        </a>
    );
};

export default TeamCard;
