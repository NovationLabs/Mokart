import React from 'react';
import '../styles/Main.css';
import Nav from '../components/Nav';
import Footer from '../components/Footer';

const colors = [
    { name: 'Canvas', value: '#0B0D0C', role: 'Page background' },
    { name: 'Surface', value: '#141715', role: 'Panels and sections' },
    { name: 'Line', value: '#30362F', role: 'Borders and dividers' },
    { name: 'Signal', value: '#A3E635', role: 'Actions and key data' },
];

const StyleGuide: React.FC = () => (
    <div className="mk-site">
        <Nav />
        <main className="mk-shell py-24 md:py-32">
            <h1 className="font-display text-5xl md:text-7xl font-bold mb-6">Built for clarity.</h1>
            <p className="text-white/60 text-lg max-w-2xl leading-relaxed">Dark neutral surfaces, clear hierarchy and a small amount of lime for actions and important data. Product photography shows the hardware as it exists today.</p>

            <section className="mt-20 pt-8 border-t border-white/15">
                <h2 className="font-display text-3xl font-bold mb-8">Colour</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                    {colors.map(color => <div key={color.name}><div className="h-28 border border-white/15 rounded-md mb-4" style={{ background: color.value }} /><strong className="block text-sm">{color.name}</strong><span className="block text-white/50 text-xs mt-1">{color.value} · {color.role}</span></div>)}
                </div>
            </section>

            <section className="mt-20 pt-8 border-t border-white/15">
                <h2 className="font-display text-3xl font-bold mb-8">Typography</h2>
                <p className="font-display text-4xl md:text-6xl font-bold leading-tight">Race data. Clearer laps.</p>
                <p className="text-white/60 mt-6 max-w-xl">Iliad gives headings their character. Body copy stays quiet and readable with a system sans serif.</p>
            </section>

            <section className="mt-20 pt-8 border-t border-white/15">
                <h2 className="font-display text-3xl font-bold mb-8">Actions</h2>
                <div className="flex flex-wrap gap-3"><a className="mk-button mk-button-primary" href="/#system">Explore the system ↗</a><a className="mk-button mk-button-secondary" href="/about">About Mokart ↗</a></div>
            </section>
        </main>
        <Footer />
    </div>
);

export default StyleGuide;
