import React, { useState } from 'react';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import Wordmark from './Wordmark';
import { dashboardUrl } from '../dashboardUrl';

const links = [
    { label: 'The system', href: '/#system' },
    { label: 'Hardware', href: '/#hardware' },
    { label: 'Dashboard', href: '/#dashboard' },
    { label: 'About', href: '/about' },
];

const Nav: React.FC = () => {
    const [open, setOpen] = useState(false);
    return (
        <nav className="mk-nav" aria-label="Main navigation">
            <div className="mk-shell mk-nav-inner">
                <Wordmark className="mk-wordmark" />
                <div className={`mk-nav-links ${open ? 'is-open' : ''}`} id="mk-menu">
                    {links.map(link => <a key={link.href} href={link.href} onClick={() => setOpen(false)}>{link.label}</a>)}
                    <a className="mk-nav-mobile-dashboard" href={dashboardUrl}>Open dashboard ↗</a>
                </div>
                <a className="mk-nav-cta" href={dashboardUrl}>Get access <ArrowUpRight size={15} /></a>
                <button type="button" className="mk-menu-toggle" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="mk-menu" aria-label={open ? 'Close menu' : 'Open menu'}>{open ? <X size={22} /> : <Menu size={22} />}</button>
            </div>
        </nav>
    );
};

export default Nav;
