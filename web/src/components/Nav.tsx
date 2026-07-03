import React, { useState } from 'react';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import Wordmark from './Wordmark';
import useScrollProgress from '../hooks/useScrollProgress';

const links = [
    { label: 'Telemetry', href: '/#telemetry' },
    { label: 'System', href: '/#system' },
    { label: 'Compare', href: '/#compare' },
    { label: 'Team', href: '/#team' },
];

const Nav: React.FC = () => {
    const [open, setOpen] = useState(false);
    const progressRef = useScrollProgress<HTMLDivElement>();

    return (
        <nav className="fixed top-0 left-0 w-full z-50 nav-blur border-b border-mokart-primary/10">
            <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                <Wordmark />

                <div className="hidden md:flex items-center gap-8 text-sm text-white/60">
                    {links.map(({ label, href }) => (
                        <a key={label} href={href} className="nav-link hover:text-white transition-colors duration-200">
                            {label}
                        </a>
                    ))}
                </div>

                <div className="flex items-center gap-3">
                    <a
                        href="https://app.novationlabs.fr"
                        className="nav-cta hidden sm:inline-flex items-center gap-1.5 font-display text-xs font-bold uppercase tracking-widest text-mokart-primary border border-mokart-primary/30 px-4 py-2 rounded-full hover:bg-mokart-primary/10 transition-all duration-200"
                    >
                        Get Access
                        <ArrowUpRight size={13} strokeWidth={2.5} />
                    </a>

                    <button
                        type="button"
                        onClick={() => setOpen((v) => !v)}
                        aria-label={open ? 'Close menu' : 'Open menu'}
                        aria-expanded={open}
                        className="md:hidden grid place-items-center w-10 h-10 rounded-full border border-mokart-primary/20 text-white/80 hover:text-white hover:border-mokart-primary/45 transition-colors"
                    >
                        {open ? <X size={18} /> : <Menu size={18} />}
                    </button>
                </div>
            </div>

            {/* Scroll-progress meter on the nav baseline */}
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-transparent overflow-hidden">
                <div ref={progressRef} className="nav-progress h-full w-full" style={{ transform: 'scaleX(0)' }} />
            </div>

            {/* Mobile sheet */}
            {open && (
                <div className="md:hidden border-t border-mokart-primary/10 nav-blur px-6 py-5">
                    <div className="flex flex-col gap-1">
                        {links.map(({ label, href }) => (
                            <a
                                key={label}
                                href={href}
                                onClick={() => setOpen(false)}
                                className="py-2.5 text-white/70 hover:text-mokart-primary transition-colors text-base"
                            >
                                {label}
                            </a>
                        ))}
                        <a
                            href="https://app.novationlabs.fr"
                            className="mt-3 btn-primary w-full"
                        >
                            Get Access
                            <ArrowUpRight size={15} strokeWidth={2.5} />
                        </a>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Nav;
