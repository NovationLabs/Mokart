import React from 'react';
import '../styles/Main.css';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import { Scale, AlertTriangle, FileCheck, Copyright } from 'lucide-react';

const LegalCard: React.FC<{
    icon: React.ElementType;
    title: string;
    accent?: 'warning';
    children: React.ReactNode;
}> = ({ icon: Icon, title, accent, children }) => (
    <div className={`hairline-card rounded-lg p-8 ${accent === 'warning' ? '!border-[#f87171]/25' : ''}`}>
        <div className="flex items-center gap-4 mb-6">
            <Icon size={20} strokeWidth={1.5} className={accent === 'warning' ? 'text-[#f87171]' : 'text-[#7bf8ac]'} />
            <h2 className="font-display text-xl font-bold text-white">{title}</h2>
        </div>
        {children}
    </div>
);

const TermsOfService: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#0d0f12] text-white antialiased overflow-x-hidden page-enter">
            <Nav />

            <div className="max-w-3xl mx-auto px-6 pt-36 pb-24 relative z-10">
                <div className="mb-12">
                    <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-3">Terms of Service</h1>
                    <p className="text-white/40">Effective Date: February 2026</p>
                </div>

                <div className="space-y-4">
                    <LegalCard icon={FileCheck} title="Project Status">
                        <p className="text-white/60 text-sm leading-relaxed">
                            Mokart is currently a <strong className="text-white font-bold">prototype</strong> developed as part of the Epitech Innovative Project (EIP) 2026-2028. The hardware and software are in active development and may be subject to updates, interruptions, or feature changes without notice.
                        </p>
                    </LegalCard>

                    <LegalCard icon={AlertTriangle} title="Safety & Liability Limitation" accent="warning">
                        <div className="p-4 bg-[#f87171]/5 border-l-2 border-[#f87171] mb-5 rounded-r">
                            <p className="text-white font-bold text-sm">WARNING: Karting is an inherently dangerous activity.</p>
                        </div>
                        <p className="text-white/60 text-sm leading-relaxed mb-4">
                            Mokart is exclusively a performance analysis aid. It does not replace driver judgment or track safety regulations.
                        </p>
                        <ul className="space-y-4 text-white/60 text-sm leading-relaxed">
                            <li className="flex gap-3">
                                <span className="text-[#f87171]">·</span>
                                <span><strong className="text-white font-bold">No Liability for Incidents:</strong> The Mokart team and its affiliates are not liable for any physical injury, property damage, collisions, or accidents that occur while using our system.</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-[#f87171]">·</span>
                                <span><strong className="text-white font-bold">Driver Responsibility:</strong> Users must obey all flags, marshals, and track rules at all times, regardless of dashboard data.</span>
                            </li>
                        </ul>
                    </LegalCard>

                    <LegalCard icon={Scale} title="Testing Partnership">
                        <p className="text-white/60 text-sm leading-relaxed">
                            {/* SpeedKart — partenariat en pause : Official testing is conducted in partnership with SpeedKart in Hyères, France. Data collected during testing sessions is subject to this agreement and our Privacy Policy. */}
                            Official testing sessions are subject to this agreement and our Privacy Policy.
                        </p>
                    </LegalCard>

                    <LegalCard icon={Copyright} title="Intellectual Property">
                        <p className="text-white/60 text-sm leading-relaxed">
                            All sensor fusion algorithms, PCB designs, dashboard interfaces, and software code are the exclusive intellectual property of the Mokart team. Unauthorized reverse engineering, copying, or redistribution of the hardware or software is strictly prohibited.
                        </p>
                    </LegalCard>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default TermsOfService;
