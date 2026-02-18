import React from 'react';

const Soon: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center relative overflow-hidden font-display">
            {/* Background Effects */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#A3E635]/10 blur-[100px] rounded-full pointer-events-none"></div>

            <div className="z-10 text-center px-6 max-w-2xl mx-auto">
                <div className="inline-block text-[#A3E635] font-mono text-xs tracking-widest uppercase mb-6 border border-[#A3E635]/20 bg-[#A3E635]/5 px-3 py-1 rounded-full">
                    Under Construction
                </div>

                <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight text-white">
                    Something Big is <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">In The Works.</span>
                </h1>

                <p className="text-gray-400 text-lg md:text-xl mb-10 leading-relaxed font-light">
                    We're currently building this page to bring you a better experience.
                    Check back soon for updates on our professional telemetry hardware.
                </p>

                <a
                    href="/"
                    className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-8 py-3 bg-[#A3E635] text-black font-semibold rounded-lg transition-all duration-300 hover:shadow-[0_0_18px_rgba(163,230,53,0.5),0_0_60px_rgba(163,230,53,0.3)]"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>
                    Return Home
                </a>
            </div>

            <div className="absolute bottom-8 text-gray-600 text-xs uppercase tracking-widest">
                Mokart Engineering &copy; 2026
            </div>
        </div>
    );
};

export default Soon;
