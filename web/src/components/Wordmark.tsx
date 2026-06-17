import React from 'react';

/**
 * Brand wordmark: kart-box icon + "Mokart." with accent dot.
 *
 * ── LOGO ANIMATION — reference for reuse (favicon animé, loader, etc.) ──
 * The icon strokes "draw themselves" on page load. Technique:
 *   1. Each SVG shape (<rect>, <path>) gets `pathLength={100}` — normalizes
 *      every path's length to 100 units regardless of real geometry.
 *   2. CSS (`.logo-draw` in styles/Main.css) sets `stroke-dasharray: 100 100`
 *      and `stroke-dashoffset: 100` (stroke fully hidden), then animates
 *      `stroke-dashoffset` to 0 (keyframes `mk-draw-in`, ~1s ease-out).
 *   3. Hover micro-interactions: `.logo-mark` tilts -8° (transform transition)
 *      and `.logo-dot` pops via the `mk-pop` scale keyframe.
 * Works on any stroke-based SVG: add pathLength={100} + the .logo-draw class.
 * Reduced-motion users get the final state instantly (guard in Main.css).
 */
const Wordmark: React.FC<{ className?: string }> = ({ className = '' }) => (
    <a href="/" className={`flex items-center gap-2.5 ${className}`}>
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className="w-6 h-6 text-[#7bf8ac] logo-mark logo-draw"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <rect x="2" y="6" width="20" height="14" rx="4" pathLength={100} />
            <path d="M8 6V3a2 2 0 0 0-4 0v3" pathLength={100} />
        </svg>
        <span className="font-display text-xl font-bold text-white tracking-tight">
            Mokart<span className="text-[#7bf8ac] logo-dot">.</span>
        </span>
    </a>
);

export default Wordmark;
