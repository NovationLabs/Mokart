import React from 'react';
import '../styles/Main.css';
import Nav from '../components/Nav';
import Footer from '../components/Footer';

const Soon: React.FC = () => (
    <div className="mk-site min-h-screen">
        <Nav />
        <main className="mk-shell py-28 md:py-40">
            <h1 className="font-display text-5xl md:text-7xl font-bold leading-tight mb-6">Still in the workshop.</h1>
            <p className="text-white/60 text-lg leading-relaxed max-w-xl mb-9">This part of Mokart is being built. You can explore the current prototype and the people behind it in the meantime.</p>
            <a href="/" className="mk-button mk-button-primary">Back to Mokart ↗</a>
        </main>
        <Footer />
    </div>
);

export default Soon;
