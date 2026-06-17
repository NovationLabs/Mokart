import React from 'react';
import '../styles/Main.css';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import { Database, LayoutDashboard, Share2, Server } from 'lucide-react';

const LegalCard: React.FC<{
    icon: React.ElementType;
    title: string;
    children: React.ReactNode;
}> = ({ icon: Icon, title, children }) => (
    <div className="hairline-card rounded-lg p-8">
        <div className="flex items-center gap-4 mb-6">
            <Icon size={20} strokeWidth={1.5} className="text-[#7bf8ac]" />
            <h2 className="font-display text-xl font-bold text-white">{title}</h2>
        </div>
        {children}
    </div>
);

const PrivacyPolicy: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#0d0f12] text-white antialiased overflow-x-hidden page-enter">
            <Nav />

            <div className="max-w-3xl mx-auto px-6 pt-36 pb-24 relative z-10">
                <div className="mb-12">
                    <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-3">Privacy Policy</h1>
                    <p className="text-white/40">Last updated: February 2026</p>
                </div>

                <div className="space-y-4">
                    <LegalCard icon={Database} title="Data Collection">
                        <ul className="space-y-4 text-white/60 text-sm leading-relaxed">
                            <li className="flex gap-3">
                                <span className="text-[#7bf8ac]">·</span>
                                <span><strong className="text-white font-bold">Telemetry Data:</strong> We collect high-frequency data including RTK GPS positioning (10cm precision), G-forces (IMU), RPM, and steering angle.</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-[#7bf8ac]">·</span>
                                <span><strong className="text-white font-bold">Session Metrics:</strong> Lap times, sector times, and invalid lap markers.</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-[#7bf8ac]">·</span>
                                <span><strong className="text-white font-bold">User Profiles:</strong> Basic driver information linked via QR code scans for personalized session history.</span>
                            </li>
                        </ul>
                    </LegalCard>

                    <LegalCard icon={LayoutDashboard} title="Purpose of Processing">
                        <p className="text-white/60 text-sm mb-4 leading-relaxed">
                            The data collected is used strictly for performance analysis and enhancement:
                        </p>
                        <ul className="space-y-4 text-white/60 text-sm leading-relaxed">
                            <li className="flex gap-3">
                                <span className="text-[#7bf8ac]">·</span>
                                <span><strong className="text-white font-bold">"Ideal vs Real":</strong> Comparing your actual racing line against the calculated optimal trajectory.</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-[#7bf8ac]">·</span>
                                <span><strong className="text-white font-bold">Performance Coaching:</strong> Identifying braking points and acceleration zones to improve lap times.</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-[#7bf8ac]">·</span>
                                <span><strong className="text-white font-bold">Leaderboards:</strong> Generating accurate rankings for competitive events.</span>
                            </li>
                        </ul>
                    </LegalCard>

                    <LegalCard icon={Share2} title="Third-Party Partners">
                        <p className="text-white/60 text-sm leading-relaxed">
                            To achieve centimetric accuracy, raw GPS data is processed in collaboration with <strong className="text-white font-bold">Point One Navigation</strong>. Anonymized telemetry data may be processed to improve positioning algorithms. We do not sell personal user data to advertisers.
                        </p>
                    </LegalCard>

                    <LegalCard icon={Server} title="Data Storage & Security">
                        <p className="text-white/60 text-sm leading-relaxed">
                            All session history and progress tracking data are securely stored in our cloud infrastructure. Drivers can request deletion of their profile and associated telemetry data at any time by contacting support.
                        </p>
                    </LegalCard>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default PrivacyPolicy;
