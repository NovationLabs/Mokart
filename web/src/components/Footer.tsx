import React from 'react';
import Wordmark from './Wordmark';

const Footer: React.FC = () => (
    <footer className="border-t border-white/10 bg-[#0d0f12] pt-16 pb-8 px-6">
        <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-12 mb-14">
                <div className="max-w-xs">
                    <Wordmark className="mb-4" />
                    <p className="text-white/40 text-sm leading-relaxed">
                        Centimeter-precision telemetry for the next generation of drivers.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-16 sm:gap-24">
                    <div>
                        <h5 className="text-white font-bold mb-4 text-sm">Product</h5>
                        <ul className="space-y-2.5 text-sm text-white/40">
                            <li><a href="/soon" className="hover:text-[#7bf8ac] transition-colors">Hardware</a></li>
                            <li><a href="https://app.novationlabs.fr" className="hover:text-[#7bf8ac] transition-colors">Software</a></li>
                            <li><a href="/soon" className="hover:text-[#7bf8ac] transition-colors">Pricing</a></li>
                        </ul>
                    </div>
                    <div>
                        <h5 className="text-white font-bold mb-4 text-sm">Company</h5>
                        <ul className="space-y-2.5 text-sm text-white/40">
                            <li><a href="/about" className="hover:text-[#7bf8ac] transition-colors">About</a></li>
                            <li><a href="/soon" className="hover:text-[#7bf8ac] transition-colors">Contact</a></li>
                            <li><a href="/style-guide" className="hover:text-[#7bf8ac] transition-colors">Style Guide</a></li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-light text-white/30">
                <p>&copy; 2026 Mokart. All rights reserved.</p>
                <div className="flex gap-6">
                    <a href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</a>
                    <a href="/terms-of-service" className="hover:text-white transition-colors">Terms of Service</a>
                </div>
            </div>
        </div>
    </footer>
);

export default Footer;
