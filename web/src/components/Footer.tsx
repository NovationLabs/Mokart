import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import Wordmark from './Wordmark';

const Footer: React.FC = () => (
    <footer className="relative border-t border-[#7bf8ac]/12 bg-[#04130c] pt-16 pb-10 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto relative z-10">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-12 mb-16">
                <div className="max-w-xs">
                    <Wordmark className="mb-4" />
                    <p className="text-white/45 text-sm leading-relaxed">
                        Centimeter-precision telemetry for the next generation of drivers.
                    </p>
                    <a
                        href="https://app.novationlabs.fr"
                        className="inline-flex items-center gap-1.5 mt-6 text-[#7bf8ac] text-sm font-bold group"
                    >
                        Launch the dashboard
                        <ArrowUpRight size={15} strokeWidth={2.5} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </a>
                </div>

                <div className="grid grid-cols-2 gap-16 sm:gap-24">
                    <div>
                        <h5 className="text-white font-bold mb-4 text-sm font-display tracking-tight">Product</h5>
                        <ul className="space-y-2.5 text-sm text-white/45">
                            <li><a href="/soon" className="hover:text-[#7bf8ac] transition-colors">Hardware</a></li>
                            <li><a href="https://app.novationlabs.fr" className="hover:text-[#7bf8ac] transition-colors">Software</a></li>
                            <li><a href="/soon" className="hover:text-[#7bf8ac] transition-colors">Pricing</a></li>
                        </ul>
                    </div>
                    <div>
                        <h5 className="text-white font-bold mb-4 text-sm font-display tracking-tight">Company</h5>
                        <ul className="space-y-2.5 text-sm text-white/45">
                            <li><a href="/about" className="hover:text-[#7bf8ac] transition-colors">About</a></li>
                            <li><a href="/soon" className="hover:text-[#7bf8ac] transition-colors">Contact</a></li>
                            <li><a href="/style-guide" className="hover:text-[#7bf8ac] transition-colors">Style Guide</a></li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="border-t border-[#7bf8ac]/8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-light text-white/35">
                <p>&copy; 2026 Mokart. All rights reserved.</p>
                <div className="flex gap-6">
                    <a href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</a>
                    <a href="/terms-of-service" className="hover:text-white transition-colors">Terms of Service</a>
                </div>
            </div>
        </div>

        {/* Oversized brand plinth, clipped at the baseline */}
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-6 md:-bottom-10 left-0 right-0 select-none">
            <p className="font-display font-bold tracking-tighter text-center text-[20vw] leading-none text-[#7bf8ac]/[0.05]">
                MOKART
            </p>
        </div>
    </footer>
);

export default Footer;
