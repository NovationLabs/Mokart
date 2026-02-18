import React from 'react';
import { MoveLeft, Scale, AlertTriangle, FileCheck, Copyright } from 'lucide-react';

const TermsOfService: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#0a0a0a] text-gray-100 font-display selection:bg-[#A3E635] selection:text-black antialiased overflow-x-hidden relative">
            {/* Background Texture */}
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff05_1px,transparent_1px)] [background-size:20px_20px] opacity-20 pointer-events-none"></div>

            <div className="max-w-4xl mx-auto px-6 py-12 relative z-10">
                {/* Header */}
                <div className="mb-12">
                    <a href="/" className="inline-flex items-center gap-2 text-[#22D3EE] hover:text-white transition-colors mb-8 group">
                        <MoveLeft className="group-hover:-translate-x-1 transition-transform" />
                        Back to Home
                    </a>
                    <h1 className="text-4xl md:text-5xl font-bold text-[#A3E635] mb-4">Terms of Service</h1>
                    <p className="text-gray-400">Effective Date: February 2026</p>
                </div>

                {/* Content Cards */}
                <div className="space-y-8">
                    {/* Project Status */}
                    <div className="glass-panel bg-white/[0.02] border border-white/10 p-8 rounded-xl backdrop-blur-sm">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 rounded-lg bg-[#A3E635]/10 text-[#A3E635]">
                                <FileCheck size={24} />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Project Status</h2>
                        </div>
                        <p className="text-gray-300 leading-relaxed">
                            Mokart is currently a <strong className="text-[#22D3EE]">prototype</strong> developed as part of the Epitech Innovative Project (EIP) 2026-2028. The hardware and software are in active development and may be subject to updates, interruptions, or feature changes without notice.
                        </p>
                    </div>

                    {/* Liability */}
                    <div className="glass-panel bg-white/[0.02] border border-[#ff4d4d]/20 p-8 rounded-xl backdrop-blur-sm">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 rounded-lg bg-[#ff4d4d]/10 text-[#ff4d4d]">
                                <AlertTriangle size={24} />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Safety & Liability Limitation</h2>
                        </div>
                        <div className="p-4 bg-[#ff4d4d]/5 border-l-2 border-[#ff4d4d] mb-4">
                            <p className="text-gray-200 font-bold">WARNING: Karting is an inherently dangerous activity.</p>
                        </div>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            Mokart is exclusively a performance analysis aid. It does not replace driver judgment or track safety regulations.
                        </p>
                        <ul className="space-y-4 text-gray-300 leading-relaxed">
                            <li className="flex gap-3">
                                <span className="text-[#ff4d4d]">•</span>
                                <span><strong>No Liability for Incidents:</strong> The Mokart team and its affiliates are not liable for any physical injury, property damage, collisions, or accidents that occur while using our system.</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-[#ff4d4d]">•</span>
                                <span><strong>Driver Responsibility:</strong> Users must obey all flags, marshals, and track rules at all times, regardless of dashboard data.</span>
                            </li>
                        </ul>
                    </div>

                    {/* Testing Partnership */}
                    <div className="glass-panel bg-white/[0.02] border border-white/10 p-8 rounded-xl backdrop-blur-sm">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 rounded-lg bg-[#A3E635]/10 text-[#A3E635]">
                                <Scale size={24} />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Testing Partnership</h2>
                        </div>
                        <p className="text-gray-300 leading-relaxed">
                            Official testing is conducted in partnership with <strong className="text-[#22D3EE]">SpeedKart</strong> in Hyères, France. Data collected during testing sessions is subject to this agreement and our Privacy Policy.
                        </p>
                    </div>

                    {/* IP */}
                    <div className="glass-panel bg-white/[0.02] border border-white/10 p-8 rounded-xl backdrop-blur-sm">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 rounded-lg bg-[#A3E635]/10 text-[#A3E635]">
                                <Copyright size={24} />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Intellectual Property</h2>
                        </div>
                        <p className="text-gray-300 leading-relaxed">
                            All sensor fusion algorithms, PCB designs, dashboard interfaces, and software code are the exclusive intellectual property of the Mokart team. Unauthorized reverse engineering, copying, or redistribution of the hardware or software is strictly prohibited.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TermsOfService;
