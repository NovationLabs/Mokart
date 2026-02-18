import React from 'react';
import { MoveLeft, Shield, Database, LayoutDashboard, Share2, Server } from 'lucide-react';

const PrivacyPolicy: React.FC = () => {
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
                    <h1 className="text-4xl md:text-5xl font-bold text-[#A3E635] mb-4">Privacy Policy</h1>
                    <p className="text-gray-400">Last updated: February 2026</p>
                </div>

                {/* Content Cards */}
                <div className="space-y-8">
                    {/* Data Collection */}
                    <div className="glass-panel bg-white/[0.02] border border-white/10 p-8 rounded-xl backdrop-blur-sm">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 rounded-lg bg-[#A3E635]/10 text-[#A3E635]">
                                <Database size={24} />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Data Collection</h2>
                        </div>
                        <ul className="space-y-4 text-gray-300 leading-relaxed">
                            <li className="flex gap-3">
                                <span className="text-[#22D3EE]">•</span>
                                <span><strong>Telemetry Data:</strong> We collect high-frequency data including RTK GPS positioning (10cm precision), G-forces (IMU), RPM, and steering angle.</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-[#22D3EE]">•</span>
                                <span><strong>Session Metrics:</strong> Lap times, sector times, and invalid lap markers.</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-[#22D3EE]">•</span>
                                <span><strong>User Profiles:</strong> Basic driver information linked via QR code scans for personalized session history.</span>
                            </li>
                        </ul>
                    </div>

                    {/* Purpose */}
                    <div className="glass-panel bg-white/[0.02] border border-white/10 p-8 rounded-xl backdrop-blur-sm">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 rounded-lg bg-[#A3E635]/10 text-[#A3E635]">
                                <LayoutDashboard size={24} />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Purpose of Processing</h2>
                        </div>
                        <p className="text-gray-300 mb-4 leading-relaxed">
                            The data collected is used strictly for performance analysis and enhancement:
                        </p>
                        <ul className="space-y-4 text-gray-300 leading-relaxed">
                            <li className="flex gap-3">
                                <span className="text-[#22D3EE]">•</span>
                                <span><strong>"Ideal vs Real":</strong> Comparing your actual racing line against the calculated optimal trajectory.</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-[#22D3EE]">•</span>
                                <span><strong>Performance Coaching:</strong> Identifying braking points and acceleration zones to improve lap times.</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-[#22D3EE]">•</span>
                                <span><strong>Leaderboards:</strong> Generating accurate rankings for competitive events.</span>
                            </li>
                        </ul>
                    </div>

                    {/* Partners */}
                    <div className="glass-panel bg-white/[0.02] border border-white/10 p-8 rounded-xl backdrop-blur-sm">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 rounded-lg bg-[#A3E635]/10 text-[#A3E635]">
                                <Share2 size={24} />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Third-Party Partners</h2>
                        </div>
                        <p className="text-gray-300 leading-relaxed">
                            To achieve centimetric accuracy, raw GPS data is processed in collaboration with <strong className="text-[#22D3EE]">Point One Navigation</strong>. Anonymized telemetry data may be processed to improve positioning algorithms. We do not sell personal user data to advertisers.
                        </p>
                    </div>

                    {/* Storage */}
                    <div className="glass-panel bg-white/[0.02] border border-white/10 p-8 rounded-xl backdrop-blur-sm">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 rounded-lg bg-[#A3E635]/10 text-[#A3E635]">
                                <Server size={24} />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Data Storage & Security</h2>
                        </div>
                        <p className="text-gray-300 leading-relaxed">
                            All session history and progress tracking data are securely stored in our cloud infrastructure. Drivers can request deletion of their profile and associated telemetry data at any time by contacting support.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
