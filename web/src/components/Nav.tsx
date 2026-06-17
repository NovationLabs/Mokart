import React from 'react';
import Wordmark from './Wordmark';

const links = [
    { label: 'Features', href: '/#features' },
    { label: 'Technology', href: '/#tech' },
    { label: 'Comparison', href: '/#comparison' },
    { label: 'Team', href: '/#team' },
];

const Nav: React.FC = () => (
    <nav className="fixed top-0 left-0 w-full z-50 nav-blur border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <Wordmark />

            <div className="hidden md:flex items-center gap-8 text-sm text-white/60">
                {links.map(({ label, href }) => (
                    <a key={label} href={href} className="nav-link hover:text-white transition-colors duration-200">
                        {label}
                    </a>
                ))}
            </div>

            <a
                href="https://app.novationlabs.fr"
                className="font-display text-xs font-bold uppercase tracking-widest text-[#7bf8ac] border border-[#7bf8ac]/30 px-4 py-2 rounded-md hover:bg-[#7bf8ac]/10 transition-colors duration-200"
            >
                Get Access
            </a>
        </div>
    </nav>
);

export default Nav;
